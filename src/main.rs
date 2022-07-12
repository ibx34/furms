mod config;
mod models;

use anyhow::{Result};
use models::{db::Database, users::Users};
use config::CONFIG;
use tracing::Level;

#[tokio::main]
pub async fn main() -> Result<()> {
    tracing_subscriber::fmt().with_max_level(Level::DEBUG).pretty().init();

    let database = Database::new(CONFIG.dsn.to_owned()).await?;
    tracing::info!("Running migrations...");
    database.migrate().await?;

    let user = Users::new(366649052357591044).insert(database).await?;
    println!("{user:?}");
    
    return Ok(());
}