package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	PgxMigration "github.com/golang-migrate/migrate/v4/database/pgx"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/joho/godotenv"
)

type FormQuestion struct {
	QID          uint64  `db:"id" json:"id"`
	QFormId      uint64  `db:"form_id"`
	QName        string  `db:"name" json:"name"`
	QType        uint64  `db:"type" json:"type"`
	QDescription *string `db:"description" json:"description"`
	QMinValue    *uint64 `db:"-" json:"min"`
	QMaxValue    *uint64 `db:"-" json:"max"`
}

type QuestionResponse struct {
	QuestionId uint64      `json:"id"`
	Response   interface{} `json:"response"`
}

type Form struct {
	FormId          uint64            `db:"form_id" json:"form_id"`
	FormName        string            `db:"name" json:"name"`
	FormPassword    *string           `db:"password"  json:"password"`
	FormDescription *string           `db:"description" json:"description"`
	FormQuestions   []FormQuestion    `json:"questions"`
	FormQQuestions  pgtype.JSONBArray `db:"questions" json:"-"`
	FormOneResponse bool              `db:"one_response" json:"limit"`
}

type FormResponse struct {
	ResponseId     uint64            `db:"id" json:"id"`
	ResponseFormId uint64            `db:"form_id" json:"form_id"`
	ResponseTime   time.Time         `db:"response_at" json:"response_at"`
	Responses      pgtype.JSONBArray `db:"responses" json:"responses"`
}

type Response struct {
	Message string `json:"message"`
}

type CreateQuestionResponse struct {
	Questions []FormQuestion `json:"questions"`
}

type App struct {
	Context  context.Context
	Database *pgxpool.Pool
}

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
	migrate.Up()

	defer dbConn.Close()

	app_context := App{Context: ctx, Database: dbConn}
	r := gin.Default()
	r.Use(CORSMiddleware)
	r.POST("/forms/new", app_context.create_form)
	r.PATCH("/forms/:form_id/questions", app_context.create_form_question)
	r.GET("/forms/:form_id", app_context.get_form)
	r.POST("/forms/:form_id/respond", app_context.create_form_response)
	r.Run()
}

func CORSMiddleware(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Password")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "PATCH, POST, OPTIONS, GET, PUT")

	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(204)
		return
	}

	c.Next()
}

func (app_context *App) create_form_response(c *gin.Context) {
	form_id := c.Params.ByName("form_id")
	if len(form_id) == 0 {
		return
	}

	type CreateFormResponseRequest struct {
		Responses []QuestionResponse `json:"responses"`
	}

	var new_response CreateFormResponseRequest
	if err := c.BindJSON(&new_response); err != nil {
		return
	}

	jsonArray := pgtype.NewArrayType("json", pgtype.JSONOID, func() pgtype.ValueTranscoder { return &pgtype.JSON{} })
	jsonArray.Set(new_response.Responses)

	query, args, errQueryArgs := UsingDollarSigns.Insert("form_response").
		Columns("form_id", "responses").
		Values(form_id, jsonArray).
		ToSql()

	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	_, err := app_context.Database.Exec(app_context.Context, query, args...)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	}
	c.JSON(http.StatusOK, Response{Message: "good"})
}

func (app_context *App) create_form_question(c *gin.Context) {
	form_id := c.Params.ByName("form_id")
	if len(form_id) == 0 {
		return
	}

	query, args, errQueryArgs := UsingDollarSigns.Select("*").From("forms").Where(sq.Eq{"form_id": form_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}
	form := Form{}
	err := app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions, &form.FormOneResponse)
	if err != nil {
		fmt.Fprintf(os.Stderr, "1/.QueryRow failed: %v\n", err)
	}

	var questions []FormQuestion
	for _, q := range form.FormQQuestions.Elements {
		question := FormQuestion{}
		json.Unmarshal(q.Bytes, &question)
		questions = append(questions, question)
	}

	type CreateFormResponseRequest struct {
		Questions []FormQuestion `json:"questions"`
	}

	var new_questions CreateFormResponseRequest
	if err := c.BindJSON(&new_questions); err != nil {
		return
	}
	log.Println("Questions:", new_questions.Questions)

	if len(questions) > 0 {
		for i, q := range new_questions.Questions {
			for qi, q2 := range questions {
				if q.QID == q2.QID {
					if q.QName != q2.QName || q.QDescription != q2.QDescription {
						questions[qi] = q
					}
					// Because there is a weird case where the new questions could only be one
					// we need to handle it.
					if len(new_questions.Questions) == 1 && i > 0 {
						i = 0
					}
					new_questions.Questions[i] = new_questions.Questions[len(new_questions.Questions)-1]
					new_questions.Questions = new_questions.Questions[:len(new_questions.Questions)-1]
				}
			}
		}
	}
	log.Println(new_questions.Questions)
	updated_questions := append(questions, new_questions.Questions...)
	log.Println(updated_questions)
	jsonArray := pgtype.NewArrayType("json", pgtype.JSONOID, func() pgtype.ValueTranscoder { return &pgtype.JSON{} })
	jsonArray.Set(updated_questions)

	query, args, errQueryArgs = UsingDollarSigns.Update("forms").Set("questions", jsonArray).Where(sq.Eq{"form_id": form_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions, &form.FormOneResponse)
	if err != nil {
		fmt.Fprintf(os.Stderr, "1/.QueryRow failed: %v\n", err)
	}
	c.JSON(http.StatusOK, CreateQuestionResponse{Questions: updated_questions})
}

// This function is cute. It will check for a password Nya.
func (app_context *App) get_form(c *gin.Context) {
	form_id := c.Params.ByName("form_id")
	form_password := c.Request.Header.Get("X-Password")
	log.Println(form_password)

	if len(form_id) == 0 {
		return
	}

	query, args, errQueryArgs := UsingDollarSigns.Select("*").From("forms").Where(sq.Eq{"form_id": form_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}
	form := Form{}
	err := app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions, &form.FormOneResponse)

	// var := []

	// log.Println("nya", _questions)

	if err != nil {
		fmt.Fprintf(os.Stderr, "1/.QueryRow failed: %v\n", err)
	}

	if form.FormPassword != nil && len(*form.FormPassword) != 0 {
		if len(form_password) == 0 {
			c.JSON(http.StatusUnauthorized, Response{
				Message: "Please remake your request with a password.",
			})
			return
		}

		if form_password != *form.FormPassword {
			c.JSON(http.StatusForbidden, Response{
				Message: "Password did not match that of the requested form.",
			})
			return
		}
	}

	//var questions []FormQuestion

	// _query, _args, _errQueryArgs := UsingDollarSigns.Select("*").From("form_questions").Where(sq.Eq{"form_id": form_id}).ToSql()
	// if _errQueryArgs != nil {
	// 	fmt.Println(errQueryArgs)
	// 	return
	// }
	// rows, _err := app_context.Database.Query(app_context.Context, _query, _args...)
	// for rows.Next() {
	// 	question := FormQuestion{}
	// 	err := rows.Scan(&question.QID, &question.QFormId, &question.QName, &question.QType, &question.QDescription)
	// 	if err != nil {
	// 		return
	// 	}
	// 	questions = append(questions, question)
	// }

	// if _err != nil {
	// 	fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	// }
	// log.Println(questions)
	// form.FormQuestions = questions

	var questions []FormQuestion
	// json.Unmarshal(form.FormQQuestions, &out)
	// log.Println(out)
	//log.Println("OWO", form.FormQQuestions)
	// log.Println("NYA", form.FormQQuestions)

	for _, q := range form.FormQQuestions.Elements {
		question := FormQuestion{}
		json.Unmarshal(q.Bytes, &question)
		questions = append(questions, question)
	}
	//log.Println("OWO", *form.FormQQuestions)
	//log.Println(out)

	form.FormQuestions = questions
	c.JSON(http.StatusOK, form)
}

func (app_context *App) create_form(c *gin.Context) {
	type CreateFormRequest struct {
		FormName     string `json:"name"`
		FormPassword string `json:"password"`
	}

	var new_form CreateFormRequest
	if err := c.BindJSON(&new_form); err != nil {
		return
	}

	query, args, errQueryArgs := UsingDollarSigns.Insert("forms").
		Columns("name", "password").
		Values(new_form.FormName, new_form.FormPassword).
		Suffix("RETURNING form_id, name").
		ToSql()

	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	fmt.Println(query)
	fmt.Println(args)

	form := Form{}
	err := app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName)

	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	}
	log.Println(form)
	c.JSON(http.StatusOK, form)
}
