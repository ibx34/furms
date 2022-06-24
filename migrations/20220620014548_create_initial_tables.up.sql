CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    connections     JSON[],
    discord_id      BIGINT NOT NULL,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS "sessions" (
    id 					VARCHAR,
	user_id 			BIGINT NOT NULL REFERENCES users(id),
    expires_at 			BIGINT NOT NULL,
	created_at 			TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),

	PRIMARY KEY (id,user_id)
);

CREATE TABLE IF NOT EXISTS forms (
    form_id                 VARCHAR PRIMARY KEY,
    name                    VARCHAR,
    description             VARCHAR,
    password                VARCHAR,
    questions               JSON[],
    require_auth            BOOLEAN DEFAULT false,
    required_connections    VARCHAR[],

    created_at              TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    -- I'm not too sure if this will actually be used but I'll still have it just in case
    updated_at              TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    created_by              BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS responses (
    id              BIGSERIAL PRIMARY KEY,
    form_id         VARCHAR NOT NULL REFERENCES forms(form_id),
    -- In the case a form doesn't require auth this will be null.
    submitted_by    BIGINT,
    submitted_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    responses       JSON[] NOT NULL
);