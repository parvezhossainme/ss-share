"use client"

import { useState, useRef, type FormEvent } from "react"
import { useRouter } from "next/navigation"

const EXPIRATION_OPTIONS = [
  { label: "1 day", value: "1" },
  { label: "3 days", value: "3" },
  { label: "5 days", value: "5" },
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "Never", value: "never" },
]

export default function HomePage() {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [slug, setSlug] = useState("")
  const [expiresIn, setExpiresIn] = useState("5")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile()
        if (blob) {
          setFile(blob)
          setPreview(URL.createObjectURL(blob))
          setError("")
        }
        return
      }
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setError("")
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!slug.trim()) return

    if (!file) {
      router.push(`/${slug.trim().toLowerCase()}`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const fd = new FormData()
      fd.set("image", file)
      fd.set("slug", slug.trim().toLowerCase())
      fd.set("expiresIn", expiresIn)

      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Upload failed")
        return
      }
      router.push(`/${slug.trim().toLowerCase()}`)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Paste & Share</h1>
          <p className="text-sm text-neutral-400">Paste an image (Ctrl+V) or type a slug to get started</p>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onPaste={handlePaste}
          className="relative flex items-center justify-center border-2 border-dashed border-neutral-700 rounded-xl p-8 min-h-[200px] cursor-pointer hover:border-neutral-500 transition-colors bg-neutral-900/50"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-[300px] rounded-lg object-contain" />
          ) : (
            <div className="text-center text-neutral-500">
              <svg className="mx-auto mb-2 size-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm">Paste image or click to browse</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">
              Room name
            </label>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>ss-share.vercel.app/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30))}
                placeholder="my-room"
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">
              Expires
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {EXPIRATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !slug.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium rounded-lg px-4 py-2.5 transition-colors text-sm"
          >
            {loading ? "Uploading..." : file ? "Share" : "Open Room"}
          </button>
        </form>

        {error && (
          <div className="bg-red-900/50 border border-red-800 rounded-lg px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
