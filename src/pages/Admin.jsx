import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch, getCsrf, setCsrf } from '../lib/api'

// --- small primitives ---
function Toast({ msg, type }) {
  if (!msg) return null
  const isOk = type === 'ok'
  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-full text-xs font-medium shadow-xl border flex items-center gap-2 ${isOk ? 'bg-[#facc15] text-[#0c0c0e] border-[#facc15]' : 'bg-red-500 text-white border-red-600'}`}>
      <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-[#0c0c0e]' : 'bg-white animate-pulse'}`} />
      {msg}
    </div>
  )
}
function Confirm({ open, title, desc, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 backdrop-blur-sm p-6">
      <div className="w-full max-w-[420px] bg-[#161618] border border-[#252529] rounded-[20px] p-6">
        <h3 className="font-display font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#9f9fa3]">{desc}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-full text-xs font-semibold bg-[#0c0c0e] border border-[#252529]">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-full text-xs font-semibold ${danger ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#facc15] text-[#0c0c0e]'}`}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
function Field({ label, hint, value, onChange, textarea, placeholder, mono }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.16em] text-[#9f9fa3]">{label}</span>
      {hint && <span className="ml-2 font-mono text-[10px] text-[#6b6b6e]">{hint}</span>}
      {textarea ? (
        <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={textarea === true ? 3 : textarea} className={`mt-1.5 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3.5 py-2.5 text-sm leading-6 focus:border-[#3a3a3e] focus:bg-[#111113] outline-none resize-y transition-colors ${mono ? 'font-mono text-xs' : ''}`} />
      ) : (
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={`mt-1.5 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#3a3a3e] focus:bg-[#111113] outline-none transition-colors ${mono ? 'font-mono text-xs' : ''}`} />
      )}
    </label>
  )
}
function TagInput({ label, value, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const tags = value || []
  function add() { const t = draft.trim(); if (t && !tags.includes(t)) onChange([...tags, t]); setDraft('') }
  return (
    <div>
      <span className="font-mono text-[10px] tracking-[0.16em] text-[#9f9fa3]">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5 bg-[#0c0c0e] border border-[#252529] rounded-xl px-2 py-2">
        {tags.map(t=>(
          <span key={t} className="inline-flex items-center gap-1 bg-[#1e1e20] border border-[#252529] rounded-full px-2.5 py-1 text-xs font-medium">
            {t} <button onClick={()=>onChange(tags.filter(x=>x!==t))} className="w-4 h-4 rounded-full bg-black/20 grid place-items-center text-[10px] hover:bg-red-500 hover:text-white">×</button>
          </span>
        ))}
        <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); add(); } if(e.key===',' ){ e.preventDefault(); add(); }}} placeholder={tags.length? placeholder || 'add + Enter' : placeholder} className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-[#6b6b6e] px-1" />
      </div>
      <div className="mt-1 font-mono text-[10px] text-[#6b6b6e]">Press Enter or comma to add • click × to remove</div>
    </div>
  )
}
function Dropzone({ url, onFile, onClear, onUrlChange }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)
  return (
    <div>
      <span className="font-mono text-[10px] tracking-[0.16em] text-[#9f9fa3]">IMAGE</span>
      {url ? (
        <div className="mt-1.5 relative group overflow-hidden rounded-xl border border-[#252529] bg-[#0c0c0e]">
          <img src={url} alt="" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onClear} className="bg-white text-[#0c0c0e] text-xs font-semibold px-3 py-1.5 rounded-full">Remove</button>
            <button onClick={()=>inputRef.current?.click()} className="bg-[#0c0c0e] border border-[#252529] text-white text-xs px-3 py-1.5 rounded-full">Replace</button>
          </div>
          <span className="absolute bottom-2 left-2 bg-[#0c0c0e]/80 backdrop-blur border border-[#252529] rounded-full px-2.5 py-1 font-mono text-[11px] text-[#d4d4d8] truncate max-w-[70%]">{url}</span>
        </div>
      ) : (
        <div onDragOver={e=>{e.preventDefault(); setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault(); setDrag(false); const f=e.dataTransfer.files?.[0]; if(f) onFile(f)}} onClick={()=>inputRef.current?.click()} className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${drag ? 'border-[#facc15] bg-[#facc15]/5' : 'border-[#252529] bg-[#0c0c0e] hover:border-[#3a3a3e]'}`}>
          <div className="w-9 h-9 rounded-xl bg-[#1e1e20] border border-[#252529] grid place-items-center mx-auto text-sm">⤒</div>
          <div className="mt-2 text-sm font-medium">Drop image or click to browse</div>
          <div className="font-mono text-xs text-[#6b6b6e]">JPG • PNG • WEBP • GIF • SVG — max 2MB</div>
        </div>
      )}
      <input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" onChange={e=>{ const f=e.target.files?.[0]; if(f) onFile(f); e.target.value='' }} />
      <input value={url||''} onChange={e=>onUrlChange(e.target.value)} placeholder="/uploads/… or https://…" className="mt-2 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3 py-2 text-xs font-mono focus:border-[#3a3a3e] outline-none" />
    </div>
  )
}

const NAV = [
  { id:'overview', label:'Overview', icon:'◈', desc:'Dashboard' },
  { id:'identity', label:'Identity', icon:'◎', desc:'Name & hero' },
  { id:'portfolio', label:'Portfolio', icon:'⬢', desc:'About & strengths' },
  { id:'projects', label:'Projects', icon:'⬣', desc:'Builds & code' },
  { id:'highlights', label:'Highlights', icon:'★', desc:'Awards & wins' },
  { id:'contact', label:'Contact', icon:'✉', desc:'Links & note' },
]

export default function Admin(){
  const nav = useNavigate()
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [initial, setInitial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [toastType, setToastType] = useState('ok')
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const dirty = useMemo(()=> initial && JSON.stringify(initial)!==JSON.stringify(data), [initial,data])
  const stats = useMemo(()=>{
    if(!data) return {}
    return {
      projects: data.projects.length,
      highlights: data.highlights.length,
      traits: data.about.traits.length,
      chars: JSON.stringify(data).length,
      lastProject: data.projects[0]?.title || '—',
    }
  },[data])

  function showToast(msg, type='ok'){ setToast(msg); setToastType(type); setTimeout(()=>setToast(null), 2800) }

  useEffect(()=>{
    let cancelled=false
    async function init(){
      try{
        const csrf = await getCsrf(); setCsrf(csrf)
        const me = await (await apiFetch('/api/auth/me')).json()
        if(!me.authenticated){ nav('/login',{replace:true}); return }
        if(me.csrfToken) setCsrf(me.csrfToken)
        const j = await (await apiFetch('/api/portfolio')).json()
        if(!cancelled){ setData(j); setInitial(JSON.parse(JSON.stringify(j))); setLoading(false) }
      } catch{ nav('/login',{replace:true}) }
    }
    init(); return ()=>{cancelled=true}
  },[nav])

  useEffect(()=>{
    const onKey = (e)=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); save() } }
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey)
  })

  async function save(){
    if(saving) return
    setSaving(true)
    try{
      const r = await apiFetch('/api/portfolio',{method:'PUT', body: JSON.stringify(data)})
      const j = await r.json()
      if(!r.ok) throw new Error(j.error||'Save failed')
      setData(j.data); setInitial(JSON.parse(JSON.stringify(j.data)))
      showToast('Saved — changes live ✓','ok')
    } catch(e){ showToast(e.message||'Save failed','err') }
    finally{ setSaving(false) }
  }
  async function logout(){ try{ await apiFetch('/api/auth/logout',{method:'POST'}) }catch{} nav('/login',{replace:true}) }
  async function handleUpload(file, onUrl){
    if(!file) return
    if(file.size>2*1024*1024){ showToast('Max 2MB','err'); return }
    const fd=new FormData(); fd.append('image',file)
    try{
      const r=await apiFetch('/api/upload',{method:'POST', body: fd})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error)
      onUrl(j.url); showToast('Image uploaded','ok')
    } catch(e){ showToast(e.message||'Upload failed','err') }
  }
  function move(arr, idx, dir){
    const n=[...arr]; const t=n[idx]; const nt=idx+dir; if(nt<0||nt>=n.length) return n
    n[idx]=n[nt]; n[nt]=t; return n
  }

  if(loading) return (
    <div className="min-h-screen bg-[#0c0c0e] grid place-items-center p-6">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-[#facc15] grid place-items-center mx-auto animate-pulse">◈</div>
        <div className="mt-3 font-mono text-xs tracking-widest text-[#9f9fa3]">LOADING DASHBOARD…</div>
      </div>
    </div>
  )
  if(!data) return null

  const filteredProjects = data.projects.filter(p => !search || (p.title+p.desc+p.tech.join(' ')).toLowerCase().includes(search.toLowerCase()))
  const filteredHighlights = data.highlights.filter(h => !search || (h.title+h.org+h.desc).toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex">
      {/* sidebar desktop */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-[#1e1e20] bg-[#0c0c0e] sticky top-0 h-screen">
        <div className="h-[64px] flex items-center gap-3 px-5 border-b border-[#1e1e20]">
          <span className="w-8 h-8 rounded-lg bg-[#facc15] text-[#0c0c0e] grid place-items-center font-bold">◈</span>
          <div>
            <div className="font-display font-semibold text-sm leading-none">Admin</div>
            <div className="font-mono text-[11px] text-[#6b6b6e]">Dinh • private</div>
          </div>
          <span className={`ml-auto w-2 h-2 rounded-full ${dirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} title={dirty ? 'Unsaved changes' : 'Saved'}/>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(n=> (
            <button key={n.id} onClick={()=>setTab(n.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border ${tab===n.id ? 'bg-[#facc15] text-[#0c0c0e] border-[#facc15]' : 'bg-transparent text-[#9f9fa3] hover:text-white hover:bg-[#161618] border-transparent hover:border-[#1e1e20]'}`}>
              <span className={`w-8 h-8 rounded-lg grid place-items-center text-sm shrink-0 ${tab===n.id ? 'bg-[#0c0c0e] text-[#facc15]' : 'bg-[#161618] border border-[#252529]'}`}>{n.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium leading-none">{n.label}</span>
                <span className={`block font-mono text-[11px] ${tab===n.id ? 'text-[#0c0c0e]/60' : 'text-[#6b6b6e]'}`}>{n.desc}</span>
              </span>
              {n.id==='projects' && <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${tab===n.id ? 'bg-[#0c0c0e] text-[#facc15]' : 'bg-[#1e1e20] text-[#9f9fa3]'}`}>{stats.projects}</span>}
              {n.id==='highlights' && stats.highlights>0 && <span className="font-mono text-xs bg-emerald-500 text-[#0c0c0e] px-2 py-0.5 rounded-full">{stats.highlights}</span>}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-[#1e1e20] space-y-2">
            <div className="px-3 py-2 rounded-xl bg-[#161618] border border-[#252529]">
              <div className="font-mono text-[10px] tracking-widest text-[#6b6b6e]">STORAGE</div>
              <div className="mt-1 font-mono text-xs text-[#9f9fa3]">{Math.round(stats.chars/1024)} KB • {stats.projects} projects</div>
              <div className="mt-2 h-1.5 bg-[#0c0c0e] rounded-full overflow-hidden"><div className="h-full bg-[#facc15]" style={{width: `${Math.min(100, Math.round(stats.chars/8000*100))}%`}}/></div>
            </div>
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0c0c0e] border border-[#252529] text-sm hover:border-[#3a3a3e]">View live site <span className="ml-auto">↗</span></a>
          </div>
        </nav>
        <div className="p-3 border-t border-[#1e1e20]">
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-[#0c0c0e] font-semibold text-sm justify-center hover:bg-[#facc15]">Logout →</button>
          <div className="mt-2 text-center font-mono text-[10px] tracking-widest text-[#6b6b6e]">Ctrl+S to save</div>
        </div>
      </aside>

      {/* main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-40 bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-[#1e1e20]">
          <div className="max-w-[1120px] mx-auto px-4 md:px-6 h-[64px] flex items-center gap-3">
            <button onClick={()=>setMobileNav(!mobileNav)} className="lg:hidden w-9 h-9 grid place-items-center rounded-xl border border-[#252529] bg-[#161618]">≡</button>
            <div className="hidden lg:block">
              <div className="font-mono text-[11px] tracking-[0.16em] text-[#6b6b6e]">{NAV.find(n=>n.id===tab)?.label.toUpperCase()} {dirty && '• UNSAVED'}</div>
              <h1 className="font-display font-semibold leading-none -mt-0.5">{tab==='overview' ? `Welcome back, ${data.name}` : NAV.find(n=>n.id===tab)?.label}</h1>
            </div>
            <div className="lg:hidden font-display font-semibold">{NAV.find(n=>n.id===tab)?.label}</div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-[#161618] border border-[#252529] rounded-full px-2 py-1">
                <span className={`w-2 h-2 rounded-full ${dirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="font-mono text-xs text-[#9f9fa3]">{dirty ? 'Unsaved' : 'Saved'}</span>
              </div>
              <Link to="/" className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium border border-[#252529] bg-[#161618] px-3 py-2 rounded-full hover:bg-[#1e1e20]">Preview ↗</Link>
              <button onClick={save} disabled={saving} className={`font-semibold text-xs px-5 py-2.5 rounded-full transition-colors ${dirty ? 'bg-[#facc15] text-[#0c0c0e] hover:bg-[#fde047]' : 'bg-white text-[#0c0c0e] hover:bg-zinc-200'} disabled:opacity-60`}>
                {saving ? 'Saving…' : dirty ? 'Save • Ctrl+S' : 'Saved ✓'}
              </button>
              <button onClick={logout} className="lg:hidden bg-white text-[#0c0c0e] font-semibold text-xs px-3 py-2 rounded-full">Logout</button>
            </div>
          </div>
          {/* mobile nav dropdown */}
          {mobileNav && (
            <div className="lg:hidden border-t border-[#1e1e20] bg-[#0c0c0e] px-4 py-3 grid grid-cols-3 gap-2">
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>{setTab(n.id); setMobileNav(false)}} className={`px-3 py-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 ${tab===n.id ? 'bg-[#facc15] text-[#0c0c0e] border-[#facc15]' : 'bg-[#161618] border-[#252529] text-[#9f9fa3]'}`}>
                  <span className="text-base">{n.icon}</span>{n.label}
                </button>
              ))}
            </div>
          )}
        </header>

        <main className="max-w-[1120px] w-full mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* search bar for projects/highlights */}
          {(tab==='projects' || tab==='highlights') && (
            <div className="mb-4 flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6e]">⌕</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tab}…`} className="w-full bg-[#161618] border border-[#252529] rounded-full pl-9 pr-3 py-2.5 text-sm focus:border-[#3a3a3e] outline-none" />
                {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-[#0c0c0e] border border-[#252529] rounded-full px-2 py-1">Clear</button>}
              </div>
              <button onClick={save} disabled={saving} className="hidden sm:inline-flex bg-[#facc15] text-[#0c0c0e] font-semibold text-xs px-4 py-2.5 rounded-full disabled:opacity-60">{saving?'Saving…':'Save'}</button>
            </div>
          )}

          {tab==='overview' && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {label:'Projects', value: stats.projects, sub: `Last: ${stats.lastProject.slice(0,22)}`, color:'bg-[#38bdf8]'},
                  {label:'Highlights', value: stats.highlights, sub: stats.highlights? 'Visible on site' : 'Empty — add wins', color:'bg-[#facc15]'},
                  {label:'Interests', value: data.whatIDo.length, sub: `${data.strengths.length} strengths`, color:'bg-[#fb923c]'},
                  {label:'Storage', value: `${Math.round(stats.chars/1024)}KB`, sub: dirty ? 'Unsaved changes' : 'All saved', color: dirty ? 'bg-amber-400' : 'bg-emerald-400'},
                ].map(c=>(
                  <div key={c.label} className="bg-[#161618] border border-[#252529] rounded-[20px] p-4">
                    <div className={`w-8 h-8 rounded-lg ${c.color} grid place-items-center text-[#0c0c0e] text-xs font-bold`}>●</div>
                    <div className="mt-3 font-mono text-[11px] tracking-widest text-[#6b6b6e]">{c.label.toUpperCase()}</div>
                    <div className="font-display font-bold text-2xl leading-none">{c.value}</div>
                    <div className="font-mono text-xs text-[#9f9fa3] truncate">{c.sub}</div>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                  <h3 className="font-display font-semibold">Quick actions</h3>
                  <div className="mt-4 grid sm:grid-cols-3 gap-3">
                    <button onClick={()=>setTab('identity')} className="text-left bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 hover:border-[#3a3a3e] group">
                      <div className="w-8 h-8 rounded-lg bg-[#facc15] grid place-items-center text-[#0c0c0e] group-hover:scale-105 transition-transform">✎</div>
                      <div className="mt-3 font-medium text-sm">Edit identity</div>
                      <div className="text-xs text-[#9f9fa3] leading-5">Name, hero subtitle, status</div>
                    </button>
                    <button onClick={()=>setTab('projects')} className="text-left bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 hover:border-[#3a3a3e] group">
                      <div className="w-8 h-8 rounded-lg bg-[#38bdf8] grid place-items-center text-[#0c0c0e] group-hover:scale-105 transition-transform">◈</div>
                      <div className="mt-3 font-medium text-sm">Manage projects</div>
                      <div className="text-xs text-[#9f9fa3] leading-5">Add • duplicate • reorder</div>
                    </button>
                    <button onClick={()=>setTab('highlights')} className="text-left bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 hover:border-[#3a3a3e] group">
                      <div className="w-8 h-8 rounded-lg bg-[#fb923c] grid place-items-center text-[#0c0c0e] group-hover:scale-105 transition-transform">★</div>
                      <div className="mt-3 font-medium text-sm">Add highlight</div>
                      <div className="text-xs text-[#9f9fa3] leading-5">{stats.highlights ? `${stats.highlights} live` : 'No awards yet'}</div>
                    </button>
                  </div>
                  <div className="mt-5 bg-[#0c0c0e] border border-dashed border-[#252529] rounded-xl p-4 flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#1e1e20] grid place-items-center text-sm shrink-0">◍</span>
                    <div className="text-sm leading-6 text-[#9f9fa3]">
                      <span className="font-medium text-white">Tip:</span> Everything saves to <span className="font-mono text-xs bg-[#161618] border border-[#252529] px-1.5 py-0.5 rounded">server/data/portfolio.json</span> — server validates, strips tags, and checks CSRF. No secrets ever reach the browser.
                    </div>
                  </div>
                </div>
                <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-widest text-[#6b6b6e]">QUICK EDIT</span>
                    <span className={`font-mono text-[10px] px-2 py-1 rounded-full border ${dirty ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>{dirty?'● Unsaved':'✓ Saved'}</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <Field label="YOUR NAME" value={data.name} onChange={v=>setData({...data, name:v})} placeholder="Dinh" />
                    <Field label="HERO STATUS" hint="pill under hero" value={data.hero.status} onChange={v=>setData({...data, hero:{...data.hero, status:v}})} />
                    <Field label="HERO SUBTITLE" value={data.hero.subtitle} onChange={v=>setData({...data, hero:{...data.hero, subtitle:v}})} textarea={3} />
                    <div className="pt-2 flex gap-2">
                      <button onClick={save} className="flex-1 bg-[#facc15] text-[#0c0c0e] font-semibold text-xs py-2.5 rounded-full">Save</button>
                      <button onClick={()=>{ setData(JSON.parse(JSON.stringify(initial))); showToast('Reverted','ok')}} className="px-4 bg-[#0c0c0e] border border-[#252529] rounded-full text-xs font-semibold">Revert</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-5 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                <div>
                  <div className="font-medium text-sm">Live preview</div>
                  <div className="text-sm text-[#9f9fa3]">See changes after Save — then refresh the public site.</div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <a href="/" target="_blank" rel="noreferrer" className="flex-1 md:flex-none bg-white text-[#0c0c0e] text-center font-semibold text-xs px-5 py-2.5 rounded-full">Open site ↗</a>
                  <button onClick={save} className="flex-1 md:flex-none bg-[#0c0c0e] border border-[#252529] text-white font-semibold text-xs px-5 py-2.5 rounded-full">Save changes</button>
                </div>
              </div>
            </div>
          )}

          {tab==='identity' && (
            <div className="space-y-5 max-w-[760px]">
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h3 className="font-display font-semibold">Identity & hero</h3>
                <p className="text-sm text-[#9f9fa3]">Shown at the top — who you are in one line.</p>
                <div className="mt-4 grid gap-4">
                  <Field label="NAME" hint="Hi, I'm …" value={data.name} onChange={v=>setData({...data, name:v})} placeholder="Dinh" />
                  <Field label="HERO SUBTITLE" value={data.hero.subtitle} onChange={v=>setData({...data, hero:{...data.hero, subtitle:v}})} textarea={4} placeholder="I like making…" />
                  <Field label="STATUS PILL" hint="green dot line" value={data.hero.status} onChange={v=>setData({...data, hero:{...data.hero, status:v}})} placeholder="Currently building…" />
                </div>
              </div>
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h3 className="font-display font-semibold">Contact</h3>
                <div className="mt-4 grid gap-4">
                  <Field label="EMAIL" value={data.contact.email} onChange={v=>setData({...data, contact:{...data.contact, email:v}})} mono />
                  <Field label="GITHUB" value={data.contact.github} onChange={v=>setData({...data, contact:{...data.contact, github:v}})} mono />
                  <Field label="NOTE" hint="under Say hi" value={data.contact.note} onChange={v=>setData({...data, contact:{...data.contact, note:v}})} textarea={3} />
                </div>
              </div>
            </div>
          )}

          {tab==='portfolio' && (
            <div className="space-y-6">
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h3 className="font-display font-semibold">About</h3>
                <div className="mt-4 space-y-4">
                  {(data.about.paragraphs||[]).map((p,i)=>(
                    <div key={i} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs tracking-widest text-[#6b6b6e]">PARAGRAPH {i+1}</span>
                        <div className="flex gap-1.5">
                          <button disabled={i===0} onClick={()=>setData({...data, about:{...data.about, paragraphs: move(data.about.paragraphs,i,-1)}})} className="w-7 h-7 grid place-items-center rounded-lg bg-[#161618] border border-[#252529] text-xs disabled:opacity-30">↑</button>
                          <button disabled={i===data.about.paragraphs.length-1} onClick={()=>setData({...data, about:{...data.about, paragraphs: move(data.about.paragraphs,i,1)}})} className="w-7 h-7 grid place-items-center rounded-lg bg-[#161618] border border-[#252529] text-xs disabled:opacity-30">↓</button>
                          <button onClick={()=> setConfirm({title:'Remove paragraph?', desc:'This will delete the paragraph.', onConfirm:()=>{ const a=[...data.about.paragraphs]; a.splice(i,1); setData({...data, about:{...data.about, paragraphs:a}}); setConfirm(null)}})} className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">Remove</button>
                        </div>
                      </div>
                      <Field label="" value={p} onChange={v=>{ const a=[...data.about.paragraphs]; a[i]=v; setData({...data, about:{...data.about, paragraphs:a}})}} textarea={4} />
                    </div>
                  ))}
                  <button onClick={()=>setData({...data, about:{...data.about, paragraphs:[...data.about.paragraphs,'New paragraph…']}})} className="w-full border border-dashed border-[#252529] bg-[#0c0c0e] rounded-xl py-3 text-xs font-mono tracking-wide hover:border-[#3a3a3e]">+ Add paragraph</button>
                  <TagInput label="TRAITS" value={data.about.traits} onChange={v=>setData({...data, about:{...data.about, traits:v}})} placeholder="e.g. Independent" />
                </div>
              </div>

              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold">What I Do — interests</h3>
                  <span className="font-mono text-xs bg-[#0c0c0e] border border-[#252529] px-2 py-1 rounded-full">{data.whatIDo.length}/6</span>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  {data.whatIDo.map((c,idx)=>(
                    <div key={idx} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] tracking-widest bg-[#161618] border border-[#252529] px-2 py-1 rounded-full">CARD {idx+1}</span>
                        <div className="flex gap-1">
                          <button disabled={idx===0} onClick={()=>setData({...data, whatIDo: move(data.whatIDo,idx,-1)})} className="w-7 h-7 grid place-items-center rounded-lg bg-[#161618] border border-[#252529] text-xs disabled:opacity-30">↑</button>
                          <button disabled={idx===data.whatIDo.length-1} onClick={()=>setData({...data, whatIDo: move(data.whatIDo,idx,1)})} className="w-7 h-7 grid place-items-center rounded-lg bg-[#161618] border border-[#252529] text-xs disabled:opacity-30">↓</button>
                          <button onClick={()=> setConfirm({title:'Remove card?', onConfirm:()=>{ const w=[...data.whatIDo]; w.splice(idx,1); setData({...data, whatIDo:w}); setConfirm(null)}, desc:'Removes this interest.'})} className="text-xs text-red-300 px-2">✕</button>
                        </div>
                      </div>
                      <Field label="LABEL" hint="01 —" value={c.label} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], label:v}; setData({...data, whatIDo:w})}} />
                      <Field label="TITLE" value={c.title} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], title:v}; setData({...data, whatIDo:w})}} />
                      <Field label="DESC" value={c.desc} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], desc:v}; setData({...data, whatIDo:w})}} textarea={3} />
                      <TagInput label="TAGS" value={c.tags} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], tags:v}; setData({...data, whatIDo:w})}} />
                      <Field label="ICON" hint="single char" value={c.icon} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], icon:v}; setData({...data, whatIDo:w})}} />
                    </div>
                  ))}
                </div>
                {data.whatIDo.length<6 && <button onClick={()=>setData({...data, whatIDo:[...data.whatIDo,{id:`new-${Date.now()}`, label:'05 — New', title:'New interest', desc:'', tags:[], icon:'✦'}]})} className="mt-4 w-full border border-dashed border-[#252529] bg-[#0c0c0e] rounded-xl py-3 text-xs font-mono">+ Add interest</button>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                  <h3 className="font-display font-semibold">Strengths</h3>
                  <div className="mt-4 space-y-3">
                    {data.strengths.map((s,idx)=>(
                      <div key={idx} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-[#6b6b6e]">#{idx+1}</span>
                          <div className="flex gap-1">
                            <button disabled={idx===0} onClick={()=>setData({...data, strengths: move(data.strengths,idx,-1)})} className="w-6 h-6 grid place-items-center rounded-lg bg-[#161618] border border-[#252529] text-xs disabled:opacity-30">↑</button>
                            <button disabled={idx===data.strengths.length-1} onClick={()=>setData({...data, strengths: move(data.strengths,idx,1)})} className="w-6 h-6 grid place-items-center rounded-lg bg-[#161618] border border-[#252529] text-xs disabled:opacity-30">↓</button>
                            <button onClick={()=> setConfirm({title:'Remove strength?', desc:'', onConfirm:()=>{ const a=[...data.strengths]; a.splice(idx,1); setData({...data, strengths:a}); setConfirm(null)}})} className="text-xs text-red-300">Remove</button>
                          </div>
                        </div>
                        <Field label="TITLE" value={s.title} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], title:v}; setData({...data, strengths:a})}} />
                        <Field label="DESC" value={s.desc} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], desc:v}; setData({...data, strengths:a})}} textarea={3} />
                        <Field label="DETAIL" hint="top label" value={s.detail} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], detail:v}; setData({...data, strengths:a})}} />
                      </div>
                    ))}
                    {data.strengths.length<6 && <button onClick={()=>setData({...data, strengths:[...data.strengths,{title:'',desc:'',detail:''}]})} className="w-full border border-dashed border-[#252529] bg-[#0c0c0e] rounded-xl py-2.5 text-xs font-mono">+ Add strength</button>}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 space-y-3">
                    <h3 className="font-display font-semibold">Growth story</h3>
                    <Field label="TITLE" value={data.growth.title} onChange={v=>setData({...data, growth:{...data.growth, title:v}})} />
                    <Field label="BEFORE" value={data.growth.story.before} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, before:v}}})} textarea={3} />
                    <Field label="WORK" value={data.growth.story.work} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, work:v}}})} textarea={3} />
                    <Field label="AFTER" value={data.growth.story.after} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, after:v}}})} textarea={3} />
                    <Field label="PRINCIPLE" hint="quoted" value={data.growth.principle} onChange={v=>setData({...data, growth:{...data.growth, principle:v}})} textarea={2} />
                  </div>
                  <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                    <h3 className="font-display font-semibold">Goals & personal</h3>
                    <div className="mt-4 space-y-3">
                      {data.goals.map((g,idx)=>(
                        <div key={idx} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-3 flex gap-2">
                          <div className="flex-1 space-y-2">
                            <Field label="K" hint="Learn/Build…" value={g.k} onChange={v=>{ const a=[...data.goals]; a[idx]={...a[idx], k:v}; setData({...data, goals:a})}} />
                            <Field label="V" value={g.v} onChange={v=>{ const a=[...data.goals]; a[idx]={...a[idx], v:v}; setData({...data, goals:a})}} textarea={2} />
                          </div>
                          <button onClick={()=>{ const a=[...data.goals]; a.splice(idx,1); setData({...data, goals:a})}} className="text-red-300 self-start p-1">✕</button>
                        </div>
                      ))}
                      <button onClick={()=>setData({...data, goals:[...data.goals,{k:'',v:''}]})} className="w-full border border-dashed border-[#252529] bg-[#0c0c0e] rounded-xl py-2 text-xs font-mono">+ Goal</button>
                      <TagInput label="NOW" value={data.personal.now} onChange={v=>setData({...data, personal:{...data.personal, now:v}})} placeholder="Tinkering…" />
                      <TagInput label="LEARNING" value={data.personal.learning} onChange={v=>setData({...data, personal:{...data.personal, learning:v}})} />
                      <TagInput label="IMPROVING" value={data.personal.improving} onChange={v=>setData({...data, personal:{...data.personal, improving:v}})} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab==='projects' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display font-semibold">Projects <span className="font-mono text-xs bg-[#161618] border border-[#252529] px-2 py-1 rounded-full ml-2">{filteredProjects.length}/{data.projects.length}</span></h3>
                <div className="flex gap-2">
                  <button onClick={()=>{ const blob=new Blob([JSON.stringify(data.projects,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='projects.json'; a.click(); URL.revokeObjectURL(url)}} className="hidden sm:inline-flex bg-[#0c0c0e] border border-[#252529] rounded-full px-3 py-1.5 text-xs font-mono">Export JSON</button>
                  <button onClick={()=>setData({...data, projects:[...data.projects,{title:'New project', desc:'', tech:[], learned:'', status:'Draft', links:{github:'#',demo:'#'}, image:''}]})} className="bg-[#facc15] text-[#0c0c0e] font-semibold text-xs px-4 py-2 rounded-full">+ New project</button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredProjects.map((p,filteredIdx)=>{
                  const idx = data.projects.indexOf(p)
                  return (
                  <div key={idx} className="bg-[#161618] border border-[#252529] rounded-[20px] p-4 space-y-3 hover:border-[#2a2a2e] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] tracking-widest bg-[#0c0c0e] border border-[#252529] px-2 py-1 rounded-full">#{idx+1} {p.status && `• ${p.status}`}</span>
                      <div className="flex gap-1">
                        <button onClick={()=>setData({...data, projects: move(data.projects,idx,-1)})} disabled={idx===0} className="w-7 h-7 grid place-items-center rounded-lg bg-[#0c0c0e] border border-[#252529] text-xs disabled:opacity-30" title="Move up">↑</button>
                        <button onClick={()=>setData({...data, projects: move(data.projects,idx,1)})} disabled={idx===data.projects.length-1} className="w-7 h-7 grid place-items-center rounded-lg bg-[#0c0c0e] border border-[#252529] text-xs disabled:opacity-30" title="Move down">↓</button>
                        <button onClick={()=>{ const clone={...p, title: p.title+' (copy)'}; const a=[...data.projects]; a.splice(idx+1,0,clone); setData({...data, projects:a}); showToast('Duplicated','ok')}} className="px-2 py-1 rounded-lg bg-[#0c0c0e] border border-[#252529] text-xs" title="Duplicate">⧉</button>
                        <button onClick={()=> setConfirm({title:'Delete project?', desc:`Remove "${p.title}" permanently.`, danger:true, onConfirm:()=>{ const a=[...data.projects]; a.splice(idx,1); setData({...data, projects:a}); setConfirm(null); showToast('Deleted','ok')}})} className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">Delete</button>
                      </div>
                    </div>
                    <Field label="TITLE" value={p.title} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], title:v}; setData({...data, projects:a})}} />
                    <Field label="DESC" value={p.desc} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], desc:v}; setData({...data, projects:a})}} textarea={3} />
                    <TagInput label="TECH" value={p.tech} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], tech:v}; setData({...data, projects:a})}} placeholder="Arduino, C++" />
                    <Field label="LEARNED" hint="What you learned" value={p.learned} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], learned:v}; setData({...data, projects:a})}} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="STATUS" value={p.status} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], status:v}; setData({...data, projects:a})}} />
                      <Field label="GITHUB" value={p.links?.github||''} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], links:{...a[idx].links, github:v}}; setData({...data, projects:a})}} mono />
                    </div>
                    <Field label="DEMO" value={p.links?.demo||''} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], links:{...a[idx].links, demo:v}}; setData({...data, projects:a})}} mono />
                    <Dropzone url={p.image} onFile={f=>handleUpload(f, url=>{ const a=[...data.projects]; a[idx]={...a[idx], image:url}; setData({...data, projects:a})})} onClear={()=>{ const a=[...data.projects]; a[idx]={...a[idx], image:''}; setData({...data, projects:a})}} onUrlChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], image:v}; setData({...data, projects:a})}} />
                  </div>
                )})}
              </div>
              {filteredProjects.length===0 && <div className="bg-[#161618] border border-dashed border-[#252529] rounded-xl p-8 text-center text-sm text-[#9f9fa3]">No projects match “{search}”.</div>}
            </div>
          )}

          {tab==='highlights' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">Highlights <span className="font-mono text-xs bg-[#161618] border border-[#252529] px-2 py-1 rounded-full ml-2">{filteredHighlights.length}/{data.highlights.length}</span></h3>
                <button onClick={()=>setData({...data, highlights:[...data.highlights,{title:'', org:'', date:'', desc:'', link:''}]})} className="bg-[#facc15] text-[#0c0c0e] font-semibold text-xs px-4 py-2 rounded-full">+ Add highlight</button>
              </div>
              {data.highlights.length===0 && <div className="bg-[#161618] border border-dashed border-[#252529] rounded-xl p-8 text-center"><div className="w-10 h-10 rounded-xl bg-[#1e1e20] border border-[#252529] grid place-items-center mx-auto">★</div><div className="mt-3 font-medium text-sm">No highlights yet</div><div className="text-sm text-[#9f9fa3]">Awards, competitions, certificates — they’ll appear on the public site once added.</div></div>}
              <div className="grid md:grid-cols-2 gap-4">
                {filteredHighlights.map((h,fi)=>{
                  const idx=data.highlights.indexOf(h)
                  return (
                  <div key={idx} className="bg-[#161618] border border-[#252529] rounded-[20px] p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[11px] tracking-widest bg-[#0c0c0e] border border-[#252529] px-2 py-1 rounded-full">#{idx+1}</span>
                      <div className="flex gap-1">
                        <button onClick={()=>setData({...data, highlights: move(data.highlights,idx,-1)})} disabled={idx===0} className="w-7 h-7 grid place-items-center rounded-lg bg-[#0c0c0e] border border-[#252529] text-xs disabled:opacity-30">↑</button>
                        <button onClick={()=>setData({...data, highlights: move(data.highlights,idx,1)})} disabled={idx===data.highlights.length-1} className="w-7 h-7 grid place-items-center rounded-lg bg-[#0c0c0e] border border-[#252529] text-xs disabled:opacity-30">↓</button>
                        <button onClick={()=>setConfirm({title:'Delete highlight?', danger:true, desc:`Remove "${h.title||'untitled'}"?`, onConfirm:()=>{ const a=[...data.highlights]; a.splice(idx,1); setData({...data, highlights:a}); setConfirm(null)}})} className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">Delete</button>
                      </div>
                    </div>
                    <Field label="TITLE" value={h.title} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], title:v}; setData({...data, highlights:a})}} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="ORG" value={h.org} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], org:v}; setData({...data, highlights:a})}} />
                      <Field label="DATE" value={h.date} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], date:v}; setData({...data, highlights:a})}} />
                    </div>
                    <Field label="DESC" value={h.desc} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], desc:v}; setData({...data, highlights:a})}} textarea={3} />
                    <Field label="LINK" value={h.link} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], link:v}; setData({...data, highlights:a})}} mono />
                  </div>
                )})}
              </div>
            </div>
          )}

          {tab==='contact' && (
            <div className="max-w-[640px] space-y-5">
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 space-y-4">
                <h3 className="font-display font-semibold">Contact</h3>
                <Field label="EMAIL" value={data.contact.email} onChange={v=>setData({...data, contact:{...data.contact, email:v}})} mono />
                <Field label="GITHUB" value={data.contact.github} onChange={v=>setData({...data, contact:{...data.contact, github:v}})} mono />
                <Field label="NOTE" hint="Connect section paragraph" value={data.contact.note} onChange={v=>setData({...data, contact:{...data.contact, note:v}})} textarea={4} />
              </div>
              <div className="bg-[#facc15] rounded-[20px] p-5 text-[#0c0c0e]">
                <div className="font-mono text-xs tracking-widest opacity-60">SECURITY</div>
                <div className="mt-1 font-display font-semibold">Change password via .env</div>
                <div className="mt-1 text-sm leading-6 opacity-70">Credentials are hashed (bcrypt) server-side, never in frontend. To change: <span className="font-mono text-xs bg-black/10 px-1.5 py-0.5 rounded">npm run hash newPassword</span> → paste into <span className="font-mono text-xs bg-black/10 px-1.5 py-0.5 rounded">ADMIN_PASSWORD_HASH</span> → restart.</div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Toast msg={toast} type={toastType} />
      <Confirm open={!!confirm} title={confirm?.title} desc={confirm?.desc} danger={confirm?.danger} onConfirm={confirm?.onConfirm} onCancel={()=>setConfirm(null)} />
    </div>
  )
}
