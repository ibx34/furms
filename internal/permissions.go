package internal

import (
	"fmt"

	"furms.dev/shared"
	sq "github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

type GenericError struct {
	Message string
}

func GetSession(context *gin.Context, app *App) (*Session, *GenericError) {
	possible_session, err := context.Cookie("session")
	if err != nil {
		return nil, &GenericError{Message: "Failed to get session cookie."}
	}

	query, args, errQueryArgs := shared.UsingDollarSigns.Select("*").From("sessions").Where(sq.Eq{"id": possible_session}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return nil, &GenericError{Message: "Error creating get-session query."}
	}

	session := Session{}
	err = app.Database.QueryRow(app.Context, query, args...).Scan(&session.Id, &session.Userid, &session.ExpiresAt, &session.CreatedAt)
	if err != nil {
		return nil, &GenericError{Message: "Error getting session from database."}
	}
	return &session, nil
}

func GetSessionUser(context *gin.Context, app *App) (*Users, *GenericError) {
	session, err := GetSession(context, app)
	if err != nil {
		return nil, err
	}

	user := Users{}
	query, args, errQueryArgs := shared.UsingDollarSigns.Select("*").From("users").Where(sq.Eq{"id": session.Userid}).ToSql()
	if errQueryArgs != nil {
		return nil, &GenericError{Message: "Error creating get-user query."}
	}

	_err := app.Database.QueryRow(app.Context, query, args...).Scan(&user.Id, &user.Connections, &user.DiscordId, &user.CreatedAt)
	if _err != nil {
		return nil, &GenericError{Message: "Error getting user from database."}
	}
	return &user, nil
}
