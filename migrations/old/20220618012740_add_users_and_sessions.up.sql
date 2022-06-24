-- Add required connections to forms
ALTER TABLE forms ADD COLUMN required_connections VARCHAR[];

CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    connections     JSON[],
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS "sessions" (
    id 					VARCHAR,
	user_id 			BIGINT NOT NULL REFERENCES users(id),
    expires_at 			BIGINT NOT NULL,
	created_at 			TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),

	PRIMARY KEY (id,user_id)
)