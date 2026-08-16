export const STORE_URLS = {
  android: 'https://play.google.com/store/apps/details?id=com.novaflix.app',
  ios: 'https://apps.apple.com/app/novaflix/id1234567890',
} as const

export function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  return /MacIntel/i.test(navigator.platform || '') && navigator.maxTouchPoints > 1
}

export function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false
  if (isAndroid() || isIOS()) return true
  return /Mobi|Mobile/i.test(navigator.userAgent || '')
}

export function getStoreUrl() {
  return isAndroid() ? STORE_URLS.android : STORE_URLS.ios
}

export function routeToStore() {
  window.location.href = getStoreUrl()
}