export const TIER_PARAMS = {
  student: { min_ppm: 5, max_ppm: 100, multiplier: 0.75, price: 800 },
  basic: { min_ppm: 5, max_ppm: 200, multiplier: 1.0, price: 1500 },
  standard: { min_ppm: 10, max_ppm: 300, multiplier: 1.25, price: 2500 },
  premium: { min_ppm: 20, max_ppm: 500, multiplier: 1.5, price: 5500 }
}

export const GATEWAY_FEES = {
  paystack: 10,
  flutterwave: 20
}

export const MIN_WITHDRAWAL = 10000

export const CONTENT_TYPES = {
  UPLOAD: 'upload',
  SCRAPED: 'scraped',
  YOUTUBE: 'youtube',
  LIVE: 'live',
  SHORTS: 'shorts'
}

export const TRANSACTION_TYPES = {
  PPM_UPLOAD: 'ppm_upload',
  PPM_SCRAPED: 'ppm_scraped',
  PPM_YOUTUBE: 'ppm_youtube',
  PPM_LIVE: 'ppm_live',
  PPM_SHORTS: 'ppm_shorts',
  TIP: 'tip',
  GIFT: 'gift',
  MEMBERSHIP: 'membership',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund'
}