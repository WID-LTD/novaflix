import fetch from 'node-fetch';
import crypto from 'crypto';

class PersonaService {
  constructor() {
    this.apiKey = process.env.PERSONA_API_KEY;
    this.templateId = process.env.PERSONA_TEMPLATE_ID;
    this.envId = process.env.PERSONA_ENV_ID;
    this.webhookSecret = process.env.PERSONA_WEBHOOK_SECRET;
    this.baseUrl = 'https://api.withpersona.com/api/v1';
    this.version = '2023-01-05';
  }

  isConfigured() {
    return !!(this.apiKey && this.templateId && this.envId);
  }

  getClientConfig() {
    return {
      templateId: this.templateId,
      environmentId: this.envId,
      apiKey: this.apiKey // for server-side only
    };
  }

  async createInquiry({ referenceId, fields = {} }) {
    if (!this.isConfigured()) {
      throw new Error('Persona not configured - set PERSONA_API_KEY, PERSONA_TEMPLATE_ID, PERSONA_ENV_ID');
    }

    const payload = {
      data: {
        attributes: {
          'inquiry-template-id': this.templateId,
          'reference-id': referenceId,
          fields: {
            'name-first': fields.firstName || '',
            'name-last': fields.lastName || '',
            'birthdate': fields.dob || '',
            'email-address': fields.email || '',
            'phone-number': fields.phone || ''
          }
        }
      }
    };

    const response = await fetch(`${this.baseUrl}/inquiries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Persona-Version': this.version,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Persona API error: ${data.errors?.[0]?.detail || response.statusText}`);
    }
    return data.data;
  }

  async getInquiry(inquiryId) {
    const response = await fetch(`${this.baseUrl}/inquiries/${inquiryId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Persona-Version': this.version
      }
    });
    return response.json();
  }

  verifyWebhook(payload, signature) {
    if (!this.webhookSecret) return false;
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  parseWebhookEvent(rawBody, signature) {
    if (!this.verifyWebhook(rawBody, signature)) {
      throw new Error('Invalid webhook signature');
    }
    return JSON.parse(rawBody);
  }

  // Get frontend SDK config
  getFrontendConfig() {
    return {
      templateId: this.templateId,
      environmentId: this.envId
    };
  }
}

export const personaService = new PersonaService();