package internal

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/jackc/pgtype"
)

var (
	UsingDollarSigns = sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
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
	http_client := http.Client{}
	jwt_State := c.Request.URL.Query()["state"][0]
	code := c.Request.URL.Query()["code"][0]
	if len(jwt_State) == 0 || len(code) == 0 {
		return
	}

	form := url.Values{}
	form.Add("client_id", os.Getenv("DISCORD_APP_ID"))
	form.Add("grant_type", "authorization_code")
	form.Add("client_secret", os.Getenv("DISCORD_SERCRET"))
	form.Add("redirect_uri", os.Getenv("DISCORD_REDIRECT_URI"))
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

	query, args, errQueryArgs := UsingDollarSigns.Select("*").From("users").Where(sq.Eq{"discord_id": discord_user.DiscordId}).ToSql()
	if errQueryArgs != nil {
		fmt.Println(errQueryArgs)
		return
	}

	user := Users{}
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&user.Id, &user.Connections, &user.DiscordId, &user.CreatedAt)
	if err != nil {
		if user.Id == 0 {
			log.Println("New user... Asking to register... saving data for later.")
			query, args, errQueryArgs = UsingDollarSigns.
				Insert("users").
				Columns("discord_id").
				Values(discord_user.DiscordId).
				Suffix("RETURNING *").ToSql()

			if errQueryArgs != nil {
				fmt.Println(errQueryArgs)
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

	query, args, errQueryArgs = UsingDollarSigns.
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
	c.Header("Location", "http://localhost:3001/")
	c.Status(http.StatusMovedPermanently)
}

func (app_context *App) get_login(c *gin.Context) {
	service := c.Request.URL.Query()["service"][0]
	if len(service) == 0 {
		return
	}

	jwt_secret := []byte(os.Getenv("JWT_SECRET"))
	claims := OAuth2Claims{
		service,
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
		if os.Getenv("ALLOW_DISCORD_AUTH") == "true" {
			oauth_link := os.Getenv("DISCORD_OAUTH_LINK")
			if len(oauth_link) == 0 {
				return
			}
			oauth_link = fmt.Sprint(oauth_link, "&state=", new_jwt)
			c.Header("Location", oauth_link)
		}
	}
	c.Status(http.StatusMovedPermanently)
}

func (app_context *App) get_form_responses(c *gin.Context) {
	form_id := c.Params.ByName("form_id")
	if len(form_id) == 0 {
		return
	}

	query, args, errQueryArgs := UsingDollarSigns.Select("*").From("form_response").Where(sq.Eq{"form_id": form_id}).ToSql()
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
		rows.Scan(&response.ResponseId, &response.ResponseFormId, &response.ResponseTime, &response.DBResponses)
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
	err := app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions, &form.FormReqConns)
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
	err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormDescription, &form.FormQQuestions, &form.FormReqConns)
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
	err := app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&form.FormId, &form.FormName, &form.FormPassword, &form.FormReqConns, &form.FormQQuestions, &form.FormDescription)

	if err != nil {
		fmt.Fprintf(os.Stderr, "1/.QueryRow failed: %v\n", err)
	}

	if form.FormPassword != nil && len(*form.FormPassword) != 0 {
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
	if len(form.FormReqConns.Elements) > 0 {
		for _, conn := range form.FormReqConns.Elements {
			switch string(conn.String) {
			case "discord":
				cookie, err := c.Request.Cookie("session")
				// If there is no cookie/it errors then send them the bad thing.
				if err != nil {
					c.JSON(http.StatusUnauthorized, GetFormError{
						Message: "Please login.",
						Code:    1,
					})
					return
				}
				// jU2lRSChmKI8Xxn9uu6umWa1LnderjYjp58rKmJn1bj0/SnV3UlJuak9HC/0MAAjixnxwwgUHON/E4uPT6xXaQ==
				session_id, err := url.QueryUnescape(cookie.Value)
				if err != nil {
					return
				}
				query, args, errQueryArgs := UsingDollarSigns.Select("user_id").From("sessions").Where(sq.Eq{"id": session_id}).ToSql()
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

				query, args, errQueryArgs = UsingDollarSigns.Select("*").From("users").Where(sq.Eq{"id": session.Userid}).ToSql()
				if errQueryArgs != nil {
					fmt.Println(errQueryArgs)
					return
				}
				user := Users{}
				err = app_context.Database.QueryRow(app_context.Context, query, args...).Scan(&user.Id, &user.Connections, &user.CreatedAt, &user.DiscordId)
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
			}
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
