import fetch from 'node-fetch';
import crypto from 'crypto';

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseUrl = 'https://api.paystack.co';
  }

  async request(method, path, body = null) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return response.json();
  }

  async listBanks() {
    return this.request('GET', '/bank?country=nigeria&perPage=200');
  }

  async resolveAccount(accountNumber, bankCode) {
    return this.request('POST', '/bank/resolve', { account_number: accountNumber, bank_code: bankCode });
  }

  async createRecipient({ name, accountNumber, bankCode }) {
    return this.request('POST', '/transferrecipient', {
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    });
  }

  async initiateTransfer({ amount, recipient, reason }) {
    return this.request('POST', '/transfer', {
      source: 'balance',
      amount: amount * 100, // kobo
      recipient,
      reason
    });
  }

  async verifyTransfer(reference) {
    return this.request('GET', `/transfer/verify/${reference}`);
  }
}

class FlutterwaveService {
  constructor() {
    this.secretKey = process.env.FLW_SECRET_KEY;
    this.baseUrl = 'https://api.flutterwave.com/v3';
  }

  async request(method, path, body = null) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return response.json();
  }

  async listBanks(country = 'NG') {
    return this.request('GET', `/banks?country=${country}`);
  }

  async resolveAccount(accountNumber, bankCode) {
    return this.request('POST', '/accounts/resolve', {
      account_number: accountNumber,
      account_bank: bankCode,
      currency: 'NGN'
    });
  }

  async createBeneficiary({ accountBank, accountNumber, beneficiaryName }) {
    return this.request('POST', '/transfers/beneficiaries', {
      account_bank: accountBank,
      account_number: accountNumber,
      beneficiary_name: beneficiaryName,
      currency: 'NGN'
    });
  }

  async initiateTransfer({ amount, accountBank, accountNumber, beneficiaryName, reference }) {
    return this.request('POST', '/transfers', {
      account_bank: accountBank,
      account_number: accountNumber,
      amount,
      currency: 'NGN',
      beneficiary_name: beneficiaryName,
      reference
    });
  }

  async verifyTransfer(id) {
    return this.request('GET', `/transfers/${id}`);
  }
}

// Keyword tokenization for bank name matching
function tokenizeName(name) {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function keywordMatch(inputName, bankName) {
  if (!inputName || !bankName) return false;
  
  const inputTokens = new Set(tokenizeName(inputName));
  const bankTokens = new Set(tokenizeName(bankName));
  
  if (inputTokens.size === 0) return false;
  
  let overlap = 0;
  for (const token of inputTokens) {
    if (bankTokens.has(token)) overlap++;
  }
  
  // Match if ≥50% of input tokens found in bank name, OR ≥2 tokens match
  const matchRatio = overlap / inputTokens.size;
  return matchRatio >= 0.5 || overlap >= 2;
}

export const paystackService = new PaystackService();
export const flutterwaveService = new FlutterwaveService();
export { keywordMatch, tokenizeName };