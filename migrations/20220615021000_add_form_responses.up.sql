CREATE TABLE IF NOT EXISTS form_response (
    id          BIGSERIAL PRIMARY KEY,
    form_id     BIGINT NOT NULL REFERENCES forms(form_id),
    response_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    responses   JSON[] NOT NULL
)