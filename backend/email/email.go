package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

const (
	emailJSServiceID  = "service_uybpg8n"
	emailJSTemplateID = "template_gq7gzbl"
	emailJSPublicKey  = "MLY_5cblkCyQiJz8q"
)

// SendOtpEmail sends the signup verification OTP through EmailJS.
func SendOtpEmail(toEmail string, otpCode string) error {
	payload := map[string]interface{}{
		"service_id":  emailJSServiceID,
		"template_id": emailJSTemplateID,
		"user_id":     emailJSPublicKey,
		"template_params": map[string]string{
			"to_email": toEmail,
			"otp_code": otpCode,
		},
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to create EmailJS payload: %w", err)
	}

	request, err := http.NewRequest(
		"POST",
		"https://api.emailjs.com/api/v1.0/email/send",
		bytes.NewBuffer(payloadBytes),
	)
	if err != nil {
		return fmt.Errorf("failed to create EmailJS request: %w", err)
	}

	request.Header.Set("Content-Type", "application/json")

	client := &http.Client{}

	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("failed to connect to EmailJS: %w", err)
	}

	defer response.Body.Close()

	if response.StatusCode >= 400 {
		responseBody, _ := io.ReadAll(response.Body)

		return fmt.Errorf(
			"EmailJS API returned status %d: %s",
			response.StatusCode,
			string(responseBody),
		)
	}

	return nil
}

// These variables prevent unused-environment-variable issues if
// you still have the old environment configuration on Render.
func init() {
	_ = os.Getenv("RESEND_API_KEY")
}

func SendPasswordResetEmail(toEmail string, resetLink string) error {
	return fmt.Errorf("password reset email is not configured")
}