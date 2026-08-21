---
title: "Privacy Policy — NovaFlix"
version: "1.0.0"
date: "2024-08-20"
author: "Chukwu Akachukwu Success"
organization: "NovaFlix / WID Ltd (RC 8824091)"
classification: "Public"
class: "Class B"
---

# Privacy Policy

> **How NovaFlix collects, uses, shares, and protects your personal data**

**Effective Date:** 2024-08-20  
**Last Updated:** 2024-08-20  
**Data Controller:** NovaFlix (Subsidiary of WID Ltd, RC 8824091), Lagos, Nigeria  
**Data Protection Officer:** dpo@nova-flix.com.ng  
**Contact:** privacy@nova-flix.com.ng

---

## 1. Scope & Applicability

This Policy applies to all users of **NovaFlix** (web, mobile, TV, API) — viewers, Creators, visitors.

**Regulatory Frameworks:**
- **NDPR** (Nigeria Data Protection Regulation 2019)
- **GDPR** (EU General Data Protection Regulation) — for EU users
- **CCPA/CPRA** (California) — for California residents
- **POPIA** (South Africa) — for SA users
- **Kenya DPA** — for Kenya users

---

## 2. Data We Collect

### 2.1 Account & Profile Data

| Category | Fields | Source |
|----------|--------|--------|
| **Identity** | Name, email, phone, username, avatar, bio | Registration, profile edit |
| **Authentication** | Hashed password, OAuth tokens (Google, Apple), 2FA secrets | Login, security settings |
| **Verification** | Government ID, selfie, BVN, NIN, tax ID (Creators) | KYC onboarding |

### 2.2 Viewing & Engagement Data

| Category | Fields | Purpose |
|----------|--------|---------|
| **Watch History** | Title, timestamp, duration, position, device, quality | Resume, recommendations, history |
| **Interactions** | Likes, comments, shares, follows, watchlist, ratings | Social features, recommendations |
| **Search** | Queries, filters, results clicked | Search improvement |
| **Watch Parties** | Host/guest, chat messages, sync data | Feature operation |
| **Gamification** | XP, level, badges, achievements, streaks | Engagement |

### 2.3 Payment & Financial Data

| Category | Fields | Retention |
|----------|--------|-----------|
| **Billing** | Name, address, tax ID, payment method token (last 4, expiry) | 7 years (legal) |
| **Transactions** | Amount, currency, gateway, status, timestamps | 7 years |
| **Creator Wallet** | Balance, earnings by source, payouts, tax forms | 7 years |
| **Tax** | WHT certificates, VAT invoices, 1042-S, residency cert | 7 years |

### 2.4 Device & Technical Data

| Category | Fields |
|----------|--------|
| **Device** | Model, OS, browser, app version, screen resolution, language |
| **Network** | IP address, ISP, connection type, geo-location (country/city) |
| **Cookies/Storage** | Session ID, preferences, cache, push tokens |
| **Analytics** | Events, funnels, performance, errors (pseudonymized) |

### 2.5 Location Data

- **Precision:** Country + City (from IP)
- **GPS:** Only with explicit consent (mobile app, optional)
- **Used for:** Content licensing, currency, compliance, fraud prevention

### 2.6 Communications

| Type | Data |
|-------|------|
| **Support** | Tickets, chats, emails, call recordings (with notice) |
| **Marketing** | Email opens, clicks, preferences (opt-in) |
| **Push/In-App** | Notification tokens, delivery/engagement |

---

## 3. Legal Bases (GDPR/NDPR)

| Processing Activity | Legal Basis |
|---------------------|-------------|
| **Account creation, service delivery** | Contract (Art. 6(1)(b)) |
| **Payments, billing, tax** | Legal obligation (Art. 6(1)(c)) |
| **Fraud prevention, security** | Legitimate interest (Art. 6(1)(f)) |
| **Recommendations, personalization** | Legitimate interest / Consent |
| **Marketing emails/push** | Consent (Art. 6(1)(a)) |
| **Analytics (pseudonymized)** | Legitimate interest |
| **Legal compliance, disputes** | Legal obligation / Legal claims |

---

## 4. How We Use Your Data

| Purpose | Description |
|---------|-------------|
| **Provide Service** | Streaming, account, billing, support |
| **Personalize** | Recommendations, continue watching, search ranking |
| **Monetization** | Subscriptions, PPM, tips, Creator payouts, tax |
| **Communications** | Transactional (billing, security), Marketing (opt-in) |
| **Safety & Security** | Fraud detection, abuse prevention, account security |
| **Legal & Compliance** | Tax, AML, sanctions, court orders, regulatory reporting |
| **Analytics & Improvement** | Product usage, performance, A/B testing |
| **Creator Tools** | Analytics, audience insights, payout reporting |

---

## 5. Data Sharing

### 5.1 Processors (Data Processing Agreements in Place)

| Processor | Purpose | Location | Safeguards |
|-----------|---------|----------|------------|
| **Stripe** | Global payments, Connect payouts, tax reporting | US, EU, Global | SCC, PCI-DSS, ISO 27001 |
| **Paystack** | Nigeria/Ghana/SA/KE payments, transfers | Nigeria, Ghana, SA, Kenya | NDPR, CBN, ISO 27001 |
| **Flutterwave** | Africa payments, mobile money, transfers | Nigeria, Africa, US, UK, EU | SCC, CBN, BoG, CCK, SARB |
| **Cloudflare (R2/CDN)** | Video storage, delivery, WAF | Global | SCC, ISO 27001 |
| **Brevo (Sendinblue)** | Transactional/marketing email | EU, US | SCC, ISO 27001 |
| **Neon (PostgreSQL)** | Primary database | US (AWS) | SCC, SOC 2, encryption |
| **Render/Vercel** | Hosting, serverless | US, EU | SOC 2, ISO 27001 |
| **Analytics (Plausible/Internal)** | Product analytics | EU | No personal data |

### 5.2 Sub-Processors

List maintained at: `https://nova-flix.com.ng/subprocessors` (updated quarterly)

### 5.3 Disclosures (Not Sale)

| Recipient | Purpose | Basis |
|-----------|---------|-------|
| **Creators** | Your public interactions (likes, comments, follows) | Contract/Legitimate Interest |
| **Law Enforcement** | Valid legal request (court order, subpoena) | Legal Obligation |
| **Regulators** | CBN, FIRS, NDPB, GDPR authorities | Legal Obligation |
| **Acquirer** | Merger/acquisition (notice provided) | Legitimate Interest |
| **Auditors** | Financial/tax audit | Legal Obligation |

### 5.4 International Transfers

| Transfer | Mechanism |
|----------|-----------|
| **EU → US (Stripe, Neon, Render)** | Standard Contractual Clauses (SCC) + Supplementary Measures |
| **Nigeria → Global (Paystack, Flutterwave)** | NDPR Cross-Border Transfer Clause + Adequacy |
| **Africa → Global (Flutterwave)** | SCC + Local Regulator Approvals |
| **All** | Processor in "adequate" jurisdiction where available |

---

## 6. Data Retention

| Category | Retention Period | Trigger for Deletion |
|----------|------------------|----------------------|
| **Account/Profile** | Duration of account + 30 days | Account deletion request |
| **Watch History** | 2 years (rolling) | Manual clear / account deletion |
| **Payment/Transactions** | 7 years (tax/legal) | Legal requirement met |
| **Creator Wallet/Tax** | 7 years post-last-payout | Legal requirement met |
| **Support Tickets** | 3 years post-closure | Time elapsed |
| **Marketing Data** | Until opt-out / 2 years inactivity | Opt-out / inactivity |
| **Analytics (PII)** | 26 months (GA4 default) | Auto-expiry |
| **Logs/Security** | 1 year | Time elapsed |
| **KYC (Creators)** | 7 years post-relationship | Legal requirement |

**Account Deletion:** Initiated in Settings → "Delete Account" — processed within 30 days (legal holds may extend).

---

## 7. Your Rights

### 7.1 Universal Rights (NDPR/GDPR/CCPA)

| Right | How to Exercise |
|-------|-----------------|
| **Access** | Settings → "Download My Data" (JSON/CSV) |
| **Rectification** | Settings → Edit Profile |
| **Erasure** | Settings → "Delete Account" |
| **Portability** | Settings → "Download My Data" (machine-readable) |
| **Restriction** | Email privacy@nova-flix.com.ng |
| **Objection** | Settings → "Privacy Preferences" (marketing, analytics) |
| **Automated Decisions** | Not used for significant effects (no profiling) |

### 7.2 Nigeria (NDPR Specific)

- **Data Protection Officer:** dpo@nova-flix.com.ng
- **Complaint:** NDPB (Nigeria Data Protection Bureau) — `https://ndpb.gov.ng`
- **Data Localization:** Nigerian user data mirrored in Nigeria (Neon PG read-replica)

### 7.3 EU (GDPR Specific)

- **Representative:** EU representative appointed (Art. 27)
- **Supervisory Authority:** Your local DPA (e.g., CNIL, ICO, BdP)
- **Cross-border:** SCCs + Transfer Impact Assessment

### 7.4 California (CCPA/CPRA Specific)

- **Do Not Sell/Share:** We don't sell; "Share" = analytics processors (opt-out in Settings)
- **Sensitive Data:** Not collected without consent
- **Authorized Agent:** You may designate agent (written permission)
- **Non-Discrimination:** No penalty for exercising rights

---

## 8. Children's Privacy

- **Minimum Age:** 13 (with parental consent 13–17)
- **No knowing collection** from <13
- **Parental Consent:** Verified via email + ID for 13–17
- **COPPA:** Compliance for US children

---

## 9. Security

### 9.1 Technical Measures

| Measure | Implementation |
|---------|----------------|
| **Encryption at Rest** | AES-256 (Neon, R2, Render) |
| **Encryption in Transit** | TLS 1.3 (all endpoints) |
| **Authentication** | Bcrypt (password), JWT (RS256), 2FA (TOTP), WebAuthn |
| **Authorization** | RBAC, resource-level permissions |
| **Secrets** | AWS Secrets Manager / Render env vars (rotation) |
| **WAF** | Cloudflare (OWASP Top 10, rate limiting) |
| **Penetration Testing** | Annual (external) + Bug bounty |

### 9.2 Organizational Measures

- **DPO** appointed
- **Privacy by Design** in development
- **DPIA** for high-risk processing
- **Staff Training** annual (privacy, security)
- **Incident Response Plan** (72-hr breach notification)
- **Vendor Management** DPA + security review

### 9.3 Breach Notification

| Timeline | Action |
|----------|--------|
| **0–24h** | Detect, contain, assess |
| **24–72h** | Notify DPO, prepare notification |
| **72h** | Notify Supervisory Authority (GDPR/NDPR) |
| **Without undue delay** | Notify affected users (high risk) |

---

## 10. Cookies & Tracking

### 10.1 Categories

| Category | Purpose | Consent |
|----------|---------|---------|
| **Strictly Necessary** | Session, auth, security, payments | No (essential) |
| **Preferences** | Language, quality, volume, UI | Yes (implied by use) |
| **Analytics** | Usage, performance, funnels (pseudonymized) | Yes (opt-in banner) |
| **Marketing** | Attribution, retargeting (none currently) | Yes (explicit opt-in) |

### 10.2 Cookie List (Key)

| Cookie | Type | Duration | Purpose |
|--------|------|----------|---------|
| `novaflix_token` | Necessary | 30 days | JWT auth |
| `novaflix_refresh` | Necessary | 90 days | Token refresh |
| `novaflix_prefs` | Preferences | 1 year | Quality, language, autoplay |
| `novaflix_analytics` | Analytics | 26 months | Pseudonymized usage |
| `novaflix_csrf` | Security | Session | CSRF protection |

### 10.3 Control

- **Banner:** First visit (Granular: Accept All / Reject Non-Essential / Customize)
- **Settings:** `Settings → Privacy → Cookies` (toggle per category)
- **Browser:** Block/Delete via browser settings

---

## 11. Marketing Communications

### 11.1 Types

| Channel | Content | Opt-In |
|---------|---------|--------|
| **Email** | New releases, Creator updates, tips, promotions | Explicit (checkbox) |
| **Push** | Watch party invites, live alerts, new episodes | Explicit (prompt) |
| **In-App** | Banners, recommendations | Implied (service) |
| **SMS/WhatsApp** | Critical only (security, billing) | Explicit |

### 11.2 Unsubscribe

- **Email:** "Unsubscribe" link in every email
- **Push:** Settings → Notifications (toggle per type)
- **All:** Settings → Communications → "Unsubscribe All"

---

## 12. Creator-Specific Privacy

### 12.1 Additional Data Collected

- **KYC:** Government ID, selfie, BVN/NIN, tax ID, bank account
- **Business:** Company name, CAC/RC, TIN, directors
- **Content:** Titles, metadata, earnings, analytics

### 12.2 Sharing with Creators

| Data Shared | Recipient | Purpose |
|-------------|-----------|---------|
| **Public Profile** | All users | Discovery, social |
| **Aggregated Analytics** | Creator (Dashboard) | Insights |
| **Supporter List** | Creator (if enabled) | Community building |

### 12.3 Creator Rights

Same as Section 7 + **Data Portability** of earnings/analytics (CSV/JSON).

---

## 13. Automated Decision Making

**No fully automated decisions** with legal/significant effects.

- **Recommendations:** Algorithmic (collaborative filtering, content-based) — human-reviewable, not binding
- **Fraud Scoring:** Rules-based + ML — flags for human review
- **Content Moderation:** AI-assisted → human final decision

---

## 14. Changes to This Policy

- **Material Changes:** 30-day notice (email, in-app banner, blog)
- **Version History:** `Settings → Legal → Privacy Policy Versions`
- **Effective Date:** Top of document

---

## 15. Contact & Complaints

**Data Protection Officer:**  
Email: `dpo@nova-flix.com.ng`  
Address: NovaFlix, Lagos, Nigeria

**Supervisory Authorities:**
- **Nigeria:** NDPB — `https://ndpb.gov.ng`
- **EU:** Your local DPA — `https://edpb.europa.eu`
- **California:** CA AG — `https://oag.ca.gov/privacy`
- **South Africa:** Information Regulator — `https://inforegulator.org.za`
- **Kenya:** ODPC — `https://odpc.go.ke`

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **Personal Data** | Any info relating to identified/identifiable person |
| **Processing** | Any operation on personal data |
| **Controller** | Entity deciding purposes/means (NovaFlix) |
| **Processor** | Entity processing on behalf of Controller |
| **SCC** | Standard Contractual Clauses (EU) |
| **DPIA** | Data Protection Impact Assessment |
| **PII** | Personally Identifiable Information |

---

*Document ID: NFX-PRIVACY-20240820 | Classification: Public | Class: B*