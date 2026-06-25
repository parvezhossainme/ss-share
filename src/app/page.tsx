"use client"

import { useState, useRef, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

const EXPIRATION_OPTIONS = [
  { label: "1 day", value: "1" },
  { label: "3 days", value: "3" },
  { label: "5 days", value: "5" },
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "Never", value: "never" },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
}

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex-1 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg space-y-6">
        <motion.div variants={item} className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Paste & Share
            </span>
          </h1>
          <p className="text-sm text-white/40">Drop an image, paste from clipboard, or create a room</p>
        </motion.div>

        <motion.div variants={item}>
          <div
            onClick={() => inputRef.current?.click()}
            onPaste={handlePaste}
            className="relative group cursor-pointer"
          >
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-violet-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500" />
            <div className="relative flex items-center justify-center border border-white/10 rounded-2xl p-8 min-h-[220px] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.05]">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              {preview ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={preview}
                  alt="Preview"
                  className="max-h-[280px] rounded-xl object-contain"
                />
              ) : (
                <div className="text-center">
                  <svg className="mx-auto mb-3 size-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-white/30">Paste image or click to browse</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.form variants={item} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 tracking-wider uppercase">
              Room name
            </label>
            <div className="flex items-center gap-2 text-sm text-white/30">
              <span className="shrink-0 font-mono text-xs text-white/20">ss-share.vercel.app/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30))}
                placeholder="my-room"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all duration-300 font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 tracking-wider uppercase">
              Expires
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all duration-300 text-sm appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "20px",
              }}
            >
              {EXPIRATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0a0a0f]">{opt.label}</option>
              ))}
            </select>
          </div>

          <motion.button
            type="submit"
            disabled={loading || !slug.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="relative w-full group"
          >
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 opacity-60 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
            <div className="relative w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white/80 group-hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </span>
              ) : file ? "Share" : "Open Room"}
            </div>
          </motion.button>
        </motion.form>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
