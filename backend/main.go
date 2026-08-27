package main

import (
	"log"
	"net/http"
	"time"

	"backend/config"
	"backend/database"
	"backend/handlers"
	appMiddleware "backend/middleware"
	"backend/notifications"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	
	cfg := config.LoadConfig()


	database.Connect(cfg.DatabaseURL)

	
	go func() {
		notifications.CheckExpiringMemberships()

		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			notifications.CheckExpiringMemberships()
		}
	}()

	
	authHandler := handlers.NewAuthHandler(
		cfg.JWTSecret,
		cfg.FrontendURL,
	)

	adminHandler := handlers.NewAdminHandler()
	attendanceHandler := handlers.NewAttendanceHandler()
	exerciseHandler := handlers.NewExerciseHandler()
	memberHandler := handlers.NewMemberHandler()

	

	router := chi.NewRouter()


	router.Use(middleware.Logger)

	router.Use(cors.Handler(cors.Options{
		// Local React development server.
		// Add your Netlify URL here when deploying.
		AllowedOrigins: cfg.AllowedOrigins,
		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
		},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	
	// /api/auth is registered ONLY ONCE.
	router.Route("/api/auth", func(r chi.Router) {
		r.Post("/signup", authHandler.Signup)
		r.Post("/login", authHandler.Login)
		r.Post("/send-signup-otp", authHandler.SendSignupOtp)
		r.Post("/forgot-password", authHandler.ForgotPassword)
		r.Post("/reset-password", authHandler.ResetPassword)
	})

	// =========================================================
	// AUTHENTICATED USER ROUTES
	// =========================================================

	router.Group(func(r chi.Router) {
		r.Use(appMiddleware.RequireAuth(cfg.JWTSecret))

		// ---------------------------------------------------------
		// Routes available to every logged-in user
		// ---------------------------------------------------------

		r.Get("/api/me", authHandler.Me)

		r.Get(
			"/api/me/membership",
			memberHandler.MyMembership,
		)

		r.Get(
			"/api/me/exercises",
			exerciseHandler.MyExercises,
		)

		r.Get(
			"/api/me/notifications",
			memberHandler.MyNotifications,
		)

		r.Post(
			"/api/me/notifications/{id}/read",
			memberHandler.MarkNotificationRead,
		)

		// Member can see their own attendance.
		r.Get(
			"/api/me/attendance",
			memberHandler.MyAttendance,
		)

		// =========================================================
		// ADMIN-ONLY ROUTES
		// =========================================================

		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.RequireAdmin)

			// -----------------------------------------------------
			// MEMBER MANAGEMENT
			// -----------------------------------------------------

			r.Get(
				"/api/admin/members",
				adminHandler.ListMembers,
			)

			r.Post(
				"/api/admin/members",
				adminHandler.CreateMember,
			)

			r.Delete(
				"/api/admin/members/{id}",
				adminHandler.RemoveMember,
			)

			r.Post(
				"/api/admin/members/{id}/batch",
				adminHandler.AssignBatch,
			)

			r.Post(
				"/api/admin/members/{id}/membership",
				adminHandler.SetMembership,
			)

			// -----------------------------------------------------
			// MEMBER EXERCISES
			// -----------------------------------------------------

			r.Post(
				"/api/admin/members/{id}/exercises",
				exerciseHandler.SetExercise,
			)

			r.Get(
				"/api/admin/members/{id}/exercises",
				exerciseHandler.GetMemberExercises,
			)

			// -----------------------------------------------------
			// BATCHES
			// -----------------------------------------------------

			r.Get(
				"/api/admin/batches",
				adminHandler.ListBatches,
			)

			r.Post(
				"/api/admin/batches",
				adminHandler.CreateBatch,
			)

			r.Get(
				"/api/admin/batches/{batchId}/sheet",
				attendanceHandler.BatchSheet,
			)

			// -----------------------------------------------------
			// ATTENDANCE
			// -----------------------------------------------------

			r.Post(
				"/api/admin/attendance",
				attendanceHandler.MarkAttendance,
			)

			r.Get(
				"/api/admin/attendance/members",
				attendanceHandler.ListMembersForAttendance,
			)

			r.Get(
				"/api/admin/attendance/summary",
				attendanceHandler.AttendanceSummary,
			)

			r.Get(
				"/api/admin/attendance/date/{date}",
				attendanceHandler.AttendanceForDate,
			)
		})
	})

	// =========================================================
	// START SERVER
	// =========================================================

	log.Printf(
		"Server starting on port %s...\n",
		cfg.Port,
	)

	if err := http.ListenAndServe(
		":"+cfg.Port,
		router,
	); err != nil {
		log.Fatal(err)
	}
}