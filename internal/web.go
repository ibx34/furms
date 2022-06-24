package internal

import (
	"context"

	"furms.dev/config"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func StartApi(ctx context.Context, dbConn *pgxpool.Pool, config config.Config) {
	app_context := App{Context: ctx, Database: dbConn, Config: config}
	r := gin.Default()
	r.Use(CORSMiddleware)
	r.GET("/forms/:form_id", app_context.get_form)
	r.GET("/oauth2/login", app_context.get_login)
	r.GET("/oauth2/callback", app_context.login_callback)
	r.Use(AuthMiddleWhere)
	r.POST("/forms/new", app_context.create_form)
	r.PATCH("/forms/:form_id/questions", app_context.create_form_question)
	r.POST("/forms/:form_id/respond", app_context.create_form_response)
	r.GET("/forms/:form_id/responses", app_context.get_form_responses)
	r.GET("/forms/:form_id/responses/:rid", app_context.download_form_response)
	r.Run()
}
