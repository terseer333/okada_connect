-- Okada Connect schema
-- Runs idempotently on server boot (IF NOT EXISTS throughout).

-- gen_random_uuid() is built into Postgres 13+; pgcrypto provides it on older
-- servers. Installed inside a DO block so a missing extension doesn't crash
-- boot on minimal builds (e.g. pgserver's bundled Postgres).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pgcrypto') THEN
    RAISE NOTICE 'pgcrypto not available; using built-in gen_random_uuid()';
  ELSE
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('customer', 'rider')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riders (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  motorcycle_number    TEXT,
  motorcycle_model     TEXT,
  availability_status  TEXT NOT NULL DEFAULT 'offline'
                       CHECK (availability_status IN ('offline', 'online', 'busy')),
  current_latitude     DOUBLE PRECISION,
  current_longitude    DOUBLE PRECISION,
  rating               DOUBLE PRECISION DEFAULT 0,
  rating_count         INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE riders ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- Last known location of a customer (used to match nearby riders).
CREATE TABLE IF NOT EXISTS customer_locations (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riders_availability ON riders(availability_status);
