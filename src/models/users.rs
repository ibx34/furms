use serde::{Deserialize, Serialize};
use sqlx::{FromRow};
use super::db::Database;
use anyhow::Result;

#[derive(Serialize, Deserialize, FromRow, Clone, Debug, Default)]
pub struct Users {
    pub id: i64,
    pub discord: i64
}

impl Users {
    pub fn new(discord:i64) -> Self {
        Self { discord, ..Default::default()}
    }
    pub async fn insert(self, database: Database) -> Result<Users> {
        return Ok(sqlx::query_as::<_, Users>(r#"INSERT INTO users(discord) VALUES($1) RETURNING *"#).bind(self.discord).fetch_one(&database.0).await?)
    }
}