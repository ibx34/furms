use std::{fs::read_to_string,env};
use once_cell::sync::Lazy;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub dsn: String,
}

pub static CONFIG: Lazy<Config> = Lazy::new(|| {
    dotenv::dotenv().ok();

    let current_path = env::current_dir().expect("Failed to get current working directory");

    let contents =
        read_to_string(current_path.as_path().join("config.yaml")).expect("Failed to open your config.yaml");
    let config =  serde_yaml::from_str::<Config>(&contents)
        .expect("Failed to parse config.json");

    config
});