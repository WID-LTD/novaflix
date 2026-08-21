---
title: "Revenue Sharing Addendum — NovaFlix Creator Platform Agreement"
version: "1.0.0"
date: "2024-08-20"
author: "Chukwu Akachukwu Success"
organization: "NovaFlix / WID Ltd (RC 8824091)"
classification: "Confidential"
class: "Class B"
---

# Revenue Sharing Addendum

> **Detailed revenue share mechanics, calculations, and schedules — annexed to Creator Platform Agreement**

---

## 1. Overview

This Addendum forms part of the **Creator Platform Agreement** between NovaFlix and the Creator. It specifies the exact formulas, timing, and mechanics for all revenue-sharing arrangements.

**Effective:** Upon Creator's digital acceptance of Creator Platform Agreement
**Version:** 1.0 (subject to annual review)

---

## 2. Revenue Pools Architecture

### 2.1 Master Revenue Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GROSS PLATFORM REVENUE                       │
│  (Subs + PPM + Tips + Memberships + Merch + Courses + Events)  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  LESS: DIRECT COSTS     │
              │  • Payment gateway fees │
              │  • Refunds & chargebacks│
              │  • Applicable taxes     │
              │  • Third-party royalties│
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │     NET REVENUE         │
              └────────────┬────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │   PLATFORM  │  │  CREATOR    │  │   RESERVES  │
   │    40%      │  │  ECOSYSTEM  │  │  (Variable) │
   │             │  │    60%      │  │             │
   └─────────────┘  └──────┬──────┘  └─────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  MAIN    │ │ SHORTS   │ │  PPM /   │
        │ CONTENT  │ │ POOL     │ │  TIPS /  │
        │  POOL    │ │          │ │  OTHER   │
        │  80%     │ │  20%     │ │  DIRECT  │
        │ (48% tot)│ │ (12% tot)│ │ (Instant)│
        └──────────┘ └──────────┘ └──────────┘
```

### 2.2 Pool Definitions

| Pool | Source Revenue | Distribution Method | Frequency |
|------|----------------|---------------------|-----------|
| **Main Content Pool** | Subscriptions (all tiers), AVOD ads on main content | **Streamshare** (minutes watched) | Monthly |
| **Shorts Pool** | Subscriptions (allocated), AVOD ads on shorts, Shorts-specific tips | **Viewshare** (qualified views) | Monthly |
| **Direct Wallet** | PPM, Tips, Glow Gifts, Memberships, Merch, Courses, Events | **Per-transaction** (instant) | Real-time |

---

## 3. Streamshare Calculation (Main Content Pool)

### 3.1 Formula

```
Creator Monthly Payout = (Creator_Eligible_Minutes ÷ Total_Eligible_Minutes) × Main_Content_Pool
```

### 3.2 Eligibility Criteria

| Criterion | Threshold | Purpose |
|-----------|-----------|---------|
| **Minimum Minutes** | 1,000 minutes/month | Anti-spam, quality signal |
| **Minimum Unique Viewers** | 50 unique users/month | Genuine audience |
| **Content Status** | Active, not disputed | Exclude disputed Content |
| **Creator Status** | Active, not suspended | Compliance |

### 3.3 Eligible Minutes Definition

| Included | Excluded |
|----------|----------|
| Minutes from paying subscribers | Free tier (AVOD) minutes |
| PPM minutes (paid per-minute) | Creator's own views |
| Membership-gated minutes | Test/internal views |
| Completed views (≥90%) | <10 second "bounce" views |

### 3.4 Calculation Example

**Scenario:** May 2024

| Metric | Value |
|--------|-------|
| Total Net Revenue | ₦100,000,000 |
| Platform Share (40%) | ₦40,000,000 |
| Creator Ecosystem (60%) | ₦60,000,000 |
| Main Content Pool (80%) | ₦48,000,000 |
| Shorts Pool (20%) | ₦12,000,000 |
| **Total Eligible Minutes (Platform)** | **50,000,000** |
| **Creator A Eligible Minutes** | **500,000** |

**Creator A Payout:**
```
(500,000 ÷ 50,000,000) × ₦48,000,000 = ₦480,000
```

---

## 4. Viewshare Calculation (Shorts Pool)

### 4.1 Formula

```
Creator Monthly Payout = (Creator_Qualified_Views ÷ Total_Qualified_Views) × Shorts_Pool
```

### 4.2 Qualified View Definition

| Criteria | Threshold |
|----------|-----------|
| **Watch Time** | ≥3 seconds |
| **Unique User** | 1 view per user per Short per day |
| **Completion** | Not required (short-form) |
| **Excluded** | Creator's own views, bot-detected, <1 sec |

### 4.3 Anti-Gaming Measures

- **Velocity limits:** Max 100 views/user/hour per Short
- **Device fingerprinting:** Deduplicate across devices
- **Referrer validation:** Only Platform-embedded player counts
- **ML detection:** Anomaly scoring (retrain weekly)

---

## 5. Direct Wallet Revenue (Instant Settlement)

### 5.1 Pay-Per-Minute (PPM)

```
Per-Minute Rate = Creator_Set_Rate (₦5–500/min)
Creator Share = Rate × 60% × Minutes_Watched
Platform Share = Rate × 40% × Minutes_Watched
Gateway Fees = Deducted from Gross before split
```

**Wallet Credit:** Real-time (per 30-second heartbeat)

### 5.2 Tips & Glow Gifts

```
Tip Amount = User_Specified
Creator Share = Tip × 80%
Platform Share = Tip × 20%
Gateway Fees = Deducted from Gross before split
```

### 5.3 Creator Memberships

```
Monthly Price = Creator_Set (per tier)
Creator Share = Price × 80% × Active_Subscribers
Platform Share = Price × 20% × Active_Subscribers
Gateway Fees = Deducted from Gross before split
Billing: Monthly on anniversary date
```

### 5.4 Merch (Print-on-Demand)

```
Sale Price = Creator_Set
COGS = Print_Provider_Cost + Shipping
Gross Margin = Sale Price - COGS
Creator Share = Gross Margin × 85%
Platform Share = Gross Margin × 15%
Gateway Fees = Deducted from Sale Price before margin calc
```

### 5.5 Courses & Digital Products

```
Sale Price = Creator_Set
Creator Share = Net Revenue × 80%
Platform Share = Net Revenue × 20%
Net Revenue = Sale Price - Gateway Fees - Taxes
```

### 5.6 Live Events (Ticketed)

```
Ticket Price = Creator_Set
Creator Share = Net Revenue × 80%
Platform Share = Net Revenue × 20%
Net Revenue = Ticket Price - Gateway Fees - Taxes
Refund Window: 24 hrs before event (auto-refund)
```

---

## 6. Multi-Gateway Revenue Attribution

### 6.1 Gateway Mapping

| User Region | Primary Gateway | Currencies | Creator Payout Via |
|-------------|-----------------|------------|-------------------|
| Nigeria | Paystack → Flutterwave | NGN | Paystack Transfer / Flutterwave |
| Ghana | Flutterwave → Paystack | GHS | Flutterwave |
| Kenya | Flutterwave → Paystack | KES | Flutterwave |
| South Africa | Flutterwave → Paystack | ZAR | Flutterwave |
| US/CA/EU/UK/AU | Stripe | USD/EUR/GBP/CAD/AUD | Stripe Connect |
| Rest of World | Stripe → Flutterwave | Local/USD | Stripe Connect / Flutterwave |

### 6.2 Revenue Attribution Rules

1. **User pays via Gateway X** → Revenue attributed to Gateway X bucket
2. **Gateway fees deducted** at source (per gateway rate card)
3. **Net Revenue pooled** by currency bucket
4. **FX conversion** at mid-market + 1% (daily fixing 12:00 WAT)
5. **Creator Wallet** credited in Creator's base currency (NGN default)

### 6.3 Gateway Fee Schedule (Indicative)

| Gateway | Card | Bank Transfer | Mobile Money | Wallet | Settlement |
|---------|------|---------------|--------------|--------|------------|
| **Stripe** | 2.9% + $0.30 | 0.8% (ACH) | N/A | N/A | T+2 / T+7 |
| **Paystack** | 1.5% + ₦100 (cap ₦2,000) | ₦100 | ₦100 | N/A | T+1 |
| **Flutterwave** | 1.4%–3.8% | 1% | 1.5%–2% | 1% | T+1 / T+2 |

*Actual rates per merchant agreement; subject to volume discounts*

---

## 7. Monthly Settlement Process

### 7.1 Timeline

| Day | Activity |
|-----|----------|
| **T+1** | Raw transaction data aggregated |
| **T+2** | Gateway reconciliation (auto-match) |
| **T+3** | Discrepancy resolution (manual) |
| **T+4** | Streamshare/Viewshare computation |
| **T+5** | **Monthly Statement Generated** (PDF + CSV) |
| **T+5** | Wallet balances updated |
| **T+7** | Auto-withdrawal (if enabled) / Manual available |
| **T+10** | Tax certificates issued (WHT) |

### 7.2 Statement Contents

| Section | Details |
|---------|---------|
| **Summary** | Total Net Revenue, Platform Share, Creator Share, Wallet Delta |
| **By Pool** | Main Content, Shorts, Direct (PPM, Tips, Memberships, Merch, etc.) |
| **By Content** | Per-title earnings (minutes, views, rate, payout) |
| **By Gateway** | Stripe, Paystack, Flutterwave — gross, fees, net, FX |
| **By Territory** | Country-level breakdown |
| **Deductions** | Gateway fees, WHT, VAT, chargebacks, refunds, reserves |
| **Tax** | WHT certificates, VAT invoices, 1042-S reference |

### 7.3 Dispute Window

- **14 days** from statement date to raise discrepancies
- Submit via Dashboard → "Dispute Statement"
- Resolution within 10 business days
- Adjusted in next cycle + interest (CBN MPR) if NovaFlix error

---

## 8. Holdbacks & Reserves

### 8.1 Chargeback Reserve

| Metric | Value |
|--------|-------|
| **Reserve %** | 5% of monthly Net Revenue |
| **Holding Period** | 90 days rolling |
| **Release** | Oldest day released daily |
| **Trigger** | Chargeback rate >1% → reserve increases to 10% |

### 8.2 Fraud / Compliance Hold

| Trigger | Hold % | Duration |
|---------|--------|----------|
| Suspicious activity (ML flag) | 100% of flagged Content | Until cleared (max 30 days) |
| Regulatory inquiry | 100% of related revenue | Until resolved |
| Sanctions match | 100% | Indefinite (legal) |

### 8.3 Minimum Payout Thresholds

| Method | Minimum | Frequency |
|--------|---------|-----------|
| Stripe Connect | $10 | Daily (auto) |
| Paystack Transfer | ₦1,000 | Daily (auto) |
| Flutterwave Payout | $10 equiv | Daily (auto) |
| Manual Bank Transfer | ₦10,000 | Monthly (manual) |

---

## 9. Tax Treatment

### 9.1 Nigeria (Primary)

| Tax | Rate | Responsibility | Documentation |
|-----|------|----------------|---------------|
| **Withholding Tax (WHT)** | 5% (individual) / 10% (corporate) | NovaFlix deducts & remits | WHT Credit Note (Form 606) |
| **VAT** | 7.5% | NovaFlix collects & remits | VAT Invoice (FIRS) |
| **CIT** | 30% | Creator (on profit) | Self-assessment |

### 9.2 International (via Stripe Connect)

| Jurisdiction | Form | Rate | Handler |
|--------------|------|------|---------|
| **US** | 1042-S | 30% or treaty | Stripe |
| **EU** | DAC7 Reporting | Varies | Stripe |
| **UK** | SA803 | Treaty | Stripe |
| **Canada** | NR4 | 25% or treaty | Stripe |

### 9.3 Creator Obligations

- Provide **Tax Residency Certificate** for treaty benefits
- Complete **W-8BEN / W-8BEN-E** (US) via Stripe dashboard
- Update tax info within 30 days of change
- Indemnify NovaFlix for tax errors due to incorrect info

---

## 10. Audit Rights

### 10.1 Creator Audit

- **Right:** Annual audit of Creator's revenue records
- **Scope:** Gateway reports, streamshare calc, fee deductions
- **Notice:** 30 days written
- **Cost:** Creator bears (refunded if >5% variance found)
- **Auditor:** Big 4 or approved firm

### 10.2 NovaFlix Audit

- **Right:** Verify Creator's Content ownership, metadata accuracy
- **Notice:** 15 days
- **Cost:** NovaFlix bears

---

## 11. Rate Card Changes

### 11.1 Platform Fee Changes

| Change | Notice | Creator Option |
|--------|--------|----------------|
| Platform % (40/60) | 90 days | Terminate (60 days) |
| Pool Split (80/20) | 90 days | Terminate (60 days) |
| Minimum Thresholds | 60 days | Accept or terminate |
| Gateway Fees | Pass-through (no notice) | N/A |

### 11.2 Creator Rate Changes

- **PPM Rate:** Creator may change anytime (applies to new views)
- **Membership Tiers:** 30-day notice to subscribers
- **Merch Prices:** Anytime (affects new orders)
- **Course/Event Prices:** Anytime (affects new sales)

---

## 12. Reporting API (Technical)

### 12.1 Endpoints (REST)

```
GET /api/v1/creator/revenue/summary?period=2024-05
GET /api/v1/creator/revenue/by-content?period=2024-05
GET /api/v1/creator/revenue/by-gateway?period=2024-05
GET /api/v1/creator/wallet/balance
GET /api/v1/creator/wallet/transactions?from=2024-05-01&to=2024-05-31
GET /api/v1/creator/statements/2024-05 (PDF/CSV)
```

### 12.2 Authentication

- Bearer token (JWT, same as Platform)
- Scope: `creator:revenue:read`
- Rate limit: 100 req/min

---

## 13. Historical Rate Card (For Reference)

| Period | Platform % | Main Pool % | Shorts Pool % | PPM/Tips Creator % | Membership Creator % |
|--------|------------|-------------|---------------|-------------------|---------------------|
| **2024-08 onward (v1.0)** | 40% | 80% | 20% | 60% / 80% | 80% |

*Future versions appended here with effective dates*

---

## 14. Execution

**THIS ADDENDUM IS INCORPORATED BY REFERENCE INTO THE CREATOR PLATFORM AGREEMENT**

**NOVAFLIX:**

```
Success
Chukwu Akachukwu Success
Founder & CEO, NovaFlix
Date: 2024-08-20
```

**CREATOR:**

```
[Creator Digital Signature]
[Creator Legal Name]
Date: [Auto-populated]
```

**ATTESTED BY PARENT COMPANY:**

```
WID Ltd  •  RC 8824091
Motivation Drives Innovation

Authorized by: Chukwu Akachukwu Success
(Founder & CEO, NovaFlix)

Date: 2024-08-20
```

---

*Document ID: NFX-REV-SHARE-ADD-20240820 | Classification: Confidential | Class: B*