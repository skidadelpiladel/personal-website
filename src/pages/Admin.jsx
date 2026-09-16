import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch, getCsrf, setCsrf } from '../lib/api'

function Field({ label, value, onChange, textarea, placeholder, mono }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] tracking-[0.16em] text-[#9f9fa3]">{label}</span>
      {textarea ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} className={`mt-1.5 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3 py-2.5 text-sm focus:border-[#3a3a3e] outline-none resize-y ${mono?'font-mono text-xs':''}`} /> : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={`mt-1.5 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3 py-2.5 text-sm focus:border-[#3a3a3e] outline-none ${mono?'font-mono text-xs':''}`} />}
    </label>
  )
}
function TagInput({ label, value, onChange }){
  const [draft,setDraft]=useState('')
  const tags=value||[]
  function add(){ const t=draft.trim(); if(t && !tags.includes(t)) onChange([...tags,t]); setDraft('')}
  return (
    <div>
      <span className="font-mono text-[11px] tracking-[0.16em] text-[#9f9fa3]">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5 bg-[#0c0c0e] border border-[#252529] rounded-xl px-2 py-2">
        {tags.map(t=> <span key={t} className="inline-flex items-center gap-1 bg-[#1e1e20] border border-[#252529] rounded-full px-2.5 py-1 text-xs">{t} <button onClick={()=>onChange(tags.filter(x=>x!==t))} className="w-4 h-4 rounded-full bg-black/20 grid place-items-center text-[10px]">×</button></span>)}
        <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'||e.key===','){ e.preventDefault(); add()}}} placeholder="add + Enter" className="flex-1 min-w-[100px] bg-transparent outline-none text-sm px-1" />
      </div>
    </div>
  )
}

export default function Admin(){
  const nav=useNavigate()
  const [tab,setTab]=useState('dashboard')
  const [data,setData]=useState(null)
  const [initial,setInitial]=useState(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState(null)
  const dirty = initial && JSON.stringify(initial)!==JSON.stringify(data)

  useEffect(()=>{
    let c=false
    async function init(){
      try{
        const csrf=await getCsrf(); setCsrf(csrf)
        const me=await (await apiFetch('/api/auth/me')).json()
        if(!me.authenticated){ nav('/login',{replace:true}); return }
        if(me.csrfToken) setCsrf(me.csrfToken)
        const j=await (await apiFetch('/api/portfolio')).json()
        if(!c){ setData(j); setInitial(JSON.parse(JSON.stringify(j))); setLoading(false) }
      }catch{ nav('/login',{replace:true}) }
    }
    init(); return ()=>{c=true}
  },[nav])

  useEffect(()=>{
    const h=(e)=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){ e.preventDefault(); save() }}
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h)
  })

  async function save(){
    if(saving) return
    setSaving(true)
    try{
      const r=await apiFetch('/api/portfolio',{method:'PUT', body:JSON.stringify(data)})
      const j=await r.json()
      if(!r.ok) throw new Error(j.error)
      setData(j.data); setInitial(JSON.parse(JSON.stringify(j.data)))
      setMsg({t:'Saved ✓', ok:true}); setTimeout(()=>setMsg(null),2500)
    }catch(e){ setMsg({t:e.message, ok:false}); setTimeout(()=>setMsg(null),3500)}
    finally{ setSaving(false) }
  }
  async function logout(){ try{ await apiFetch('/api/auth/logout',{method:'POST'}) }catch{} nav('/login',{replace:true}) }
  async function upload(file, cb){
    if(!file) return
    if(file.size>2*1024*1024){ setMsg({t:'Max 2MB', ok:false}); setTimeout(()=>setMsg(null),2500); return }
    const fd=new FormData(); fd.append('image',file)
    const r=await apiFetch('/api/upload',{method:'POST', body:fd})
    const j=await r.json()
    if(!r.ok){ setMsg({t:j.error, ok:false}); setTimeout(()=>setMsg(null),2500); return }
    cb(j.url)
  }

  if(loading) return <div className="min-h-screen bg-[#0c0c0e] grid place-items-center font-mono text-xs text-[#9f9fa3]">Loading dashboard…</div>
  if(!data) return null

  const tabs=[
    ['dashboard','Dashboard'],
    ['edit','Edit Portfolio'],
    ['projects','Projects'],
    ['highlights','Highlights'],
    ['settings','Settings'],
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <header className="sticky top-0 z-40 bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-[#1e1e20]">
        <div className="max-w-[1120px] mx-auto px-4 md:px-6 h-[64px] flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#D97706] text-[#0c0c0e] grid place-items-center font-bold">◈</span>
            <span className="font-display font-semibold text-sm hidden sm:inline">Admin</span>
            <span className="hidden sm:inline font-mono text-xs text-[#6b6b6e]">— private</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className={`hidden sm:inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full border ${dirty?'bg-amber-500/10 border-amber-500/20 text-amber-300':'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>{dirty?'● Unsaved':'✓ Saved'}</span>
            <Link to="/" className="hidden md:inline-flex text-xs border border-[#252529] bg-[#161618] px-3 py-2 rounded-full">View site →</Link>
            <button onClick={save} disabled={saving} className="bg-[#D97706] text-[#0c0c0e] font-semibold text-xs px-5 py-2 rounded-full disabled:opacity-60">{saving?'Saving…':'Save'}</button>
            <button onClick={logout} className="bg-white text-[#0c0c0e] font-semibold text-xs px-4 py-2 rounded-full">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(([id,label])=> <button key={id} onClick={()=>setTab(id)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border ${tab===id?'bg-[#D97706] text-[#0c0c0e] border-[#D97706]':'bg-[#161618] border-[#252529] text-[#9f9fa3] hover:text-white'}`}>{label}</button>)}
        </div>
        {msg && <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-mono border ${msg.ok?'bg-emerald-500/10 border-emerald-500/20 text-emerald-300':'bg-red-500/10 border-red-500/20 text-red-300'}`}>{msg.t}</div>}

        <div className="mt-6">
          {tab==='dashboard' && (
            <div className="space-y-5">
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h2 className="font-display font-semibold text-lg">Dashboard</h2>
                <p className="text-sm text-[#9f9fa3] mt-1">Edit without code. Changes persist to <span className="font-mono text-xs bg-[#0c0c0e] border border-[#252529] px-1.5 py-0.5 rounded">server/data/portfolio.json</span> — server validates & checks CSRF. Press <span className="font-mono text-xs bg-[#0c0c0e] border border-[#252529] px-1 py-0.5 rounded">Ctrl+S</span> to save.</p>
                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button onClick={()=>setTab('edit')} className="text-left bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 hover:border-[#3a3a3e]">
                    <div className="w-8 h-8 rounded-lg bg-[#D97706] grid place-items-center text-[#0c0c0e]">✎</div>
                    <div className="mt-2 font-medium text-sm">Edit Portfolio</div>
                    <div className="text-xs text-[#9f9fa3]">Name, hero, about, strengths</div>
                  </button>
                  <button onClick={()=>setTab('projects')} className="text-left bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 hover:border-[#3a3a3e]">
                    <div className="w-8 h-8 rounded-lg bg-[#38bdf8] grid place-items-center text-[#0c0c0e]">◈</div>
                    <div className="mt-2 font-medium text-sm">Projects</div>
                    <div className="text-xs text-[#9f9fa3]">{data.projects.length} items</div>
                  </button>
                  <button onClick={()=>setTab('highlights')} className="text-left bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 hover:border-[#3a3a3e]">
                    <div className="w-8 h-8 rounded-lg bg-[#fb923c] grid place-items-center text-[#0c0c0e]">★</div>
                    <div className="mt-2 font-medium text-sm">Highlights</div>
                    <div className="text-xs text-[#9f9fa3]">{data.highlights.length} items</div>
                  </button>
                  <button onClick={()=>setTab('settings')} className="text-left bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4 hover:border-[#3a3a3e]">
                    <div className="w-8 h-8 rounded-lg bg-[#1e1e20] border border-[#252529] grid place-items-center">⚙</div>
                    <div className="mt-2 font-medium text-sm">Settings</div>
                    <div className="text-xs text-[#9f9fa3]">Contact & security</div>
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#161618] border border-[#252529] rounded-2xl p-4"><div className="font-mono text-xs text-[#6b6b6e]">NAME</div><div className="font-medium">{data.name}</div></div>
                <div className="bg-[#161618] border border-[#252529] rounded-2xl p-4"><div className="font-mono text-xs text-[#6b6b6e]">PROJECTS</div><div className="font-medium">{data.projects.length} • {data.projects[0]?.title?.slice(0,24)}</div></div>
                <div className="bg-[#161618] border border-[#252529] rounded-2xl p-4"><div className="font-mono text-xs text-[#6b6b6e]">STATUS</div><div className="font-mono text-xs text-[#9f9fa3] truncate">{data.hero.status}</div></div>
              </div>
            </div>
          )}

          {tab==='edit' && (
            <div className="space-y-6 max-w-[760px]">
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 space-y-4">
                <h3 className="font-display font-semibold">Identity</h3>
                <Field label="NAME" value={data.name} onChange={v=>setData({...data, name:v})} placeholder="Dinh" />
                <Field label="HERO SUBTITLE" value={data.hero.subtitle} onChange={v=>setData({...data, hero:{...data.hero, subtitle:v}})} textarea placeholder="I like making…" />
                <Field label="HERO STATUS PILL" value={data.hero.status} onChange={v=>setData({...data, hero:{...data.hero, status:v}})} />
              </div>
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 space-y-4">
                <h3 className="font-display font-semibold">About</h3>
                {data.about.paragraphs.map((p,i)=>(
                  <div key={i} className="flex gap-2">
                    <div className="flex-1"><Field label={`PARAGRAPH ${i+1}`} value={p} onChange={v=>{ const a=[...data.about.paragraphs]; a[i]=v; setData({...data, about:{...data.about, paragraphs:a}})}} textarea /></div>
                    <button onClick={()=>{ const a=[...data.about.paragraphs]; a.splice(i,1); setData({...data, about:{...data.about, paragraphs:a}})}} className="self-start mt-7 text-xs text-red-300">Remove</button>
                  </div>
                ))}
                <button onClick={()=>setData({...data, about:{...data.about, paragraphs:[...data.about.paragraphs,'']}})} className="text-xs font-mono bg-[#0c0c0e] border border-[#252529] px-3 py-1.5 rounded-full">+ Paragraph</button>
                <TagInput label="TRAITS (add + Enter)" value={data.about.traits} onChange={v=>setData({...data, about:{...data.about, traits:v}})} />
              </div>
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
                <h3 className="font-display font-semibold">Interests (What I Do)</h3>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  {data.whatIDo.map((c,idx)=>(
                    <div key={idx} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between"><span className="font-mono text-xs text-[#6b6b6e]">CARD {idx+1}</span><button onClick={()=>{ const w=[...data.whatIDo]; w.splice(idx,1); setData({...data, whatIDo:w})}} className="text-xs text-red-300">Remove</button></div>
                      <Field label="LABEL" value={c.label} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], label:v}; setData({...data, whatIDo:w})}} />
                      <Field label="TITLE" value={c.title} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], title:v}; setData({...data, whatIDo:w})}} />
                      <Field label="DESC" value={c.desc} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], desc:v}; setData({...data, whatIDo:w})}} textarea />
                      <TagInput label="TAGS" value={c.tags} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], tags:v}; setData({...data, whatIDo:w})}} />
                      <Field label="ICON" value={c.icon} onChange={v=>{ const w=[...data.whatIDo]; w[idx]={...w[idx], icon:v}; setData({...data, whatIDo:w})}} />
                    </div>
                  ))}
                </div>
                {data.whatIDo.length<6 && <button onClick={()=>setData({...data, whatIDo:[...data.whatIDo,{id:'new',label:'05 — New',title:'New',desc:'',tags:[],icon:'✦'}]})} className="mt-4 text-xs font-mono bg-[#0c0c0e] border border-[#252529] px-3 py-1.5 rounded-full">+ Add interest</button>}
              </div>
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 space-y-3">
                <h3 className="font-display font-semibold">Growth story</h3>
                <Field label="TITLE" value={data.growth.title} onChange={v=>setData({...data, growth:{...data.growth, title:v}})} />
                <Field label="BEFORE" value={data.growth.story.before} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, before:v}}}) } textarea />
                <Field label="WORK" value={data.growth.story.work} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, work:v}}}) } textarea />
                <Field label="AFTER" value={data.growth.story.after} onChange={v=>setData({...data, growth:{...data.growth, story:{...data.growth.story, after:v}}}) } textarea />
                <Field label="PRINCIPLE" value={data.growth.principle} onChange={v=>setData({...data, growth:{...data.growth, principle:v}})} textarea />
              </div>
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 space-y-3">
                <h3 className="font-display font-semibold">Strengths & Goals</h3>
                {data.strengths.map((s,idx)=>(
                  <div key={idx} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-3 space-y-2">
                    <div className="flex justify-between"><span className="font-mono text-xs text-[#6b6b6e]">#{idx+1}</span><button onClick={()=>{ const a=[...data.strengths]; a.splice(idx,1); setData({...data, strengths:a})}} className="text-xs text-red-300">Remove</button></div>
                    <Field label="TITLE" value={s.title} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], title:v}; setData({...data, strengths:a})}} />
                    <Field label="DESC" value={s.desc} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], desc:v}; setData({...data, strengths:a})}} textarea />
                    <Field label="DETAIL" value={s.detail} onChange={v=>{ const a=[...data.strengths]; a[idx]={...a[idx], detail:v}; setData({...data, strengths:a})}} />
                  </div>
                ))}
                {data.strengths.length<6 && <button onClick={()=>setData({...data, strengths:[...data.strengths,{title:'',desc:'',detail:''}]})} className="text-xs font-mono bg-[#0c0c0e] border border-[#252529] px-3 py-1.5 rounded-full">+ Strength</button>}
                <div className="pt-3 border-t border-[#1e1e20] space-y-2">
                  {data.goals.map((g,idx)=>(
                    <div key={idx} className="flex gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Field label="K" value={g.k} onChange={v=>{ const a=[...data.goals]; a[idx]={...a[idx], k:v}; setData({...data, goals:a})}} />
                        <Field label="V" value={g.v} onChange={v=>{ const a=[...data.goals]; a[idx]={...a[idx], v:v}; setData({...data, goals:a})}} />
                      </div>
                      <button onClick={()=>{ const a=[...data.goals]; a.splice(idx,1); setData({...data, goals:a})}} className="self-center text-red-300">×</button>
                    </div>
                  ))}
                  <button onClick={()=>setData({...data, goals:[...data.goals,{k:'',v:''}]})} className="text-xs font-mono bg-[#0c0c0e] border border-[#252529] px-3 py-1 rounded-full">+ Goal</button>
                </div>
                <TagInput label="NOW" value={data.personal.now} onChange={v=>setData({...data, personal:{...data.personal, now:v}})} />
                <TagInput label="LEARNING" value={data.personal.learning} onChange={v=>setData({...data, personal:{...data.personal, learning:v}})} />
                <TagInput label="IMPROVING" value={data.personal.improving} onChange={v=>setData({...data, personal:{...data.personal, improving:v}})} />
              </div>
            </div>
          )}

          {tab==='projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">Projects ({data.projects.length})</h3>
                <button onClick={()=>setData({...data, projects:[...data.projects,{title:'New project',desc:'',tech:[],learned:'',status:'Draft',links:{github:'#',demo:'#'},image:''}]})} className="bg-[#D97706] text-[#0c0c0e] font-semibold text-xs px-4 py-2 rounded-full">+ New project</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {data.projects.map((p,idx)=>(
                  <div key={idx} className="bg-[#161618] border border-[#252529] rounded-[20px] p-4 space-y-3">
                    <div className="flex justify-between"><span className="font-mono text-xs bg-[#0c0c0e] border border-[#252529] px-2 py-1 rounded-full">#{idx+1}</span><button onClick={()=>{ if(!confirm(`Delete "${p.title}"?`)) return; const a=[...data.projects]; a.splice(idx,1); setData({...data, projects:a})}} className="text-xs text-red-300">Delete</button></div>
                    <Field label="TITLE" value={p.title} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], title:v}; setData({...data, projects:a})}} />
                    <Field label="DESC" value={p.desc} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], desc:v}; setData({...data, projects:a})}} textarea />
                    <TagInput label="TECH" value={p.tech} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], tech:v}; setData({...data, projects:a})}} />
                    <Field label="LEARNED" value={p.learned} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], learned:v}; setData({...data, projects:a})}} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="STATUS" value={p.status} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], status:v}; setData({...data, projects:a})}} />
                      <Field label="GITHUB" value={p.links?.github||''} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], links:{...a[idx].links, github:v}}; setData({...data, projects:a})}} mono />
                    </div>
                    <Field label="DEMO" value={p.links?.demo||''} onChange={v=>{ const a=[...data.projects]; a[idx]={...a[idx], links:{...a[idx].links, demo:v}}; setData({...data, projects:a})}} mono />
                    <div>
                      <span className="font-mono text-[11px] tracking-[0.16em] text-[#9f9fa3]">IMAGE</span>
                      {p.image && <img src={p.image} alt="" className="mt-1.5 w-full h-32 object-cover rounded-xl border border-[#252529]" />}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>upload(e.target.files[0], url=>{ const a=[...data.projects]; a[idx]={...a[idx], image:url}; setData({...data, projects:a})})} className="mt-2 block text-xs file:bg-[#0c0c0e] file:border file:border-[#252529] file:rounded-full file:px-3 file:py-1 file:text-xs" />
                      <input value={p.image||''} onChange={e=>{ const a=[...data.projects]; a[idx]={...a[idx], image:e.target.value}; setData({...data, projects:a})}} placeholder="/uploads/… or https://…" className="mt-2 w-full bg-[#0c0c0e] border border-[#252529] rounded-xl px-3 py-2 text-xs font-mono focus:border-[#3a3a3e] outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='highlights' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">Highlights ({data.highlights.length})</h3>
                <button onClick={()=>setData({...data, highlights:[...data.highlights,{title:'',org:'',date:'',desc:'',link:''}]})} className="bg-[#D97706] text-[#0c0c0e] font-semibold text-xs px-4 py-2 rounded-full">+ Add</button>
              </div>
              {data.highlights.length===0 && <div className="bg-[#161618] border border-dashed border-[#252529] rounded-xl p-6 text-center text-sm text-[#9f9fa3]">No highlights — add awards/certificates.</div>}
              <div className="grid md:grid-cols-2 gap-4">
                {data.highlights.map((h,idx)=>(
                  <div key={idx} className="bg-[#161618] border border-[#252529] rounded-[20px] p-4 space-y-3">
                    <div className="flex justify-between"><span className="font-mono text-xs text-[#6b6b6e]">#{idx+1}</span><button onClick={()=>{ const a=[...data.highlights]; a.splice(idx,1); setData({...data, highlights:a})}} className="text-xs text-red-300">Delete</button></div>
                    <Field label="TITLE" value={h.title} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], title:v}; setData({...data, highlights:a})}} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="ORG" value={h.org} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], org:v}; setData({...data, highlights:a})}} />
                      <Field label="DATE" value={h.date} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], date:v}; setData({...data, highlights:a})}} />
                    </div>
                    <Field label="DESC" value={h.desc} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], desc:v}; setData({...data, highlights:a})}} textarea />
                    <Field label="LINK" value={h.link} onChange={v=>{ const a=[...data.highlights]; a[idx]={...a[idx], link:v}; setData({...data, highlights:a})}} mono />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='settings' && (
            <div className="max-w-[560px] space-y-5">
              <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 space-y-4">
                <h3 className="font-display font-semibold">Contact</h3>
                <Field label="EMAIL" value={data.contact.email} onChange={v=>setData({...data, contact:{...data.contact, email:v}})} mono />
                <Field label="GITHUB" value={data.contact.github} onChange={v=>setData({...data, contact:{...data.contact, github:v}})} mono />
                <Field label="NOTE" value={data.contact.note} onChange={v=>setData({...data, contact:{...data.contact, note:v}})} textarea />
              </div>
              <div className="bg-[#161618] border border-[#D97706]/20 rounded-[20px] p-5">
                <div className="font-mono text-xs tracking-widest text-[#D97706]">SECURITY — ENV ONLY</div>
                <div className="font-display font-semibold mt-1 text-white">Secrets never in GitHub</div>
                <div className="text-sm text-[#9f9fa3] mt-1">Change password: <span className="font-mono text-xs bg-[#0c0c0e] border border-[#252529] px-1.5 py-0.5 rounded">npm run hash newPass</span> → paste into <span className="font-mono text-xs bg-[#0c0c0e] border border-[#252529] px-1.5 py-0.5 rounded">.env ADMIN_PASSWORD_HASH</span> (gitignored via <span className="font-mono text-xs bg-[#0c0c0e] border border-[#252529] px-1.5 py-0.5 rounded">.gitignore:3</span>) → restart.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
