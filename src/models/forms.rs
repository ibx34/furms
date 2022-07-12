use serde::{Deserialize, Serialize};
use sqlx::{FromRow, types::Json};
use chrono::NaiveDateTime;

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Question {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub r#type: i32
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Forms {
    pub id: String,
    pub creator: i32,
    pub created_at: NaiveDateTime,
    pub name: String,
    pub description: Option<String>,
    pub questions: Vec<Json<Question>>
}