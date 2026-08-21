---
title: "Flutterwave Merchant Agreement — NovaFlix"
version: "1.0.0"
date: "2024-08-20"
author: "Chukwu Akachukwu Success"
organization: "NovaFlix / WID Ltd (RC 8824091)"
classification: "Confidential"
class: "Class B"
---

# Flutterwave Merchant Agreement

> **Agreement governing NovaFlix's use of Flutterwave for Africa-wide payments and creator payouts**

---

## 1. Parties

| Party | Role | Details |
|-------|------|---------|
| **NovaFlix** | Merchant / Platform | Subsidiary of WID Ltd (RC 8824091), Lagos, Nigeria |
| **Flutterwave Technology Solutions Limited** | Payment Service Provider | RC 1231618, 8 Providence Street, Lekki Phase 1, Lagos |
| **Flutterwave Inc.** | US Entity | 415 Mission St, San Francisco, CA 94105 |
| **Creators** | Payout Beneficiaries | Individuals/Companies receiving payouts via Flutterwave |

---

## 2. Regulatory Context

### 2.1 Licensing

| License | Jurisdiction | Status | Scope |
|---------|--------------|--------|-------|
| **Switching & Processing** | CBN (Nigeria) | ✅ Active | Card acquiring, switching, transfers |
| **Mobile Money** | CBN (Nigeria) | ✅ Active | Agent banking, wallets |
| **Payment Service Provider** | BoG (Ghana) | ✅ Active | Mobile money, cards, bank |
| **PSP License** | CCK (Kenya) | ✅ Active | M-Pesa, cards, bank |
| **PSP License** | SARB (South Africa) | ✅ Active | Cards, EFT, instant payments |
| **PSP License** | BoU (Uganda) | ✅ Active | Mobile money, cards |
| **PSP License** | BNR (Rwanda) | ✅ Active | Mobile money, cards |
| **PSP License** | BCT (Tanzania) | ✅ Active | Mobile money, cards |
| **PSP License** | BOZ (Zambia) | ✅ Active | Mobile money, cards |
| **Money Transmitter** | US (State licenses) | ✅ Active | Cross-border remittance |
| **EMI License** | UK (FCA) | ✅ Active | E-money, payments |
| **PISP/AISP** | EU (PSD2) | ✅ Active | Open banking |

**NovaFlix Status:** Merchant on Flutterwave platform across enabled countries.

---

## 3. Payment Products by Country

### 3.1 Collection Channels (User → NovaFlix)

| Country | Cards | Mobile Money | Bank Transfer | USSD | QR | Barcode | Apple/Google Pay |
|---------|-------|--------------|---------------|------|----|---------|------------------|
| **Nigeria** | ✅ | ✅ (Paga, OPay, MTN MoMo) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ghana** | ✅ | ✅ (MTN MoMo, Vodafone Cash, AirtelTigo) | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Kenya** | ✅ | ✅ (M-Pesa) | ✅ | ❌ | ✅ | ❌ | ✅ |
| **South Africa** | ✅ | ❌ | ✅ (EFT, Ozow) | ❌ | ✅ | ❌ | ✅ |
| **Uganda** | ✅ | ✅ (MTN, Airtel) | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Rwanda** | ✅ | ✅ (MTN, Airtel) | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Tanzania** | ✅ | ✅ (M-Pesa, Tigo, Airtel) | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Zambia** | ✅ | ✅ (Airtel, MTN) | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Global (USD/EUR/GBP)** | ✅ | ❌ | ✅ (SWIFT) | ❌ | ❌ | ❌ | ✅ |

### 3.2 Payout Channels (NovaFlix → Creator)

| Country | Bank Transfer | Mobile Money | Card Payout |
|---------|---------------|--------------|-------------|
| **Nigeria** | ✅ (NIBSS Instant) | ✅ | ❌ |
| **Ghana** | ✅ (GhIPSS) | ✅ | ❌ |
| **Kenya** | ✅ | ✅ (M-Pesa) | ❌ |
| **South Africa** | ✅ (RTC) | ❌ | ✅ |
| **Uganda** | ✅ | ✅ | ❌ |
| **Rwanda** | ✅ | ✅ | ❌ |
| **Tanzania** | ✅ | ✅ | ❌ |
| **Zambia** | ✅ | ✅ | ❌ |
| **Global** | ✅ (SWIFT) | ❌ | ❌ |

---

## 4. Integration Architecture

### 4.1 API Versioning

- **API Version:** `v3` (current)
- **Base URL:** `https://api.flutterwave.com/v3`
- **Test URL:** `https://api.flutterwave.com/v3` (same, test keys)
- **Encryption:** FLW_ENCRYPTION_KEY for sensitive payloads

### 4.2 Key Endpoints Used

| Operation | Endpoint | Method |
|-----------|----------|--------|
| **Initialize Payment** | `/payments` | POST |
| **Verify Payment** | `/transactions/verify_by_reference` | GET |
| **Charge Card (Tokenized)** | `/payments` | POST (with `token`) |
| **Charge Mobile Money** | `/payments` | POST (with `type: mobile_money`) |
| **Create Transfer** | `/transfers` | POST |
| **Verify Transfer** | `/transfers/{id}` | GET |
| **Bulk Transfers** | `/bulk-transfers` | POST |
| **Banks List** | `/banks/{country}` | GET |
| **Resolve Account** | `/accounts/resolve` | POST |
| **Webhook** | `https://api.nova-flix.com.ng/webhooks/flutterwave` | POST |

### 4.3 Webhook Events

| Event | NovaFlix Action |
|-------|-----------------|
| `charge.completed` | Verify status=successful → credit wallet |
| `charge.failed` | Notify user, log failure reason |
| `transfer.completed` | Confirm Creator payout received |
| `transfer.failed` | Alert Creator, retry |
| `transfer.reversed` | Investigate, notify Creator |
| `subscription.created` | Record Creator membership |
| `subscription.cancelled` | Cancel Creator membership revenue |
| `refund.processed` | Reverse wallet credit |
| `payout.completed` | Batch payout confirmation |

### 4.4 Webhook Security

```javascript
// Flutterwave Signature Verification
const crypto = require('crypto');
const secret = process.env.FLW_SECRET_KEY;

// For v3 webhooks, verify hash
const hash = crypto.createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

if (hash !== req.headers['verif-hash']) {
  return res.status(400).send('Invalid signature');
}
```

- **Retry:** 3 attempts (0min, 5min, 30min)
- **Idempotency:** Store `event.id` + `tx_ref` processed

---

## 5. Revenue Split & Fee Structure

### 5.1 Flutterwave Fees (Indicative — Per Merchant Agreement)

| Channel | Nigeria | Ghana | Kenya | South Africa | Others |
|---------|---------|-------|-------|--------------|--------|
| **Cards (Local)** | 1.4% (cap ₦2,000) | 1.9% | 2.5% | 2.9% | 3.8% |
| **Cards (Intl)** | 3.8% | 3.8% | 3.8% | 3.8% | 3.8% |
| **Mobile Money** | 1.5% | 1.5% | 1.5% (M-Pesa) | N/A | 1.5–2% |
| **Bank Transfer** | ₦100 | 1% | 1% | 1% | 1% |
| **USSD** | 1.5% (cap ₦2,000) | N/A | N/A | N/A | N/A |
| **Transfers (Payouts)** | ₦20–₦50 | 1% | 1% | 1% | 1% |
| **Barcode (SA)** | N/A | N/A | N/A | 1.5% | N/A |

*Volume discounts: >₦500M/mo → custom rates*

### 5.2 NovaFlix Platform Fee (On Top)

| Revenue Type | Platform Fee | Collection Method |
|--------------|--------------|-------------------|
| **Subscriptions** | 40% | Deduced at settlement |
| **PPM / Tips / Glow Gifts** | 40% | Real-time (per transaction) |
| **Memberships** | 20% | Monthly settlement |
| **Merch / Courses / Events** | 20% | Per transaction |
| **Shorts Pool** | 40% (of 60% ecosystem) | Monthly calc |

### 5.3 Multi-Currency Settlement

| User Pays | Creator Base | FX Rate | Settlement |
|-----------|--------------|---------|------------|
| NGN | NGN | 1:1 | NGN |
| GHS | GHS | 1:1 | GHS |
| KES | KES | 1:1 | KES |
| ZAR | ZAR | 1:1 | ZAR |
| USD | NGN | FW mid-market + 1% | NGN |
| EUR | NGN | FW mid-market + 1% | NGN |
| GBP | NGN | FW mid-market + 1% | NGN |

*Creator wallet: Multi-currency balances (NGN, GHS, KES, ZAR, USD, EUR, GBP)*

---

## 6. Creator Onboarding & KYC

### 6.1 Transfer Recipient Creation

```javascript
// Create Transfer Recipient (Bank)
POST /transfers/beneficiaries
{
  "account_bank": "044", // Access Bank Nigeria
  "account_number": "0123456789",
  "beneficiary_name": "Creator Legal Name",
  "currency": "NGN",
  "meta": { "creator_id": "uuid" }
}

// Create Transfer Recipient (Mobile Money)
POST /transfers/beneficiaries
{
  "account_bank": "MPESA", // Kenya
  "account_number": "254712345678", // Phone number
  "beneficiary_name": "Creator Legal Name",
  "currency": "KES"
}
```

### 6.2 Required Creator KYC by Country

| Country | Individual | Company |
|---------|------------|---------|
| **Nigeria** | BVN, NIN, Bank Account, Phone, Email, Gov ID | CAC, TIN, Directors' BVN, Bank Account |
| **Ghana** | Ghana Card, Bank Account, Phone | Registrar General, TIN, Directors' Ghana Card |
| **Kenya** | National ID, KRA PIN, Phone (M-Pesa) | Certificate of Incorporation, KRA PIN |
| **South Africa** | SA ID, Bank Account, Phone | CIPC, SARS Tax, Directors' SA ID |
| **Uganda** | National ID, TIN, Phone | URSB, TIN, Directors' National ID |
| **Rwanda** | National ID, TIN, Phone | RDB, TIN, Directors' National ID |

---

## 7. Settlement & Reconciliation

### 7.1 Settlement Timeline

| Channel | Nigeria | Ghana | Kenya | South Africa | Others |
|---------|---------|-------|-------|--------------|--------|
| **Cards** | T+1 | T+1 | T+1 | T+2 | T+2 |
| **Mobile Money** | Instant | Instant | Instant | N/A | Instant |
| **Bank Transfer** | Instant (NIBSS) | Instant (GhIPSS) | Instant | T+1 (RTC) | T+1 |
| **Payouts** | Instant | Instant | Instant | Instant | T+1 |

### 7.2 Reconciliation Process

| Frequency | Process |
|-----------|---------|
| **Daily** | Auto-match: Flutterwave transactions ↔ NovaFlix records |
| **Weekly** | Failed payouts, chargebacks, FX discrepancies |
| **Monthly** | Full ledger reconciliation, statement generation |

### 7.3 Reports (Flutterwave Dashboard)

| Report | Frequency | Contents |
|--------|-----------|----------|
| **Daily Collections** | Daily | Gross, fees, net, per channel, per country |
| **Monthly Statement** | Monthly | Summary, chargebacks, refunds, FX |
| **Payout Report** | Per batch | Beneficiaries, amounts, status, references |

---

## 8. Dispute & Chargeback Management

### 8.1 Card Chargebacks

| Timeline | Action |
|----------|--------|
| **Day 0** | Chargeback received (Visa/MC) |
| **Day 1** | Flutterwave notifies (webhook `charge.chargeback`) |
| **Day 1–7** | NovaFlix gathers evidence (access logs, TOS, delivery) |
| **Day 7** | Submit via Flutterwave Dashboard |
| **Day 30–45** | Scheme decision |
| **Won** | Funds released |
| **Lost** | Funds deducted, Creator wallet debited |

### 8.2 Mobile Money Disputes

| Type | Resolution |
|------|------------|
| **Failed Delivery** | Auto-reversal (within 24h) |
| **Wrong Recipient** | MNO investigation (48h) |
| **Fraud** | Police report if >$500 equiv |

### 8.3 Thresholds

| Metric | Warning | Action |
|--------|---------|--------|
| **Chargeback Rate** | >0.5% | Alert |
| **Chargeback Rate** | >1% | Reserve 10% |
| **Fraud Rate** | >0.1% | Review |

---

## 9. Compliance & Regulatory

### 9.1 Multi-Jurisdictional

| Country | Regulator | Key Requirement |
|---------|-----------|-----------------|
| **Nigeria** | CBN | BVN, NIN, Transaction limits, SAR |
| **Ghana** | BoG | Ghana Card, Transaction limits |
| **Kenya** | CCK | National ID, KRA PIN, M-Pesa limits |
| **South Africa** | SARB | FICA, KYC, Transaction reporting |
| **Uganda** | BoU | National ID, Transaction limits |
| **Rwanda** | BNR | National ID, Transaction limits |
| **US** | FinCEN | BSA/AML, SAR, CTR >$10k |
| **UK/EU** | FCA/ECB | PSD2, SCA, DAC7, GDPR |

### 9.2 Nigeria Specific (CBN)

| Requirement | Implementation |
|-------------|----------------|
| **BVN Verification** | Mandatory for payouts >₦50k |
| **NIN Linkage** | All accounts |
| **Transaction Limits** | ₦5M/tx (indiv), ₦100M (corp) |
| **Sanctions Screening** | Real-time (Flutterwave + NovaFlix) |
| **SAR Filing** | Auto for suspicious >₦10M |

### 9.3 Data Protection

| Regulation | Scope | Compliance |
|------------|-------|------------|
| **NDPR (Nigeria)** | Nigerian users/creators | DPO, DPIA, 7-yr retention |
| **GDPR (EU)** | EU users/creators | DPA, SCC, 7-yr retention |
| **POPIA (SA)** | SA users/creators | Information Officer, 7-yr |
| **Kenya DPA** | Kenya users/creators | Data Commissioner, 7-yr |

### 9.4 Tax

| Country | WHT on Payouts | VAT on Fees | Filing |
|---------|----------------|-------------|--------|
| **Nigeria** | 5%/10% | 7.5% | Monthly (FIRS) |
| **Ghana** | 5%/15% | 12.5% | Monthly (GRA) |
| **Kenya** | 5%/20% | 16% | Monthly (KRA) |
| **South Africa** | 15%/20% | 15% | Monthly (SARS) |
| **US** | 30%/treaty | N/A | 1042-S (Flutterwave) |

*Flutterwave handles US/EU tax reporting; NovaFlix handles Africa*

---

## 10. Technical Specifications

### 10.1 Keys Management

| Environment | Public Key | Secret Key | Encryption Key |
|-------------|------------|------------|----------------|
| **Test** | `FLWPUBK_TEST_...` | `FLWSECK_TEST_...` | `FLWSECK_TEST...` |
| **Live** | `FLWPUBK_...` | `FLWSECK_...` (HSM) | `FLWSECK_...` |

*Stored in Render env vars / AWS Secrets Manager*

### 10.2 Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| `INSUFFICIENT_FUNDS` | User wallet low | Retry, notify |
| `CARD_DECLINED` | Issuer declined | Generic message |
| `ACCOUNT_NOT_FOUND` | Mobile money invalid | Re-verify phone |
| `BANK_UNAVAILABLE` | Bank down | Retry (max 3) |
| `INVALID_ACCOUNT` | NUBAN/Phone invalid | Re-verify Creator |
| `TRANSFER_FAILED` | Network issue | Retry (max 3), then manual |

### 10.3 Rate Limits

| Endpoint | Limit |
|----------|-------|
| **Payments** | 500/min |
| **Transfers** | 200/min |
| **Verify** | 500/min |
| **Webhooks** | Unlimited |

---

## 11. Service Levels

| Metric | Target |
|--------|--------|
| **API Uptime** | 99.9% |
| **Payment Success** | >95% (cards), >99% (mobile money) |
| **Settlement** | Per country table |
| **Payout Success** | >99% |
| **Support** | 2 hrs (business), 24 hrs (general) |

---

## 12. Liability & Indemnification

### 12.1 Flutterwave Liability

- Cap: 12 months fees (excl. fraud, willful misconduct)
- Force majeure excluded

### 12.2 NovaFlix Indemnifies Flutterwave For

- Merchant fraud, chargebacks
- KYC failures
- Content liability
- Regulatory violations

### 12.3 Flutterwave Indemnifies NovaFlix For

- System failures
- Data breaches (Flutterwave side)
- MNO failures (mobile money)
- Unauthorized transactions (Flutterwave fault)

---

## 13. Term & Termination

| Party | Notice | Effect |
|-------|--------|--------|
| **NovaFlix** | 30 days | Offboard per country |
| **Flutterwave** | Per MSA | Compliance, risk |
| **Regulator** | Immediate | Per country |

### Offboarding (Per Country)

1. Disable new payments
2. Process pending payouts
3. Refund customer balances
4. Close merchant account

---

## 14. Execution

**EXECUTED BY AUTHORIZED SIGNATORIES**

**NOVAFLIX:**

```
Success
Chukwu Akachukwu Success
Founder & CEO, NovaFlix
Date: 2024-08-20
```

**FLUTTERWAVE TECHNOLOGY SOLUTIONS LIMITED:**

```
________________________________________
Authorized Signatory
Flutterwave Technology Solutions Limited
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

*Document ID: NFX-FLUTTERWAVE-MERCHANT-20240820 | Classification: Confidential | Class: B*