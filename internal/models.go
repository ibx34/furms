package internal

import (
	"context"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4/pgxpool"
)

type ChoiceQuestionType struct {
	MultipleSelections bool     `db:"-" json:"multiple_selections"`
	Choices            []string `db:"-" json:"choices"`
}

type FormQuestion struct {
	QID          uint64              `db:"id" json:"id"`
	QFormId      uint64              `db:"form_id"`
	QName        string              `db:"name" json:"name"`
	QType        uint64              `db:"type" json:"type"`
	QDescription *string             `db:"description" json:"description"`
	QMinValue    *uint64             `db:"-" json:"min"`
	QMaxValue    *uint64             `db:"-" json:"max"`
	QChoice      *ChoiceQuestionType `db:"-" json:"choices"`
}

type QuestionResponse struct {
	QuestionId uint64      `json:"id"`
	Response   interface{} `json:"response"`
}

type Form struct {
	FormId          uint64              `db:"form_id" json:"form_id"`
	FormName        string              `db:"name" json:"name"`
	FormPassword    *string             `db:"password"  json:"password"`
	FormDescription *string             `db:"description" json:"description"`
	FormQuestions   []FormQuestion      `json:"questions"`
	FormQQuestions  pgtype.JSONBArray   `db:"questions" json:"-"`
	FormReqConns    pgtype.VarcharArray `db:"required_connections" json:"-"`
}

type FormResponse struct {
	ResponseId     uint64             `db:"id" json:"id"`
	ResponseFormId uint64             `db:"form_id" json:"form_id"`
	ResponseTime   time.Time          `db:"response_at" json:"response_at"`
	DBResponses    pgtype.JSONBArray  `db:"responses" json:"-"`
	Responses      []QuestionResponse `db:"-" json:"responses"`
}

type Users struct {
	Id          uint64             `db:"id" json:"id"`
	Connections *pgtype.JSONBArray `db:"connections" json:"connections"`
	DiscordId   *uint64            `db:"discord_id" json:"discord_id"`
	CreatedAt   time.Time          `db:"created_at" json:"created_at"`
}

type UserConnection struct {
	Service  string `db:"-" json:"service"`
	UniqueId string `db:"-" json:"id"`
}

type Session struct {
	Id        string    `db:"id" json:"id"`
	Userid    uint64    `db:"user_id" json:"user_id"`
	ExpiresAt uint64    `db:"expires_at" json:"expires_at"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type Response struct {
	Message string `json:"message"`
}

type GetFormError struct {
	Message string `json:"message"`
	Code    uint64 `json:"code"`
}

type CreateQuestionResponse struct {
	Questions []FormQuestion `json:"questions"`
}

type GetResponsesResponse struct {
	Responses []FormResponse `json:"responses"`
}

type App struct {
	Context  context.Context
	Database *pgxpool.Pool
}

type OAuth2Claims struct {
	Service string `json:"service"`
	jwt.StandardClaims
}

type SuccessfulDiscordAuth struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    uint64 `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	TokenType    string `json:"token_type"`
}

type DiscordUser struct {
	DiscordId string  `json:"id"`
	Email     *string `json:"email"`
	Username  string  `json:"username"`
	Discrim   string  `json:"discriminator"`
}
