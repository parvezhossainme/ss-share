import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ss-share — Paste & Share Images",
  description: "Paste an image, get a short URL, share with anyone",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-neutral-950 text-neutral-100 flex flex-col">
        <header className="border-b border-neutral-800 px-4 py-3">
          <a href="/" className="font-mono text-lg font-bold tracking-tight text-white">
            ss-share
          </a>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
