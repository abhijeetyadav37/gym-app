package handlers

import (
	"context"
	"net/http"
	"time"
	"backend/database"
	appMiddleware "backend/middleware"
	"backend/models"
	"log"

	"github.com/go-chi/chi/v5"
)

type MemberHandler struct{}

func NewMemberHandler() *MemberHandler {
	return &MemberHandler{}
}

// MyMembership returns the logged-in member's latest membership record.
func (h *MemberHandler) MyMembership(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(appMiddleware.UserIDKey).(int)

	var m models.Membership
	err := database.DB.QueryRow(context.Background(), `
		SELECT id, user_id, plan_type, price, start_date, end_date, payment_status
		FROM memberships
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`, userID).Scan(&m.ID, &m.UserID, &m.PlanType, &m.Price, &m.StartDate, &m.EndDate, &m.PaymentStatus)

	if err != nil {
		http.Error(w, "No membership found", http.StatusNotFound)
		return
	}

	respondJSON(w, http.StatusOK, m)
}

// MyNotifications returns the logged-in member's notifications,
// newest first.
func (h *MemberHandler) MyNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(appMiddleware.UserIDKey).(int)

	rows, err := database.DB.Query(context.Background(), `
		SELECT id, user_id, message, type, is_read, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
	log.Println("Could not fetch notifications:", err)
	http.Error(w, "Could not fetch notifications", http.StatusInternalServerError)
	return
}
	defer rows.Close()

	notifs := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Message, &n.Type, &n.IsRead, &n.CreatedAt); err != nil {
			continue
		}
		notifs = append(notifs, n)
	}

	respondJSON(w, http.StatusOK, notifs)
}

// MarkNotificationRead lets the member dismiss a notification
// (e.g. after they see it in the UI).
func (h *MemberHandler) MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(appMiddleware.UserIDKey).(int)
	notificationID := chi.URLParam(r, "id")

	_, err := database.DB.Exec(context.Background(), `
		UPDATE notifications SET is_read = TRUE
		WHERE id = $1 AND user_id = $2
	`, notificationID, userID)

	if err != nil {
		http.Error(w, "Could not update notification", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Marked as read"})
}

// MyAttendance returns the logged-in member's own current streak
// (shown as 0 if they've missed a day, same rule as the admin view)
// plus their personal check-in history for the last ~91 days —
// exactly what their own heatmap needs.
func (h *MemberHandler) MyAttendance(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(appMiddleware.UserIDKey).(int)
	ctx := context.Background()

	var effectiveStreak int
	err := database.DB.QueryRow(ctx, `
		SELECT CASE WHEN last_attendance_date >= CURRENT_DATE - INTERVAL '1 day'
			THEN current_streak ELSE 0 END
		FROM users WHERE id = $1
	`, userID).Scan(&effectiveStreak)
	if err != nil {
		http.Error(w, "Could not fetch streak", http.StatusInternalServerError)
		return
	}

	rows, err := database.DB.Query(ctx, `
		SELECT attendance_date FROM attendance
		WHERE user_id = $1 AND attendance_date >= CURRENT_DATE - INTERVAL '91 days'
		ORDER BY attendance_date ASC
	`, userID)
	if err != nil {
		http.Error(w, "Could not fetch attendance history", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	summary := []models.AttendanceDaySummary{}
	for rows.Next() {
		var date time.Time
		if err := rows.Scan(&date); err != nil {
			continue
		}
		// Count is always 1 here since this is one member's own
		// history — reusing the same struct as the admin heatmap
		// keeps the frontend logic consistent between both.
		summary = append(summary, models.AttendanceDaySummary{
			Date:  date.Format("2006-01-02"),
			Count: 1,
		})
	}

	respondJSON(w, http.StatusOK, models.MyAttendanceResponse{
		CurrentStreak: effectiveStreak,
		Summary:       summary,
	})
}