package email

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendPasswordResetEmail(toEmail string, resetLink string) error {
	smtpUser := os.Getenv("EMAIL_SMTP_USER")
	smtpPassword := os.Getenv("EMAIL_SMTP_PASSWORD")

	if smtpUser == "" || smtpPassword == "" {
		return fmt.Errorf("email credentials are not configured")
	}

	subject := "Reset your A1 Fitness password"
	body := fmt.Sprintf(
		"Click the link below to reset your password:\n\n%s\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email.",
		resetLink,
	)
	message := fmt.Sprintf("Subject: %s\r\n\r\n%s", subject, body)

	auth := smtp.PlainAuth("", smtpUser, smtpPassword, "smtp.gmail.com")
	return smtp.SendMail("smtp.gmail.com:587", auth, smtpUser, []string{toEmail}, []byte(message))
}

// SendOtpEmail sends the 6-digit signup verification code.
func SendOtpEmail(toEmail string, otpCode string) error {
	smtpUser := os.Getenv("EMAIL_SMTP_USER")
	smtpPassword := os.Getenv("EMAIL_SMTP_PASSWORD")

	if smtpUser == "" || smtpPassword == "" {
		return fmt.Errorf("email credentials are not configured")
	}

	subject := "Your A1 Fitness verification code"
	body := fmt.Sprintf("Your verification code is: %s\n\nThis code expires in 10 minutes.", otpCode)
	message := fmt.Sprintf("Subject: %s\r\n\r\n%s", subject, body)

	auth := smtp.PlainAuth("", smtpUser, smtpPassword, "smtp.gmail.com")
	return smtp.SendMail("smtp.gmail.com:587", auth, smtpUser, []string{toEmail}, []byte(message))
}