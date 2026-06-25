"use client"

import { useEffect, useState, useRef, useCallback, type FormEvent } from "react"
import { useParams } from "next/navigation"

interface ImageData {
  id: number
  imageUrl: string
  storage: string
  createdAt: string
  expiresAt: string | null
}

export default function SlugPage() {
  const { slug } = useParams<{ slug: string }>()
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteTokens, setDeleteTokens] = useState<Record<number, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/share/${slug}`)
      if (!res.ok) return
      const data = await res.json()
      setImages(data.images)
    } finally {
      setLoading(false)
    }
  }, [slug])

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.set("image", file)
      fd.set("slug", slug)
      fd.set("expiresIn", "5")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (res.ok) {
        const data = await res.json()
        setDeleteTokens(prev => ({ ...prev, [data.id]: data.deleteToken }))
      }
      await fetchImages()
    } catch {
      // ignore
    } finally {
      setUploading(false)
    }
  }, [slug, fetchImages])

  useEffect(() => {
    fetchImages()
    const interval = setInterval(fetchImages, 5000)
    return () => clearInterval(interval)
  }, [fetchImages])

  useEffect(() => {
    function onGlobalPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) { uploadFile(blob) }
          return
        }
      }
    }
    document.addEventListener("paste", onGlobalPaste)
    return () => document.removeEventListener("paste", onGlobalPaste)
  }, [uploadFile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [images])

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile()
        if (blob) { await uploadFile(blob) }
        return
      }
    }
  }

  async function handleDelete(img: ImageData) {
    const dt = deleteTokens[img.id]
    if (!dt) return
    if (!confirm("Delete this image?")) return
    try {
      const res = await fetch(`/api/share/${slug}?dt=${dt}&imageId=${img.id}`, { method: "DELETE" })
      if (res.ok) {
        const newTokens = { ...deleteTokens }
        delete newTokens[img.id]
        setDeleteTokens(newTokens)
        await fetchImages()
      }
    } catch {
      // ignore
    }
  }

  function handleFileChange(e: FormEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0]
    if (f) uploadFile(f)
    e.currentTarget.value = ""
  }

  async function handleCopyImage(url: string) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    } catch {
      // ignore
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (isToday) return time
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`
  }

  function formatExpiry(dateStr: string | null) {
    if (!dateStr) return "Never"
    const diff = new Date(dateStr).getTime() - Date.now()
    if (diff <= 0) return "Expired"
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      <div className="sticky top-0 bg-neutral-950/80 backdrop-blur z-10 border-b border-neutral-800 px-4 py-3">
        <h1 className="text-sm font-mono text-neutral-400">
          /{slug} <span className="text-neutral-600">· {images.length} image{images.length !== 1 ? "s" : ""}</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {images.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm py-12">
            No images yet. Paste one below!
          </div>
        ) : (
          images.map((img) => (
            <div key={img.id} className="max-w-[280px]">
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <img
                  src={img.imageUrl}
                  alt=""
                  className="w-full max-h-[220px] object-contain bg-neutral-950/50"
                />
              </div>
              <div className="flex items-center gap-2 px-1 pt-1 text-[11px] text-neutral-500">
                <span className="truncate">{formatTime(img.createdAt)}</span>
                <span className="shrink-0">· Exp {formatExpiry(img.expiresAt)}</span>
                <button
                  onClick={() => handleCopyImage(img.imageUrl)}
                  className="shrink-0 text-blue-400 hover:text-blue-300 ml-auto"
                >
                  Copy
                </button>
                {deleteTokens[img.id] && (
                  <button
                    onClick={() => handleDelete(img)}
                    className="shrink-0 text-red-400 hover:text-red-300"
                  >
                    Del
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-neutral-950/80 backdrop-blur border-t border-neutral-800 p-2">
        {uploading ? (
          <div className="text-center text-xs text-neutral-500 py-2">Uploading...</div>
        ) : (
          <div
            onPaste={handlePaste}
            onClick={() => fileRef.current?.click()}
            className="text-center text-xs text-neutral-500 py-2 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            Tap to choose image · Ctrl+V to paste
          </div>
        )}
      </div>
    </div>
  )
}
