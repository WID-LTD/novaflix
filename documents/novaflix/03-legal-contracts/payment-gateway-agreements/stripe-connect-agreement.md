---
title: "Stripe Connect Agreement — NovaFlix"
version: "1.0.0"
date: "2024-08-20"
author: "Chukwu Akachukwu Success"
organization: "NovaFlix / WID Ltd (RC 8824091)"
classification: "Confidential"
class: "Class B"
---

# Stripe Connect Agreement

> **Agreement governing NovaFlix's use of Stripe Connect for global payments and creator payouts**

---

## 1. Parties

| Party | Role | Details |
|-------|------|---------|
| **NovaFlix** | Platform / Connected Account Owner | Subsidiary of WID Ltd (RC 8824091), Lagos, Nigeria |
| **Stripe, Inc.** | Payment Processor | 510 Townsend St, San Francisco, CA 94103, USA |
| **Stripe Payments Europe, Ltd.** | EU Processor | 1 Grand Canal Street Lower, Dublin 2, Ireland |
| **Creators** | Connected Accounts | Individuals/Companies onboarding via NovaFlix |

---

## 2. Scope & Structure

### 2.1 Connect Model: **Standard / Express / Custom**

| Model | Description | NovaFlix Choice |
|-------|-------------|-----------------|
| **Standard** | Creator has full Stripe dashboard | ✅ Primary (global creators) |
| **Express** | Branded onboarding, limited dashboard | ✅ Secondary (Nigeria/Africa) |
| **Custom** | NovaFlix builds entire UI | ❌ Not used |

**Default:** **Standard** for global creators; **Express** for Nigeria/Ghana/Kenya/South Africa.

### 2.2 Account Types

| Account Type | Use Case | KYC Level |
|--------------|----------|-----------|
| **Individual** | Solo creators | Standard |
| **Company** | Production companies, studios | Enhanced |
| **Non-Profit** | NGOs, film collectives | Standard |

---

## 3. Platform Responsibilities (NovaFlix)

### 3.1 Onboarding

| Step | NovaFlix Action | Stripe Action |
|------|-----------------|---------------|
| 1. Invite | Generate OAuth link / Account Link | — |
| 2. KYC | Collect: legal name, DOB, address, tax ID, bank account | Verify identity, sanctions screening |
| 3. Activation | Confirm `charges_enabled=true`, `payouts_enabled=true` | Enable processing |
| 4. Ongoing | Monitor `requirements.currently_due`, `requirements.eventually_due` | Request additional info |

### 3.2 Compliance Obligations

| Obligation | Frequency | Details |
|------------|-----------|---------|
| **KYC/AML** | Continuous | Stripe handles; NovaFlix monitors webhooks |
| **Sanctions Screening** | Real-time | Stripe OFAC/SDN lists |
| **DAC7 Reporting** | Annual (EU) | Stripe auto-generates for EU creators |
| **1099-K / 1042-S** | Annual (US) | Stripe Connect handles |
| **Nigeria WHT** | Monthly | NovaFlix deducts & remits (Stripe doesn't) |
| **PCI-DSS** | Annual | SAQ-A (NovaFlix never touches card data) |

### 3.3 Platform Fees (Application Fees)

| Transaction Type | Fee Collection | Formula |
|------------------|----------------|---------|
| **Subscriptions** | `application_fee_amount` on each invoice | `amount × 40%` (platform) + gateway fees |
| **One-time (PPM, Tips, Merch, Courses, Events)** | `application_fee_amount` on each PaymentIntent | `amount × 40%` (platform) + gateway fees |
| **Memberships** | `application_fee_amount` on recurring | `amount × 20%` (platform) + gateway fees |
| **Refunds** | `application_fee_amount` refunded pro-rata | Automatic |

---

## 4. Creator (Connected Account) Terms

### 4.1 Creator Agreement with Stripe

Each Creator accepts **Stripe Connected Account Agreement** during onboarding, covering:
- Stripe Services Agreement
- Issuing Cardholder Agreement (if using Stripe Issuing)
- Capital Terms (if using Stripe Capital)
- Tax Reporting Consent (W-8BEN/W-9, DAC7)

### 4.2 Creator Payout Schedule

| Region | Payout Schedule | Minimum | Currency |
|--------|-----------------|---------|----------|
| **US** | Daily rolling (T+2) | $1 | USD |
| **EU/UK** | Daily rolling (T+3) | €1/£1 | EUR/GBP |
| **Canada** | Daily rolling (T+3) | $1 | CAD |
| **Australia** | Daily rolling (T+3) | $1 | AUD |
| **Nigeria (via Express)** | Daily rolling (T+1) | ₦1,000 | NGN |
| **Other** | Weekly / Monthly | $10 equiv | Local/USD |

### 4.3 Reserve Policies

| Reserve Type | Trigger | Amount | Release |
|--------------|---------|--------|---------|
| **Rolling Reserve** | High risk / new account | 10% of volume | 90 days rolling |
| **Fixed Reserve** | Dispute spike | Fixed amount | Per Stripe review |
| **Chargeback Reserve** | Chargeback rate >0.75% | Variable | Per Stripe review |

---

## 5. Payment Flow Architecture

### 5.1 Subscription Flow (Stripe Billing)

```
User → NovaFlix Checkout → Stripe Checkout Session
  ↓
PaymentIntent (setup_future_usage=off_session)
  ↓
Subscription Created (customer, price, application_fee_percent=40)
  ↓
Invoice → PaymentIntent → Charge Succeeded
  ↓
Webhook: invoice.payment_succeeded
  → NovaFlix: Record revenue, credit creator wallet (48% main / 12% shorts)
  → Stripe: Platform fee to NovaFlix Stripe account, Creator share to Connected Account
```

### 5.2 One-Time Payment Flow (PPM, Tips, Merch, Courses, Events)

```
User → NovaFlix Checkout → PaymentIntent
  (amount, currency, application_fee_amount, transfer_data[destination=creator_account_id])
  ↓
Charge Succeeded
  ↓
Webhook: payment_intent.succeeded
  → NovaFlix: Credit creator wallet (instant for PPM/Tips)
  → Stripe: Automatic transfer to Connected Account (net of platform fee)
```

### 5.3 Multi-Currency Handling

| Scenario | Handling |
|----------|----------|
| **User pays USD, Creator NGN** | Stripe FX at mid-market + 1% → NGN to Creator |
| **User pays EUR, Creator USD** | Stripe FX → USD to Creator |
| **Multiple currencies in wallet** | Separate balances per currency |

---

## 6. Webhook Events & Handling

### 6.1 Critical Events

| Event | NovaFlix Action |
|-------|-----------------|
| `account.updated` | Check `requirements`, `capabilities`, `settings.payouts.schedule` |
| `account.application.deauthorized` | Revoke Creator access, settle wallet |
| `payment_intent.succeeded` | Credit wallet, record transaction |
| `payment_intent.payment_failed` | Notify user, retry logic |
| `charge.refunded` | Reverse wallet credit, adjust revenue |
| `charge.dispute.created` | Freeze disputed amount, notify Creator |
| `charge.dispute.closed` | Release/settle per outcome |
| `payout.paid` | Confirm Creator received funds |
| `payout.failed` | Alert Creator, retry |
| `invoice.payment_succeeded` | Subscription revenue recognition |
| `customer.subscription.updated` | Plan changes, proration |
| `customer.subscription.deleted` | Cancel Creator membership revenue |
| `radar.early_fraud_warning` | Review, potentially block |

### 6.2 Webhook Security

- **Endpoint:** `https://api.nova-flix.com.ng/webhooks/stripe`
- **Signature Verification:** `Stripe-Signature` header + webhook secret
- **Retry:** Exponential backoff (5 attempts over 24h)
- **Idempotency:** Process `event.id` once (store in `processed_webhooks` table)

---

## 7. Dispute & Chargeback Management

### 7.1 Dispute Flow

```
Charge Dispute Created
  ↓
Stripe holds funds (dispute.amount)
  ↓
NovaFlix:
  - Freezes equivalent in Creator wallet
  - Notifies Creator (Dashboard + Email)
  - Collects evidence (delivery proof, access logs, TOS acceptance)
  ↓
NovaFlix submits evidence via Stripe Dashboard/API
  ↓
Stripe/Network decides
  ↓
WON: Funds released to Creator wallet
LOST: Funds permanently deducted, Creator wallet debited
```

### 7.2 Evidence Collection (Automated)

| Evidence Type | Source | Auto-Attached |
|---------------|--------|---------------|
| **Access Logs** | `watch_history` table | ✅ |
| **Subscription Proof** | `creator_memberships` table | ✅ |
| **Content Delivery** | CDN logs (Cloudflare) | ✅ |
| **TOS Acceptance** | User agreement timestamp | ✅ |
| **Communication** | In-app messages | ✅ |

### 7.3 Chargeback Thresholds

| Metric | Warning | Action |
|--------|---------|--------|
| **Dispute Rate** | >0.5% | Email Creator, review |
| **Dispute Rate** | >0.75% | Rolling reserve 10% |
| **Dispute Rate** | >1% | Account review, potential deactivation |
| **Fraud Rate** | >0.1% | Immediate review, Radar rules |

---

## 8. Tax & Regulatory

### 8.1 US Tax Reporting

| Form | Recipient | Threshold | Stripe Role |
|------|-----------|-----------|-------------|
| **1099-K** | US Creators | $600+ gross | Auto-generated |
| **1042-S** | Non-US Creators (US income) | Any | Auto-generated |
| **W-8BEN/BEN-E** | Non-US Creators | Required | Collected at onboarding |

### 8.2 EU DAC7 Reporting

| Requirement | Details |
|-------------|---------|
| **Reportable Platform** | Yes (digital platform) |
| **Reportable Sellers** | EU tax resident Creators |
| **Data Collected** | Identity, tax ID, VAT, revenue, fees, quarter |
| **Filing** | Annual by Jan 31 (Stripe handles) |

### 8.3 Nigeria Tax

| Tax | Rate | Collection | Filing |
|-----|------|------------|--------|
| **WHT** | 5% (indiv) / 10% (corp) | NovaFlix deducts at payout | Monthly Form 606 |
| **VAT** | 7.5% | NovaFlix collects from users | Monthly VAT return |

*Stripe does not handle Nigerian WHT/VAT — NovaFlix manages*

---

## 9. Security & Compliance

### 9.1 PCI-DSS

- **NovaFlix SAQ:** SAQ-A (fully hosted checkout, no card data touch)
- **Stripe:** PCI Level 1 Service Provider
- **Annual:** Attestation of Compliance (AOC) from Stripe

### 9.2 Data Protection

| Data | Controller | Processor | DPA |
|------|------------|-----------|-----|
| **User Payment Data** | Stripe | — | Stripe DPA |
| **Creator KYC Data** | Stripe | NovaFlix (limited) | Stripe DPA + NovaFlix addendum |
| **Transaction Data** | Joint | — | Stripe DPA |

### 9.3 Fraud Prevention (Stripe Radar)

| Rule | Action |
|------|--------|
| **Block** | Known bad cards, high-risk countries (OFAC) |
| **Review** | Velocity, amount anomalies, new device |
| **Allow** | Verified Creators, repeat users |
| **3DS** | Required for EU (SCA), optional elsewhere |

---

## 10. Financial Terms

### 10.1 Stripe Fees (Indicative — Per Merchant Agreement)

| Transaction | Stripe Fee |
|-------------|------------|
| **Cards (US)** | 2.9% + $0.30 |
| **Cards (International)** | +1% |
| **Cards (EU/UK)** | 1.4% + £0.20 / 1.4% + €0.25 |
| **ACH** | 0.8% (cap $5) |
| **Connect Fee** | $2/month per active Connected Account (Standard) |
| **Instant Payouts** | 1.5% (US) |
| **FX Conversion** | Mid-market + 1% |

*Actual rates per signed Stripe Merchant Agreement*

### 10.2 NovaFlix Platform Fee (On Top of Stripe)

| Revenue Type | Platform Fee | Collected Via |
|--------------|--------------|---------------|
| **Subscriptions** | 40% | `application_fee_percent=40` |
| **PPM / Tips / Merch / Courses / Events** | 40% | `application_fee_amount` |
| **Memberships** | 20% | `application_fee_percent=20` |
| **Shorts Pool** | 40% (of 60% ecosystem) | Monthly calc |

---

## 11. Term & Termination

### 11.1 Term

- **Effective:** Upon Stripe account approval
- **Term:** Perpetual unless terminated

### 11.2 Termination

| Party | Notice | Effect |
|-------|--------|--------|
| **NovaFlix** | 30 days | Offboard Creators, settle wallets |
| **Stripe** | Per MSA | Compliance, risk, breach |
| **Creator** | Immediate (deauthorize) | `account.application.deauthorized` webhook |

### 11.3 Offboarding Process

1. Creator clicks "Disconnect Stripe" in Dashboard
2. Stripe sends `account.application.deauthorized`
3. NovaFlix:
   - Disables Creator monetization
   - Processes final wallet payout (T+7)
   - Archives Creator data (NDPR retention)
   - Revokes API keys

---

## 12. Liability & Indemnification

### 12.1 Stripe Liability

- Per Stripe Services Agreement
- Cap: 12 months fees (excluding fraud, willful misconduct)

### 12.2 NovaFlix Indemnifies Stripe For

- Creator fraud, chargebacks
- NovaFlix platform defects
- Regulatory violations (Nigeria)
- IP infringement by Creators

### 12.3 Stripe Indemnifies NovaFlix For

- Stripe system failures
- Data breaches (Stripe side)
- Unauthorized transactions (Stripe fault)

---

## 13. Service Levels

| Metric | Target |
|--------|--------|
| **API Uptime** | 99.99% |
| **Checkout Latency** | <500ms p95 |
| **Payout Reliability** | 99.9% |
| **Webhook Delivery** | 99.9% (with retry) |
| **Support Response** | 4 hrs (business), 24 hrs (general) |

---

## 14. Nigeria-Specific Considerations

### 13.1 CBN Compliance

- Stripe not licensed by CBN — used for **cross-border** only
- **Domestic NGN payments:** Paystack / Flutterwave (CBN-licensed)
- **Stripe NGN:** Not available (Stripe doesn't support NGN acquiring)

### 13.2 FX Repatriation

- Creator USD earnings → Stripe → SWIFT to Nigerian bank
- **Form A** required for >$10,000 (bank handles)
- **Certificate of Capital Importation (CCI):** For foreign investment

### 13.3 Data Localization

- Creator KYC data: Stripe stores in US/EU
- NovaFlix mirrors minimal data in Nigeria (Neon PG)
- NDPR: Cross-border transfer clause in DPA

---

## 14. Integration Specifications (Technical)

### 14.1 API Versions

- **Stripe API:** `2024-06-20` (pinned)
- **Connect Onboarding:** `/v1/account_links`, `/v1/accounts`
- **Webhooks:** `account`, `payment_intent`, `invoice`, `payout`, `dispute`

### 14.2 Keys Management

| Environment | Publishable Key | Secret Key | Webhook Secret |
|-------------|-----------------|------------|----------------|
| **Development** | `pk_test_...` | `sk_test_...` | `whsec_test_...` |
| **Staging** | `pk_test_...` | `sk_test_...` | `whsec_test_...` |
| **Production** | `pk_live_...` | `sk_live_...` (HSM) | `whsec_live_...` |

*Keys stored in AWS Secrets Manager / Render environment variables*

### 14.3 Idempotency

- All mutating calls: `Idempotency-Key` header (UUID v4)
- Stored 24h; retry safe

---

## 15. Execution

**EXECUTED BY AUTHORIZED SIGNATORIES**

**NOVAFLIX:**

```
Success
Chukwu Akachukwu Success
Founder & CEO, NovaFlix
Date: 2024-08-20
```

**STRIPE, INC.:**

```
________________________________________
Authorized Signatory
Stripe, Inc.
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

*Document ID: NFX-STRIPE-CONNECT-20240820 | Classification: Confidential | Class: B*