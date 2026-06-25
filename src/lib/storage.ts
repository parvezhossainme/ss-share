import { put } from '@vercel/blob'

export async function uploadImage(buffer: Buffer, filename: string): Promise<{ url: string; storage: string }> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, buffer, { access: 'public' })
    return { url: blob.url, storage: 'vercel-blob' }
  }
  const base64 = buffer.toString('base64')
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ image: base64 }),
  })
  const data = await res.json()
  if (!data.success) throw new Error('ImgBB upload failed')
  return { url: data.data.display_url, storage: 'imgbb' }
}

export async function deleteImage(url: string, storage: string): Promise<void> {
  if (storage === 'vercel-blob') {
    const { del } = await import('@vercel/blob')
    await del(url)
  }
}
