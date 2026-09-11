import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch, getCsrf } from '../lib/api'

export default function Login() {
  const [user, setUser] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  useEffect(() => { getCsrf().catch(()=>{}) }, [])

  async function submit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      // ensure csrf fresh
      await getCsrf()
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: user, password: pwd })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Login failed')
      if (j.csrfToken) {
        // store for next requests
        const { setCsrf } = await import('../lib/api')
        setCsrf(j.csrfToken)
      }
      nav('/admin', { replace: true })
    } catch (e) {
      setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#6b6b6e] mb-8">← BACK TO PORTFOLIO</Link>
        <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-7 md:p-8">
          <div className="w-10 h-10 rounded-xl bg-[#D97706] grid place-items-center text-[#0c0c0e] font-bold">◈</div>
          <h1 className="mt-4 font-display font-bold text-[22px] tracking-tight">Admin login</h1>
          <p className="mt-1 text-sm text-[#9f9fa3]">Private — only you can edit. Credentials are checked server-side.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="font-mono text-xs tracking-widest text-[#9f9fa3]">USERNAME</label>
              <input value={user} onChange={e=>setUser(e.target.value)} required autoComplete="username" aria-label="Username" className="mt-1 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3 py-2.5 text-sm focus:border-[#D97706] outline-none" placeholder="weave" />
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest text-[#9f9fa3]">PASSWORD</label>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} required autoComplete="current-password" className="mt-1 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3 py-2.5 text-sm focus:border-[#D97706] outline-none" placeholder="••••••••" />
            </div>
            {err && <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3 py-2 rounded-xl">{err}</div>}
            <button disabled={loading} className="w-full bg-[#D97706] text-[#0c0c0e] font-semibold text-sm py-3 rounded-full hover:bg-[#E89A4D] disabled:opacity-60 transition-colors">
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
