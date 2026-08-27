package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"backend/database"
	"backend/models"

	appMiddleware "backend/middleware"

	"github.com/go-chi/chi/v5"
)

type ExerciseHandler struct{}

func NewExerciseHandler() *ExerciseHandler {
	return &ExerciseHandler{}
}

// SetExercise lets the admin set (or overwrite) the exercise plan
// for a member on a specific day of the week.
func (h *ExerciseHandler) SetExercise(w http.ResponseWriter, r *http.Request) {
	memberID := chi.URLParam(r, "id")

	var req models.SetExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Delete any existing entry for that member+day, then insert fresh.
	// Simpler and just as fast as an upsert for this small table.
	database.DB.Exec(context.Background(),
		`DELETE FROM exercise_schedule WHERE user_id = $1 AND day_of_week = $2`,
		memberID, req.DayOfWeek)

	var item models.ExerciseScheduleItem
	err := database.DB.QueryRow(context.Background(), `
		INSERT INTO exercise_schedule (user_id, day_of_week, exercise_details)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, day_of_week, exercise_details
	`, memberID, req.DayOfWeek, req.ExerciseDetails,
	).Scan(&item.ID, &item.UserID, &item.DayOfWeek, &item.ExerciseDetails)

	if err != nil {
		http.Error(w, "Could not save exercise schedule", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusCreated, item)
}

// MyExercises returns the logged-in member's own full weekly schedule.
// Notice this reads the user ID from the JWT context (appMiddleware.UserIDKey),
// NOT from a URL param — a member can only ever see their own data this way.
func (h *ExerciseHandler) MyExercises(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(appMiddleware.UserIDKey).(int)

	rows, err := database.DB.Query(context.Background(), `
		SELECT id, user_id, day_of_week, exercise_details
		FROM exercise_schedule
		WHERE user_id = $1
	`, userID)

	if err != nil {
		http.Error(w, "Could not fetch exercises", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	schedule := []models.ExerciseScheduleItem{}
	for rows.Next() {
		var item models.ExerciseScheduleItem
		if err := rows.Scan(&item.ID, &item.UserID, &item.DayOfWeek, &item.ExerciseDetails); err != nil {
			continue
		}
		schedule = append(schedule, item)
	}

	respondJSON(w, http.StatusOK, schedule)
}

// GetMemberExercises lets the admin view (and pre-fill an edit form
// with) one specific member's full weekly schedule — unlike
// MyExercises, this is scoped by URL param since the admin is
// looking at someone else's data, not their own.
func (h *ExerciseHandler) GetMemberExercises(w http.ResponseWriter, r *http.Request) {
	memberID := chi.URLParam(r, "id")

	rows, err := database.DB.Query(context.Background(), `
		SELECT id, user_id, day_of_week, exercise_details
		FROM exercise_schedule
		WHERE user_id = $1
	`, memberID)

	if err != nil {
		http.Error(w, "Could not fetch exercises", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	schedule := []models.ExerciseScheduleItem{}
	for rows.Next() {
		var item models.ExerciseScheduleItem
		if err := rows.Scan(&item.ID, &item.UserID, &item.DayOfWeek, &item.ExerciseDetails); err != nil {
			continue
		}
		schedule = append(schedule, item)
	}

	respondJSON(w, http.StatusOK, schedule)
}