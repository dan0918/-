CREATE TABLE IF NOT EXISTS communities (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  station text NOT NULL DEFAULT '',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  price_per_ping text NOT NULL DEFAULT '',
  age text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE communities ADD COLUMN IF NOT EXISTS source_url text NOT NULL DEFAULT '';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE communities ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'district'
  ) THEN
    ALTER TABLE communities ALTER COLUMN district DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'transit'
  ) THEN
    ALTER TABLE communities ALTER COLUMN transit DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'cover_photo'
  ) THEN
    ALTER TABLE communities ALTER COLUMN cover_photo DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'album'
  ) THEN
    ALTER TABLE communities ALTER COLUMN album DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'tags'
  ) THEN
    ALTER TABLE communities ALTER COLUMN tags DROP NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS community_note_history (
  id text PRIMARY KEY,
  community_id text NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  community_name text NOT NULL,
  address text NOT NULL,
  note text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 5),
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_note_history_community_id_idx ON community_note_history(community_id);
CREATE INDEX IF NOT EXISTS community_note_history_saved_at_idx ON community_note_history(saved_at);
