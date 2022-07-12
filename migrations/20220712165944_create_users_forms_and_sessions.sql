-- Add migration script here

CREATE TABLE IF NOT EXISTS "users" (
    "id"        BIGSERIAL NOT NULL,

    PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "forms" (
    "id"            VARCHAR         NOT NULL,
    "creator"       BIGINT          NOT NULL REFERENCES "users"("id"),
    "created_at"    TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    "name"          VARCHAR(64)     NOT NULL,
    "description"   VARCHAR(2000),
    "questions"     JSON[],

    PRIMARY KEY("id")
);