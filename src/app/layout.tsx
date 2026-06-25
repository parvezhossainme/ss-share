import type { Metadata } from "next"
import { Exo } from "next/font/google"
import "./globals.css"

const exo = Exo({
  variable: "--font-exo",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "ss-share — Paste & Share Images",
  description: "Paste an image, get a short URL, share with anyone",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${exo.variable}`}>
      <body className="min-h-dvh bg-[#07070a] text-white antialiased flex flex-col relative">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] size-[60vh] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] size-[60vh] rounded-full bg-violet-500/10 blur-[120px]" />
        </div>
        <header className="relative z-10 border-b border-white/[0.06] bg-[#07070a]/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="text-lg font-semibold tracking-wide text-white/90 hover:text-white transition-colors">
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">ss</span>
              <span className="text-white/60">-share</span>
            </a>
            <span className="text-[11px] text-white/20 tracking-widest uppercase">paste · share</span>
          </div>
        </header>
        <main className="relative z-10 flex-1 flex flex-col">{children}</main>
        <footer className="relative z-10 border-t border-white/[0.06] bg-[#07070a]/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-center gap-1 text-xs text-white/25">
            <span>dev —</span>
            <a href="https://github.com/parevezhossainme" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-cyan-300 transition-colors">@parevezhossainme</a>
            <span className="text-white/15 mx-1">;</span>
            <span>for more: </span>
            <a href="https://parvezhossainme.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-cyan-300 transition-colors">parvezhossainme.com</a>
          </div>
        </footer>
      </body>
    </html>
  )
}
