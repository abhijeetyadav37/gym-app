package models

import "time"

// PlanPrice returns the price in rupees for a given plan type.
// Centralizing this means if you change pricing later, you change
// it in exactly one place.
func PlanPrice(planType string) int {
	switch planType {
	case "1_month":
		return 600
	case "3_month":
		return 1500
	default:
		return 0
	}
}

// PlanDuration returns how many months a plan type lasts.
func PlanDuration(planType string) int {
	switch planType {
	case "1_month":
		return 1
	case "3_month":
		return 3
	default:
		return 0
	}
}

// CalculateEndDate figures out the membership expiry date given
// a start date and plan type.
func CalculateEndDate(startDate time.Time, planType string) time.Time {
	months := PlanDuration(planType)
	return startDate.AddDate(0, months, 0)
}