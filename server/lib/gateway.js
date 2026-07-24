const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/payment/success'

// ---- Paystack ----
let _paystack = null
async function getPaystack() {
  if (_paystack) return _paystack
  if (!process.env.PAYSTACK_SECRET_KEY) return null
  try {
    const paystackModule = await import('paystack-api')
    const PaystackAPI = paystackModule.default || paystackModule
    _paystack = new PaystackAPI(process.env.PAYSTACK_SECRET_KEY)
    return _paystack
  } catch { return null }
}

// ---- Flutterwave ----
let _flutterwave = null
async function getFlutterwave() {
  if (_flutterwave) return _flutterwave
  if (!process.env.FLW_SECRET_KEY) return null
  try {
    const Flutterwave = require('flutterwave-node-v3')
    _flutterwave = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY)
    return _flutterwave
  } catch { return null }
}

export async function initializePayment({ gateway, email, amount, reference, callbackUrl, metadata }) {
  if (gateway === 'paystack') {
    const paystack = await getPaystack()
    if (!paystack) return { success: false, error: 'Paystack not configured' }

    const response = await paystack.transaction.initialize({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: callbackUrl || `${CALLBACK_URL}?reference=${reference}`,
      metadata,
    })
    return { success: true, authorization_url: response.data.authorization_url, reference }
  }

  if (gateway === 'flutterwave') {
    const flw = await getFlutterwave()
    if (!flw) return { success: false, error: 'Flutterwave not configured' }

    const response = await flw.Charge.card({
      card_number: '',
      cvv: '',
      expiry_month: '',
      expiry_year: '',
      currency: 'NGN',
      amount,
      email,
      tx_ref: reference,
      redirect_url: callbackUrl || `${CALLBACK_URL}?reference=${reference}`,
      meta: metadata,
    })
    // Flutterwave returns a link for card charge
    if (response.meta && response.meta.authorization && response.meta.authorization.redirect) {
      return { success: true, authorization_url: response.meta.authorization.redirect, reference }
    }
    // Fallback: use Flutterwave standard checkout
    const payload = {
      tx_ref: reference,
      amount,
      currency: 'NGN',
      redirect_url: callbackUrl || `${CALLBACK_URL}?reference=${reference}`,
      customer: { email },
      customizations: { title: 'NovaFlix', logo: 'https://novaflix.app/logo.png' },
      meta: metadata,
    }
    const checkoutRes = await flw.Payment.make(payload)
    if (checkoutRes.status === 'success' && checkoutRes.data && checkoutRes.data.link) {
      return { success: true, authorization_url: checkoutRes.data.link, reference }
    }
    return { success: false, error: 'Failed to initialize Flutterwave payment' }
  }

  return { success: false, error: `Unknown gateway: ${gateway}` }
}

export async function verifyPayment({ gateway, reference }) {
  if (gateway === 'paystack') {
    const paystack = await getPaystack()
    if (!paystack) return { success: false, error: 'Paystack not configured' }

    const response = await paystack.transaction.verify({ reference })
    const txData = response.data
    if (txData.status === 'success') {
      return { success: true, status: 'success', amount: txData.amount / 100 }
    }
    return { success: false, status: txData.status }
  }

  if (gateway === 'flutterwave') {
    const flw = await getFlutterwave()
    if (!flw) return { success: false, error: 'Flutterwave not configured' }

    const response = await flw.Transaction.verify({ id: reference })
    if (response.status === 'success' && response.data.status === 'successful') {
      return { success: true, status: 'success', amount: response.data.amount }
    }
    return { success: false, status: response.data?.status || 'failed' }
  }

  return { success: false, error: `Unknown gateway: ${gateway}` }
}

export function isConfigured(gateway) {
  if (gateway === 'paystack') return !!process.env.PAYSTACK_SECRET_KEY
  if (gateway === 'flutterwave') return !!process.env.FLW_SECRET_KEY
  return false
}
