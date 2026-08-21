---
title: "Creator Platform Agreement — NovaFlix"
version: "1.0.0"
date: "2024-08-20"
author: "Chukwu Akachukwu Success"
organization: "NovaFlix / WID Ltd (RC 8824091)"
classification: "Confidential"
class: "Class B"
---

# Creator Platform Agreement

> **Standard agreement between NovaFlix and Creators for content distribution, monetization, and revenue sharing**

---

## 1. Parties

| Party | Details |
|-------|---------|
| **NovaFlix** | Private Limited Company, Lagos, Nigeria (Subsidiary of WID Ltd RC 8824091) |
| **Creator** | [Creator Legal Name] — [Individual / Company] |
| **Effective Date** | [Date of digital acceptance] |
| **Agreement Version** | 1.0 |

---

## 2. Definitions

| Term | Definition |
|------|------------|
| **"Platform"** | NovaFlix streaming service (web, mobile, TV apps) |
| **"Content"** | Audio-visual works uploaded/imported by Creator (films, series, shorts, live streams) |
| **"Revenue"** | Gross amounts received from users for Creator's Content |
| **"Net Revenue"** | Revenue less: payment gateway fees, taxes, refunds, chargebacks, third-party royalties |
| **"Creator Wallet"** | Digital ledger tracking Creator's earnings on Platform |
| **"PPM"** | Pay-Per-Minute viewing model |
| **"Glow Gifts"** | Virtual gifts/tips from viewers to Creator |
| **"Territory"** | Worldwide (unless restricted per Schedule A) |
| **"Term"** | Initial 3 years, auto-renew 1 year unless terminated |

---

## 3. Grant of Rights

### 3.1 License Grant

Creator grants NovaFlix a **non-exclusive, worldwide, royalty-bearing license** to:

| Right | Scope |
|-------|-------|
| **Stream** | Encode, transcode, deliver via HLS/DASH to users |
| **Monetize** | Subscriptions, PPM, Ads, Tips, Memberships, Merch |
| **Promote** | Clips, trailers, thumbnails in feeds, search, marketing |
| **Archive** | Store for catch-up, library, legal compliance |
| **Analyze** | Usage data for recommendations, reporting |

### 3.2 Content Types Covered

| Type | Examples | Monetization |
|------|----------|--------------|
| **Main Content** | Films, TV episodes, documentaries | Subs, PPM, Ads, Tips |
| **Shorts** | <60 sec vertical videos | Shorts Pool (20%), Tips |
| **Live** | Real-time streams | Tips, Tickets, Subs-gated |
| **Courses** | Structured lessons | One-time / Membership |
| **Extras** | Behind-scenes, commentary | Subs, Tips |

### 3.3 Reserved Rights

Creator retains:
- Copyright ownership
- Right to distribute elsewhere (non-exclusive)
- Right to create derivatives
- Moral rights (attribution, integrity)

---

## 4. Content Delivery & Standards

### 4.1 Delivery Methods

| Method | Process | Timeline |
|--------|---------|----------|
| **Direct Upload** | Creator Dashboard → R2 storage → Transcode | <24 hrs to live |
| **YouTube Import** | OAuth → yt-dlp → R2 → Transcode | <48 hrs to live |
| **Scraped Link Claim** | TMDB match → Claim profile → Auto-link | Immediate |

### 4.2 Technical Specs

| Requirement | Spec |
|-------------|------|
| **Video** | H.264/H.265, 1080p min (4K preferred), MP4/MOV |
| **Audio** | AAC 2.0 / 5.1, 48kHz |
| **Subtitles** | SRT/VTT, UTF-8, synced |
| **Thumbnails** | 16:9 (1920x1080), 2:3 poster (1200x1800) |
| **Metadata** | Title, synopsis, cast, genre, rating, language, year |

### 4.3 Quality Control

- NovaFlix may reject Content failing specs (notify within 5 business days)
- Creator may re-deliver corrected files
- No liability for rejection

---

## 5. Revenue Model & Sharing

### 5.1 Revenue Split (Platform / Creator Ecosystem)

| Pool | Platform | Creator Ecosystem | Notes |
|------|----------|-------------------|-------|
| **Total Net Revenue** | **40%** | **60%** | After gateway fees, taxes, refunds |
| **Of Creator 60%:** | | | |
| → Main Content Pool | — | **80%** (48% of total) | Distributed by streamshare |
| → Shorts Pool | — | **20%** (12% of total) | Distributed by viewshare |

### 5.2 Streamshare Calculation (Main Content)

```
Creator Share = (Creator Minutes Watched ÷ Total Platform Minutes) × Main Content Pool
```

- **Minutes Watched** = Sum of all viewing minutes on Creator's Content
- **Calculated Monthly** (calendar month)
- **Minimum Threshold:** 1,000 minutes/month to participate (anti-spam)

### 5.3 Shorts Viewshare Calculation

```
Creator Share = (Creator Shorts Views ÷ Total Platform Shorts Views) × Shorts Pool
```

- **View** = ≥3 seconds watch time
- **Calculated Monthly**

### 5.4 Pay-Per-Minute (PPM) — Instant Wallet Credit

| Parameter | Value |
|-----------|-------|
| **Rate** | Creator-set (min ₦5/min, max ₦500/min) |
| **Split** | 60% Creator / 40% Platform (real-time) |
| **Wallet Credit** | Instant on each minute watched |
| **Withdrawal** | Anytime (min ₦1,000) |

### 5.5 Tips & Glow Gifts

| Type | Split | Timing |
|------|-------|--------|
| **Cash Tips** | 80% Creator / 20% Platform | Instant |
| **Glow Gifts** | 80% Creator / 20% Platform | Instant |

### 5.6 Creator Memberships

- Creator sets tiers (monthly price, benefits)
- **Split:** 80% Creator / 20% Platform
- Billed monthly via user's payment method

### 5.7 Merch, Courses, Events

| Type | Split | Notes |
|------|-------|-------|
| **Merch (POD)** | 85% Creator / 15% Platform | After COGS |
| **Courses** | 80% Creator / 20% Platform | One-time or subscription |
| **Live Events** | 80% Creator / 20% Platform | Ticket sales |

---

## 6. Payment & Settlement

### 6.1 Payment Gateways (User-Facing)

| Gateway | Regions | Currencies | Creator Payout Via |
|---------|---------|------------|-------------------|
| **Stripe** | Global (US, EU, UK, CA, AU, etc.) | USD, EUR, GBP, CAD, AUD, 135+ | Stripe Connect |
| **Paystack** | Nigeria, Ghana, SA, Kenya | NGN, GHS, ZAR, KES | Paystack Transfers |
| **Flutterwave** | Africa (34 countries) | NGN, KES, GHS, ZAR, UGX, XOF, XAF | Flutterwave Payouts |

### 6.2 Creator Payout Methods

| Method | Regions | Frequency | Minimum | Processing |
|--------|---------|-----------|---------|------------|
| **Stripe Connect** | Global | Daily rolling (T+2) | $10 | Auto |
| **Paystack Transfer** | Nigeria | Daily | ₦1,000 | Auto |
| **Flutterwave Payout** | Africa | Daily | Equivalent $10 | Auto |
| **Bank Transfer (Manual)** | Nigeria | Monthly | ₦10,000 | 5 business days |

### 6.3 Settlement Timeline

| Revenue Type | Settlement | Wallet Credit |
|--------------|------------|---------------|
| Subscriptions | Monthly (5th business day) | Monthly |
| PPM | Real-time | Instant |
| Tips/Gifts | Real-time | Instant |
| Memberships | Monthly (5th business day) | Monthly |
| Merch/Courses/Events | Per transaction (T+7 for refunds) | T+7 |

### 6.4 Tax Withholding

| Jurisdiction | Rate | Responsibility |
|--------------|------|----------------|
| **Nigeria (WHT)** | 5% (individuals) / 10% (corporate) | NovaFlix deducts, remits, issues WHT credit |
| **US (Form 1042-S)** | 30% or treaty rate | Stripe Connect handles |
| **Other** | Per local law | Gateway handles |

Creator provides tax residency certificate for treaty benefits.

### 6.5 Currency & FX

- **Platform Currency:** NGN (primary), USD (secondary)
- **FX Rate:** Mid-market + 1% (Stripe), Gateway rate (Paystack/Flutterwave)
- **Creator Wallets:** Multi-currency (NGN, USD, EUR, GBP)

---

## 7. Creator Wallet & Withdrawals

### 7.1 Wallet Structure

| Balance Type | Source | Withdrawable |
|--------------|--------|--------------|
| **Main Wallet** | Streamshare, PPM, Tips, Memberships | Yes (min ₦1,000) |
| **Shorts Wallet** | Shorts viewshare | Yes (min ₦1,000) |
| **Pending** | Unsettled (refund window) | No (auto-clears) |

### 7.2 Withdrawal Process

1. Creator initiates in Dashboard → "Withdraw"
2. Selects method (Stripe Connect / Paystack / Flutterwave / Bank)
3. Enters amount (minimums apply)
4. 2FA confirmation
5. Processed per Section 6.2 timelines
6. Receipt generated with Doc ID

### 7.3 Holds & Reserves

NovaFlix may hold funds for:
- Chargeback risk (90 days rolling)
- Dispute resolution
- Regulatory compliance
- Suspected fraud (investigation period)

---

## 8. Reporting & Transparency

### 8.1 Creator Dashboard Metrics

| Category | Metrics |
|----------|---------|
| **Revenue** | By source, by content, by territory, by period |
| **Engagement** | Minutes, views, completion rate, retention cohorts |
| **Audience** | Demographics, geography, device, plan tier |
| **Wallet** | Balance, pending, history, tax documents |

### 8.2 Monthly Statement

Generated by 5th business day, includes:
- Revenue by source (with gateway breakdown)
- Streamshare calculation detail
- Fee deductions (gateway, platform, tax)
- Net payable
- Withdrawal history

### 8.3 Annual Tax Pack

- Nigeria: WHT certificates, income summary
- US: 1042-S (via Stripe)
- Other: Per gateway

---

## 9. Intellectual Property

### 9.1 Ownership

- **Creator** owns all IP in Content
- **NovaFlix** owns Platform IP (player, algorithms, brand, tech)

### 9.2 License Scope

Non-exclusive, worldwide, Territory, Term. Sublicensable to CDNs, payment processors.

### 9.3 Takedown & DMCA

- NovaFlix complies with DMCA / Nigerian Copyright Act
- Creator can submit takedown notices via Dashboard
- Counter-notification process per law
- Repeat infringers: 3 strikes → account review

### 9.4 User-Generated Content (UGC)

Creator responsible for:
- Clearing all rights (music, footage, likeness)
- No illegal, hateful, CSAM, extremist content
- Compliance with NBC (Nigeria broadcasting code)

---

## 10. Creator Obligations

### 10.1 Content Warranties

Creator represents:
- Owns or controls all rights to Content
- Content doesn't infringe third-party IP
- No defamatory, illegal, harmful material
- All metadata accurate

### 10.2 Compliance

- Adhere to Community Guidelines (Schedule B)
- Maintain accurate tax/payout info
- Respond to support within 5 business days
- No artificial engagement (bots, view farms)

### 10.3 Promotion

Creator may promote Content on Platform using:
- Share links (tracked, revenue-attributed)
- Cross-post to social (Instagram, TikTok, X, YouTube)
- Email list integration (Mailchimp, ConvertKit)

---

## 11. NovaFlix Obligations

### 11.1 Platform Operations

- 99.5% uptime SLA (excl. planned maintenance)
- CDN delivery globally (Cloudflare R2 + edge)
- HLS.js player with adaptive bitrate
- DRM option (Widevine/PlayReady) for premium Content

### 11.2 Creator Support

| Tier | Response | Channels |
|------|----------|----------|
| **Standard** | 48 hrs | Email, Dashboard ticket |
| **Priority** (Top 100 creators) | 12 hrs | + WhatsApp, Phone |
| **Partner** (Contracted) | 4 hrs | + Slack, Dedicated CSM |

### 11.3 Marketing Support

- Algorithmic recommendation (merit-based)
- Editorial features (Staff Picks, Trending)
- Creator spotlights (blog, social, newsletter)
- Cross-promotion with other creators

---

## 12. Term & Termination

### 12.1 Term

- **Initial:** 3 years from Effective Date
- **Renewal:** Auto-renew 1 year unless 90-day notice
- **Early Termination:** Either party, 60 days written notice

### 12.2 Termination for Cause

| Breach | Cure Period | Action |
|--------|-------------|--------|
| IP Infringement (repeat) | None | Immediate |
| Fraud / Artificial Engagement | None | Immediate |
| Non-payment (Platform) | 15 days | Suspend → Terminate |
| Non-payment (Creator) | 30 days | Suspend → Terminate |
| Material Breach | 30 days | Cure or terminate |

### 12.3 Effect of Termination

| Item | Treatment |
|------|-----------|
| **Content** | Removed within 30 days (Creator may request 90-day wind-down) |
| **Wallet Balance** | Paid out per Section 6 (subject to holdbacks) |
| **Licenses** | Survive for Content already downloaded by users |
| **Data** | Creator data exported (GDPR/NDPR) within 30 days |
| **Non-Compete** | 12 months (Creator not to launch competing platform) |

---

## 13. Liability & Indemnification

### 13.1 Limitation of Liability

- **NovaFlix:** Not liable for indirect, consequential, punitive damages
- **Cap:** Total liability ≤ 12 months Creator's average monthly earnings
- **Exceptions:** Fraud, willful misconduct, IP indemnity, data protection

### 13.2 Mutual Indemnity

Each party indemnifies the other for:
- Breach of warranties
- Third-party IP claims (Creator: Content; NovaFlix: Platform)
- Regulatory violations
- Data protection breaches

### 13.3 Force Majeure

Neither party liable for delays due to: acts of God, government action, internet outages, cyberattacks, strikes.

---

## 14. Confidentiality

### 14.1 Obligations

- Protect confidential info (revenue, algorithms, user data, roadmap)
- Use only for Agreement performance
- Disclose only to employees/agents with need-to-know + NDA

### 14.2 Exceptions

- Public knowledge
- Independently developed
- Required by law (notify other party)

### 14.3 Duration

- Trade secrets: Perpetual
- Other confidential: 5 years post-termination

---

## 15. Data Protection

### 15.1 Roles

- **NovaFlix:** Data Controller (Platform data)
- **Creator:** Data Controller (Creator's fan data exported)
- **Joint:** Analytics aggregates

### 15.2 Compliance

- NDPR (Nigeria), GDPR (EU), CCPA (California)
- DPA executed for processing
- Breach notification: 72 hours

---

## 16. Dispute Resolution

### 16.1 Escalation

1. **Good Faith Negotiation** — 15 days (Creator Support → Legal)
2. **Mediation** — Lagos Court of Arbitration (LCA) — 30 days
3. **Arbitration** — LCA Rules, 3 arbitrators, Lagos, English law
4. **Court** — Lagos High Court (Commercial Division) for injunctive relief

### 16.2 Costs

Losing party bears reasonable costs (including legal fees).

---

## 17. General

### 17.1 Assignment

- **NovaFlix:** May assign to affiliate or acquirer (notice to Creator)
- **Creator:** Not assignable without NovaFlix consent (not unreasonably withheld)

### 17.2 Amendments

Written agreement. Material changes: 30-day notice, Creator may terminate if adverse.

### 17.3 Governing Law

**Federal Republic of Nigeria** law. Exclusive jurisdiction: Lagos courts.

### 17.4 Notices

Email to registered addresses (deemed received at sending).

### 17.5 Entire Agreement

Supersedes all prior. Schedules A–C incorporated.

---

## Schedule A: Territory Restrictions

| Content | Restricted Territories | Reason |
|---------|----------------------|--------|
| *Per Content* | *Per license* | *Existing distribution deals* |

---

## Schedule B: Community Guidelines Summary

| Prohibited | Action |
|------------|--------|
| Copyright infringement | Takedown, strike |
| Hate speech / extremism | Removal, ban |
| CSAM / child exploitation | Report to authorities, ban |
| Pornography (hardcore) | Removal (soft erotica: 18+ gated) |
| Misinformation (health/election) | Label, reduce distribution |
| Spam / artificial engagement | Removal, wallet freeze |
| Doxxing / harassment | Removal, ban |

---

## Schedule C: Revenue Share Quick Reference

| Revenue Source | Creator % | Platform % | Gateway Fees | Tax | Settlement |
|----------------|-----------|------------|--------------|-----|------------|
| **Subscriptions (Main Pool)** | 48%* | 40% | Deducted first | WHT | Monthly |
| **Subscriptions (Shorts Pool)** | 12%* | 40% | Deducted first | WHT | Monthly |
| **PPM** | 60% | 40% | Deducted first | WHT | Instant |
| **Tips / Glow Gifts** | 80% | 20% | Deducted first | WHT | Instant |
| **Memberships** | 80% | 20% | Deducted first | WHT | Monthly |
| **Merch (POD)** | 85%** | 15% | Deducted first | VAT | T+7 |
| **Courses** | 80% | 20% | Deducted first | WHT | T+7 |
| **Live Events** | 80% | 20% | Deducted first | WHT | T+7 |
| **AVOD (Ads)** | 50% | 50% | N/A | WHT | Monthly |

*Of Net Revenue after gateway fees, taxes, refunds
**After COGS (print-on-demand cost)

---

## Execution

**EXECUTED BY DIGITAL ACCEPTANCE ON PLATFORM**

**NOVAFLIX:**

```
Success
Chukwu Akachukwu Success
Founder & CEO, NovaFlix
Date: [Auto-populated]
```

**CREATOR:**

```
[Creator Digital Signature]
[Creator Legal Name]
[Creator Type: Individual/Company]
Date: [Auto-populated]
```

**ATTESTED BY PARENT COMPANY:**

```
WID Ltd  •  RC 8824091
Motivation Drives Innovation

Authorized by: Chukwu Akachukwu Success
(Founder & CEO, NovaFlix)

Date: [Auto-populated]
```

---

*Document ID: NFX-CREATOR-AGREE-20240820 | Classification: Confidential | Class: B*