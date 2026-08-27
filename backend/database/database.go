package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB is a package-level variable holding our connection pool.
// A "pool" means Go keeps several ready-to-use connections open
// instead of opening a new one for every request — this is what
// makes it fast under load.
var DB *pgxpool.Pool

func Connect(databaseURL string) {
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}

	// Ping actually tests the connection right now, rather than
	// waiting for the first real query to fail.
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Database ping failed: %v\n", err)
	}

	DB = pool
	log.Println("Connected to Neon Postgres successfully")
}