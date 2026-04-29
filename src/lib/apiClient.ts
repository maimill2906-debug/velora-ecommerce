export type ApiErrorPayload = {
  message?: string
  error?: string
  errors?: unknown
}

const DEFAULT_BASE = 'http://localhost:9999'

export function getApiBaseUrl(): string {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  return (base && base.trim()) || DEFAULT_BASE
}

export function getAuthToken(): string | null {
  return localStorage.getItem('velora_token')
}

export function setAuthToken(token: string | null) {
  if (!token) localStorage.removeItem('velora_token')
  else localStorage.setItem('velora_token', token)
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const base = getApiBaseUrl()
  const url = path.startsWith('http') ? path : `${base}${path}`

  const headers = new Headers(opts.headers || {})
  headers.set('Content-Type', 'application/json')

  if (opts.auth) {
    const token = getAuthToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, { ...opts, headers })
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = (isJson ? await res.json() : await res.text()) as any

  if (!res.ok) {
    const msg =
      (payload && (payload.message || payload.error)) ||
      `HTTP ${res.status}`

    if (opts.auth && res.status === 401) {
      // If token is missing/invalid/expired, clear and redirect to login
      const m = String((payload && (payload.message || payload.error)) || '')
      if (m === 'missing_token' || m === 'invalid_token') {
        try {
          setAuthToken(null)
        } catch {
          // ignore storage errors
        }
        try {
          const cur = `${window.location.pathname}${window.location.search}`
          if (!cur.startsWith('/login')) {
            window.location.href = `/login?next=${encodeURIComponent(cur)}`
          }
        } catch {
          // ignore redirect errors
        }
      }
    }
    throw new Error(msg)
  }
  return payload as T
}

