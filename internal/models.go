package internal

import (
	"context"
	"time"

	"furms.dev/config"
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
	QRequired    *bool               `db:"-" json:"required"`
}

type QuestionResponse struct {
	QuestionId uint64      `json:"id"`
	Response   interface{} `json:"response"`
}

type Form struct {
	FormId          string            `db:"form_id" json:"form_id"`
	FormName        string            `db:"name" json:"name"`
	FormDescription *string           `db:"description" json:"description"`
	FormPassword    *string           `db:"password"  json:"password"`
	FormQuestions   []FormQuestion    `json:"questions"`
	FormQQuestions  pgtype.JSONBArray `db:"questions" json:"-"`
	FormReqAuth     *bool             `db:"require_auth" json:"require_auth"`
	FormCreatedAt   *time.Time        `db:"created_at" json:"created_at"`
	FormCreatedBy   uint64            `db:"created_by" json:"created_by"`
	FormUpdatedAt   *time.Time        `db:"updated_at" json:"updated_at"`
	FormRespLimit   *uint64           `db:"response_limit" json:"resp_limit"`
}

type FormResponse struct {
	ResponseId     uint64             `db:"id" json:"id"`
	ResponseFormId string             `db:"form_id" json:"form_id"`
	ResponseBy     *uint64            `db:"submitted_by" json:"submitted_by"`
	DBResponses    pgtype.JSONBArray  `db:"responses" json:"-"`
	ResponseTime   time.Time          `db:"submitted_at" json:"submitted_at"`
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

type GetMyFormsResponse struct {
	Forms []Form `json:"forms"`
}

type App struct {
	Context  context.Context
	Database *pgxpool.Pool
	Config   config.Config
}

type OAuth2Claims struct {
	Service     string `json:"service"`
	RedirectUri string `json:"redirect_uri"`
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
