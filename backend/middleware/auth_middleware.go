package middleware

import (
	"context"
	"net/http"
	"strings"

	"backend/auth"
)

// contextKey is a custom type to avoid collisions with other
// packages that might also store values in the request context.
type contextKey string

const UserIDKey contextKey = "user_id"
const UserRoleKey contextKey = "user_role"

// RequireAuth checks for a valid JWT in the Authorization header
// on every request to a protected route. If missing or invalid,
// it stops the request before it reaches the actual handler.
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")

			claims, err := auth.ParseToken(tokenString, jwtSecret)
			if err != nil {
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			}

			// user_id comes back as float64 because JWT claims are
			// stored as a generic map — this is a normal Go/JSON quirk.
			userID := int(claims["user_id"].(float64))
			userRole := claims["role"].(string)

			// Store the user's identity on the request context so
			// downstream handlers can read "who is calling" without
			// re-parsing the token.
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserRoleKey, userRole)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin builds on RequireAuth — use it on routes that only
// the gym owner should access, like adding/removing members.
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, ok := r.Context().Value(UserRoleKey).(string)
		if !ok || role != "admin" {
			http.Error(w, "Admin access required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}