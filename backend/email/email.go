package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// sendViaResend sends an email through Resend's HTTPS API instead of
// raw SMTP. Free hosting platforms like Render commonly block
// outbound SMTP ports (25/465/587) to prevent spam abuse — a normal
// HTTPS API call like this is never blocked.
func sendViaResend(toEmail string, subject string, body string) error {
	apiKey := os.Getenv("RESEND_API_KEY")

	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY is not configured")
	}

	payload := map[string]interface{}{
		"from":    "A1 Fitness <onboarding@resend.dev>",
		"to":      []string{toEmail},
		"subject": subject,
		"text":    body,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to create email payload: %w", err)
	}

	request, err := http.NewRequest(
		"POST",
		"https://api.resend.com/emails",
		bytes.NewBuffer(payloadBytes),
	)
	if err != nil {
		return fmt.Errorf("failed to create Resend request: %w", err)
	}

	request.Header.Set("Authorization", "Bearer "+apiKey)
	request.Header.Set("Content-Type", "application/json")

	client := &http.Client{}

	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("failed to connect to Resend: %w", err)
	}

	defer response.Body.Close()

	if response.StatusCode >= 400 {
		responseBody, _ := io.ReadAll(response.Body)

		return fmt.Errorf(
			"resend API returned status %d: %s",
			response.StatusCode,
			string(responseBody),
		)
	}

	return nil
}

func SendPasswordResetEmail(toEmail string, resetLink string) error {
	subject := "Reset your A1 Fitness password"

	body := fmt.Sprintf(
		"Click the link below to reset your password:\n\n%s\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email.",
		resetLink,
	)

	return sendViaResend(toEmail, subject, body)
}

func SendOtpEmail(toEmail string, otpCode string) error {
	subject := "Your A1 Fitness verification code"

	body := fmt.Sprintf(
		"Your verification code is: %s\n\nThis code expires in 10 minutes.",
		otpCode,
	)

	return sendViaResend(toEmail, subject, body)
}

