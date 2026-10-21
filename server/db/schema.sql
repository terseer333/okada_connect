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

-- Ride requests (Phase 6) and lifecycle (Phase 7).
CREATE TABLE IF NOT EXISTS ride_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rider_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup_latitude  DOUBLE PRECISION NOT NULL,
  pickup_longitude DOUBLE PRECISION NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')),
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at      TIMESTAMPTZ,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_customer ON ride_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_rider ON ride_requests(rider_id);

CREATE INDEX IF NOT EXISTS idx_riders_availability ON riders(availability_status);
