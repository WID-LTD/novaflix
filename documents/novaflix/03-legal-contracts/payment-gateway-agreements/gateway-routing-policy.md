---
title: "Gateway Routing Policy — NovaFlix Multi-Gateway Payment Orchestration"
version: "1.0.0"
date: "2024-08-20"
author: "Chukwu Akachukwu Success"
organization: "NovaFlix / WID Ltd (RC 8824091)"
classification: "Confidential"
class: "Class B"
---

# Gateway Routing Policy

> **Rules and logic for routing payments across Stripe, Paystack, and Flutterwave**

---

## 1. Overview

NovaFlix operates a **multi-gateway payment orchestration layer** that routes each transaction to the optimal gateway based on user geography, currency, payment method, and regulatory requirements.

**Gateways:**
- **Stripe** — Global (US, EU, UK, CA, AU, 40+ countries), USD/EUR/GBP/CAD/AUD + 135 currencies
- **Paystack** — Nigeria, Ghana, South Africa, Kenya (NGN, GHS, ZAR, KES)
- **Flutterwave** — Africa 34 countries + Global (NGN, GHS, KES, ZAR, UGX, XOF, XAF, USD, EUR, GBP)

---

## 2. Routing Decision Matrix

### 2.1 Primary Routing Logic (Priority Order)

```
1. USER COUNTRY (Geo-IP / Billing Address)
   ↓
2. CURRENCY (User Selected / Card Currency)
   ↓
3. PAYMENT METHOD (Card, Bank, Mobile Money, USSD, QR)
   ↓
4. GATEWAY HEALTH (Success Rate, Latency, Availability)
   ↓
5. COST OPTIMIZATION (Gateway Fees, FX Spread)
   ↓
6. REGULATORY (CBN, BoG, CCK, SARB, etc.)
   ↓
7. USER PREFERENCE (Saved Gateway)
```

### 2.2 Country → Default Gateway Mapping

| Country / Region | Primary Gateway | Fallback Gateway | Currency | Notes |
|------------------|-----------------|------------------|----------|-------|
| **Nigeria** | Paystack | Flutterwave | NGN | CBN-licensed, local cards, USSD, bank transfer |
| **Ghana** | Flutterwave | Paystack | GHS | Mobile money (MoMo), GhIPSS |
| **Kenya** | Flutterwave | Paystack | KES | M-Pesa dominant |
| **South Africa** | Flutterwave | Paystack | ZAR | EFT, Ozow, cards |
| **Uganda** | Flutterwave | — | UGX | Mobile money |
| **Rwanda** | Flutterwave | — | RWF | Mobile money |
| **Tanzania** | Flutterwave | — | TZS | Mobile money |
| **Zambia** | Flutterwave | — | ZMW | Mobile money |
| **US** | Stripe | — | USD | Cards, ACH, Apple Pay |
| **Canada** | Stripe | — | CAD | Cards, Interac |
| **UK** | Stripe | — | GBP | Cards, Open Banking |
| **EU (Eurozone)** | Stripe | — | EUR | Cards, SEPA, Bancontact, iDEAL |
| **Australia** | Stripe | — | AUD | Cards, BPAY |
| **Rest of Africa** | Flutterwave | Stripe | Local/USD | 34 countries |
| **Rest of World** | Stripe | Flutterwave | Local/USD | 40+ countries |

---

## 3. Payment Method Routing

### 3.1 Method → Gateway Compatibility

| Payment Method | Stripe | Paystack | Flutterwave | Routing Rule |
|----------------|--------|----------|-------------|--------------|
| **Visa/Mastercard/Amex** | ✅ | ✅ | ✅ | Default to country primary |
| **Verve (Nigeria)** | ❌ | ✅ | ✅ | Paystack > Flutterwave |
| **Bank Transfer (NGN)** | ❌ | ✅ (NIBSS) | ✅ (NIBSS) | Paystack (Nigeria) |
| **Bank Transfer (GHS/KES/ZAR)** | ❌ | ✅ | ✅ | Country primary |
| **USSD (Nigeria)** | ❌ | ✅ | ✅ | Paystack |
| **Mobile Money (MoMo)** | ❌ | ✅ (Ghana) | ✅ (All Africa) | Flutterwave (multi-country) |
| **M-Pesa (Kenya)** | ❌ | ✅ | ✅ | Flutterwave |
| **EFT/Ozow (SA)** | ❌ | ❌ | ✅ | Flutterwave |
| **Apple Pay / Google Pay** | ✅ | ✅ | ✅ | Country primary |
| **QR Code** | ❌ | ✅ | ✅ | Country primary |
| **Barcode (SA)** | ❌ | ❌ | ✅ | Flutterwave |
| **ACH (US)** | ✅ | ❌ | ❌ | Stripe |
| **SEPA (EU)** | ✅ | ❌ | ❌ | Stripe |
| **Bacs (UK)** | ✅ | ❌ | ❌ | Stripe |
| **BPAY (AU)** | ✅ | ❌ | ❌ | Stripe |

---

## 4. Currency Routing

### 4.1 Supported Currencies by Gateway

| Currency | Stripe | Paystack | Flutterwave | Primary |
|----------|--------|----------|-------------|---------|
| **NGN** | ❌ | ✅ | ✅ | Paystack |
| **GHS** | ❌ | ✅ | ✅ | Flutterwave |
| **KES** | ❌ | ✅ | ✅ | Flutterwave |
| **ZAR** | ❌ | ✅ | ✅ | Flutterwave |
| **UGX** | ❌ | ❌ | ✅ | Flutterwave |
| **XOF** | ❌ | ❌ | ✅ | Flutterwave |
| **XAF** | ❌ | ❌ | ✅ | Flutterwave |
| **USD** | ✅ | ❌ | ✅ | Stripe |
| **EUR** | ✅ | ❌ | ✅ | Stripe |
| **GBP** | ✅ | ❌ | ✅ | Stripe |
| **CAD** | ✅ | ❌ | ❌ | Stripe |
| **AUD** | ✅ | ❌ | ❌ | Stripe |
| **135+ others** | ✅ | ❌ | ❌ | Stripe |

### 4.2 FX Conversion Rules

| Scenario | FX Provider | Rate | Settlement |
|----------|-------------|------|------------|
| **Stripe USD → Creator NGN** | Stripe | Mid-market + 1% | NGN to Creator |
| **Paystack NGN → Creator USD** | Paystack | Mid-market + 1.5% | USD to Creator |
| **Flutterwave GHS → Creator NGN** | Flutterwave | Mid-market + 1% | NGN to Creator |
| **Multi-currency wallet** | Per gateway | Per gateway | Native currency |

---

## 5. Health-Based Routing (Dynamic)

### 5.1 Health Metrics (Per Gateway, Per Country)

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Success Rate** | <95% | Deprioritize |
| **Latency (p95)** | >3s | Deprioritize |
| **Error Rate** | >2% | Deprioritize |
| **Maintenance Window** | Scheduled | Pause routing |
| **Incident** | Active | Pause routing |

### 5.2 Health Check Implementation

```javascript
// Runs every 5 minutes per gateway/country
async function checkGatewayHealth(gateway, country) {
  const metrics = await getMetrics(gateway, country, '5m');
  
  if (metrics.successRate < 0.95) {
    await setGatewayStatus(gateway, country, 'degraded');
  }
  if (metrics.latencyP95 > 3000) {
    await setGatewayStatus(gateway, country, 'slow');
  }
  if (metrics.errorRate > 0.02) {
    await setGatewayStatus(gateway, country, 'unhealthy');
  }
}
```

### 5.3 Failover Logic

```
Primary Gateway Unhealthy
  ↓
Check Fallback Gateway Health
  ↓
If Healthy → Route to Fallback
  ↓
If Both Unhealthy → Queue Transaction, Alert On-Call
  ↓
Notify User: "Payment temporarily unavailable, retrying..."
```

---

## 6. Cost Optimization Routing

### 6.1 Fee Comparison (Indicative)

| Route | Gateway Fee | FX Spread | Total Cost | Preferred When |
|-------|-------------|-----------|------------|----------------|
| **Nigeria NGN Card** | Paystack 1.5% | N/A | 1.5% | Always |
| **Nigeria NGN Card** | Flutterwave 1.4% | N/A | 1.4% | If Paystack degraded |
| **Ghana GHS MoMo** | Flutterwave 1.5% | N/A | 1.5% | Always |
| **Kenya KES M-Pesa** | Flutterwave 1.5% | N/A | 1.5% | Always |
| **SA ZAR Card** | Flutterwave 2.9% | N/A | 2.9% | Always |
| **US USD Card** | Stripe 2.9%+$0.30 | N/A | ~3% | Always |
| **EU EUR Card** | Stripe 1.4%+€0.25 | N/A | ~1.5% | Always |
| **Nigeria NGN → Creator USD** | Paystack 1.5% | +1.5% | 3% | If Creator wants USD |
| **Nigeria NGN → Creator USD** | Flutterwave 1.4% | +1% | 2.4% | Preferred for USD payout |

---

## 6. Regulatory Routing (Hard Constraints)

### 6.1 Mandatory Routing Rules

| Regulation | Constraint | Enforcement |
|------------|------------|-------------|
| **CBN (Nigeria)** | Domestic NGN → CBN-licensed PSP only | Paystack/Flutterwave only (not Stripe) |
| **BoG (Ghana)** | Domestic GHS → BoG-licensed PSP | Flutterwave/Paystack |
| **CCK (Kenya)** | Domestic KES → CCK-licensed PSP | Flutterwave/Paystack |
| **SARB (SA)** | Domestic ZAR → SARB-licensed PSP | Flutterwave/Paystack |
| **Data Localization** | Creator KYC stored in-country | Per country gateway |
| **Sanctions** | OFAC/UN/EU lists blocked | All gateways |
| **PEP Screening** | Enhanced due diligence | All gateways |

### 6.2 Cross-Border Restrictions

| From → To | Allowed Gateway | Notes |
|-----------|-----------------|-------|
| **Nigeria → Global** | Stripe (USD), Flutterwave (USD) | Form A >$10k |
| **Ghana → Global** | Flutterwave | BoG reporting |
| **Kenya → Global** | Flutterwave | CCK reporting |
| **SA → Global** | Flutterwave/Stripe | SARB reporting |
| **Global → Nigeria** | Paystack/Flutterwave (NGN) | CBN inbound limits |

---

## 7. User Experience Routing

### 7.1 Checkout Flow

```
User Initiates Payment
  ↓
Detect Country (Geo-IP) + Currency
  ↓
Show Available Methods (per Gateway)
  ↓
User Selects Method
  ↓
Route to Gateway
  ↓
Gateway Checkout (Hosted/Embedded)
  ↓
Webhook → NovaFlix Settlement
```

### 7.2 Saved Gateway Preference

- User can set "Preferred Gateway" in Settings
- Overrides default if gateway supports method/currency
- Respects regulatory constraints

### 7.3 A/B Testing

| Test | Variant A | Variant B | Metric |
|------|-----------|-----------|--------|
| **Default Gateway** | Country Primary | Cheapest | Conversion Rate |
| **Method Order** | Card First | Mobile Money First | Completion Rate |
| **FX Display** | Show FX | Hide FX | Trust/Conversion |

---

## 8. Technical Implementation

### 8.1 Routing Service (Pseudo-Code)

```javascript
class PaymentRouter {
  async routePayment({ user, amount, currency, method, userPreference }) {
    // 1. Determine eligible gateways
    const eligible = this.getEligibleGateways(user.country, currency, method);
    
    // 2. Apply regulatory constraints
    const compliant = eligible.filter(g => this.isRegulatoryCompliant(g, user.country, currency));
    
    // 3. Check health
    const healthy = compliant.filter(g => this.isHealthy(g, user.country));
    
    // 4. Apply user preference
    if (userPreference && healthy.includes(userPreference)) {
      return userPreference;
    }
    
    // 5. Cost optimization
    const cheapest = this.getCheapest(healthy, currency, method);
    
    // 6. Fallback to primary
    return cheapest || this.getPrimary(user.country);
  }
  
  getEligibleGateways(country, currency, method) {
    return GATEWAY_CAPABILITIES
      .filter(g => g.countries.includes(country))
      .filter(g => g.currencies.includes(currency))
      .filter(g => g.methods.includes(method));
  }
}
```

### 8.2 Configuration (Database)

```sql
-- gateway_capabilities table
CREATE TABLE gateway_capabilities (
  gateway VARCHAR(20),           -- 'stripe', 'paystack', 'flutterwave'
  country CHAR(2),               -- ISO 3166-1 alpha-2
  currency CHAR(3),              -- ISO 4217
  method VARCHAR(30),            -- 'card', 'bank_transfer', 'mobile_money', 'ussd', 'qr'
  is_primary BOOLEAN DEFAULT FALSE,
  fee_percent DECIMAL(5,2),
  fee_fixed DECIMAL(10,2),
  fx_spread_percent DECIMAL(3,2),
  settlement_timing VARCHAR(20), -- 'instant', 'T+1', 'T+2'
  regulatory_approved BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'degraded', 'maintenance', 'disabled'
  PRIMARY KEY (gateway, country, currency, method)
);

-- gateway_health table (updated every 5 min)
CREATE TABLE gateway_health (
  gateway VARCHAR(20),
  country CHAR(2),
  success_rate DECIMAL(5,4),
  latency_p95_ms INTEGER,
  error_rate DECIMAL(5,4),
  last_check TIMESTAMP,
  status VARCHAR(20), -- 'healthy', 'degraded', 'slow', 'unhealthy', 'maintenance'
  PRIMARY KEY (gateway, country)
);
```

---

## 9. Monitoring & Alerting

### 9.1 Key Dashboards

| Dashboard | Metrics | Alert Threshold |
|-----------|---------|-----------------|
| **Routing Overview** | Volume per gateway, success rate, latency | Success rate <95% |
| **Cost Analysis** | Fees per gateway, FX cost, total cost | Cost > budget 10% |
| **Failover Events** | Count, duration, impact | >5 failovers/hour |
| **Regulatory Compliance** | Transaction coverage per country | <99% compliant |

### 9.2 Alerts

| Alert | Condition | Channel | Escalation |
|-------|-----------|---------|------------|
| **Gateway Down** | Health = unhealthy | PagerDuty, Slack | On-call eng |
| **High Failover** | >10 failovers/15min | Slack | Payments lead |
| **Cost Spike** | Daily fees > 1.5x avg | Email | Finance |
| **Regulatory Breach** | Non-compliant routing | PagerDuty | Legal + Eng |

---

## 10. Testing & Validation

### 10.1 Test Scenarios

| Scenario | Expected Route | Test Data |
|----------|----------------|-----------|
| **Nigeria User, NGN, Card** | Paystack | NG IP, NGN, Visa |
| **Nigeria User, NGN, USSD** | Paystack | NG IP, NGN, USSD |
| **Ghana User, GHS, MoMo** | Flutterwave | GH IP, GHS, MoMo |
| **Kenya User, KES, M-Pesa** | Flutterwave | KE IP, KES, M-Pesa |
| **US User, USD, Card** | Stripe | US IP, USD, Visa |
| **UK User, GBP, Apple Pay** | Stripe | GB IP, GBP, Apple Pay |
| **Nigeria User, USD, Card** | Stripe | NG IP, USD, Visa |

### 10.2 Chaos Engineering

| Experiment | Frequency | Validation |
|------------|-----------|------------|
| **Kill Primary Gateway** | Monthly | Failover <30s, 0% data loss |
| **Inject Latency** | Weekly | Fallback triggers correctly |
| **Simulate CBN Directive** | Quarterly | Nigeria routing respects constraint |

---

## 11. Audit & Compliance

### 11.1 Routing Audit Log

Every routing decision logged:

```json
{
  "event": "payment_routed",
  "timestamp": "2024-08-20T14:30:00Z",
  "user_id": "uuid",
  "country": "NG",
  "currency": "NGN",
  "method": "card",
  "amount": 5000,
  "eligible_gateways": ["paystack", "flutterwave"],
  "selected_gateway": "paystack",
  "selection_reason": "primary_healthy_lowest_cost",
  "health_snapshot": {
    "paystack": { "success_rate": 0.998, "latency_p95": 450 },
    "flutterwave": { "success_rate": 0.995, "latency_p95": 620 }
  },
  "regulatory_check": "CBN_compliant"
}
```

### 11.2 Quarterly Review

- Routing accuracy vs. optimal cost
- Regulatory compliance verification
- Failover effectiveness
- User experience impact

---

## 12. Execution

**THIS POLICY IS OPERATIONAL — ENFORCED BY PAYMENT ORCHESTRATION LAYER**

**NOVAFLIX:**

```
Success
Chukwu Akachukwu Success
Founder & CEO, NovaFlix
Date: 2024-08-20
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

*Document ID: NFX-GATEWAY-ROUTING-20240820 | Classification: Confidential | Class: B*