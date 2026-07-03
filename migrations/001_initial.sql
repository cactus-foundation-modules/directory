-- Directory Module - Initial Migration
-- Table prefix: dir_
-- Applied once by the Cactus module migration runner during build.
-- PROTECTED: written for review, not executed against the shared Neon DB
-- until Chris signs off (see plan review gate).

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "dir_categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dir_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dir_categories_slug_key" UNIQUE ("slug")
);

CREATE INDEX IF NOT EXISTS "dir_categories_display_order_idx" ON "dir_categories" ("display_order");

-- ---------------------------------------------------------------------------
-- Entries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "dir_entries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    -- Puck Data JSON for the entry's rich description block
    "description" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_until" TIMESTAMP(3),
    "lat" NUMERIC(9,6),
    "lng" NUMERIC(9,6),
    "address" TEXT,
    "area" TEXT,
    "sub_area" TEXT,
    "route_marker" NUMERIC(5,2),
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    -- Ordered array of Media.id (no FK - core Media table); first entry is the cover image
    "images" JSONB NOT NULL DEFAULT '[]',
    -- JSONB array of strings rather than TEXT[] - keeps every array-valued
    -- column on the same $queryRaw ::jsonb parameterisation as `images` above,
    -- matching gz_settings.reaction_set (no TEXT[] precedent exists in this codebase).
    "tags" JSONB NOT NULL DEFAULT '[]',
    "preview_token_hash" TEXT,
    "preview_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dir_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dir_entries_slug_key" UNIQUE ("slug"),
    CONSTRAINT "dir_entries_status_check" CHECK ("status" IN ('draft', 'published')),
    -- RESTRICT: a category with entries in it can't be deleted from under them
    CONSTRAINT "dir_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "dir_categories"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "dir_entries_category_id_idx" ON "dir_entries" ("category_id");
CREATE INDEX IF NOT EXISTS "dir_entries_status_idx" ON "dir_entries" ("status");
CREATE INDEX IF NOT EXISTS "dir_entries_featured_idx" ON "dir_entries" ("featured");
CREATE INDEX IF NOT EXISTS "dir_entries_area_idx" ON "dir_entries" ("area");
CREATE INDEX IF NOT EXISTS "dir_entries_preview_token_hash_idx" ON "dir_entries" ("preview_token_hash");

-- ---------------------------------------------------------------------------
-- Settings (singleton, mirrors gz_settings / brd_settings)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "dir_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "intro_text" TEXT,
    "map_centre_lat" NUMERIC(9,6) NOT NULL DEFAULT 51.505,
    "map_centre_lng" NUMERIC(9,6) NOT NULL DEFAULT -0.09,
    "map_zoom" INTEGER NOT NULL DEFAULT 11,
    "featured_label" TEXT NOT NULL DEFAULT 'Featured',
    "csv_import_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dir_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dir_settings_singleton" CHECK ("id" = 'singleton')
);

INSERT INTO "dir_settings" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING;
