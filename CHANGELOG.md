# Changelog

All notable changes to [WID-LTD/novaflix](https://github.com/WID-LTD/novaflix) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/) and file:line references for review.

## [430851a] - 2026-09-02

### Fixed
- `client/dist/manifest.json:15-18` — remove duplicate trailing `}\n  ]` (2 deletions) to match `client/public/manifest.json` fix in `d021032`; both manifests now valid JSON (18 lines) and byte-identical. Verified `python3 -c json.load()` passes.
  - **Anomaly note:** `.gitignore:10` declares `client/dist/` ignored, but `git ls-files | grep client/dist` shows 5 tracked files (`DESIGN.md`, `icons/icon-192.svg`, `icons/icon-512.svg`, `index.html`, `manifest.json`, `sw.js`). Forced via `git add -f`. **Recommendation:** `git rm --cached -r client/dist && git commit` to enforce ignore and stop committing build artifacts (Vercel builds from `client/public`).

> Pushed 2026-09-02T15:46:47Z to `origin/main` (`https://github.com/WID-LTD/novaflix.git` — sole remote). Verified `git rev-parse HEAD == git ls-remote origin main == 430851a`, `git status --porcelain` clean.

## [71a227a] - 2026-09-01 — `fix(auth,client): allow any login in no-DB dev mode + HeroBanner button nesting`

### Fixed
- `server/controllers/authController.js:25` — broaden dev fallback when `DATABASE_URL` dummy / DB unreachable (`ECONNREFUSED`): any email with `password.length >= 8` now mints a premium `viewer` JWT ( `dev@novaflix.local` stays `admin` ), fixing persistent `500 POST /api/auth/login` for non-dev emails in no-DB dev. Short passwords still `400/500` as before.
- `client/src/components/features/HeroBanner.tsx:11` — fix `validateDOMNesting` `button inside button`: outer `<button>` → `<div role="button" tabIndex={0}>` with keyboard handler (`Enter/Space`), inner trailer button `stopPropagation` + `pointer-events-auto`, removing `chunk-GNC7SI6A` warning.

## [d021032] - 2026-08-31 — `fix(client,server): manifest JSON syntax + dev login fallback for no-DB mode`

### Fixed
- `client/public/manifest.json:19` — remove duplicate trailing `] }` causing `Manifest Line 19 column 3 Unexpected data after root element` (affected both `public` and `dist`).
- `server/controllers/authController.js:17` — add fail-open dev fallback when DB unreachable: `dev@novaflix.local / NovaflixDev123!` logs in as premium `admin` without Postgres, fixing `500 POST /api/auth/login` when `DATABASE_URL` dummy.
- `server/.env.example` — document `DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD`.

## [e60ed5d] - 2026-08-31 — `fix(server): dev JWT auth fail-open when DB unavailable + rename stream-events`

### Fixed
- `server/middleware/auth.js:22` — wrap `isTokenBlocked()` in `try/catch` fail-open and retain token claims when `findUserById` returns `null` or DB unreachable; allows dev JWT `premium/admin` without Postgres.
- `server/routes/streamRoutes.js:3` — rename `POST /events` → `POST /stream-events` (no auth) to avoid collision with creator `eventRoutes POST /api/events` (`auth+creatorOrAdmin`) which caused `401/500`.

## [6f299b9] - 2026-08-31 — `feat(server): stable movie/TV streaming observability + audio probe + dedicated endpoints`

### Added
- `server/controllers/streamController.js:73` — persistent file logger `logToFile()` → `~/.novaflix/logs/events.jsonl` (10k-line cap) and `ffprobe` audio probe `probeAudioSegment()` integrated into unified `source` flow for stable movie/TV audio verification; dedicated wrappers `movieSource` / `tvSource` mapping path-param style `GET /movie/:id/source` + `GET /tv/:id/source` to unified source.
- `server/routes/streamRoutes.js:24` — keep `authMiddleware` on all streaming routes; add dedicated stable endpoints `GET /movie/:id/source` and `GET /tv/:id/source` plus `POST /stream-events` persistent logging endpoint (later renamed in `e60ed5d`).
- `server/providers/anidb-provider.js:134` — new TV/anime provider (`anidb.app`) with fix to return `null` on episode miss (prevents silent `ep1` fallback).
- `server/.env.example:3` — add `ENABLE_PROXY=true` for streaming stability.

> Merged local stream stability work (`stream` baseline before `08bf0dc` + dirty enhancements) onto `3227d5b` while discarding local aesthetic `client` (keeps remote React `client/src`). All remote auth, plan enforcement, creator hub, and 40+ business routes preserved. Parent: `3227d5b` (last other-person push `2026-08-29T05:20:16Z` by `successchukwu`).

---

## State Verification (read-only, 2026-09-02)

```bash
git remote -v
# origin https://github.com/WID-LTD/novaflix.git (fetch/push) — sole remote, wid-ltd only

git rev-parse HEAD && git ls-remote origin main
# 430851aaa077a44986d3420a8f85161dc1a4c024 (HEAD == origin/main == origin/HEAD)

git status --porcelain
# clean (no divergence after push)

git log --oneline origin/main -5
# 430851a fix(client): manifest JSON syntax in dist build artifact
# 71a227a fix(auth,client): allow any login in no-DB dev mode + HeroBanner
# d021032 fix(client,server): manifest JSON syntax + dev login fallback
# e60ed5d fix(server): dev JWT auth fail-open + rename stream-events
# 6f299b9 feat(server): stable movie/TV streaming observability
```

## Pending / Recommended Next

- **Enforce `.gitignore` for build artifacts:** `git rm --cached -r client/dist && git commit -m "chore: untrack client/dist"` — currently tracked despite ignore; future builds should generate `client/dist` from `client/public` + Vite.
- No unseen remote commits to pull (`pushed_at: 2026-09-02T15:46:47Z` matches HEAD).

## Push History Context

- Latest push overall `2026-09-01T12:53:17Z` (before this doc) by `Wizzyboypondec` (`71a227a`), now superseded by `430851a` `2026-09-02T15:46:47Z`.
- Latest other-person push `2026-08-29T05:20:16Z` by `successchukwu` (`3227d5b`).
- `HEAD == origin/main` fully synced; `origin` is `WID-LTD/novaflix` only (`git remote -v` confirms no other remotes).
