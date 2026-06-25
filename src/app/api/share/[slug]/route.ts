import { NextRequest, NextResponse } from 'next/server'
import { getImages, getImageById, deleteImageById } from '@/lib/db'
import { deleteImage } from '@/lib/storage'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const images = await getImages(slug)

  const now = new Date()
  const valid = []
  for (const img of images) {
    if (img.expires_at && new Date(img.expires_at) < now) {
      await deleteImage(img.image_url, img.storage)
      await deleteImageById(img.id)
    } else {
      valid.push(img)
    }
  }

  return NextResponse.json({
    images: valid.map(i => ({
      id: i.id,
      imageUrl: i.image_url,
      storage: i.storage,
      createdAt: i.created_at,
      expiresAt: i.expires_at,
    })),
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dt = req.nextUrl.searchParams.get('dt')
  const imageId = req.nextUrl.searchParams.get('imageId')

  if (!dt || !imageId) {
    return NextResponse.json({ error: 'Missing delete token or image ID' }, { status: 400 })
  }

  const image = await getImageById(parseInt(imageId))
  if (!image || image.slug !== slug) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (image.delete_token !== dt) {
    return NextResponse.json({ error: 'Invalid delete token' }, { status: 403 })
  }

  await deleteImage(image.image_url, image.storage)
  await deleteImageById(image.id)

  return NextResponse.json({ success: true })
}
