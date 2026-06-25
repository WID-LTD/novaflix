# NovaFlix

A self-hosted streaming platform that lets you search, watch, and download movies and TV shows via HLS streams. Built with Node.js (Express) on the backend and vanilla JavaScript on the frontend.

```
novaflix/
├── client/                  # Frontend
│   ├── index.html           # Search page
│   ├── movie.html           # Movie/TV detail page
│   ├── watch.html           # Video player page
│   ├── css/style.css        # All styles
│   ├── js/
│   │   ├── search.js        # Search logic
│   │   ├── movie.js         # Detail page logic
│   │   └── watch.js         # Player & sidebar logic
│   ├── server.js            # Dev server (port 3000)
│   └── package.json
├── server/                  # Backend API
│   ├── server.js            # Express API (port 3030)
│   ├── scraper.mjs          # Stream source resolution
│   ├── .env                 # TMDB token + config
│   └── package.json
└── README.md
```

## Architecture

Two Node.js servers run side by side:

- **Client server** (`client/server.js`, port 3000) — serves static files and proxies `/api/*` requests to the backend. Download requests (`/api/download`) are redirected as HTTP 302 to bypass the proxy for streaming efficiency.
- **API server** (`server/server.js`, port 3030) — handles all data fetching: TMDB metadata, stream source resolution, HLS manifest parsing, ffmpeg-based video conversion, and CDN proxying.

The frontend is vanilla HTML/CSS/JS with no framework. HLS.js handles video playback in the browser. ffmpeg (installed separately) converts HLS streams to MP4 for download on the server side.

## Prerequisites

- **Node.js** 18+ (ESM modules required)
- **ffmpeg** 7+ (with `libx264` and `aac` support) — install via winget (`winget install Gyan.FFmpeg`), or place at a known path. The server auto-detects ffmpeg at startup.
- **TMDB API access token** — get one free at https://www.themoviedb.org/settings/api

## Setup

```bash
# 1. Clone and install dependencies
cd novaflix
cd server && npm install
cd ../client && npm install
cd ..

# 2. Create server/.env
echo "TMDB_ACCESS_TOKEN=your_token_here" > server/.env
echo "PORT=3030" >> server/.env

# 3. Start both servers
# Terminal 1:
cd server && npm start

# Terminal 2:
cd client && npm start
```

Open http://localhost:3000 to search for movies and TV shows.

## How It Works

### Search → Details Flow

1. **Search** (`index.html` + `search.js`): User types a title, which debounces 400ms then calls `GET /api/search?query=...&type=movie|tv`. The server proxies to TMDB's search endpoint and returns a list of matches with poster, year, and ID.

2. **Movie/TV Details** (`movie.html` + `movie.js`): Clicking a card navigates to `movie.html?id=XXX&type=movie`. The page calls `GET /api/details?id=XXX&type=movie` which fetches: title, year, runtime, rating, genres, overview, poster, backdrop image, YouTube trailer key, and (for TV) season list with episode counts. The backdrop renders as a full-width background with a gradient overlay. Below the info card, a full-width trailer section shows the YouTube embed if available.

3. **For TV shows**: The detail page shows season/episode selectors, a "Watch Now" link for the selected episode, and an episode checklist with Select All and batch download. The checklist loads episodes across all seasons from `GET /api/tv-season?id=XXX&season=N`.

4. **Watch Page** (`watch.html` + `watch.js`): Clicking "Watch Now" navigates to `watch.html?id=XXX&type=movie|tv&season=N&episode=N`. The player calls `GET /api/source?id=XXX&type=...&season=...&episode=...` which resolves a playable HLS stream URL from the available sources.

### Stream Source Resolution (`server/scraper.mjs`)

Two source systems are tried in order:

**Source API** (movies only): Queries `nextgencloudfabric.com/embed/source-api.php?tmdb=ID` or `vidsrc.pm/embed/source-api.php?tmdb=ID`. These return a JSON payload with stream URLs and subtitle tracks (`default_subs`).

**XPlay** (all types): Falls back to `play.xpass.top/e/movie/ID` or `play.xpass.top/e/tv/ID/season/episode`. The server fetches the HTML page, extracts embedded `playlist.json` paths, then fetches the JSON playlist to find an HLS source. Subtitles come from the playlist's `tracks` array (captions/subtitles).

If both fail, the API returns `{ success: false }` with an error message and (if available) the TMDB release date to help the frontend show contextual messages like "Recently released — may still be uploading."

### HLS Streaming & Proxying

The `/api/source` endpoint returns both:
- `streamUrl`: a proxy URL via `/api/proxy/*` (for fallback)
- `directUrl`: the raw CDN URL (for direct HLS.js connection)

**Watch page** tries direct CDN first. If HLS.js reports a fatal network error, it falls back to the proxy URL transparently.

**`/api/proxy/*`** (`server.js:404`): Forwards requests to the CDN, rewriting `.m3u8` manifest URLs so segment paths point back through the proxy. It tries multiple `Referer` headers in sequence (`tik.1x2.space`, `nextgencloudfabric.com`, `play.xpass.top`, `p16-sg.tiktokcdn.com`) because some CDNs require a specific referer. Returns 502 if all attempts fail.

### Video Player

The player uses **HLS.js** for HLS playback with custom controls (no native `controls` attribute):

- Play/pause (click video or space/k key)
- Seek bar with buffer progress
- Rewind/forward 10s (arrow keys)
- Prev/next episode navigation (TV only)
- Speed toggle: 0.5x → 0.75x → 1x → 1.25x → 1.5x → 2x
- Volume slider + mute toggle (m key, up/down arrows)
- Picture-in-Picture
- Fullscreen (f key)
- Subtitle/CC dropdown — merged from source API subs + HLS.js subtitle tracks
- Quality selector — populated from HLS.js level list
- Download button

Controls appear on video click and hide on mouse leave from the overlay (no auto-hide timer).

### Download System

The download modal shows each available quality variant with two options:

- **Original** — stream copy (`-c copy`): fast, original quality, largest file size
- **Fast** — re-encode (`-c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k`): smaller file, slightly lower quality

Sizes are estimated from the HLS variant's `BANDWIDTH` value × TMDB runtime. For compressed (Fast) downloads, a resolution-tiered compression ratio is applied:
- 1080p+ → 30% of original
- 720p → 35%
- 480p → 40%
- Below 480p → 45%

**For TV shows**, the per-episode runtime is fetched from `GET /tv/{id}/season/{s}/episode/{e}` (TMDB) for accurate size estimates. The "Download Selected" flow queues episodes sequentially — each episode's stream URL is resolved, then an invisible `<a download>` element triggers the browser's native download dialog. A 3-second delay between files prevents browser throttling of simultaneous downloads.

**Server-side download** (`/api/download`):
1. **Probe step**: Runs `ffmpeg -t 1 -i <url> -f null -` to verify the stream is accessible before sending response headers. If this fails, returns 400 "Stream not accessible" — this prevents 0-byte file saves.
2. **Conversion**: Spawns ffmpeg with `-allowed_extensions ALL` (critical for TikTok CDN segments that lack `.ts` extensions) and pipes the MP4 output directly to the response. The `Referer` header is selected dynamically based on the CDN hostname.
3. On client disconnect, the ffmpeg process is killed via `SIGTERM`.

### Subtitles

Three subtitle sources are merged into a single dropdown:
1. **Source API** `default_subs` — from `nextgencloudfabric.com` or `vidsrc.pm`
2. **XPlay playlist** `tracks` — captions/subtitles from `play.xpass.top`
3. **HLS.js native** `subtitleTracks` — embedded in the HLS manifest

The dropdown is populated once from server subs (added immediately), then updated when HLS.js fires `SUBTITLE_TRACKS_UPDATED`. Selection uses HLS.js's native subtitle track switching when the track came from the manifest, or falls back to a `<track>` element for external VTT URLs.

## Key Design Decisions

- **No bundler**: Vanilla JS keeps the stack minimal and easy to debug. No build step required.
- **ffmpeg for download**: Chosen over client-side zip or server-side libraries because ffmpeg handles HLS demuxing, re-encoding, and fragmentation in a single process.
- **Sequential batch downloads**: Hidden `<a download>` elements trigger browser-native save dialogs one at a time. No server-side file aggregation — each file downloads independently.
- **Direct-then-proxy streaming**: Connecting directly to the CDN avoids bandwidth costs on the proxy server. The proxy is only a fallback for blocked or restricted CDNs.
- **Multi-referer proxy**: CDNs often block requests without a specific `Referer`. Trying multiple referers in sequence maximizes the chance of a successful connection.
- **Error responses as 200 with `success: false`**: All API endpoints return HTTP 200 with `{ success: false, error: ... }` instead of non-200 status codes. This simplifies error handling on the frontend.
- **TMDB dotenv path**: The `.env` file is loaded from `server/.env` using an explicit absolute path (`path.join(__dirname, '.env')`) so the server works regardless of the working directory.

## API Reference

### `GET /api/search`
- Params: `query` (string), `type` (`movie` | `tv`)
- Returns: `{ success, data: [{ id, title, year, poster, overview, type }] }`

### `GET /api/details`
- Params: `id` (TMDB ID), `type` (`movie` | `tv`)
- Returns: `{ success, data: { id, title, year, poster, backdrop, overview, rating, genres, trailerKey, runtime, seasons?, totalSeasons? } }`

### `GET /api/tv-season`
- Params: `id`, `season`
- Returns: `{ success, episodes: [{ episode, name }] }`

### `GET /api/source`
- Params: `id`, `type`, `season`?, `episode`?
- Returns: `{ success, streamUrl, directUrl, subtitles: [{ label, file }] }`

### `GET /api/manifest-info`
- Params: `url`, `id`?, `type`?, `season`?, `episode`?
- Returns: `{ success, duration, variants: [{ resolution, bandwidth, url, label, sizeBytes, sizeLabel, compressedBytes, compressedLabel }] }`

### `GET /api/download`
- Params: `url`, `title`?, `variant`?, `compress`? (`true` | `false`)
- Returns: MP4 file stream with `Content-Disposition: attachment`

### `GET /api/proxy/*`
- Path: segments of the original URL after `https://` (e.g., `/api/proxy/cdn.example.com/path/file.ts`)
- Returns: proxied stream content with URL rewriting for m3u8 manifests

## Data Flow Summary

```
Search → movie.html → details + trailer + episode checklist
                         ↓
                    watch.html → HLS.js player (direct CDN → proxy fallback)
                         ↓
                    Download modal → quality + size estimate (Original / Fast)
                         ↓
                    /api/download → ffmpeg probe → ffmpeg encode → MP4 stream
```
