import { neon } from '@neondatabase/serverless'

export interface Image {
  id: number
  slug: string
  image_url: string
  storage: string
  delete_token: string
  expires_at: string | null
  created_at: string
}

const mem: Image[] = []
let ensured = false

function useNeon() {
  if (!process.env.DATABASE_URL) return null
  return neon(process.env.DATABASE_URL)
}

async function ensureTable() {
  if (ensured) return
  const sql = useNeon()
  if (!sql) return
  await sql`
    CREATE TABLE IF NOT EXISTS images (
      id           SERIAL PRIMARY KEY,
      slug         TEXT NOT NULL,
      image_url    TEXT NOT NULL,
      storage      TEXT NOT NULL DEFAULT 'vercel-blob',
      delete_token TEXT NOT NULL,
      expires_at   TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_images_slug ON images(slug)`
  ensured = true
}

export async function createImage(opts: {
  slug: string; imageUrl: string; storage: string; deleteToken: string; expiresAt: string | null
}): Promise<Image> {
  const sql = useNeon()
  if (sql) {
    await ensureTable()
    const rows = await sql`
      INSERT INTO images (slug, image_url, storage, delete_token, expires_at, created_at)
      VALUES (${opts.slug}, ${opts.imageUrl}, ${opts.storage}, ${opts.deleteToken}, ${opts.expiresAt}, NOW())
      RETURNING *
    `
    return rows[0] as unknown as Image
  }
  const img: Image = {
    id: mem.length + 1,
    slug: opts.slug,
    image_url: opts.imageUrl,
    storage: opts.storage,
    delete_token: opts.deleteToken,
    expires_at: opts.expiresAt,
    created_at: new Date().toISOString(),
  }
  mem.push(img)
  return img
}

export async function getImages(slug: string): Promise<Image[]> {
  const sql = useNeon()
  if (sql) {
    await ensureTable()
    const rows = await sql`
      SELECT * FROM images WHERE slug = ${slug} ORDER BY created_at ASC
    `
    return rows as unknown as Image[]
  }
  return mem.filter(i => i.slug === slug)
}

export async function getImageById(id: number): Promise<Image | null> {
  const sql = useNeon()
  if (sql) {
    await ensureTable()
    const rows = await sql`SELECT * FROM images WHERE id = ${id}`
    return rows.length > 0 ? (rows[0] as unknown as Image) : null
  }
  return mem.find(i => i.id === id) ?? null
}

export async function deleteImageById(id: number): Promise<boolean> {
  const sql = useNeon()
  if (sql) {
    await ensureTable()
    const rows = await sql`DELETE FROM images WHERE id = ${id} RETURNING *`
    return rows.length > 0
  }
  const idx = mem.findIndex(i => i.id === id)
  if (idx === -1) return false
  mem.splice(idx, 1)
  return true
}
