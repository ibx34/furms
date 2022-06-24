package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"furms.dev/config"
	"furms.dev/internal"
	sq "github.com/Masterminds/squirrel"
	"github.com/golang-migrate/migrate/v4"
	PgxMigration "github.com/golang-migrate/migrate/v4/database/pgx"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/joho/godotenv"
)

var (
	UsingDollarSigns = sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	ctx := context.Background()

	cfg, errConfig := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
	if errConfig != nil {
		fmt.Println("Bad!")
	}

	dbConn, errConnectConfig := pgxpool.ConnectConfig(ctx, cfg)
	if errConnectConfig != nil {
		log.Fatalf("Failed to connect to database: %v", errConnectConfig)
	}

	instance, errOpen := sql.Open("pgx", os.Getenv("DATABASE_URL"))
	if errOpen != nil {
		fmt.Println("Failed to open database for migration")
	}
	if errPing := instance.Ping(); errPing != nil {
		fmt.Println("Cannot migrate, failed to connect to target server")
	}

	driver, _ := PgxMigration.WithInstance(instance, &PgxMigration.Config{
		MigrationsTable:       "_migration",
		SchemaName:            "public",
		StatementTimeout:      60 * time.Second,
		MultiStatementEnabled: true,
	})

	migrate, err := migrate.NewWithDatabaseInstance(
		"file://./migrations",
		"pgx", driver,
	)

	if err != nil {
		fmt.Println("Failed to create migration")
	}
	err = migrate.Up()
	if err != nil {
		fmt.Println("Failed to run migrations: ", err)
	}

	defer dbConn.Close()
	config, err := config.New()
	if err != nil {
		fmt.Println("Failed to create config: ", err)
		return
	}
	defer internal.StartApi(ctx, dbConn, config)
}
