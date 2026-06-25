# ss-share

Paste an image, get a short shareable URL. Like a pastebin for images.

Built with **Next.js 16** (App Router), **Tailwind v4**, **Neon** (Postgres), and **Vercel Blob** / **ImgBB**.

## How it works

1. Go to the home page, type a slug (e.g. `my-pics`), optionally paste an image.
2. Share `https://ss-share.vercel.app/my-pics` with anyone.
3. Anyone with the link can view, copy, or download images.
4. Anyone who pastes an image in that room gets a delete token (stored in browser memory) to delete their own uploads.

## Features

- Ctrl+V to paste images anywhere on the page
- Multiple images per slug (chat-thread style)
- Expiration: 1d / 3d / 5d / 7d / 30d / Never (default: 5d)
- Lazy expiration cleanup on read
- Copy image to clipboard / Download
- Delete your own uploads

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | No* | Neon Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | No* | Vercel Blob token |
| `IMGBB_API_KEY` | No* | ImgBB API key (free fallback) |

\* Without `DATABASE_URL`, data is stored in memory (lost on restart).  
\* Without `BLOB_READ_WRITE_TOKEN`, falls back to ImgBB.  
\* Without `IMGBB_API_KEY`, uploads will fail.

## Local dev

```bash
cp .env.example .env
# fill in your keys
npm install
npm run dev
```
