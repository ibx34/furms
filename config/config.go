package config

import (
	"gopkg.in/yaml.v3"

	"io/ioutil"
	"log"
	"os"
)

type AllowedCreatorsConf struct {
	Service string `yaml:"service" json:"service"`
	Id      string `yaml:"id" json:"id"`
}

type FormsConfig struct {
	AnyoneCanCreate  *bool                  `yaml:"anyone_can_create"`
	AllowedCreators  *[]AllowedCreatorsConf `yaml:"allowed_creators"`
	MaxQuestions     *uint64                `yaml:"max_questions"`
	AllowPasswords   *bool                  `yaml:"allow_passwords"`
	AllowRequireAuth *bool                  `yaml:"allow_required_auth"`
}

type DiscordConfig struct {
	Enabled     bool
	AppId       string `yaml:"app_id"`
	RedirectUri string `yaml:"redirect_uri"`
	PublicKey   string `yaml:"public_key"`
	Secret      string
	AuthLink    string `yaml:"auth_link"`
}

type GithubConfig struct {
	Enabled     bool
	AppId       string `yaml:"app_id"`
	Secret      string
	RedirectUri string `yaml:"redirect_uri"`
}

type Config struct {
	DatabaseURL string `yaml:"database_url"`
	JwtSecret   string `yaml:"jwt_secret"`
	Discord     DiscordConfig
	Forms       *FormsConfig
	Github      *GithubConfig
}

func New() (cfg Config, err error) {
	config := Config{}
	log.Print("Loading config file ...")

	pwd, err := os.Getwd()
	if err != nil {
		log.Fatal("Failed to get current working directory.")
		return config, err
	}
	config_bytes, err := ioutil.ReadFile(pwd + "/Furms.yml")
	if err != nil {
		log.Fatal("Failed to read config file.")
		return config, err
	}

	_err := yaml.Unmarshal(config_bytes, &config)
	if _err != nil {
		log.Fatalf("error: %v", err)
	}
	return config, nil
}
