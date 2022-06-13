CREATE TABLE IF NOT EXISTS form_questions (
    id      BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES forms(form_id)
    name    VARCHAR,
    description VARCHAR
    type    BIGINT
)