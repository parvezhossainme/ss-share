"use client"

import { useEffect, useState, useRef, useCallback, type FormEvent } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

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
  const [toast, setToast] = useState("")
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
        showToast("Deleted")
        await fetchImages()
      }
    } catch {
      // ignore
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 2000)
  }

  function handleFileChange(e: FormEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0]
    if (f) uploadFile(f)
    e.currentTarget.value = ""
  }

  async function pasteFromClipboard() {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type)
            await uploadFile(new File([blob], "clipboard.png", { type }))
            return
          }
        }
      }
      showToast("No image in clipboard")
    } catch {
      showToast("Could not read clipboard")
    }
  }

  async function handleCopyImage(url: string) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      showToast("Copied!")
    } catch {
      showToast("Copy failed")
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
      <div className="flex-1 flex items-center justify-center">
        <div className="size-6 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      <div className="sticky top-0 z-10 bg-[#07070a]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium text-white/60">
            <span className="text-white/90">/{slug}</span>
            <span className="text-white/20 ml-2">· {images.length} image{images.length !== 1 ? "s" : ""}</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex items-center justify-center text-white/20 text-sm py-16"
          >
            No images yet. Paste or choose one below.
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {images.map((img) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="max-w-[300px]"
              >
                <div className="group relative">
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden backdrop-blur-sm">
                    <img
                      src={img.imageUrl}
                      alt=""
                      className="w-full max-h-[240px] object-contain bg-black/20"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-1 pt-1.5 text-[11px] text-white/30">
                  <span>{formatTime(img.createdAt)}</span>
                  <span className="size-1 rounded-full bg-white/10" />
                  <span>Exp {formatExpiry(img.expiresAt)}</span>
                  <button
                    onClick={() => handleCopyImage(img.imageUrl)}
                    className="ml-auto text-cyan-400/60 hover:text-cyan-300 transition-colors text-[10px] tracking-wider uppercase font-medium"
                  >
                    Copy
                  </button>
                  {deleteTokens[img.id] && (
                    <button
                      onClick={() => handleDelete(img)}
                      className="text-red-400/60 hover:text-red-300 transition-colors text-[10px] tracking-wider uppercase font-medium"
                    >
                      Del
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-[#07070a]/80 backdrop-blur-xl border-t border-white/[0.06] p-3">
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-white/30 py-1.5">
            <div className="size-3.5 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
            Uploading...
          </div>
        ) : (
          <div onPaste={handlePaste} className="flex items-center justify-center gap-2 text-xs">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="group relative"
            >
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
              <div className="relative px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80 transition-colors">
                Choose Image
              </div>
            </button>
            <button
              onClick={pasteFromClipboard}
              className="group relative"
            >
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
              <div className="relative px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80 transition-colors">
                Paste
              </div>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/[0.06] text-white/80 text-xs px-5 py-2.5 rounded-xl shadow-2xl z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
