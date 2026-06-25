CREATE TABLE IF NOT EXISTS images (
  id           SERIAL PRIMARY KEY,
  slug         TEXT NOT NULL,
  image_url    TEXT NOT NULL,
  storage      TEXT NOT NULL DEFAULT 'vercel-blob',
  delete_token TEXT NOT NULL,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_slug ON images(slug);
