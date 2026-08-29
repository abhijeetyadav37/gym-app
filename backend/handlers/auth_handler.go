package handlers

import (
	"context"
	"crypto/rand"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"backend/auth"
	"backend/database"
	"backend/email"
	appMiddleware "backend/middleware"
	"backend/models"

	"golang.org/x/crypto/bcrypt"
)

// AuthHandler bundles the JWT secret so it's available to every
// handler function without using a global variable.
type AuthHandler struct {
	JWTSecret   string
	FrontendURL string
}

func NewAuthHandler(jwtSecret string, frontendURL string) *AuthHandler {
	return &AuthHandler{JWTSecret: jwtSecret, FrontendURL: frontendURL}
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req models.SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Email == "" || req.Password == "" || req.Otp == "" {
		http.Error(w, "Name, email, password, and verification code are all required", http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	var matchingOtpID int
	err := database.DB.QueryRow(ctx, `
		SELECT id FROM signup_otps
		WHERE email = $1 AND otp_code = $2 AND used = FALSE AND expires_at > NOW()
		ORDER BY created_at DESC LIMIT 1
	`, req.Email, req.Otp).Scan(&matchingOtpID)

	if err != nil {
		http.Error(w, "Invalid or expired verification code", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Could not process password", http.StatusInternalServerError)
		return
	}

	var newUser models.User
	err = database.DB.QueryRow(ctx,
		`INSERT INTO users (name, email, password_hash, role)
		 VALUES ($1, $2, $3, 'member')
		 RETURNING id, name, email, role, created_at`,
		req.Name, req.Email, string(hashedPassword),
	).Scan(&newUser.ID, &newUser.Name, &newUser.Email, &newUser.Role, &newUser.CreatedAt)

	if err != nil {
		if isDuplicateEmailError(err) {
			http.Error(w, "This email is already registered. Please log in instead.", http.StatusConflict)
			return
		}
		http.Error(w, "Could not create account", http.StatusInternalServerError)
		return
	}

	database.DB.Exec(ctx, `UPDATE signup_otps SET used = TRUE WHERE id = $1`, matchingOtpID)

	token, err := auth.GenerateToken(newUser.ID, newUser.Role, h.JWTSecret)
	if err != nil {
		http.Error(w, "Could not generate session", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  newUser,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	var user models.User
	var isActive bool

	err := database.DB.QueryRow(
		context.Background(),
		`SELECT id, name, email, password_hash, role, created_at, is_active
		 FROM users WHERE email = $1`,
		req.Email,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.CreatedAt,
		&isActive,
	)

	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	if !isActive {
		http.Error(w, "This account has been deactivated. Please contact the gym.", http.StatusForbidden)
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Generate JWT
	token, err := auth.GenerateToken(user.ID, user.Role, h.JWTSecret)
	if err != nil {
		http.Error(w, "Could not generate session", http.StatusInternalServerError)
		return
	}

	// Don't send password hash to frontend
	user.PasswordHash = ""

	respondJSON(w, http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func isDuplicateEmailError(err error) bool {
	return err != nil && containsPgCode(err, "23505")
}

// Me returns the currently logged-in user's basic info.
// It's protected by RequireAuth middleware, so r.Context() will
// always have a user_id by the time we get here.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(appMiddleware.UserIDKey).(int)

	var user models.User
	err := database.DB.QueryRow(context.Background(),
		`SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.CreatedAt)

	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// ForgotPassword always returns the same success message whether or
// not the email exists — this prevents someone from using this
// endpoint to discover which emails are registered.
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	var userID int
	err := database.DB.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, req.Email).Scan(&userID)

	if err == nil {
		tokenBytes := make([]byte, 32)
		if _, err := rand.Read(tokenBytes); err != nil {
			log.Println("Failed to generate password reset token:", err)
			respondJSON(w, http.StatusOK, map[string]string{
				"message": "If that email is registered, a reset link has been sent.",
			})
			return
		}

		token := hex.EncodeToString(tokenBytes)

		database.DB.Exec(ctx, `
			INSERT INTO password_reset_tokens (user_id, token, expires_at)
			VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
		`, userID, token)

		resetLink := fmt.Sprintf("%s/reset-password?token=%s", h.FrontendURL, token)

		// Sent in a goroutine so a slow email provider never delays
		// the HTTP response back to the user.
		go func() {
			if err := email.SendPasswordResetEmail(req.Email, resetLink); err != nil {
				log.Println("Failed to send password reset email:", err)
			}
		}()
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "If that email is registered, a reset link has been sent.",
	})
}

// ResetPassword validates the token (must exist, be unused, and not
// expired) before allowing the password change.
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	var userID int
	err := database.DB.QueryRow(ctx, `
		SELECT user_id FROM password_reset_tokens
		WHERE token = $1 AND used = FALSE AND expires_at > NOW()
	`, req.Token).Scan(&userID)

	if err != nil {
		http.Error(w, "This reset link is invalid or has expired", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Could not process password", http.StatusInternalServerError)
		return
	}

	database.DB.Exec(ctx,
		`UPDATE users SET password_hash = $1 WHERE id = $2`,
		string(hashedPassword),
		userID,
	)

	database.DB.Exec(ctx,
		`UPDATE password_reset_tokens SET used = TRUE WHERE token = $1`,
		req.Token,
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Password reset successfully",
	})
}

// SendSignupOtp emails a 6-digit code to verify the address is real
// and reachable before an account is ever created for it.
func (h *AuthHandler) SendSignupOtp(w http.ResponseWriter, r *http.Request) {
	var req models.SendSignupOtpRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	var existingUserID int
	err := database.DB.QueryRow(
		ctx,
		`SELECT id FROM users WHERE email = $1`,
		req.Email,
	).Scan(&existingUserID)

	if err == nil {
		http.Error(
			w,
			"This email is already registered. Please log in instead.",
			http.StatusConflict,
		)
		return
	}

	otpCode := generateOtpCode()

	_, err = database.DB.Exec(ctx, `
		INSERT INTO signup_otps (email, otp_code, expires_at)
		VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
	`, req.Email, otpCode)

	if err != nil {
		log.Println("Failed to save signup OTP:", err)
		http.Error(w, "Could not generate verification code", http.StatusInternalServerError)
		return
	}

	if err := email.SendOtpEmail(req.Email, otpCode); err != nil {
		log.Println("Failed to send OTP email:", err)
		http.Error(
			w,
			"Could not send the verification email. Double-check the address and try again.",
			http.StatusInternalServerError,
		)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Verification code sent",
	})
}

// generateOtpCode produces a random 6-digit numeric code, always
// zero-padded (e.g. "004821"), using crypto/rand for unpredictability.
func generateOtpCode() string {
	randomBytes := make([]byte, 4)

	if _, err := rand.Read(randomBytes); err != nil {
		return "000000"
	}

	number := binary.BigEndian.Uint32(randomBytes) % 1000000

	return fmt.Sprintf("%06d", number)
}

