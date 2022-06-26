package internal

import (
	"fmt"
	"net/http"

	"furms.dev/shared"
	sq "github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

func (app_context *App) get_user_forms(c *gin.Context) {
	user, err := GetSessionUser(c, app_context)
	if err != nil {
		c.Status(http.StatusForbidden)
	}

	query, args, errQueryArgs := shared.UsingDollarSigns.Select("*").From("forms").Where(sq.Eq{"created_by": user.Id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	rows, _err := app_context.Database.Query(app_context.Context, query, args...)
	if _err != nil {
		c.Status(http.StatusForbidden)
	}

	var forms []Form
	for rows.Next() {
		form := Form{}
		rows.Scan(&form.FormId, &form.FormName, &form.FormDescription, &form.FormPassword, &form.FormQQuestions, &form.FormReqAuth, &form.FormCreatedAt, &form.FormUpdatedAt, &form.FormCreatedBy, &form.FormRespLimit)
		forms = append(forms, form)
	}

	c.JSON(http.StatusOK, forms)
}
