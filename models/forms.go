package models

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"time"

	"furms.dev/shared"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4/pgxpool"
)

type DBError struct {
	Code int64
}

type ChoiceQuestionType struct {
	MultipleSelections bool     `db:"-" json:"multiple_selections"`
	Choices            []string `db:"-" json:"choices"`
}

type FormQuestion struct {
	Id          uint64              `db:"id" json:"id"`
	FormId      uint64              `db:"form_id"`
	Name        string              `db:"name" json:"name"`
	Type        uint64              `db:"type" json:"type"`
	Description *string             `db:"description" json:"description"`
	MinValue    *uint64             `db:"-" json:"min"`
	MaxValue    *uint64             `db:"-" json:"max"`
	Choice      *ChoiceQuestionType `db:"-" json:"choices"`
}

type Form struct {
	Id          string            `db:"form_id" json:"form_id"`
	Name        string            `db:"name" json:"name"`
	Description *string           `db:"description" json:"description"`
	Password    *string           `db:"password"  json:"password"`
	Questions   []FormQuestion    `json:"questions"`
	QQuestions  pgtype.JSONBArray `db:"questions" json:"-"`
	ReqAuth     *bool             `db:"require_auth" json:"require_auth"`
	CreatedAt   *time.Time        `db:"created_at" json:"created_at"`
	CreatedBy   uint64            `db:"created_by" json:"created_by"`
	UpdatedAt   *time.Time        `db:"updated_at" json:"updated_at"`
	RespLimit   *uint64           `db:"response_limit" json:"resp_limit"`
}

func (form *Form) NewForm(
	name string,
	description *string,
	password *string,
	req_auth *bool,
	created_by uint64,
	response_limit *uint64,
	public bool,

	database *pgxpool.Pool,
	context context.Context,
) (*Form, *DBError) {
	//if public != nil && *public {
	if public {
		// Public forms are required to require authoirzation
		// just because they're public and anyone can use them.
		if req_auth == nil || (req_auth != nil && !*req_auth) {
			return nil, &DBError{Code: 0}
		}
	}

	form_idb := [8]byte{}
	rand.Read(form_idb[:])
	form_id := hex.EncodeToString(form_idb[:])

	// TODO: Check if the user who is creating this is allowed to create forms.
	// Should this even happen here? Probably not. It should most likely occur before
	// this method is called, or maybe even provide some wrapper function to combine this
	// and checking the user while still letting the underlying function be accessed.

	query, args, err := shared.UsingDollarSigns.Insert("forms").
		Columns("form_id", "name", "description", "password", "require_auth", "response_limit", "created_by", "created_at").
		Values(form_id, name, description, password, req_auth, response_limit, created_by, time.Now()).
		Suffix("RETURNING form_id, name").
		ToSql()

	if err != nil {
		log.Println("QueryRow failed: ", err)
		return nil, &DBError{Code: 1}
	}

	err = database.QueryRow(context, query, args...).Scan(&form.Id, &form.Name)
	if err != nil {
		log.Println("QueryRow failed: ", err)
		return nil, &DBError{Code: 2}
	}
	return form, nil
}
