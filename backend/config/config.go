package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	Port           string
	FrontendURL    string
	AllowedOrigins []string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, reading from system environment instead")
	}

	// ALLOWED_ORIGINS is comma-separated, e.g.
	// "http://localhost:5173,https://your-gym.netlify.app"
	allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")
	if allowedOriginsEnv == "" {
		allowedOriginsEnv = "http://localhost:5173"
	}

	return &Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		Port:           os.Getenv("PORT"),
		FrontendURL:    os.Getenv("FRONTEND_URL"),
		AllowedOrigins: strings.Split(allowedOriginsEnv, ","),
	}
}