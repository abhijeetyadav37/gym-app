package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"backend/database"
	"backend/models"

	"github.com/go-chi/chi/v5"
)

type AttendanceHandler struct{}

func NewAttendanceHandler() *AttendanceHandler {
	return &AttendanceHandler{}
}

// daysBetween returns how many calendar days apart two dates are,
// ignoring the time-of-day portion.
func daysBetween(earlier, later time.Time) int {
	e := time.Date(earlier.Year(), earlier.Month(), earlier.Day(), 0, 0, 0, 0, time.UTC)
	l := time.Date(later.Year(), later.Month(), later.Day(), 0, 0, 0, 0, time.UTC)
	return int(l.Sub(e).Hours() / 24)
}

func (h *AttendanceHandler) MarkAttendance(w http.ResponseWriter, r *http.Request) {
	var req models.MarkAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	var todayFromDB time.Time
	if err := database.DB.QueryRow(ctx, `SELECT CURRENT_DATE`).Scan(&todayFromDB); err != nil {
		http.Error(w, "Could not determine current date", http.StatusInternalServerError)
		return
	}
	todayDateString := todayFromDB.Format("2006-01-02")

	var currentStreak int
	var lastAttendanceDate *time.Time
	err := database.DB.QueryRow(ctx,
		`SELECT current_streak, last_attendance_date FROM users WHERE id = $1`,
		req.UserID,
	).Scan(&currentStreak, &lastAttendanceDate)
	if err != nil {
		http.Error(w, "Member not found", http.StatusNotFound)
		return
	}

	if lastAttendanceDate == nil || daysBetween(*lastAttendanceDate, todayFromDB) != 0 {
		newStreak := 1
		if lastAttendanceDate != nil && daysBetween(*lastAttendanceDate, todayFromDB) == 1 {
			newStreak = currentStreak + 1
		}

		_, err = database.DB.Exec(ctx,
			`UPDATE users SET current_streak = $1, last_attendance_date = $2 WHERE id = $3`,
			newStreak, todayDateString, req.UserID)
		if err != nil {
			http.Error(w, "Could not update streak", http.StatusInternalServerError)
			return
		}
	}

	_, err = database.DB.Exec(ctx, `
		INSERT INTO attendance (user_id, attendance_date, arrival_time)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, attendance_date)
		DO UPDATE SET arrival_time = EXCLUDED.arrival_time
	`, req.UserID, todayDateString, req.ArrivalTime)

	if err != nil {
		http.Error(w, "Could not mark attendance", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Attendance marked"})
}

// ListMembersForAttendance powers the dedicated Attendance page —
// each member's batch, current streak (shown as 0 if they've missed
// a day, even though we haven't reset the stored value yet), and
// whether they've already checked in today. Only active (not
// removed) members are included.
func (h *AttendanceHandler) ListMembersForAttendance(w http.ResponseWriter, r *http.Request) {
	shift := r.URL.Query().Get("shift")
	batchID := r.URL.Query().Get("batch_id")

	query := `
		SELECT u.id, u.name, b.name, b.shift,
			CASE WHEN u.last_attendance_date >= CURRENT_DATE - INTERVAL '1 day'
				THEN u.current_streak ELSE 0 END,
			a.arrival_time
		FROM users u
		LEFT JOIN batch_members bm ON bm.user_id = u.id
		LEFT JOIN batches b ON b.id = bm.batch_id
		LEFT JOIN attendance a ON a.user_id = u.id AND a.attendance_date = CURRENT_DATE
		WHERE u.role = 'member' AND u.is_active = TRUE
	`
	args := []interface{}{}
	argPosition := 1

	if shift != "" {
		query += " AND b.shift = $" + strconv.Itoa(argPosition)
		args = append(args, shift)
		argPosition++
	}
	if batchID != "" {
		query += " AND b.id = $" + strconv.Itoa(argPosition)
		args = append(args, batchID)
		argPosition++
	}

	query += " ORDER BY u.name ASC"

	rows, err := database.DB.Query(context.Background(), query, args...)
	if err != nil {
		http.Error(w, "Could not fetch members", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	members := []models.AttendanceMemberItem{}
	for rows.Next() {
		var m models.AttendanceMemberItem
		if err := rows.Scan(&m.ID, &m.Name, &m.BatchName, &m.Shift, &m.CurrentStreak, &m.TodayArrival); err != nil {
			continue
		}
		members = append(members, m)
	}

	respondJSON(w, http.StatusOK, members)
}

// AttendanceSummary returns a check-in count per day for roughly the
// last N days — exactly the data the heatmap needs to color each cell.
func (h *AttendanceHandler) AttendanceSummary(w http.ResponseWriter, r *http.Request) {
	days := 91
	if daysParam := r.URL.Query().Get("days"); daysParam != "" {
		if parsed, err := strconv.Atoi(daysParam); err == nil {
			days = parsed
		}
	}

	rows, err := database.DB.Query(context.Background(), `
		SELECT attendance_date, COUNT(*)
		FROM attendance
		WHERE attendance_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
		GROUP BY attendance_date
		ORDER BY attendance_date ASC
	`, days)

	if err != nil {
		http.Error(w, "Could not fetch attendance summary", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	summary := []models.AttendanceDaySummary{}
	for rows.Next() {
		var entry models.AttendanceDaySummary
		var date time.Time
		if err := rows.Scan(&date, &entry.Count); err != nil {
			continue
		}
		entry.Date = date.Format("2006-01-02")
		summary = append(summary, entry)
	}

	respondJSON(w, http.StatusOK, summary)
}

// AttendanceForDate returns everyone who checked in on one specific
// date — this is exactly what the click-to-print heatmap day needs.
// Deliberately NOT filtered by is_active — if a removed member
// checked in on that historical date, they should still appear on
// that day's printed sheet.
func (h *AttendanceHandler) AttendanceForDate(w http.ResponseWriter, r *http.Request) {
	date := chi.URLParam(r, "date")

	rows, err := database.DB.Query(context.Background(), `
		SELECT u.id, u.name, u.email, a.arrival_time
		FROM attendance a
		JOIN users u ON u.id = a.user_id
		WHERE a.attendance_date = $1
		ORDER BY a.arrival_time ASC
	`, date)

	if err != nil {
		http.Error(w, "Could not fetch attendance for date", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type DateAttendanceRow struct {
		ID          int    `json:"id"`
		Name        string `json:"name"`
		Email       string `json:"email"`
		ArrivalTime string `json:"arrival_time"`
	}

	records := []DateAttendanceRow{}
	for rows.Next() {
		var row DateAttendanceRow
		if err := rows.Scan(&row.ID, &row.Name, &row.Email, &row.ArrivalTime); err != nil {
			continue
		}
		records = append(records, row)
	}

	respondJSON(w, http.StatusOK, records)
}

// BatchSheet returns everyone in a given batch plus today's arrival
// time. Filtered to active members only — someone who was removed
// shouldn't show up on today's printable sheet going forward
// (though they'll still correctly appear on AttendanceForDate for
// past dates they actually attended).
func (h *AttendanceHandler) BatchSheet(w http.ResponseWriter, r *http.Request) {
	batchID := chi.URLParam(r, "batchId")

	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	rows, err := database.DB.Query(context.Background(), `
		SELECT u.id, u.name, u.email, a.arrival_time
		FROM users u
		JOIN batch_members bm ON bm.user_id = u.id
		LEFT JOIN attendance a ON a.user_id = u.id AND a.attendance_date = $2
		WHERE bm.batch_id = $1 AND u.is_active = TRUE
		ORDER BY u.name ASC
	`, batchID, date)

	if err != nil {
		http.Error(w, "Could not fetch batch sheet", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type SheetRow struct {
		ID          int     `json:"id"`
		Name        string  `json:"name"`
		Email       string  `json:"email"`
		ArrivalTime *string `json:"arrival_time"`
	}

	sheet := []SheetRow{}
	for rows.Next() {
		var row SheetRow
		if err := rows.Scan(&row.ID, &row.Name, &row.Email, &row.ArrivalTime); err != nil {
			continue
		}
		sheet = append(sheet, row)
	}

	respondJSON(w, http.StatusOK, sheet)
}