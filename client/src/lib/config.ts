/// <reference types="vite/client" />

const rawApi = (import.meta.env.VITE_API_BASE as string | undefined) || ''

export const API_BASE: string = rawApi.replace(/\/+$/, '') || '/api'
export const WS_ORIGIN: string = rawApi ? new URL(rawApi).origin : ''
