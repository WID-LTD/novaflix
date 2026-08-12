/// <reference types="vite/client" />

const rawApi = (import.meta.env.VITE_API_BASE as string | undefined) || ''

// Production fallback: if no VITE_API_BASE was set at build time (e.g. missing
// Vercel env var), point API + WS straight at the deployed NovaFlix engine so
// the site never silently loses the server connection.
const PROD_FALLBACK = import.meta.env.PROD ? 'https://novaflix-ecz9.onrender.com' : ''

export const effectiveApi: string = (rawApi || PROD_FALLBACK).replace(/\/+$/, '')
export const API_BASE: string = effectiveApi || '/api'
export const WS_ORIGIN: string = effectiveApi ? new URL(effectiveApi).origin : ''
