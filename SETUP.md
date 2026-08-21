# NovaFlix - Comprehensive Setup Guide

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- FFmpeg 7+
- Flutter 3.22+ (for mobile)

### Environment Setup
1. Copy `.env.example` to `.env` in both `server/` and `client/` directories
2. Fill in all required environment variables
3. Run database migrations: `cd server && npm run migrate`
4. Seed database: `cd server && npm run seed`

### Development
```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
cd client && npm run dev

# Terminal 3: Start mobile (optional)
cd mobile && flutter run
```

### Production Deployment
```bash
# Using Docker Compose
docker-compose up -d

# Or build and run production
docker-compose -f docker-compose.prod.yml up -d
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        NovaFlix Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)          Mobile (Flutter)          │
│  ┌─────────────────────┐          ┌─────────────────────┐   │
│  │ React 18 + TypeScript│          │ Flutter 3.22+       │   │
│  │ Vite + TailwindCSS   │          │ Riverpod + GoRouter │   │
│  │ HLS.js + MediaKit    │          │ MediaKit + WebView  │   │
│  └──────────┬───────────┘          └──────────┬───────────┘   │
│             │                                 │              │
│             ▼                                 ▼              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              API Gateway (Express)                   │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │     │
│  │  │ Auth    │ │ Content │ │ Creator │ │ Payment │    │     │
│  │  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │    │     │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘    │     │
│  └───────┼───────────┼───────────┼───────────┼──────────┘     │
│           ▼           ▼           ▼           ▼              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Services Layer                          │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │     │
│  │  │ TMDB    │ │ Payment │ │ Storage │ │ Realtime│    │     │
│  │  │ Sync    │ │ Gateway │ │ (R2)    │ │ (WS)    │    │     │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │     │
│  └─────────────────────────────────────────────────────┘     │
│             │           │           │           │             │
│             ▼           ▼           ▼           ▼            │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Data Layer                              │     │
│  │  PostgreSQL 16  │  Redis 7  │  Cloudflare R2  │      │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Key Features Implementation

### 1. Dynamic SEO & Sitemap
- **Backend**: `GET /sitemap.xml` and `GET /robots.txt` with dynamic content
- **Frontend**: `SEOMeta` component with Open Graph, Twitter Cards
- **Cache**: 1-hour cache for sitemap

### 2. Celebrity Knowledge Graph
- TMDB sync service (hourly incremental, weekly full)
- `artist_graph` table for co-star connections
- `scraped_content_links` for TMDB content attribution
- Batch check endpoint for movie detail page

### 3. Creator Economy
- **Wallet**: Real-time PPM earnings, multi-currency support
- **PPM System**: Dynamic tier-based rates (baseline VPM × tier multiplier)
- **Tips/Gifts**: 80/20 split, instant wallet credit
- **Withdrawals**: Multi-gateway (Paystack/Flutterwave), min ₦10,000
- **Beneficiary Setup**: Bank verification via Paystack/Flutterwave

### 4. Content Management
- **Shorts/TikTok-style**: `HooksCard` with real-time interactions
- **Live Streams**: Saved as shorts, PPM from shorts pool
- **YouTube Import**: yt-dlp integration, direct R2 upload
- **Posts System**: Text/media posts with likes, comments, shares

### 5. Real-time Features
- WebSocket server for real-time updates
- Watch parties with sync playback
- Live chat with presence
- Typing indicators
- Message acknowledgments

### 6. Celebrity Knowledge Graph
- 100+ TMDB artists seeded
- Co-star graph with weighted edges
- Claim flow with Persona KYC
- Automatic earnings attribution

### 7. Monetization
- **PPM**: Dynamic tier-based rates (baseline VPM × tier multiplier)
- **Subscriptions**: 40/60 split, Stripe Connect
- **Tips/Gifts**: 80/20 split
- **Withdrawals**: Multi-gateway, min ₦10,000

### 8. Notifications
- In-app + Push (FCM/Web Push)
- Types: live_stream, new_content, payment, withdrawal, follower, comment_reply, mention, milestone
- Web Push + FCM for mobile

### 9. Dynamic SEO
- Sitemap.xml with 1-hour cache
- Open Graph + Twitter Cards
- Dynamic meta tags per content type
- robots.txt

## API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/login/verify
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
```

### Content
```
GET    /api/search              # Search movies/TV
GET    /api/details             # Movie/TV details
GET    /api/credits             # Cast & crew
GET    /api/tv-season           # TV season episodes
GET    /api/source              # Stream source
GET    /api/manifest-info       # HLS manifest info
GET    /api/trending            # Trending content
GET    /api/search/person       # Search people
GET    /api/person/:id/credits  # Person credits
GET    /api/creator/batch-check # Batch check creator profiles
```

### Creator
```
POST   /api/creator/upload
POST   /api/creator/youtube/preview
POST   /api/creator/youtube/import
GET    /api/creator/uploads
GET    /api/creator/dashboard
GET    /api/creator/earnings
GET    /api/creator/ppm/rate
PUT    /api/creator/ppm/config
POST   /api/creator/claim/start
GET    /api/creator/claim/preview/:id
GET    /api/creator/claim/status/:id
```

### Wallet & Payments
```
GET    /api/wallet/balance
GET    /api/wallet/transactions
GET    /api/wallet/earnings
GET    /api/wallet/ppm/rate
PUT    /api/wallet/ppm/config
POST   /api/wallet/ppm/credit
POST   /api/wallet/tip
POST   /api/wallet/gift
GET    /api/wallet/withdraw/preview
POST   /api/wallet/withdraw
POST   /api/beneficiary
GET    /api/beneficiary
GET    /api/banks?gateway=paystack|flutterwave
POST   /api/banks/verify
```

### Payments
```
POST   /api/payment/initialize
GET    /api/payment/gateway-info
GET    /api/payment/verify
POST   /api/payment/verify
```

### Creator Auth
```
POST   /api/creator/auth/register
POST   /api/creator/auth/login
POST   /api/creator/auth/login/verify
POST   /api/creator/auth/forgot-password
POST   /api/creator/auth/reset-password
```

### Social
```
GET    /api/interactions/like
POST   /api/interactions/like
GET    /api/interactions/comments
POST   /api/interactions/comment
POST   /api/interactions/follow
GET    /api/interactions/follow
```

### Payments (Paystack/Flutterwave)
```
POST   /api/beneficiary
GET    /api/beneficiary
GET    /api/banks?gateway=paystack|flutterwave
POST   /api/banks/verify
```

### Notifications
```
GET    /api/notifications
GET    /api/notifications/unread-count
POST   /api/notifications/:id/read
POST   /api/notifications/read-all
```

### Admin
```
GET    /api/admin/overview
GET    /api/admin/users
GET    /api/admin/creators
GET    /api/admin/content
GET    /api/admin/transactions
GET    /api/admin/analytics
```

### Cron Jobs (Admin)
```
POST   /api/cron/tmdb/sync-full
POST   /api/cron/tmdb/sync-incremental
POST   /api/cron/ppm/refresh-baseline
POST   /api/cron/banks/refresh
POST   /api/cron/tmdb/sync-person
GET    /api/cron/status
```

### Sitemap & SEO
```
GET    /sitemap.xml
GET    /robots.txt
```

### Share System
```
POST   /api/share
GET    /api/share/:code
GET    /api/share/stats
POST   /api/share/track
GET    /api/share/analytics
POST   /api/share/custom
GET    /api/share/preview
```

### Downloads
```
GET    /api/downloads/list
DELETE /api/downloads/:filename
```

### Webhooks
```
POST   /api/webhooks/stripe
POST   /api/webhooks/paystack
POST   /api/webhooks/flutterwave
POST   /api/creator/claim/persona/webhook
```

## Database Schema

Key tables:
- `users` - All users (viewers + creators)
- `creator_profiles` - Creator-specific data
- `uploads` - Creator uploads
- `shorts` - Short-form content
- `posts` - Social posts
- `post_comments` - Post comments
- `post_likes` - Post likes
- `post_views` - View tracking
- `shorts` - Short-form content
- `scraped_content_links` - TMDB content attribution
- `creator_profiles` - Creator profiles with TMDB links
- `artist_graph` - Co-star knowledge graph
- `wallet_transactions` - Earnings ledger
- `baseline_vpm_cache` - Hourly VPM cache
- `platform_ppm_tiers` - Tier parameters
- `creator_ppm_config` - Creator PPM settings
- `creator_claim_requests` - KYC claims
- `beneficiaries` - Bank accounts for payouts
- `share_links` - Share tracking
- `share_analytics` - Share analytics
- `posts` - User posts
- `post_comments` - Post comments
- `post_likes` - Post likes
- `post_views` - View tracking
- `notifications` - User notifications
- `push_subscriptions` - Web Push subscriptions

## Mobile App (Flutter)

### Screens Implemented
- `creator_wallet_screen.dart` - Wallet balance, earnings, withdraw
- `creator_onboarding_screen.dart` - Dual gateway setup
- `creator_ppm_settings_screen.dart` - PPM configuration
- `creator_claim_start_screen.dart` - Claim flow start
- `creator_claim_verify_screen.dart` - Persona KYC
- `creator_claim_status_screen.dart` - Status polling
- `creator_claim_success_screen.dart` - Success redirect

### Key Providers
- `walletProvider` - Wallet state management
- `walletServiceProvider` - API service
- `notificationProvider` - Notifications
- `authProvider` - Authentication

### Key Services
- `WalletService` - API calls
- `NotificationService` - FCM + Local notifications
- `AuthService` - Authentication

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `TMDB_ACCESS_TOKEN` | TMDB API v4 token |
| `JWT_SECRET` | JWT signing secret |
| `PERSONA_API_KEY` | Persona API key |
| `PERSONA_TEMPLATE_ID` | Persona template ID |
| `PERSONA_ENV_ID` | Persona environment ID |
| `PERSONA_WEBHOOK_SECRET` | Persona webhook secret |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `FLW_SECRET_KEY` | Flutterwave secret key |
| `FLW_ENCRYPTION_KEY` | Flutterwave encryption key |
| `BREVO_API_KEY` | Brevo API key |
| `R2_*` | Cloudflare R2 credentials |

### Optional
| Variable | Default |
|----------|---------|
| `PORT` | 3030 |
| `APP_URL` | http://localhost:3000 |
| `R2_ENDPOINT` | Cloudflare R2 endpoint |
| `R2_BUCKET` | novaflix |
| `PAYSTACK_PUBLIC_KEY` | pk_live_xxx |
| `FLW_PUBLIC_KEY` | FLWPUBK_xxx |

## Deployment

### Docker
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Render (Backend)
1. Connect GitHub repo
2. Set environment variables
3. Set build command: `npm ci && npm run build`
4. Set start command: `node dist/server.js`

### Vercel (Frontend)
1. Connect GitHub repo
2. Set environment variables
3. Build command: `npm run build`
5. Output directory: `dist`

### Flutter
```bash
# Android
flutter build apk --release

# iOS
flutter build ios --release
```

## Testing

```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm run test

# Flutter tests
cd mobile && flutter test

# E2E tests
npx playwright test
```

## Monitoring

### Health Checks
- Backend: `GET /api/health`
- Database: `pg_isready`
- Redis: `redis-cli ping`

### Logging
- Structured JSON logs
- Error tracking: Sentry (configure DSN)
- Metrics: Prometheus + Grafana (optional)

## Security Checklist

- [ ] JWT secrets rotated regularly
- [ ] Payment keys in environment variables only
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers
- [ ] CSP headers configured
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (Content Security Policy)
- [ ] CSRF protection for state-changing operations
- [ ] File upload validation (type, size, content)
- [ ] Input validation on all endpoints
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for sensitive operations

## Support

- **Documentation**: This file + inline code comments
- **API Docs**: Swagger UI at `/api/docs` (when enabled)
- **Issues**: GitHub Issues
- **Discord**: Community support