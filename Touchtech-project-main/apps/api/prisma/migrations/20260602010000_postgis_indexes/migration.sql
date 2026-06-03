-- Raw-SQL migration for constructs Prisma cannot express declaratively.
-- Run AFTER `prisma migrate` has created the base tables/indexes.
-- Idempotent where practical so it is safe to re-apply in dev.

-- ---------------------------------------------------------------------------
-- Extensions (also declared in schema.prisma; ensured here for raw runs)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- GiST spatial indexes on geography columns
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_worker_loc
  ON worker_profiles USING GIST (current_location);

CREATE INDEX IF NOT EXISTS idx_addr_geom
  ON addresses USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_req_pickup_geom
  ON requests USING GIST (pickup_geom);

-- ---------------------------------------------------------------------------
-- Partial indexes for hot query paths
-- ---------------------------------------------------------------------------

-- Worker "nearby pool": only requests still open for matching.
CREATE INDEX IF NOT EXISTS idx_req_open_pickup
  ON requests USING GIST (pickup_geom)
  WHERE status IN ('created', 'matched');

-- Matching scans only available workers.
CREATE INDEX IF NOT EXISTS idx_worker_avail
  ON worker_profiles (is_available)
  WHERE is_available;

-- Unread-notification counts.
CREATE INDEX IF NOT EXISTS idx_notif_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Active (non-revoked) sessions for refresh/logout lookups.
CREATE INDEX IF NOT EXISTS idx_sess_active
  ON sessions (user_id)
  WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- CHECK constraints (business invariants)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_window') THEN
    ALTER TABLE requests
      ADD CONSTRAINT chk_window
      CHECK (window_end IS NULL OR window_start IS NULL OR window_end > window_start);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_price') THEN
    ALTER TABLE requests
      ADD CONSTRAINT chk_price CHECK (price_cents >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_score') THEN
    ALTER TABLE ratings
      ADD CONSTRAINT chk_score CHECK (score BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_detour') THEN
    ALTER TABLE worker_profiles
      ADD CONSTRAINT chk_detour CHECK (max_detour_pct BETWEEN 0 AND 100);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- location_pings range partitioning (by recorded_at)
-- ---------------------------------------------------------------------------
-- NOTE: Prisma created `location_pings` as a normal table. We swap it for a
-- partitioned parent. In a fresh environment this runs before any data exists.
-- For existing data, migrate rows into the partitioned table out-of-band.

-- A DEFAULT partition guarantees inserts never fail if a daily partition is
-- missing; a scheduled job (pg_partman or app cron) pre-creates daily ranges.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_partitioned_table pt
    JOIN pg_class c ON c.oid = pt.partrelid
    WHERE c.relname = 'location_pings'
  ) THEN
    -- Rebuild as partitioned only if not already partitioned.
    ALTER TABLE location_pings RENAME TO location_pings_legacy;

    CREATE TABLE location_pings (
      id          BIGINT GENERATED ALWAYS AS IDENTITY,
      worker_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      batch_id    BIGINT REFERENCES batches(id) ON DELETE SET NULL,
      geom        geography(Point, 4326) NOT NULL,
      speed_mps   REAL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (id, recorded_at)
    ) PARTITION BY RANGE (recorded_at);

    CREATE INDEX idx_ping_batch_time
      ON location_pings (batch_id, recorded_at DESC);

    CREATE TABLE location_pings_default
      PARTITION OF location_pings DEFAULT;

    INSERT INTO location_pings (worker_id, batch_id, geom, speed_mps, recorded_at)
      SELECT worker_id, batch_id, geom, speed_mps, recorded_at
      FROM location_pings_legacy;

    DROP TABLE location_pings_legacy;
  END IF;
END $$;

-- Helper to pre-create a daily partition; called by a scheduled job.
CREATE OR REPLACE FUNCTION create_location_ping_partition(target_day DATE)
RETURNS void AS $$
DECLARE
  part_name TEXT := format('location_pings_%s', to_char(target_day, 'YYYYMMDD'));
  start_ts  TIMESTAMPTZ := target_day::timestamptz;
  end_ts    TIMESTAMPTZ := (target_day + 1)::timestamptz;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF location_pings FOR VALUES FROM (%L) TO (%L)',
      part_name, start_ts, end_ts
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
