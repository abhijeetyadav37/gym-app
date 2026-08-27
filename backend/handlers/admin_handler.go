package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"backend/database"
	"backend/models"
	

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct{}

func NewAdminHandler() *AdminHandler {
	return &AdminHandler{}
}

// ListMembers returns every member (role='member'), with their batch
// and membership info if it exists, filtered by optional query params:
// ?shift=morning
// ?plan_type=1_month
// ?payment_status=unpaid
// ?batch_id=2
func (h *AdminHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	shift := r.URL.Query().Get("shift")
	planType := r.URL.Query().Get("plan_type")
	paymentStatus := r.URL.Query().Get("payment_status")
	batchID := r.URL.Query().Get("batch_id")

	query := `
		SELECT
			u.id,
			u.name,
			u.email,
			b.name,
			b.shift,
			m.plan_type,
			m.payment_status,
			m.end_date
		FROM users u
		LEFT JOIN batch_members bm ON bm.user_id = u.id
		LEFT JOIN batches b ON b.id = bm.batch_id
		LEFT JOIN memberships m ON m.user_id = u.id
			AND m.id = (
				SELECT id
				FROM memberships
				WHERE user_id = u.id
				ORDER BY created_at DESC
				LIMIT 1
			)
		WHERE u.role = 'member'
	`

	args := []interface{}{}
	argPosition := 1

	// Build WHERE clauses dynamically using SQL parameters
	// to prevent SQL injection.
	if shift != "" {
		query += " AND b.shift = $" + itoa(argPosition)
		args = append(args, shift)
		argPosition++
	}

	if planType != "" {
		query += " AND m.plan_type = $" + itoa(argPosition)
		args = append(args, planType)
		argPosition++
	}

	if paymentStatus != "" {
		query += " AND m.payment_status = $" + itoa(argPosition)
		args = append(args, paymentStatus)
		argPosition++
	}

	if batchID != "" {
		query += " AND b.id = $" + itoa(argPosition)
		args = append(args, batchID)
		argPosition++
	}

	query += " ORDER BY u.name ASC"

	rows, err := database.DB.Query(
		context.Background(),
		query,
		args...,
	)
	if err != nil {
		http.Error(
			w,
			"Could not fetch members",
			http.StatusInternalServerError,
		)
		return
	}
	defer rows.Close()

	members := []models.MemberListItem{}

	for rows.Next() {
		var m models.MemberListItem

		if err := rows.Scan(
			&m.ID,
			&m.Name,
			&m.Email,
			&m.BatchName,
			&m.Shift,
			&m.PlanType,
			&m.PaymentStatus,
			&m.EndDate,
		); err != nil {
			http.Error(
				w,
				"Error reading member data",
				http.StatusInternalServerError,
			)
			return
		}

		members = append(members, m)
	}

	respondJSON(w, http.StatusOK, members)
}

// AssignBatch puts a member into a batch.
func (h *AdminHandler) AssignBatch(w http.ResponseWriter, r *http.Request) {
	memberID := chi.URLParam(r, "id")

	var req models.AssignBatchRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(
			w,
			"Invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	// Remove member from any previous batch first.
	_, err := database.DB.Exec(
		context.Background(),
		`
		DELETE FROM batch_members
		WHERE user_id = $1 AND batch_id != $2
		`,
		memberID,
		req.BatchID,
	)

	if err != nil {
		http.Error(
			w,
			"Could not update previous batch",
			http.StatusInternalServerError,
		)
		return
	}

	// Add member to the new batch.
	_, err = database.DB.Exec(
		context.Background(),
		`
		INSERT INTO batch_members (batch_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT (batch_id, user_id) DO NOTHING
		`,
		req.BatchID,
		memberID,
	)

	if err != nil {
		http.Error(
			w,
			"Could not assign batch",
			http.StatusInternalServerError,
		)
		return
	}

	respondJSON(
		w,
		http.StatusOK,
		map[string]string{
			"message": "Batch assigned",
		},
	)
}

// SetMembership creates a new membership record for a member.
func (h *AdminHandler) SetMembership(w http.ResponseWriter, r *http.Request) {
	memberID := chi.URLParam(r, "id")

	var req models.SetMembershipRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(
			w,
			"Invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	price := models.PlanPrice(req.PlanType)

	if price == 0 {
		http.Error(
			w,
			"plan_type must be '1_month' or '3_month'",
			http.StatusBadRequest,
		)
		return
	}

	startDate := time.Now()
	endDate := models.CalculateEndDate(
		startDate,
		req.PlanType,
	)

	var membership models.Membership

	err := database.DB.QueryRow(
		context.Background(),
		`
		INSERT INTO memberships (
			user_id,
			plan_type,
			price,
			start_date,
			end_date,
			payment_status
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING
			id,
			user_id,
			plan_type,
			price,
			start_date,
			end_date,
			payment_status
		`,
		memberID,
		req.PlanType,
		price,
		startDate,
		endDate,
		req.PaymentStatus,
	).Scan(
		&membership.ID,
		&membership.UserID,
		&membership.PlanType,
		&membership.Price,
		&membership.StartDate,
		&membership.EndDate,
		&membership.PaymentStatus,
	)

	if err != nil {
		http.Error(
			w,
			"Could not create membership",
			http.StatusInternalServerError,
		)
		return
	}

	respondJSON(
		w,
		http.StatusCreated,
		membership,
	)
}

// RemoveMember deletes a member entirely.
func (h *AdminHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	memberID := chi.URLParam(r, "id")

	result, err := database.DB.Exec(
		context.Background(),
		`
		DELETE FROM users
		WHERE id = $1 AND role = 'member'
		`,
		memberID,
	)

	if err != nil {
		http.Error(
			w,
			"Could not remove member",
			http.StatusInternalServerError,
		)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(
			w,
			"Member not found",
			http.StatusNotFound,
		)
		return
	}

	respondJSON(
		w,
		http.StatusOK,
		map[string]string{
			"message": "Member removed",
		},
	)
}

// ListBatches returns all batches.
func (h *AdminHandler) ListBatches(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(
		context.Background(),
		`
		SELECT id, name, shift
		FROM batches
		ORDER BY shift, name
		`,
	)

	if err != nil {
		http.Error(
			w,
			"Could not fetch batches",
			http.StatusInternalServerError,
		)
		return
	}
	defer rows.Close()

	batches := []models.Batch{}

	for rows.Next() {
		var b models.Batch

		if err := rows.Scan(
			&b.ID,
			&b.Name,
			&b.Shift,
		); err != nil {
			continue
		}

		batches = append(batches, b)
	}

	respondJSON(
		w,
		http.StatusOK,
		batches,
	)
}

// CreateBatch lets the admin create a new batch.
func (h *AdminHandler) CreateBatch(w http.ResponseWriter, r *http.Request) {
	var req models.Batch

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(
			w,
			"Invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	err := database.DB.QueryRow(
		context.Background(),
		`
		INSERT INTO batches (name, shift)
		VALUES ($1, $2)
		RETURNING id
		`,
		req.Name,
		req.Shift,
	).Scan(&req.ID)

	if err != nil {
		http.Error(
			w,
			"Could not create batch",
			http.StatusInternalServerError,
		)
		return
	}

	respondJSON(
		w,
		http.StatusCreated,
		req,
	)
}

// CreateMember lets the admin add a member directly.
func (h *AdminHandler) CreateMember(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMemberRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(
			w,
			"Invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	// Validate required fields first.
	if req.Name == "" || req.Email == "" || req.Password == "" {
		http.Error(
			w,
			"Name, email, and password are all required",
			http.StatusBadRequest,
		)
		return
	}


	// Hash password before storing it.
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		http.Error(
			w,
			"Could not process password",
			http.StatusInternalServerError,
		)
		return
	}

	var newMember models.User

	err = database.DB.QueryRow(
		context.Background(),
		`
		INSERT INTO users (
			name,
			email,
			password_hash,
			role
		)
		VALUES ($1, $2, $3, 'member')
		RETURNING
			id,
			name,
			email,
			role,
			created_at
		`,
		req.Name,
		req.Email,
		string(hashedPassword),
	).Scan(
		&newMember.ID,
		&newMember.Name,
		&newMember.Email,
		&newMember.Role,
		&newMember.CreatedAt,
	)

	if err != nil {
		if isDuplicateEmailError(err) {
			http.Error(
				w,
				"This email is already registered.",
				http.StatusConflict,
			)
			return
		}

		http.Error(
			w,
			"Could not create member",
			http.StatusInternalServerError,
		)
		return
	}

	respondJSON(
		w,
		http.StatusCreated,
		newMember,
	)
}