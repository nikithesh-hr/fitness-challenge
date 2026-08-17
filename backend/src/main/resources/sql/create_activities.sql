-- Run this manually if you need to create the activities table in PostgreSQL
-- (Not required when ddl-auto=update — Hibernate creates the table automatically)

CREATE TABLE IF NOT EXISTS activities (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID           NOT NULL,
    sport            VARCHAR(50)    NOT NULL,
    distance_km      NUMERIC(10, 3),
    duration_seconds INTEGER,
    step_count       INTEGER,
    points           INTEGER        NOT NULL,
    notes            VARCHAR(500),
    extra_fields     JSONB          NOT NULL DEFAULT '{}'::jsonb,
    recorded_at      TIMESTAMP      NOT NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT now(),

    CONSTRAINT fk_activities_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT chk_sport_valid
        CHECK (sport IN ('RUNNING', 'WALKING', 'CYCLING', 'GYM', 'SWIMMING', 'DAILY_STEPS')),

    CONSTRAINT chk_points_non_negative
        CHECK (points >= 0)
);
