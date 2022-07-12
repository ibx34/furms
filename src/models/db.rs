use sqlx::{postgres::PgPoolOptions, Pool, Postgres, migrate::Migrator};
use anyhow::{Result, bail};
use std::env;

pub struct Database (pub Pool<Postgres>);

impl Database {
    pub async fn new(dsn: String) -> Result<Self> {
        let database = PgPoolOptions::new()
            .max_connections(150)
            .connect(&dsn)
            .await?;
        return Ok(Self(database))
    }
    pub async fn migrate(&self) -> Result<()> {
        let current_path = env::current_dir().expect("Failed to get current working directory");
        let migrations_dir = current_path.as_path().join("migrations");
        if !migrations_dir.is_dir() || !migrations_dir.exists() {
            bail!("Migrations path is not a directory");
        }
        let migrator = Migrator::new(migrations_dir).await?;
        migrator.run(&self.0).await?;
        return Ok(())
    }
}