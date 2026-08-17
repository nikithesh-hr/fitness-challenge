-- Run this manually if you need to create the users table in PostgreSQL
-- (Not required when ddl-auto=update — Hibernate creates the table automatically)

CREATE TABLE IF NOT EXISTS users (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

-- Case-insensitive unique index on full name (not created by Hibernate automatically)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_name
    ON users (lower(first_name), lower(last_name));
