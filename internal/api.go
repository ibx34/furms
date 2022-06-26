package internal

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"furms.dev/models"
	"furms.dev/shared"
	sq "github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/jackc/pgtype"
)

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

func AuthMiddleWhere(c *gin.Context) {
	log.Println("Session: ", c.Request.Cookies())
	c.Next()
}

func (app_context *App) login_callback(c *gin.Context) {
	// possible_sessions := c.Request.Cookies()

	http_client := http.Client{}
	jwt_State := c.Request.URL.Query()["state"][0]
	code := c.Request.URL.Query()["code"][0]
	if len(jwt_State) == 0 || len(code) == 0 {
		return
	}

	token, _ := jwt.ParseWithClaims(jwt_State, &OAuth2Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(app_context.Config.JwtSecret), nil
	})

	claims, ok := token.Claims.(*OAuth2Claims)
	if !ok {
		c.JSON(http.StatusBadRequest, Response{Message: "Bad state."})
	}
	form := url.Values{}
	form.Add("client_id", app_context.Config.Discord.AppId)
	form.Add("grant_type", "authorization_code")
	form.Add("client_secret", app_context.Config.Discord.Secret)
	form.Add("redirect_uri", app_context.Config.Discord.RedirectUri)
	form.Add("code", code)

	req, err := http.NewRequest(
		"POST",
		"https://discord.com/api/v10/oauth2/token",
		strings.NewReader(form.Encode()),
	)

	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	if err != nil {
		return
	}
	resp, err := http_client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return
	}
	oauth_data := SuccessfulDiscordAuth{}
	err = json.Unmarshal(body, &oauth_data)
	if err != nil {
		return
	}
	log.Println(oauth_data)
	req, err = http.NewRequest(
		"GET",
		"https://discord.com/api/v10/users/@me",
		nil,
	)
	req.Header.Add("Authorization", fmt.Sprintf("%s %s", oauth_data.TokenType, oauth_data.AccessToken))
	if err != nil {
		return
	}
	resp, err = http_client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()
	body, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return
	}
	discord_user := DiscordUser{}
	err = json.Unmarshal(body, &discord_user)
	if err != nil {
		log.Println("err: ", err)
		return
	}
	log.Println(discord_user)
	query, args, errQueryArgs := shared.UsingDollarSigns.Select("*").From("users").Where(sq.Eq{"discord_id": discord_user.DiscordId}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	user := Users{}
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&user.Id, &user.Connections, &user.DiscordId, &user.CreatedAt)
	if err != nil {
		if user.Id == 0 {
			log.Println("New user... Asking to register... saving data for later.")
			query, args, errQueryArgs = shared.UsingDollarSigns.
				Insert("users").
				Columns("discord_id").
				Values(discord_user.DiscordId).
				Suffix("RETURNING *").ToSql()

			if errQueryArgs != nil {
				fmt.Println("OwO", errQueryArgs)
				return
			}

			err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&user.Id, &user.Connections, &user.DiscordId, &user.CreatedAt)
			if err != nil {
				fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
			}
		}
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	}

	session_id := [64]byte{}
	rand.Read(session_id[:])

	base64_sid := base64.StdEncoding.EncodeToString(session_id[:])
	expires_at := time.Now().Add(604800000000000)

	query, args, errQueryArgs = shared.UsingDollarSigns.
		Insert("sessions").
		Columns("id", "user_id", "expires_at", "created_at").
		Values(base64_sid, user.Id, expires_at.Unix(), time.Now()).
		Suffix("RETURNING *").ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}
	session := Session{}
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&session.Id, &session.Userid, &session.ExpiresAt, &session.CreatedAt)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	}

	c.SetCookie("session", session.Id, 604800, "/", "", true, true)
	c.Header("Location", claims.RedirectUri)
	c.Status(http.StatusMovedPermanently)
}

func (app_context *App) get_login(c *gin.Context) {
	service := c.Request.URL.Query()["service"][0]
	redirect_uri := c.Request.URL.Query()["redirect_url"][0]
	if len(service) == 0 || len(redirect_uri) == 0 {
		return
	}

	jwt_secret := []byte(app_context.Config.JwtSecret)
	claims := OAuth2Claims{
		service,
		redirect_uri,
		jwt.StandardClaims{
			ExpiresAt: 15000,
			Issuer:    "test",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	new_jwt, err := token.SignedString(jwt_secret)
	if err != nil {
		return
	}

	switch service {
	case "discord":
		if app_context.Config.Discord.Enabled {
			oauth_link := app_context.Config.Discord.AuthLink
			if len(oauth_link) == 0 {
				return
			}
			oauth_link = fmt.Sprint(oauth_link, "&state=", new_jwt)
			c.Header("Location", oauth_link)
		}

	case "github":
		if app_context.Config.Github != nil && app_context.Config.Github.Enabled {
			base_link := fmt.Sprintf("%s?client_id=%s&redirect_uri=%s&state=%s&scope=%s",
				"https://github.com/login/oauth/authorize",
				app_context.Config.Github.AppId,
				app_context.Config.Github.RedirectUri,
				new_jwt,
				"read:user%20user:email",
			)
			c.Header("Location", base_link)
		}
	}
	c.Status(http.StatusMovedPermanently)
}

func (app_context *App) download_form_response(c *gin.Context) {
	// Check if the user requests responses can actually access them.

	form_id, response_id := c.Params.ByName("form_id"), c.Params.ByName("rid")
	if len(form_id) == 0 {
		return
	}

	query, args, errQueryArgs := shared.UsingDollarSigns.Select("*").From("responses").Where(sq.Eq{"form_id": form_id, "id": response_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	response := FormResponse{}
	err := app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&response.ResponseId, &response.ResponseFormId, &response.ResponseBy, &response.DBResponses, &response.ResponseTime)
	// .Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions, &form.FormOneResponse)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	}

	var responses []QuestionResponse
	for _, q := range response.DBResponses.Elements {
		response := QuestionResponse{}
		json.Unmarshal(q.Bytes, &response)
		responses = append(responses, response)
	}
	response.Responses = responses

	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", fmt.Sprint("attachment; filename=", form_id, "-", response_id, ".json"))
	j, _ := json.Marshal(response)
	c.Stream(func(w io.Writer) bool {
		w.Write(j)
		return false
	})
}

func (app_context *App) get_form_responses(c *gin.Context) {
	// Check if the user requests responses can actually access them.

	form_id := c.Params.ByName("form_id")
	if len(form_id) == 0 {
		return
	}

	query, args, errQueryArgs := shared.UsingDollarSigns.Select("*").From("responses").Where(sq.Eq{"form_id": form_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	rows, err := app_context.Database.Query(app_context.Context, query, args...)
	// .Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions, &form.FormOneResponse)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	}

	var responses []FormResponse
	for rows.Next() {
		response := FormResponse{}
		rows.Scan(&response.ResponseId, &response.ResponseFormId, &response.ResponseBy, &response.DBResponses, &response.ResponseTime)
		log.Println(response)
		var question_responses []QuestionResponse
		for _, q := range response.DBResponses.Elements {
			question := QuestionResponse{}
			json.Unmarshal(q.Bytes, &question)
			question_responses = append(question_responses, question)
		}
		response.Responses = question_responses
		responses = append(responses, response)
	}
	c.JSON(http.StatusOK, GetResponsesResponse{Responses: responses})
}

func (app_context *App) create_form_response(c *gin.Context) {
	cookie, err := c.Request.Cookie("session")
	// If there is no cookie/it errors then send them the bad thing.
	if err != nil {
		c.JSON(http.StatusUnauthorized, GetFormError{
			Message: "Please login.",
			Code:    1,
		})
		return
	}

	session_id, err := url.QueryUnescape(cookie.Value)
	if err != nil {
		log.Println("SID", err)
		return
	}
	query, args, errQueryArgs := shared.UsingDollarSigns.Select("user_id").From("sessions").Where(sq.Eq{"id": session_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}
	session := Session{}
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&session.Userid)
	if err != nil {
		log.Println("Err2", err)
		return
	}

	query, args, errQueryArgs = shared.UsingDollarSigns.Select("*").From("users").Where(sq.Eq{"id": session.Userid}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}
	user := Users{}
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&user.Id, &user.Connections, &user.DiscordId, &user.CreatedAt)
	if err != nil {
		log.Println("Err1", err)
		return
	}

	form_id := c.Params.ByName("form_id")
	if len(form_id) == 0 {
		return
	}

	query, args, errQueryArgs = shared.UsingDollarSigns.Select("*").From("forms").Where(sq.Eq{"form_id": form_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	form := Form{}
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormDescription, &form.FormPassword, &form.FormQQuestions, &form.FormReqAuth, &form.FormCreatedAt, &form.FormUpdatedAt, &form.FormCreatedBy, &form.FormRespLimit)

	if err != nil {
		log.Println(err)
		return
	}
	//log.Println(*form.FormRespLimit)
	if form.FormRespLimit != nil {
		query, args, errQueryArgs = shared.UsingDollarSigns.Select("count(*)").From("responses").Where(sq.Eq{"form_id": form.FormId, "submitted_by": user.Id}).ToSql()
		if errQueryArgs != nil {
			fmt.Println(errQueryArgs)
			return
		}
		var response_count uint64
		err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&response_count)
		if err != nil {
			return
		}

		if response_count >= *form.FormRespLimit {
			c.Status(http.StatusForbidden)
			return
		}
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

	query, args, errQueryArgs = shared.UsingDollarSigns.Insert("responses").
		Columns("form_id", "responses", "submitted_by", "submitted_at").
		Values(form_id, jsonArray, user.Id, time.Now()).
		ToSql()

	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	_, err = app_context.Database.Exec(app_context.Context, query, args...)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	}
	c.JSON(http.StatusOK, Response{Message: "good"})
}

func (app_context *App) create_form_question(c *gin.Context) {
	_, _err := GetSessionUser(c, app_context)
	if _err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	form_id := c.Params.ByName("form_id")
	if len(form_id) == 0 {
		return
	}

	query, args, errQueryArgs := shared.UsingDollarSigns.Select("*").From("forms").Where(sq.Eq{"form_id": form_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}
	form := Form{}
	err := app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions)
	if err != nil {
		fmt.Fprintf(os.Stderr, "1/.QueryRow failed: %v\n", err)
	}

	// if form.FormCreatedBy != user.Id {
	// 	c.Status(http.StatusForbidden)
	// 	return
	// }

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

	query, args, errQueryArgs = shared.UsingDollarSigns.Update("forms").Set("questions", jsonArray).Where(sq.Eq{"form_id": form_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions)
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

	query, args, errQueryArgs := shared.UsingDollarSigns.Select("*").From("forms").Where(sq.Eq{"form_id": form_id}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	form := Form{}
	err := app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormDescription, &form.FormPassword, &form.FormQQuestions, &form.FormReqAuth, &form.FormCreatedAt, &form.FormUpdatedAt, &form.FormCreatedBy, &form.FormRespLimit)

	if err != nil {
		fmt.Fprintf(os.Stderr, "12/.QueryRow failed: %v\n", err)
	}
	if form.FormPassword != nil {
		if len(form_password) == 0 {
			c.JSON(http.StatusUnauthorized, GetFormError{
				Message: "Please remake your request with a password.",
				Code:    0,
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

	// Okay we require some stuff :D
	if form.FormReqAuth != nil { //len(form.FormReqConns.Elements) > 0 {
		if *form.FormReqAuth {
			// 	for _, conn := range form.FormReqConns.Elements {
			// 		switch string(conn.String) {
			//		case "discord":
			cookie, err := c.Request.Cookie("session")
			// If there is no cookie/it errors then send them the bad thing.
			if err != nil {
				c.JSON(http.StatusUnauthorized, GetFormError{
					Message: "Please login.",
					Code:    1,
				})
				return
			}
			session_id, err := url.QueryUnescape(cookie.Value)
			if err != nil {
				return
			}
			query, args, errQueryArgs := shared.UsingDollarSigns.Select("user_id").From("sessions").Where(sq.Eq{"id": session_id}).ToSql()
			if errQueryArgs != nil {
				fmt.Println(errQueryArgs)
				return
			}
			session := Session{}
			err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&session.Userid)
			if err != nil {
				log.Println("Err2", err)
				return
			}

			query, args, errQueryArgs = shared.UsingDollarSigns.Select("*").From("users").Where(sq.Eq{"id": session.Userid}).ToSql()
			if errQueryArgs != nil {
				fmt.Println(errQueryArgs)
				return
			}
			user := Users{}
			err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&user.Id, &user.Connections, &user.DiscordId, &user.CreatedAt)
			if err != nil {
				log.Println("Err1", err)
				return
			}
			if user.DiscordId == nil {
				c.JSON(http.StatusForbidden, GetFormError{
					Message: "Please connect your Discord account.",
					Code:    2,
				})
				return
			}
			//}
		}
	}

	var questions []FormQuestion
	for _, q := range form.FormQQuestions.Elements {
		question := FormQuestion{}
		json.Unmarshal(q.Bytes, &question)
		questions = append(questions, question)
	}
	form.FormQuestions = questions
	c.JSON(http.StatusOK, form)
}

func (app_context *App) create_form(c *gin.Context) {
	user, _err := GetSessionUser(c, app_context)
	if _err != nil {
		c.JSON(http.StatusBadRequest, Response{Message: _err.Message})
		return
	}

	// Check if creating forms is disabled for everyone.
	if app_context.Config.Forms != nil &&
		(app_context.Config.Forms.AnyoneCanCreate != nil &&
			!*app_context.Config.Forms.AnyoneCanCreate) {

		allowed_to_create := false
		if app_context.Config.Forms.AllowedCreators != nil &&
			len(*app_context.Config.Forms.AllowedCreators) > 0 {
		out:
			for _, allowed_user := range *app_context.Config.Forms.AllowedCreators {
				switch allowed_user.Service {
				case "discord":
					if user.DiscordId != nil && allowed_user.Id == strconv.FormatUint(*user.DiscordId, 10) {
						allowed_to_create = true
						break out
					}
				case "furms":
					if allowed_user.Id == strconv.FormatUint(user.Id, 10) {
						allowed_to_create = true
						break out
					}
				}
			}
		}

		if !allowed_to_create {
			c.Status(http.StatusForbidden)
			return
		}
	}

	type CreateFormRequest struct {
		Name         string  `json:"name"`
		Password     *string `json:"password"`
		Description  *string `json:"description"`
		RequiresAuth *bool   `json:"auth"`
		RespLimit    *uint64 `json:"limit"`
	}

	var new_form CreateFormRequest
	if err := c.BindJSON(&new_form); err != nil {
		return
	}

	form := models.Form{}

	_, err := form.NewForm(
		new_form.Name,
		new_form.Description,
		new_form.Password,
		new_form.RequiresAuth,
		user.Id,
		new_form.RespLimit,
		false,
		app_context.Database,
		app_context.Context,
	)

	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	}
	c.JSON(http.StatusOK, form)
}
