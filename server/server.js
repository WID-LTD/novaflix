import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import { spawn } from 'child_process';
import http from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { closeBrowser } from './scraper.mjs';
import { initDatabase } from './config/database.js';
import apiRoutes from './routes/index.js';
import { getPlanRank } from './controllers/planUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3030;
const JWT_SECRET = process.env.JWT_SECRET || 'novaflix-secret-key-change-in-production';
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

if (!TMDB_ACCESS_TOKEN) {
  console.error('\x1b[31m[TMDB] ERROR: TMDB_ACCESS_TOKEN is not set in server/.env\x1b[0m');
  console.error('\x1b[33m[TMDB] All TMDB search/detail endpoints will return 401 errors.\x1b[0m');
  console.error('\x1b[33m[TMDB] Create server/.env with: TMDB_ACCESS_TOKEN=your_token_here\x1b[0m');
  console.error('\x1b[33m[TMDB] Get a token at: https://www.themoviedb.org/settings/api\x1b[0m\n');
}

function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  const candidates = [
    'ffmpeg',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-8.1.1-full_build', 'bin', 'ffmpeg.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-7.1-full_build', 'bin', 'ffmpeg.exe'),
    'C:\\tools\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
  ];
  for (const c of candidates) {
    try {
      if (c === 'ffmpeg') {
        const r = spawn.sync(c, ['-version'], { stdio: 'pipe', timeout: 3000 });
        if (r.status === 0) { return c; }
      } else if (fs.existsSync(c)) {
        return c;
      }
    } catch {}
  }
  return 'ffmpeg';
}

const ffmpegPath = resolveFfmpeg();
console.log(`[ffmpeg] using: ${ffmpegPath}`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.locals.ffmpegPath = ffmpegPath;
app.locals.tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

app.use('/api', apiRoutes);

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
const rooms = new Map()

wss.on('connection', (ws, req) => {
  let userId = null
  let currentRoom = null
  let userPlan = 'free'

  // Authenticate via token in query param
  const url = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      userId = decoded.id
      userPlan = decoded.plan || 'free'
    } catch {}
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      const { type, room, user, payload } = msg

      switch (type) {
        case 'join': {
          const roomUserId = userId || user?.id || uuidv4()
          if (getPlanRank(userPlan) < 3) {
            ws.send(JSON.stringify({ type: 'error', message: 'Watch Parties require a Premium plan. Please upgrade to join.' }))
            return
          }
          userId = roomUserId
          currentRoom = room
          if (!rooms.has(room)) rooms.set(room, new Map())
          const roomUsers = rooms.get(room)
          roomUsers.set(userId, { ws, name: user?.name || 'Anonymous', id: userId })
          ws.send(JSON.stringify({ type: 'joined', userId, room, users: [...roomUsers.keys()] }))
          broadcast(room, { type: 'user-joined', userId, name: user?.name || 'Anonymous' }, userId)
          break
        }
        case 'chat': {
          if (currentRoom) {
            broadcast(currentRoom, { type: 'chat', userId, message: payload?.message, name: payload?.name, timestamp: Date.now() })
          }
          break
        }
        case 'sync': {
          if (currentRoom) {
            broadcast(currentRoom, { type: 'sync', userId, action: payload?.action, currentTime: payload?.currentTime, playing: payload?.playing }, userId)
          }
          break
        }
        case 'leave': {
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).delete(userId)
            broadcast(currentRoom, { type: 'user-left', userId })
            if (rooms.get(currentRoom).size === 0) rooms.delete(currentRoom)
          }
          break
        }
      }
    } catch {}
  })

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(userId)
      broadcast(currentRoom, { type: 'user-left', userId })
      if (rooms.get(currentRoom).size === 0) rooms.delete(currentRoom)
    }
  })

  function broadcast(room, msg, excludeId) {
    if (!rooms.has(room)) return
    for (const [id, client] of rooms.get(room)) {
      if (id !== excludeId && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(msg))
      }
    }
  }
})

import { deactivateExpiredSubscriptions } from './jobs/subscriptionExpiry.js'
import { seedAchievements } from './db.js'

initDatabase().then(async () => {
  await seedAchievements()
  // Subscription expiry — run every hour
  deactivateExpiredSubscriptions()
  setInterval(deactivateExpiredSubscriptions, 60 * 60 * 1000)

  server.listen(PORT, () => {
    console.log(`NovaFlix engine alive on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  });
}).catch((err) => {
  console.error('[server] Failed to initialize database:', err.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  wss.close()
  await closeBrowser();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  wss.close()
  await closeBrowser();
  server.close(() => process.exit(0));
});
