package models

import "time"

// User represents a row in the "users" table.
// The `json:"..."` tags control how this struct looks when
// converted to JSON for the frontend (React) to read.
type User struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // "-" means never include this in JSON responses
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`

}

// SignupRequest is what we expect the frontend to send when a new
// user registers.
type SignupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Otp      string `json:"otp"`
}

type SendSignupOtpRequest struct {
	Email string `json:"email"`
}

// LoginRequest is what the frontend sends on login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse is what we send back after a successful signup/login.
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type Membership struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	PlanType       string    `json:"plan_type"`
	Price          int       `json:"price"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
	PaymentStatus  string    `json:"payment_status"`
}

type Batch struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Shift string `json:"shift"`
}

// MemberListItem is a "flattened" view combining user + membership +
// batch info in one row — exactly what the admin table needs, so we
// don't make the frontend stitch together 3 separate API calls.
type MemberListItem struct {
	ID             int       `json:"id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	BatchName      *string   `json:"batch_name"`
	Shift          *string   `json:"shift"`
	PlanType       *string   `json:"plan_type"`
	PaymentStatus  *string   `json:"payment_status"`
	EndDate        *time.Time `json:"end_date"`
}

type AssignBatchRequest struct {
	BatchID int `json:"batch_id"`
}

type SetMembershipRequest struct {
	PlanType      string `json:"plan_type"`      // "1_month" or "3_month"
	PaymentStatus string `json:"payment_status"` // "paid" or "unpaid"
}

type Attendance struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	AttendanceDate time.Time `json:"attendance_date"`
	ArrivalTime    string    `json:"arrival_time"`
}

type ExerciseScheduleItem struct {
	ID               int    `json:"id"`
	UserID           int    `json:"user_id"`
	DayOfWeek        string `json:"day_of_week"`
	ExerciseDetails  string `json:"exercise_details"`
}

type MarkAttendanceRequest struct {
	UserID      int    `json:"user_id"`
	ArrivalTime string `json:"arrival_time"` // e.g. "06:45"
}

type SetExerciseRequest struct {
	DayOfWeek       string `json:"day_of_week"`
	ExerciseDetails string `json:"exercise_details"`
}

type Notification struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Message   string    `json:"message"`
	Type      string    `json:"type"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateMemberRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AttendanceMemberItem struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	BatchName     *string `json:"batch_name"`
	Shift         *string `json:"shift"`
	CurrentStreak int     `json:"current_streak"`
	TodayArrival  *string `json:"today_arrival"`
}

type AttendanceDaySummary struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type MyAttendanceResponse struct {
	CurrentStreak int                    `json:"current_streak"`
	Summary       []AttendanceDaySummary `json:"summary"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

