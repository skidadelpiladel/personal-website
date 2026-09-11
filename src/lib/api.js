// Simple API helper with CSRF + credentials
let csrfToken = null

export async function getCsrf() {
  const r = await fetch('/api/csrf-token', { credentials: 'include' })
  const j = await r.json()
  csrfToken = j.csrfToken
  return csrfToken
}
export function setCsrf(t) { csrfToken = t }

export async function apiFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  if (csrfToken && opts.method && !['GET', 'HEAD'].includes(opts.method)) {
    headers['x-csrf-token'] = csrfToken
  }
  if (opts.body && !(opts.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(path, {
    credentials: 'include',
    ...opts,
    headers,
  })
  return res
}
export async function getPortfolio() {
  const r = await fetch('/api/portfolio', { credentials: 'include' })
  if (!r.ok) throw new Error('load failed')
  return r.json()
}
