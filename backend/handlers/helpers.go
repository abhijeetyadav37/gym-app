package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
 "strconv"
)

// respondJSON is a shared helper so every handler sends responses
// the same consistent way instead of repeating this code everywhere.
func respondJSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}

// containsPgCode does a simple check for Postgres error codes inside
// the error text. It's a pragmatic approach for now — later we can
// switch to properly typed pgconn.PgError checks if needed.
func containsPgCode(err error, code string) bool {
	return strings.Contains(err.Error(), code)
}

func itoa(n int) string {
	return strconv.Itoa(n)
}