---
title: "NovaFlix Documentation Suite - Master Index"
version: "1.0.0"
date: "2024-08-20"
author: "Chukwu Akachukwu Success"
organization: "NovaFlix / WID Ltd (RC 8824091)"
classification: "Confidential"
---

# NovaFlix Documentation Suite

> **Complete business, legal, technical, and operational documentation for NovaFlix**
> A subsidiary of **WID Ltd (RC 8824091)** — "Motivation Drives Innovation"

---

## 📁 Documentation Structure

```
documents/novaflix/
├── 00-meta/                    # This index & metadata
├── 01-corporate/               # Incorporation, governance, equity, compliance
├── 02-business-model/          # Business model, revenue, financial projections
├── 03-legal-contracts/         # Creator, user, payment, vendor, employment, IP
├── 04-technical-architecture/  # System design, infrastructure, backend, frontend, mobile
├── 05-product-design/          # Design system, UX, creator tools, viewer features
├── 06-marketing-growth/        # Brand, acquisition, retention, creator programs
├── 07-operations/              # Trust & safety, support, finance, HR, vendors
├── 08-fundraising/             # Pitch deck, data room, investor materials
├── 09-regulatory-compliance/   # Nigeria, international, payment, industry regs
├── 10-templates-tools/         # Signature generator, templates, checklists, scripts
└── 11-appendices/              # Glossary, acronyms, references, licenses
```

---

## 🔐 Document Classification & Signing Authority

| Class | Description | Signing Requirements | Watermark |
|-------|-------------|---------------------|-----------|
| **Class A** | Foundational Corporate Documents | Founder signature + Parent company attestation + **Corporate Seal** | Opacity 8%, Scale 30% |
| **Class B** | Operational Agreements & Policies | Founder signature + Parent company attestation | Opacity 6%, Scale 25% |
| **Class C** | Internal Procedures & Technical Docs | Founder signature only | Opacity 4%, Scale 20% |
| **Class D** | Generated Reports & Analytics | Watermark only | Opacity 3%, Scale 15% |

### Signing Authorities

**Founder / Authorized Signatory:**
- **Chukwu Akachukwu Success** — Founder & CEO, NovaFlix
- Email: `chukwusuccess247@gmail.com`
- Signing Capacity: *Individual Capacity & Authorized Signatory for WID Ltd*

**Parent Company:**
- **WID Ltd** (RC 8824091)
- Incorporated: 2024, Federal Republic of Nigeria
- Registered Address: Lagos, Nigeria
- CEO: **Ike Wisdom**
- Motto: *Motivation Drives Innovation*
- Website: `https://xperiencestore.store`
- Business Lines: Xperiencestore, First Lady Fashion Hub, WID Force, Xperience TV, **NovaFlix**, GiGoAI

**Subsidiary Relationship:**
- NovaFlix is a **wholly-owned subsidiary** of WID Ltd
- Authorized by: Board Resolution `WID/2024/001`

---

## 🏗️ Build Pipeline

### Prerequisites
```bash
cd documents/novaflix/10-templates-tools
npm install
```

### Generate All PDFs
```bash
npm run build
```

Output: `dist/docs/` with signed, watermarked PDFs + `MASTER_INDEX.json`

### Individual Scripts
```bash
npm run sign       # Apply signatures only
npm run watermark  # Apply watermarks only
npm run verify     # Verify signatures on generated PDFs
```

---

## 📋 Document Index (Auto-Generated)

See `MASTER_INDEX.json` after build for complete index with:
- Document paths & titles
- Categories & document classes
- Doc IDs (format: `NFX-<SHA256-12>`)
- Last modified timestamps

---

## 🔑 Key Business Parameters

| Parameter | Value |
|-----------|-------|
| **Revenue Split (Platform/Creator)** | 40% / 60% |
| **Creator Pool Distribution** | 80% Main Content / 20% Shorts |
| **Pay-Per-Minute** | Auto-credited to creator wallet |
| **Subscription Tiers** | Student (₦800) / Basic (₦1,500) / Standard (₦2,500) / Premium (₦5,500) |
| **Payment Gateways** | Stripe (Global/Connect), Paystack (NG Cards/Bank/USSD), Flutterwave (Africa Mobile Money) |
| **Currency** | NGN (primary), USD/EUR (via Stripe) |

---

## 🎯 Current Status

| Category | Documents | Status |
|----------|-----------|--------|
| 01-Corporate (Class A) | 9 | 🔄 In Progress |
| 02-Business Model | 15+ | ⏳ Planned |
| 03-Legal Contracts | 25+ | ⏳ Planned |
| 04-Technical Architecture | 25+ | ⏳ Planned |
| 05-Product Design | 20+ | ⏳ Planned |
| 06-Marketing Growth | 15+ | ⏳ Planned |
| 07-Operations | 15+ | ⏳ Planned |
| 08-Fundraising | 10+ | ⏳ Planned |
| 09-Regulatory Compliance | 15+ | ⏳ Planned |
| 10-Templates & Tools | 10+ | ✅ Core Complete |
| 11-Appendices | 5+ | ⏳ Planned |

---

## 📞 Contact

**NovaFlix Documentation Team**
- Founder: Chukwu Akachukwu Success (`chukwusuccess247@gmail.com`)
- Parent Co: WID Ltd (`https://xperiencestore.store`)
- Repository: Internal — NovaFlix Organization

---

*Last Updated: 2024-08-20 | Version 1.0.0 | Classification: Confidential*