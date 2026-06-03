-- Baseline schema for RouteShare. Creates extensions, enums, tables, foreign
-- keys, and the indexes Prisma can express. PostGIS geography columns are
-- created here as raw `geography(...)` types; spatial/partial indexes and
-- partitioning are added by the follow-up migration.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

-- Enums -------------------------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('admin', 'user', 'worker');
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE "WorkerVerification" AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE "VehicleType" AS ENUM ('bike', 'motorbike', 'car', 'van', 'foot');
CREATE TYPE "PackageSize" AS ENUM ('xs', 's', 'm', 'l', 'xl');
CREATE TYPE "RequestStatus" AS ENUM (
  'created', 'matched', 'accepted', 'picked_up', 'in_transit',
  'delivered', 'confirmed', 'cancelled', 'failed'
);
CREATE TYPE "BatchStatus" AS ENUM ('planning', 'active', 'completed', 'cancelled');
CREATE TYPE "StopStatus" AS ENUM ('pending', 'arrived', 'picked_up', 'dropped_off', 'skipped');
CREATE TYPE "NotificationType" AS ENUM ('status_change', 'assignment', 'message', 'system');
CREATE TYPE "ProofType" AS ENUM ('photo', 'signature', 'code', 'none');

-- Tables ------------------------------------------------------------------
CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "email" CITEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "status" "UserStatus" NOT NULL DEFAULT 'active',
  "full_name" TEXT NOT NULL,
  "phone" TEXT,
  "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  "rating_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE INDEX "users_role_status_idx" ON "users" ("role", "status");

CREATE TABLE "worker_profiles" (
  "user_id" BIGINT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "verification" "WorkerVerification" NOT NULL DEFAULT 'pending',
  "vehicle" "VehicleType" NOT NULL,
  "is_available" BOOLEAN NOT NULL DEFAULT false,
  "current_location" geography(Point, 4326),
  "route_corridor" geography(LineString, 4326),
  "max_detour_pct" SMALLINT NOT NULL DEFAULT 15,
  "last_seen_at" TIMESTAMPTZ(6)
);

CREATE TABLE "addresses" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" TEXT,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "city" TEXT NOT NULL,
  "postal_code" TEXT,
  "geom" geography(Point, 4326) NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "addresses_user_id_idx" ON "addresses" ("user_id");

CREATE TABLE "requests" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "pickup_geom" geography(Point, 4326) NOT NULL,
  "pickup_text" TEXT NOT NULL,
  "dropoff_geom" geography(Point, 4326) NOT NULL,
  "dropoff_text" TEXT NOT NULL,
  "recipient_name" TEXT NOT NULL,
  "recipient_phone" TEXT,
  "package_size" "PackageSize" NOT NULL,
  "notes" TEXT,
  "window_start" TIMESTAMPTZ(6),
  "window_end" TIMESTAMPTZ(6),
  "status" "RequestStatus" NOT NULL DEFAULT 'created',
  "price_cents" INTEGER NOT NULL,
  "distance_m" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "requests_status_idx" ON "requests" ("status");
CREATE INDEX "requests_user_id_idx" ON "requests" ("user_id");

CREATE TABLE "batches" (
  "id" BIGSERIAL PRIMARY KEY,
  "worker_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "status" "BatchStatus" NOT NULL DEFAULT 'planning',
  "stop_order" JSONB NOT NULL DEFAULT '[]',
  "planned_geom" geography(LineString, 4326),
  "total_distance_m" INTEGER,
  "started_at" TIMESTAMPTZ(6),
  "completed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "batches_worker_id_status_idx" ON "batches" ("worker_id", "status");

CREATE TABLE "batch_items" (
  "batch_id" BIGINT NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
  "request_id" BIGINT NOT NULL REFERENCES "requests"("id") ON DELETE RESTRICT,
  "sequence" SMALLINT NOT NULL,
  "stop_status" "StopStatus" NOT NULL DEFAULT 'pending',
  PRIMARY KEY ("batch_id", "request_id")
);
CREATE UNIQUE INDEX "batch_items_request_id_key" ON "batch_items" ("request_id");
CREATE INDEX "batch_items_request_id_idx" ON "batch_items" ("request_id");

CREATE TABLE "location_pings" (
  "id" BIGSERIAL,
  "worker_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "batch_id" BIGINT REFERENCES "batches"("id") ON DELETE SET NULL,
  "geom" geography(Point, 4326) NOT NULL,
  "speed_mps" REAL,
  "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id", "recorded_at")
);
CREATE INDEX "location_pings_batch_id_recorded_at_idx"
  ON "location_pings" ("batch_id", "recorded_at" DESC);

CREATE TABLE "status_events" (
  "id" BIGSERIAL PRIMARY KEY,
  "request_id" BIGINT NOT NULL REFERENCES "requests"("id") ON DELETE CASCADE,
  "from_status" "RequestStatus",
  "to_status" "RequestStatus" NOT NULL,
  "actor_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
  "reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "status_events_request_id_created_at_idx"
  ON "status_events" ("request_id", "created_at");

CREATE TABLE "proof_of_delivery" (
  "request_id" BIGINT PRIMARY KEY REFERENCES "requests"("id") ON DELETE CASCADE,
  "type" "ProofType" NOT NULL DEFAULT 'none',
  "photo_url" TEXT,
  "signature_url" TEXT,
  "code_verified" BOOLEAN,
  "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "captured_by" BIGINT REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE "ratings" (
  "id" BIGSERIAL PRIMARY KEY,
  "request_id" BIGINT NOT NULL REFERENCES "requests"("id") ON DELETE CASCADE,
  "rater_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "ratee_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "score" SMALLINT NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "ratings_request_id_rater_id_key"
  ON "ratings" ("request_id", "rater_id");
CREATE INDEX "ratings_ratee_id_idx" ON "ratings" ("ratee_id");

CREATE TABLE "notifications" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "NotificationType" NOT NULL,
  "payload" JSONB NOT NULL,
  "read_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "notifications_user_id_created_at_idx"
  ON "notifications" ("user_id", "created_at" DESC);

CREATE TABLE "sessions" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "refresh_hash" TEXT NOT NULL,
  "user_agent" TEXT,
  "ip" INET,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");

CREATE TABLE "audit_logs" (
  "id" BIGSERIAL PRIMARY KEY,
  "actor_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" BIGINT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "audit_logs_entity_type_entity_id_idx"
  ON "audit_logs" ("entity_type", "entity_id");
CREATE INDEX "audit_logs_actor_id_created_at_idx"
  ON "audit_logs" ("actor_id", "created_at" DESC);
