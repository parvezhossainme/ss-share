import { NextRequest, NextResponse } from 'next/server'
import { createImage } from '@/lib/db'
import { uploadImage } from '@/lib/storage'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const slug = formData.get('slug') as string
    const expiresIn = formData.get('expiresIn') as string

    if (!file || !slug) {
      return NextResponse.json({ error: 'Missing image or slug' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9]{1,30}$/.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug (alphanumeric, max 30 chars)' }, { status: 400 })
    }

    const ext = file.name?.split('.').pop() || 'png'
    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, storage } = await uploadImage(buffer, `${slug}-${Date.now()}.${ext}`)

    const deleteToken = crypto.randomUUID()
    let expiresAt: string | null = null
    if (expiresIn && expiresIn !== 'never') {
      const days = parseInt(expiresIn)
      if (!isNaN(days)) {
        expiresAt = new Date(Date.now() + days * 86400000).toISOString()
      }
    }

    const image = await createImage({ slug, imageUrl: url, storage, deleteToken, expiresAt })

    return NextResponse.json({
      id: image.id,
      imageUrl: url,
      storage,
      createdAt: image.created_at,
      expiresAt,
      deleteToken,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
