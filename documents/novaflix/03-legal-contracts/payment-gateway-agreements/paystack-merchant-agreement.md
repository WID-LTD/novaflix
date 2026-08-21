---
title: "Paystack Merchant Agreement — NovaFlix"
version: "1.0.0"
date: "2024-08-20"
author: "Chukwu Akachukwu Success"
organization: "NovaFlix / WID Ltd (RC 8824091)"
classification: "Confidential"
class: "Class B"
---

# Paystack Merchant Agreement

> **Agreement governing NovaFlix's use of Paystack for Nigeria/Ghana/South Africa/Kenya payments and creator payouts**

---

## 1. Parties

| Party | Role | Details |
|-------|------|---------|
| **NovaFlix** | Merchant / Platform | Subsidiary of WID Ltd (RC 8824091), Lagos, Nigeria |
| **Paystack Payments Limited** | Payment Service Provider | RC 1325247, 5th Floor, 14A Chris Maduike Drive, Lekki Phase 1, Lagos |
| **Creators** | Sub-merchants / Payout Recipients | Individuals/Companies receiving payouts via Paystack Transfers |

---

## 2. Regulatory Context

### 2.1 CBN Licensing

| License | Status | Scope |
|---------|--------|-------|
| **Switching License** | ✅ Active | Interbank switching, card acquiring |
| **PTSP License** | ✅ Active | Payment Terminal Service Provider |
| **Mobile Money License** | ✅ Active | Agent banking, wallet operations |
| **NIBSS Integration** | ✅ Active | Instant transfers, BVN verification |

**NovaFlix Status:** Merchant on Paystack platform — **not** a licensed PSP.

### 2.2 Compliance Obligations (NovaFlix)

| Obligation | Description | Frequency |
|------------|-------------|-----------|
| **KYC** | Collect: CAC cert, TIN, BVN of directors, business address | Onboarding + annual refresh |
| **AML/CFT** | Transaction monitoring, suspicious activity reporting (SAR) | Real-time + monthly |
| **NDPR** | Data protection impact assessment, DPO appointment | Annual |
| **CBN Returns** | Monthly transaction volume, fraud reports | Monthly (Paystack files) |
| **PCI-DSS** | SAQ-A (hosted checkout) | Annual |

---

## 3. Payment Products Enabled

### 3.1 Collection Channels (User → NovaFlix)

| Channel | Nigeria | Ghana | South Africa | Kenya | Fees (Indicative) |
|---------|---------|-------|--------------|-------|-------------------|
| **Card (Visa/MC/ Verve)** | ✅ | ✅ | ✅ | ✅ | 1.5% + ₦100 (cap ₦2,000) |
| **Bank Transfer (Static/Dynamic)** | ✅ | ✅ | ❌ | ❌ | ₦100 flat |
| **USSD** | ✅ | ❌ | ❌ | ❌ | 1.5% (cap ₦2,000) |
| **Mobile Money (MoMo)** | ❌ | ✅ | ❌ | ❌ | 1.5% |
| **QR Code** | ✅ | ✅ | ❌ | ❌ | 1.5% |
| **Apple Pay / Google Pay** | ✅ | ✅ | ✅ | ✅ | Card rate |
| **Bank Account (Direct Debit)** | ✅ | ❌ | ❌ | ❌ | ₦100 |

### 3.2 Payout Channels (NovaFlix → Creator)

| Channel | Nigeria | Ghana | South Africa | Kenya | Fees |
|---------|---------|-------|--------------|-------|------|
| **Paystack Transfers (Bank)** | ✅ | ✅ | ✅ | ✅ | ₦10–₦50 per transfer |
| **Mobile Money** | ❌ | ✅ | ❌ | ✅ | 1% |
| **Card Payout (Visa/MC)** | ❌ | ❌ | ✅ | ❌ | 1.5% |

---

## 4. Integration Architecture

### 4.1 API Versioning

- **API Version:** `2024-01-01` (pinned)
- **Base URL:** `https://api.paystack.co`
- **Test URL:** `https://api.paystack.co` (same, test keys)

### 4.2 Key Endpoints Used

| Operation | Endpoint | Method |
|-----------|----------|--------|
| **Initialize Transaction** | `/transaction/initialize` | POST |
| **Verify Transaction** | `/transaction/verify/{reference}` | GET |
| **Charge Authorization** | `/transaction/charge_authorization` | POST |
| **Create Transfer Recipient** | `/transferrecipient` | POST |
| **Initiate Transfer** | `/transfer` | POST |
| **Verify Transfer** | `/transfer/verify/{reference}` | GET |
| **List Banks** | `/bank` | GET |
| **Resolve Account** | `/bank/resolve` | POST |
| **Webhook** | `https://api.nova-flix.com.ng/webhooks/paystack` | POST |

### 4.3 Webhook Events

| Event | NovaFlix Action |
|-------|-----------------|
| `charge.success` | Verify, credit wallet, record revenue |
| `charge.failed` | Notify user, retry logic |
| `transfer.success` | Confirm Creator payout received |
| `transfer.failed` | Alert Creator, retry (max 3) |
| `transfer.reversed` | Investigate, notify Creator |
| `subscription.create` | Record Creator membership |
| `subscription.disable` | Cancel Creator membership revenue |
| `invoice.create` | Subscription billing |
| `invoice.payment_failed` | Dunning, notify Creator |

### 4.4 Webhook Security

```javascript
// Verification
const crypto = require('crypto');
const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(payload))
  .digest('hex');

if (hash !== req.headers['x-paystack-signature']) {
  return res.status(400).send('Invalid signature');
}
```

- **IP Whitelist:** Paystack IPs (52.31.139.75, 52.49.173.169, 52.214.14.220)
- **Retry:** 3 attempts (immediate, 5min, 30min)
- **Idempotency:** Store `event.id` processed

---

## 5. Revenue Split & Fee Structure

### 5.1 Paystack Fees (Per Merchant Agreement)

| Channel | Fee | Settlement |
|---------|-----|------------|
| **Card (Local)** | 1.5% + ₦100 | T+1 |
| **Card (International)** | 3.8% + ₦100 | T+1 |
| **Bank Transfer** | ₦100 flat | Instant |
| **USSD** | 1.5% (cap ₦2,000) | Instant |
| **Transfers (Payouts)** | ₦10–₦50 | Instant |

*Volume discounts negotiated separately*

### 5.2 NovaFlix Platform Fee (On Top)

| Revenue Type | Platform Fee | Collection Method |
|--------------|--------------|-------------------|
| **Subscriptions** | 40% | Deduced at settlement |
| **PPM / Tips / Glow Gifts** | 40% | Real-time (per transaction) |
| **Memberships** | 20% | Monthly settlement |
| **Merch / Courses / Events** | 20% | Per transaction |
| **Shorts Pool** | 40% (of 60% ecosystem) | Monthly calc |

### 5.3 Settlement Flow

```
User Payment (Paystack)
  ↓
Paystack deducts gateway fee
  ↓
Net Amount → NovaFlix Paystack Account
  ↓
NovaFlix splits:
  - 40% → NovaFlix operating account
  - 60% → Creator ecosystem
    - 80% (48% total) → Main Content wallet
    - 20% (12% total) → Shorts wallet
    - PPM/Tips → Instant wallet credit (60%)
  ↓
Creator Payout (Paystack Transfers)
  ↓
Creator Bank Account (T+0)
```

---

## 6. Creator Onboarding & KYC (Paystack Transfers)

### 6.1 Recipient Creation

```javascript
// Create Transfer Recipient
POST /transferrecipient
{
  "type": "nuban",
  "name": "Creator Legal Name",
  "account_number": "0123456789",
  "bank_code": "044", // Access Bank
  "currency": "NGN"
}

// Response: { recipient_code: "RCP_xxxxx" }
```

### 6.2 Required Creator KYC

| Individual | Company |
|------------|---------|
| Full Legal Name | Company Name (CAC) |
| BVN | RC Number |
| Bank Account (NUBAN) | TIN |
| Phone (verified) | Directors' BVN |
| Email | Authorized Signatory ID |
| Government ID (NIN/Int'l Passport) | CAC Certificate |

### 6.3 Verification Flow

```
NovaFlix collects Creator KYC → Dashboard
  ↓
NovaFlix creates Transfer Recipient (Paystack API)
  ↓
Paystack validates account (NIBSS)
  ↓
Recipient Code stored in creator_profiles.paystack_recipient_code
  ↓
Payouts enabled
```

---

## 6. Settlement & Reconciliation

### 6.1 Settlement Timeline

| Event | Timeline |
|-------|----------|
| **Card/USSD/MoMo** | T+1 (next business day) |
| **Bank Transfer** | Instant (NIBSS) |
| **Payouts (Transfers)** | Instant (NIBSS) |
| **Dispute/Chargeback** | 45 days (card) / 30 days (transfer) |

### 6.2 Reconciliation Process

| Frequency | Process |
|-----------|---------|
| **Daily** | Auto-match: Paystack transactions ↔ NovaFlix records |
| **Weekly** | Manual review: Failed payouts, disputed charges |
| **Monthly** | Full ledger reconciliation, statement generation |

### 6.3 Settlement Report (Paystack Dashboard)

| Report | Frequency | Contents |
|--------|-----------|----------|
| **Daily Settlement** | Daily | Gross, fees, net, per channel |
| **Monthly Statement** | Monthly | Summary, chargebacks, refunds |
| **Payout Report** | Per payout | Recipient, amount, status, reference |

---

## 7. Dispute & Chargeback Management

### 7.1 Card Chargebacks

| Timeline | Action |
|----------|--------|
| **Day 0** | Chargeback received (Visa/MC/ Verve) |
| **Day 1** | Paystack notifies NovaFlix (webhook `charge.dispute.create`) |
| **Day 1–7** | NovaFlix gathers evidence (access logs, TOS, delivery proof) |
| **Day 7** | NovaFlix submits via Paystack Dashboard |
| **Day 30–45** | Scheme decision |
| **Won** | Funds released to NovaFlix |
| **Lost** | Funds deducted, Creator wallet debited |

### 7.2 Transfer Disputes

| Type | Resolution |
|------|------------|
| **Wrong Account** | Paystack reverses (if reported <24h) |
| **Fraud Claim** | Investigation, police report if >₦500k |
| **Duplicate** | Auto-detected, reversed |

### 7.3 Chargeback Thresholds (Paystack)

| Metric | Warning | Action |
|--------|---------|--------|
| **Chargeback Rate** | >0.5% | Email alert |
| **Chargeback Rate** | >1% | Rolling reserve 10% |
| **Fraud Rate** | >0.1% | Account review |

---

## 8. Compliance & Regulatory

### 8.1 CBN Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Transaction Limits** | ₦5M/transaction (individual), ₦10M (corporate) |
| **BVN Verification** | Mandatory for payouts >₦50k |
| **NIN Linkage** | Required for all accounts |
| **Sanctions Screening** | Real-time (Paystack + NovaFlix) |
| **SAR Filing** | Auto for >₦10M suspicious (Paystack files) |

### 8.2 NDPR (Nigeria Data Protection)

| Data | Controller | Lawful Basis | Retention |
|------|------------|--------------|-----------|
| **User Payment Data** | Paystack | Contract | 7 years |
| **Creator KYC** | Paystack + NovaFlix | Legal Obligation | 7 years post-relationship |
| **Transaction Logs** | Joint | Legitimate Interest | 7 years |

### 8.3 Tax (Nigeria)

| Tax | Rate | Collection | Remittance |
|-----|------|------------|------------|
| **WHT (Payouts)** | 5% (indiv) / 10% (corp) | NovaFlix deducts | Monthly (FIRS) |
| **VAT (Fees)** | 7.5% | Paystack adds to fees | Paystack remits |
| **Stamp Duty** | ₦50/transaction >₦10k | Paystack collects | Paystack remits |

---

## 9. Technical Specifications

### 9.1 Keys Management

| Environment | Public Key | Secret Key | Webhook Secret |
|-------------|------------|------------|----------------|
| **Test** | `pk_test_...` | `sk_test_...` | Set in Dashboard |
| **Live** | `pk_live_...` | `sk_live_...` (HSM) | Set in Dashboard |

*Stored in Render environment variables / AWS Secrets Manager*

### 9.2 Error Handling

| Error Code | Meaning | Action |
|------------|---------|--------|
| `insufficient_funds` | User account low | Retry, notify user |
| `card_declined` | Issuer declined | Show generic message |
| `do_not_honor` | Issuer risk | Retry later |
| `expired_card` | Card expired | Ask for new card |
| `invalid_account` | NUBAN invalid | Re-verify Creator bank |
| `transfer_failed` | Bank unavailable | Retry (max 3), then manual |

### 9.3 Rate Limits

| Endpoint | Limit |
|----------|-------|
| **Initialize** | 200/min |
| **Verify** | 200/min |
| **Transfers** | 100/min |
| **Webhooks** | Unlimited (recommended <1000/min) |

---

## 9. Nigeria-Specific Features

### 9.1 NIBSS Instant Payments

- **Availability:** 24/7/365
- **Limit:** ₦10M/transaction (individual), ₦100M (corporate)
- **Settlement:** Real-time (seconds)

### 9.2 BVN Verification

```javascript
// Verify BVN
POST /verification/bvn
{
  "bvn": "12345678901",
  "first_name": "John",
  "last_name": "Doe"
}
```

### 9.3 Account Resolution

```javascript
// Verify bank account before payout
POST /bank/resolve
{
  "account_number": "0123456789",
  "bank_code": "044"
}
// Returns: { account_name: "John Doe", account_number: "0123456789" }
```

### 9.4 Recurring Payments (Subscriptions)

- **Paystack Subscriptions API** for Creator memberships
- **Authorization:** Reusable token (`authorization_code`)
- **Retry Logic:** 3 attempts (Day 0, 3, 7) with email notification

---

## 10. Service Levels

| Metric | Target |
|--------|--------|
| **API Uptime** | 99.9% |
| **Transaction Success** | >95% (cards), >99% (transfers) |
| **Settlement** | T+1 (cards), Instant (transfers) |
| **Support Response** | 2 hrs (business), 24 hrs (general) |
| **Dispute Resolution** | 7 days evidence submission |

---

## 11. Liability & Indemnification

### 11.1 Paystack Liability

- Cap: 12 months fees (excluding fraud, willful misconduct)
- Force majeure excluded

### 11.2 NovaFlix Indemnifies Paystack For

- Merchant fraud, chargebacks
- KYC failures
- Regulatory violations (Nigeria)
- Content liability

### 11.3 Paystack Indemnifies NovaFlix For

- System failures
- Data breaches (Paystack side)
- Unauthorized transactions (Paystack fault)
- NIBSS downtime (force majeure)

---

## 12. Term & Termination

| Party | Notice | Effect |
|-------|--------|--------|
| **NovaFlix** | 30 days | Offboard, settle |
| **Paystack** | Per MSA | Compliance, risk |
| **CBN Directive** | Immediate | Regulatory |

### Offboarding

1. Disable new payments
2. Process pending payouts
3. Refund customer balances
4. Close merchant account

---

## 13. Execution

**EXECUTED BY AUTHORIZED SIGNATORIES**

**NOVAFLIX:**

```
Success
Chukwu Akachukwu Success
Founder & CEO, NovaFlix
Date: 2024-08-20
```

**PAYSTACK PAYMENTS LIMITED:**

```
________________________________________
Authorized Signatory
Paystack Payments Limited
Date: _______________
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

*Document ID: NFX-PAYSTACK-MERCHANT-20240820 | Classification: Confidential | Class: B*