import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch, getCsrf, setCsrf } from '../lib/api'

function Field({ label, value, onChange, textarea, placeholder }) {
  return (
    <div>
      <label className="font-mono text-xs tracking-widest text-[#9f9fa3]">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} className="mt-1 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3 py-2.5 text-sm focus:border-[#6b6b6e] outline-none resize-y" />
      ) : (
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3 py-2.5 text-sm focus:border-[#6b6b6e] outline-none" />
      )}
    </div>
  )
}

export default function Admin() {
  const nav = useNavigate()
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const csrf = await getCsrf()
        setCsrf(csrf)
        const meRes = await apiFetch('/api/auth/me')
        const me = await meRes.json()
        if (!me.authenticated) { nav('/login', { replace: true }); return }
        if (me.csrfToken) setCsrf(me.csrfToken)
        const r = await apiFetch('/api/portfolio')
        const j = await r.json()
        if (!cancelled) { setData(j); setLoading(false) }
      } catch (e) {
        nav('/login', { replace: true })
      }
    }
    init()
    return () => { cancelled = true }
  }, [nav])

  async function save() {
    setSaving(true); setMsg('')
    try {
      const r = await apiFetch('/api/portfolio', { method: 'PUT', body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Save failed')
      setData(j.data)
      setMsg('Saved ✓')
      setTimeout(()=>setMsg(''), 2500)
    } catch (e) {
      setMsg(e.message)
    } finally { setSaving(false) }
  }

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    nav('/login', { replace: true })
  }

  async function handleUpload(file, onUrl) {
    if (!file) return
    if (file.size > 2*1024*1024) { alert('Max 2MB'); return }
    const fd = new FormData()
    fd.append('image', file)
    const r = await apiFetch('/api/upload', { method: 'POST', body: fd })
    const j = await r.json()
    if (!r.ok) { alert(j.error || 'Upload failed'); return }
    onUrl(j.url)
  }

  if (loading) return <div className="min-h-screen bg-[#0c0c0e] grid place-items-center text-[#9f9fa3] font-mono text-sm">Loading dashboard…</div>
  if (!data) return null

  const tabs = [
    ['overview', 'Overview'],
    ['portfolio', 'Portfolio'],
    ['projects', 'Projects'],
    ['highlights', 'Highlights'],
    ['contact', 'Contact'],
  ]

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white">
      {/* top bar */}
      <header className="sticky top-0 z-40 bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-[#1e1e20]">
        <div className="max-w-[1160px] mx-auto px-6 h-[64px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#facc15] text-[#0c0c0e] grid place-items-center font-mono text-sm font-bold">◈</span>
            <span className="font-display font-semibold text-sm">Admin</span>
            <span className="hidden sm:inline font-mono text-xs text-[#6b6b6e]">— private</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden sm:inline-flex text-xs font-mono tracking-wide text-[#9f9fa3] hover:text-white border border-[#252529] px-3 py-2 rounded-full">View site →</Link>
            <button onClick={logout} className="bg-white text-[#0c0c0e] font-semibold text-xs px-4 py-2 rounded-full hover:bg-[#facc15]">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1160px] mx-auto px-6 py-6 md:py-8">
        {/* tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map(([k,label]) => (
            <button key={k} onClick={()=>setTab(k)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold font-mono tracking-wide border ${tab===k ? 'bg-[#facc15] text-[#0c0c0e] border-[#facc15]' : 'bg-[#161618] border-[#252529] text-[#9f9fa3] hover:text-white'}`}>{label}</button>
          ))}
          <button onClick={save} disabled={saving} className="ml-auto shrink-0 bg-white text-[#0c0c0e] font-semibold text-xs px-5 py-2 rounded-full disabled:opacity-60">{saving ? 'Saving…' : 'Save changes ✓'}</button>
        </div>
        {msg && <div className={`mt-3 text-xs font-mono px-3 py-2 rounded-xl border ${msg.includes('Saved') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>{msg}</div>}

        {/* content */}
        <div className="mt-6">
          {tab==='overview' && (
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h2 className="font-display font-semibold text-lg">Welcome back</h2>
                <p className="mt-1 text-sm text-[#9f9fa3]">Edit your portfolio without touching code. Changes persist to <span className="font-mono text-xs bg-[#0c0c0e] border border-[#252529] px-1.5 py-0.5 rounded">server/data/portfolio.json</span> and survive refresh.</p>
                <div className="mt-6 grid sm:grid-cols-3 gap-3">
                  <button onClick={()=>setTab('portfolio')} className="bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 text-left hover:border-[#3a3a3e]">
                    <div className="w-8 h-8 rounded-lg bg-[#facc15] grid place-items-center text-[#0c0c0e]">✎</div>
                    <div className="mt-2 font-medium text-sm">Edit Portfolio</div>
                    <div className="text-xs text-[#9f9fa3]">Name, hero, about, interests</div>
                  </button>
                  <button onClick={()=>setTab('projects')} className="bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 text-left hover:border-[#3a3a3e]">
                    <div className="w-8 h-8 rounded-lg bg-[#38bdf8] grid place-items-center text-[#0c0c0e]">◈</div>
                    <div className="mt-2 font-medium text-sm">Projects</div>
                    <div className="text-xs text-[#9f9fa3]">{data.projects.length} projects</div>
                  </button>
                  <button onClick={()=>setTab('highlights')} className="bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 text-left hover:border-[#3a3a3e]">
                    <div className="w-8 h-8 rounded-lg bg-[#fb923c] grid place-items-center text-[#0c0c0e]">★</div>
                    <div className="mt-2 font-medium text-sm">Highlights</div>
                    <div className="text-xs text-[#9f9fa3]">{data.highlights.length} items</div>
                  </button>
                </div>
                <div className="mt-6 bg-[#0c0c0e] border border-dashed border-[#252529] rounded-xl p-4 text-xs font-mono text-[#6b6b6e]">Tip: use phone — dashboard is responsive. Upload images max 2MB (jpg/png/webp/gif/svg).</div>
              </div>
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <div className="font-mono text-xs tracking-widest text-[#6b6b6e]">QUICK EDIT</div>
                <div className="mt-4 space-y-4">
                  <Field label="YOUR NAME" value={data.name} onChange={v=>setData({...data, name: v})} placeholder="Alex" />
                  <Field label="HERO STATUS" value={data.hero.status} onChange={v=>setData({...data, hero: {...data.hero, status: v}})} placeholder="Currently building…" />
                  <Field label="HERO SUBTITLE" value={data.hero.subtitle} onChange={v=>setData({...data, hero: {...data.hero, subtitle: v}})} textarea placeholder="I like making…" />
                </div>
              </div>
            </div>
          )}

          {tab==='portfolio' && (
            <div className="space-y-6">
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h3 className="font-display font-semibold">Identity</h3>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <Field label="NAME" value={data.name} onChange={v=>setData({...data, name: v})} />
                  <Field label="HERO STATUS" value={data.hero.status} onChange={v=>setData({...data, hero:{...data.hero, status: v}})} />
                  <div className="md:col-span-3"><Field label="HERO SUBTITLE" value={data.hero.subtitle} onChange={v=>setData({...data, hero:{...data.hero, subtitle: v}})} textarea /></div>
                </div>
              </div>

              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h3 className="font-display font-semibold">About</h3>
                <div className="mt-4 space-y-4">
                  {(data.about.paragraphs||[]).map((p,i)=>(
                    <div key={i} className="flex gap-2">
                      <Field label={`PARAGRAPH ${i+1}`} value={p} onChange={v=>{ const a=[...data.about.paragraphs]; a[i]=v; setData({...data, about:{...data.about, paragraphs:a}})}} textarea />
                      <button onClick={()=>{ const a=[...data.about.paragraphs]; a.splice(i,1); setData({...data, about:{...data.about, paragraphs:a}})}} className="self-start mt-6 text-xs text-red-300 hover:text-red-200">Remove</button>
                    </div>
                  ))}
                  <button onClick={()=>setData({...data, about:{...data.about, paragraphs:[...data.about.paragraphs, '']}})} className="text-xs font-mono bg-[#0c0c0e] border border-[#252529] px-3 py-1.5 rounded-full">+ Paragraph</button>
                  <Field label="TRAITS (comma separated)" value={(data.about.traits||[]).join(', ')} onChange={v=>setData({...data, about:{...data.about, traits: v.split(',').map(s=>s.trim()).filter(Boolean)}})} placeholder="Reserved at first, Independent…" />
                </div>
              </div>

              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h3 className="font-display font-semibold">What I Do — 4 interests</h3>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  {data.whatIDo.map((c,idx)=>(
                    <div key={idx} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-[#6b6b6e]">CARD {idx+1}</span>
                        <button onClick={()=>{ const w=[...data.whatIDo]; w.splice(idx,1); setData({...data, whatIDo:w})}} className="text-xs text-red-300">Remove</button>
                      </div>
                      <Field label="LABEL" value={c.label} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], label:v}; setData({...data, whatIDo:w})}} />
                      <Field label="TITLE" value={c.title} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], title:v}; setData({...data, whatIDo:w})}} />
                      <Field label="DESC" value={c.desc} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], desc:v}; setData({...data, whatIDo:w})}} textarea />
                      <Field label="TAGS (comma)" value={(c.tags||[]).join(', ')} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], tags: v.split(',').map(s=>s.trim()).filter(Boolean)}; setData({...data, whatIDo:w})}} />
                      <Field label="ICON" value={c.icon} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], icon:v}; setData({...data, whatIDo:w})}} />
                    </div>
                  ))}
                </div>
                {data.whatIDo.length<6 && <button onClick={()=>setData({...data, whatIDo:[...data.whatIDo, {id:'new', label:'05 — New', title:'New interest', desc:'', tags:[], icon:'✦'}]})} className="mt-4 text-xs font-mono bg-[#0c0c0e] border border-[#252529] px-3 py-1.5 rounded-full">+ Add interest</button>}
              </div>

              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h3 className="font-display font-semibold">Strengths</h3>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  {data.strengths.map((s,idx)=>(
                    <div key={idx} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between"><span className="font-mono text-xs text-[#6b6b6e]">STRENGTH {idx+1}</span><button onClick={()=>{ const a=[...data.strengths]; a.splice(idx,1); setData({...data, strengths:a})}} className="text-xs text-red-300">Remove</button></div>
                      <Field label="TITLE" value={s.title} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], title:v}; setData({...data, strengths:a})}} />
                      <Field label="DESC" value={s.desc} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], desc:v}; setData({...data, strengths:a})}} textarea />
                      <Field label="DETAIL (top label)" value={s.detail} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], detail:v}; setData({...data, strengths:a})}} />
                    </div>
                  ))}
                </div>
                {data.strengths.length<6 && <button onClick={()=>setData({...data, strengths:[...data.strengths, {title:'', desc:'', detail:''}]})} className="mt-4 text-xs font-mono bg-[#0c0c0e] border border-[#252529] px-3 py-1.5 rounded-full">+ Add strength</button>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 space-y-3">
                  <h3 className="font-display font-semibold">Growth story</h3>
                  <Field label="TITLE" value={data.growth.title} onChange={v=>setData({...data, growth:{...data.growth, title:v}})} />
                  <Field label="BEFORE" value={data.growth.story.before} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, before:v}}})} textarea />
                  <Field label="WORK" value={data.growth.story.work} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, work:v}}})} textarea />
                  <Field label="AFTER" value={data.growth.story.after} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, after:v}}})} textarea />
                  <Field label="PRINCIPLE" value={data.growth.principle} onChange={v=>setData({...data, growth:{...data.growth, principle:v}})} textarea />
                </div>
                <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                  <h3 className="font-display font-semibold">Goals (Learn/Build/Improve/Repeat)</h3>
                  <div className="mt-4 space-y-3">
                    {data.goals.map((g,idx)=>(
                      <div key={idx} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-3 flex gap-2">
                        <div className="flex-1 space-y-2">
                          <Field label="K" value={g.k} onChange={v=>{ const a=[...data.goals]; a[idx]={...a[idx], k:v}; setData({...data, goals:a})}} />
                          <Field label="V" value={g.v} onChange={v=>{ const a=[...data.goals]; a[idx]={...a[idx], v:v}; setData({...data, goals:a})}} textarea />
                        </div>
                        <button onClick={()=>{ const a=[...data.goals]; a.splice(idx,1); setData({...data, goals:a})}} className="text-xs text-red-300 self-start">✕</button>
                      </div>
                    ))}
                    <button onClick={()=>setData({...data, goals:[...data.goals, {k:'', v:''}]})} className="text-xs font-mono bg-[#0c0c0e] border border-[#252529] px-3 py-1.5 rounded-full">+ Goal</button>
                  </div>
                  <h3 className="mt-6 font-display font-semibold">Personal</h3>
                  <Field label="NOW (comma)" value={(data.personal.now||[]).join(', ')} onChange={v=>setData({...data, personal:{...data.personal, now: v.split(',').map(s=>s.trim()).filter(Boolean)}})} textarea />
                  <Field label="LEARNING (comma)" value={(data.personal.learning||[]).join(', ')} onChange={v=>setData({...data, personal:{...data.personal, learning: v.split(',').map(s=>s.trim()).filter(Boolean)}})} textarea />
                  <Field label="IMPROVING (comma)" value={(data.personal.improving||[]).join(', ')} onChange={v=>setData({...data, personal:{...data.personal, improving: v.split(',').map(s=>s.trim()).filter(Boolean)}})} textarea />
                </div>
              </div>
            </div>
          )}

          {tab==='projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">Projects ({data.projects.length})</h3>
                <button onClick={()=>setData({...data, projects:[...data.projects, {title:'New project', desc:'', tech:[], learned:'', status:'Draft', links:{github:'#', demo:'#'}, image:''}]})} className="text-xs font-mono bg-[#facc15] text-[#0c0c0e] px-3 py-1.5 rounded-full font-semibold">+ New project</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {data.projects.map((p,idx)=>(
                  <div key={idx} className="bg-[#161618] border border-[#252529] rounded-[20px] p-4 space-y-3">
                    <div className="flex justify-between items-center"><span className="font-mono text-xs text-[#6b6b6e]">#{idx+1}</span><button onClick={()=>{ const a=[...data.projects]; a.splice(idx,1); setData({...data, projects:a})}} className="text-xs text-red-300 border border-red-500/20 px-2 py-1 rounded-full">Delete</button></div>
                    <Field label="TITLE" value={p.title} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], title:v}; setData({...data, projects:a})}} />
                    <Field label="DESC" value={p.desc} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], desc:v}; setData({...data, projects:a})}} textarea />
                    <Field label="TECH (comma)" value={(p.tech||[]).join(', ')} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], tech: v.split(',').map(s=>s.trim()).filter(Boolean)}; setData({...data, projects:a})}} />
                    <Field label="LEARNED" value={p.learned} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], learned:v}; setData({...data, projects:a})}} />
                    <Field label="STATUS" value={p.status} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], status:v}; setData({...data, projects:a})}} />
                    <Field label="GITHUB" value={p.links?.github||''} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], links:{...a[idx].links, github:v}}; setData({...data, projects:a})}} />
                    <Field label="DEMO" value={p.links?.demo||''} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], links:{...a[idx].links, demo:v}}; setData({...data, projects:a})}} />
                    <div>
                      <label className="font-mono text-xs tracking-widest text-[#9f9fa3]">IMAGE</label>
                      {p.image && <img src={p.image} alt="" className="mt-1 w-full h-32 object-cover rounded-xl border border-[#252529]" />}
                      <div className="mt-2 flex gap-2">
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" onChange={e=>handleUpload(e.target.files[0], url=>{ const a=[...data.projects]; a[idx]={...a[idx], image:url}; setData({...data, projects:a})})} className="text-xs file:bg-[#0c0c0e] file:border file:border-[#252529] file:rounded-full file:px-3 file:py-1 file:text-xs file:text-[#9f9fa3]" />
                        {p.image && <button onClick={()=>{ const a=[...data.projects]; a[idx]={...a[idx], image:''}; setData({...data, projects:a})}} className="text-xs text-red-300">Clear</button>}
                      </div>
                      <Field label="IMAGE URL (or upload)" value={p.image||''} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], image:v}; setData({...data, projects:a})}} placeholder="/uploads/..." />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='highlights' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">Highlights / Achievements ({data.highlights.length})</h3>
                <button onClick={()=>setData({...data, highlights:[...data.highlights, {title:'', org:'', date:'', desc:'', link:''}]})} className="text-xs font-mono bg-[#facc15] text-[#0c0c0e] px-3 py-1.5 rounded-full font-semibold">+ Add highlight</button>
              </div>
              {data.highlights.length===0 && <div className="bg-[#161618] border border-dashed border-[#252529] rounded-xl p-6 text-sm text-[#9f9fa3]">No highlights yet — add awards, competitions, certificates. They will appear on the public site.</div>}
              <div className="grid md:grid-cols-2 gap-4">
                {data.highlights.map((h,idx)=>(
                  <div key={idx} className="bg-[#161618] border border-[#252529] rounded-[20px] p-4 space-y-3">
                    <div className="flex justify-between"><span className="font-mono text-xs text-[#6b6b6e]">#{idx+1}</span><button onClick={()=>{ const a=[...data.highlights]; a.splice(idx,1); setData({...data, highlights:a})}} className="text-xs text-red-300">Delete</button></div>
                    <Field label="TITLE" value={h.title} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], title:v}; setData({...data, highlights:a})}} />
                    <Field label="ORG" value={h.org} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], org:v}; setData({...data, highlights:a})}} />
                    <Field label="DATE" value={h.date} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], date:v}; setData({...data, highlights:a})}} />
                    <Field label="DESC" value={h.desc} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], desc:v}; setData({...data, highlights:a})}} textarea />
                    <Field label="LINK" value={h.link} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], link:v}; setData({...data, highlights:a})}} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='contact' && (
            <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 max-w-[560px] space-y-4">
              <h3 className="font-display font-semibold">Contact</h3>
              <Field label="EMAIL" value={data.contact.email} onChange={v=>setData({...data, contact:{...data.contact, email:v}})} />
              <Field label="GITHUB" value={data.contact.github} onChange={v=>setData({...data, contact:{...data.contact, github:v}})} />
              <Field label="NOTE" value={data.contact.note} onChange={v=>setData({...data, contact:{...data.contact, note:v}})} textarea />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
