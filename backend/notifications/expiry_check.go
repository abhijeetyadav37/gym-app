package notifications

import (
	"context"
	"fmt"
	"log"
	"time"
	"backend/database"
)

// CheckExpiringMemberships finds memberships expiring within the
// next 3 days and creates a notification for each one — but only
// if we haven't already notified that member in the last 24 hours,
// so they don't get spammed every time this runs.
func CheckExpiringMemberships() {
	rows, err := database.DB.Query(context.Background(), `
		SELECT m.user_id, m.end_date, m.plan_type
		FROM memberships m
		WHERE m.end_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
		AND NOT EXISTS (
			SELECT 1 FROM notifications n
			WHERE n.user_id = m.user_id
			AND n.type = 'membership_expiry'
			AND n.created_at > NOW() - INTERVAL '1 day'
		)
	`)
	if err != nil {
		log.Println("Error checking expiring memberships:", err)
		return
	}
	defer rows.Close()

	type expiring struct {
    userID   int
    endDate  time.Time
    planType string
}

	var toNotify []expiring
	for rows.Next() {
		var e expiring
		if err := rows.Scan(&e.userID, &e.endDate, &e.planType); err != nil {
			continue
		}
		toNotify = append(toNotify, e)
	}

	for _, e := range toNotify {
		message := fmt.Sprintf(
    "Your gym membership is expiring on %s. Please renew soon to avoid interruption.",
    e.endDate.Format("02 Jan 2006"),
)

		_, err := database.DB.Exec(context.Background(), `
			INSERT INTO notifications (user_id, message, type)
			VALUES ($1, $2, 'membership_expiry')
		`, e.userID, message)

		if err != nil {
			log.Println("Error creating notification for user", e.userID, ":", err)
		}
	}

	if len(toNotify) > 0 {
		log.Printf("Created %d expiry notifications\n", len(toNotify))
	}
}