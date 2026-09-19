import { useEffect, useState, useRef, lazy, Suspense } from "react"
import { Routes, Route, Link } from "react-router-dom"
import { siteData as fallback } from "./data"
import { useReveal } from "./hooks/useReveal"
const Login = lazy(()=> import("./pages/Login"))
const Admin = lazy(()=> import("./pages/Admin"))

// hook to load live data, fallback to static
function usePortfolio() {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/portfolio', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => { setData(j); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  return { data, loading }
}

function ScrollProgress(){
  const [w,setW]=useState(0)
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onScroll=()=>{
      const max=document.documentElement.scrollHeight - window.innerHeight
      setW(max>0 ? (window.scrollY / max) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, {passive:true})
    return ()=> window.removeEventListener('scroll', onScroll)
  },[])
  return <div className="scroll-progress" style={{width:`${w}%`}} aria-hidden="true" />
}

function CursorLight(){
  const cur=useRef({x:0,y:0})
  const target=useRef({x:0,y:0})
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches) return
    const el=document.createElement('div')
    el.className='cursor-light'
    document.body.appendChild(el)
    let rafId
    const lerp=(a,b,n)=>a+(b-a)*n
    const onMove=(e)=>{
      target.current.x=e.clientX
      target.current.y=e.clientY
      el.classList.add('visible')
    }
    const onLeave=()=> el.classList.remove('visible')
    const tick=()=>{
      cur.current.x=lerp(cur.current.x,target.current.x,0.08)
      cur.current.y=lerp(cur.current.y,target.current.y,0.08)
      el.style.transform=`translate(${cur.current.x}px,${cur.current.y}px) translate(-50%,-50%)`
      rafId=requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener('mousemove', onMove, {passive:true})
    window.addEventListener('mouseleave', onLeave)
    return ()=>{
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      el.remove()
    }
  },[])
  return null
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  const links = [
    ["About", "#about"],
    ["Work", "#work"],
    ["Growth", "#growth"],
    ["Projects", "#projects"],
    ["Goals", "#goals"],
  ]
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 border-b transition-all ${scrolled ? "bg-[#0c0c0e]/80 backdrop-blur-xl border-[#1e1e20]" : "bg-transparent border-transparent"}`}>
      <div className="max-w-[1160px] mx-auto px-6 h-[64px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#D97706] text-[#0c0c0e] grid place-items-center font-mono text-sm font-bold">◈</span>
          <span className="font-display font-semibold tracking-tight text-[15px]">portfolio</span>
          <span className="hidden sm:inline text-[#6b6b6e] font-mono text-xs ml-1">, quiet / steady</span>
        </Link>
        <div className="hidden md:flex items-center gap-7">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="nav-link text-[13px] tracking-wide font-medium text-[#9f9fa3] hover:text-white transition-colors">
              {label}
            </a>
          ))}
          <a href="#contact" className="btn-press text-sm font-medium bg-white text-[#0c0c0e] px-4 py-2 rounded-full hover:bg-[#D97706] transition-colors">Get in touch →</a>
          <Link to="/login" className="btn-press font-mono text-[11px] tracking-[0.16em] text-[#6b6b6e] hover:text-[#9f9fa3] border border-[#252529] hover:border-[#3a3a3e] px-3 py-1.5 rounded-full transition-colors">Edit</Link>
        </div>
        <button onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className="md:hidden w-9 h-9 grid place-items-center rounded-lg border border-[#252529] text-white">
          <span className="font-mono text-sm" aria-hidden="true">{open ? "✕" : "≡"}</span>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-[#1e1e20] bg-[#0c0c0e]/95 backdrop-blur-xl px-6 py-5 flex flex-col gap-4">
          {links.map(([label, href]) => (
            <a key={label} onClick={() => setOpen(false)} href={href} className="text-sm text-[#9f9fa3] hover:text-white">{label}</a>
          ))}
          <a onClick={() => setOpen(false)} href="#contact" className="mt-2 bg-white text-[#0c0c0e] text-center px-4 py-2.5 rounded-full font-medium text-sm">Get in touch</a>
          <Link to="/login" onClick={() => setOpen(false)} className="font-mono text-[11px] tracking-[0.16em] text-[#6b6b6e] border border-[#252529] px-3 py-2 rounded-full text-center">Edit</Link>
        </div>
      )}
    </nav>
  )
}

function SectionLabel({ num, label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-xs tracking-[0.18em] text-[#6b6b6e]">{num}</span>
      <span className="w-8 h-px bg-[#252529]" />
      <span className="font-mono text-xs tracking-[0.18em] text-[#D97706]">{label}</span>
    </div>
  )
}

function Hero({ d }) {
  return (
    <section className="relative pt-[96px] pb-12 md:pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="absolute -top-32 -right-32 w-[720px] h-[720px] rounded-full blur-[120px] opacity-[0.07] pointer-events-none" style={{ background: "radial-gradient(circle, #D97706, transparent 70%)" }} />
      <div className="absolute top-20 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.05] pointer-events-none" style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)" }} />
      <div className="max-w-[1160px] mx-auto px-6 relative">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-8 items-center">
          <div>
            <div className="hero-enter hero-enter-1 inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#9f9fa3] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
              AVAILABLE FOR NEW PROJECTS & COLLABS
            </div>
            <div className="hero-enter hero-enter-1 font-mono text-sm tracking-wide text-[#9f9fa3] mb-2">Hi, I'm <span className="text-white font-semibold">{d.name}</span>,</div>
            <h1 className="hero-enter hero-enter-2 font-display font-bold tracking-[-0.04em] leading-[0.9] text-[42px] sm:text-[56px] lg:text-[68px]">
              <span className="block text-white">I figure out</span>
              <span className="block text-white">how things work,</span>
              <span className="block text-[#D97706]">then see what</span>
              <span className="block text-[#D97706]">I can build.</span>
            </h1>
            <p className="hero-enter hero-enter-3 mt-6 max-w-[520px] text-[16px] md:text-[17px] leading-7 text-[#9f9fa3]">{d.hero.subtitle}</p>
            <div className="hero-enter hero-enter-3 mt-6 inline-flex items-center gap-2.5 bg-[#161618] border border-[#252529] rounded-full px-3 py-2 pr-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              <span className="text-xs font-mono text-[#d4d4d8]">{d.hero.status}</span>
            </div>
            <div className="hero-enter hero-enter-4 mt-8 flex flex-wrap gap-3">
              <a href="#projects" className="btn-press bg-[#D97706] text-[#0c0c0e] font-medium text-sm px-6 py-3 rounded-full hover:bg-[#E89A4D] transition-colors">View projects →</a>
              <a href="#growth" className="btn-press bg-transparent border border-[#252529] text-white font-medium text-sm px-6 py-3 rounded-full hover:bg-[#161618] transition-colors">My growth story</a>
            </div>
            <div className="hero-enter hero-enter-4 mt-8 flex items-center gap-6 text-xs font-mono text-[#6b6b6e]">
              <span className="flex items-center gap-2"><span className="w-4 h-px bg-[#2a2a2e]" /> Arduino</span>
              <span className="flex items-center gap-2"><span className="w-4 h-px bg-[#2a2a2e]" /> Basketball</span>
              <span className="flex items-center gap-2"><span className="w-4 h-px bg-[#2a2a2e]" /> Football</span>
            </div>
          </div>
          <div className="hero-enter hero-enter-2 lg:pl-4">
            <div className="relative bg-[#161618] border border-[#252529] rounded-[20px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252529] bg-[#111113]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/10" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/10" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/10" />
                </div>
                <span className="font-mono text-[11px] tracking-widest text-[#6b6b6e]">BUILD_LOG: progress.tsx</span>
                <span className="font-mono text-[11px] text-[#6b6b6e] hidden sm:inline">● live</span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="font-mono text-[12px] leading-6">
                  <div className="text-[#6b6b6e]">// improvement isn't loud. it's consistent.</div>
                  <div><span className="text-[#D97706]">const</span> <span className="text-white">progress</span> <span className="text-[#9f9fa3]">=</span> <span className="text-[#38bdf8]">track</span><span className="text-white">(</span><span className="text-[#a7f3d0]">"footwork"</span><span className="text-white">)</span>;</div>
                  <div><span className="text-[#D97706]">while</span> <span className="text-white">(</span><span className="text-white">learning</span><span className="text-white">)</span> <span className="text-white">{`{`}</span></div>
                  <div className="pl-4 text-[#d4d4d8]">build(); <span className="text-[#6b6b6e]">// Arduino, art, ideas</span></div>
                  <div className="pl-4 text-[#d4d4d8]">practice(); <span className="text-[#6b6b6e]">// paint → court → field</span></div>
                  <div className="pl-4 text-[#38bdf8]">reflect();<span className="blink inline-block w-[7px] h-[14px] bg-[#D97706] ml-1 translate-y-[2px]" aria-hidden="true"></span></div>
                  <div className="text-white">{`}`}</div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { label: "Arduino", val: 72, color: "#38bdf8" },
                    { label: "Basketball", val: 64, color: "#D97706" },
                    { label: "Football", val: 58, color: "#fb923c" },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#0c0c0e] border border-[#252529] rounded-xl p-3">
                      <div className="font-mono text-[10px] tracking-widest text-[#6b6b6e]">{s.label.toUpperCase()}</div>
                      <div className="mt-1 font-display font-bold text-lg">{s.val}%</div>
                      <div className="mt-2 h-1.5 bg-[#1e1e20] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.val}%`, background: s.color }} />
                      </div>
                      <div className="mt-1.5 font-mono text-[10px] text-[#6b6b6e]">↗ improving</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between bg-[#0c0c0e] border border-[#252529] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D97706] grid place-items-center text-[#0c0c0e] font-bold text-sm">↗</div>
                    <div>
                      <div className="font-mono text-[11px] tracking-widest text-[#6b6b6e]">MINDSET</div>
                      <div className="text-sm font-medium">Learn → Build → Improve → Repeat</div>
                    </div>
                  </div>
                  <span className="hidden sm:inline font-mono text-xs text-[#6b6b6e]">∞ loop</span>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-[#D97706] via-[#fb923c] to-[#38bdf8] opacity-60" />
            </div>
            <div className="hidden lg:flex absolute -right-2 top-10 bg-white text-[#0c0c0e] rounded-full px-3 py-1.5 items-center gap-2 shadow-xl rotate-2">
              <span className="w-6 h-6 rounded-full bg-[#0c0c0e] text-white grid place-items-center text-xs">✓</span>
              <span className="font-mono text-xs font-semibold">Progress visible</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function About({ d }) {
  return (
    <section id="about" className="py-16 md:py-24 border-t border-[#161618]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
          <div className="reveal">
            <SectionLabel num="01" label="ABOUT ME" />
            <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[40px] leading-[0.95]">
              Reserved first.<br />
              <span className="text-[#9f9fa3]">Real once you</span><br />
              know me.
            </h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {d.about.traits.map((t) => (
                <span key={t} className="tag-hover text-xs font-mono tracking-wide px-3 py-2 rounded-full bg-[#161618] border border-[#252529] text-[#d4d4d8]">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-8 bg-[#161618] border border-[#252529] rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#D97706] grid place-items-center text-[#0c0c0e] shrink-0">❝</div>
              <div>
                <div className="font-mono text-[11px] tracking-widest text-[#6b6b6e]">HOW FRIENDS DESCRIBE ME</div>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {["Shy", "Good at English", "Independent"].map((k) => (
                    <span key={k} className="bg-[#0c0c0e] border border-[#252529] rounded-full px-3 py-1 text-xs font-medium">{k}</span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-[#9f9fa3]">Quiet at first, but I light up when I get to show what I'm building or learning.</p>
              </div>
            </div>
          </div>
          <div className="reveal reveal-delay-1">
            <div className="space-y-5 text-[15.5px] leading-7 text-[#d4d4d8]">
              {d.about.paragraphs.map((p, i) => (
                <p key={i} className={i === 0 ? "text-white text-[17px] leading-7" : ""}>{p}</p>
              ))}
            </div>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <div className="bg-[#161618] border border-[#252529] rounded-2xl p-5">
                <div className="w-8 h-8 rounded-lg bg-[#0c0c0e] border border-[#252529] grid place-items-center text-sm">◈</div>
                <div className="mt-3 font-medium text-sm">I like showing, not just telling</div>
                <div className="mt-1 text-sm leading-6 text-[#9f9fa3]">If I'm excited about something I made, you'll know, I'll want to show you how it works.</div>
              </div>
              <div className="bg-[#161618] border border-[#D97706]/20 rounded-2xl p-5">
                <div className="font-mono text-xs tracking-widest text-[#D97706]">INDEPENDENCE</div>
                <div className="mt-2 font-display font-bold leading-tight text-white">Comfortable figuring things out on my own.</div>
                <div className="mt-2 text-sm leading-6 text-[#9f9fa3]">I don't wait for perfect instructions. I try, adjust, and learn as I go.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhatIDo({ d }) {
  return (
    <section id="work" className="py-16 md:py-24 bg-[#0f0f11] border-y border-[#161618]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 reveal">
          <div>
            <SectionLabel num="02" label="WHAT I DO" />
            <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[42px] leading-none">Building.<br /><span className="text-[#D97706]">Playing.</span> Creating.</h2>
          </div>
          <p className="max-w-[420px] text-sm leading-6 text-[#9f9fa3]">Four things I keep coming back to, not because I have to, but because I genuinely enjoy getting better at them.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          {d.whatIDo.map((card, i) => (
            <div key={card.id} className={`reveal ${i % 2 ? "reveal-delay-1" : ""} group relative bg-[#161618] border border-[#252529] rounded-[20px] p-6 md:p-7 overflow-hidden hover:border-[#2e2e32] hover:bg-[#1a1a1e] transition-colors`}>
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity pointer-events-none" style={{ background: `radial-gradient(circle at 30% 30%, ${i % 2 ? "#D97706" : "#38bdf8"}, transparent 60%)` }} />
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] tracking-[0.16em] text-[#6b6b6e]">{card.label}</span>
                <span className="w-9 h-9 rounded-xl bg-[#0c0c0e] border border-[#252529] grid place-items-center text-[#D97706] group-hover:bg-[#D97706] group-hover:text-[#0c0c0e] transition-colors">{card.icon}</span>
              </div>
              <h3 className="mt-4 font-display font-semibold text-[22px] tracking-tight">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#9f9fa3]">{card.desc}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {card.tags.map((t) => (
                  <span key={t} className="tag-hover font-mono text-[11px] tracking-wide px-2.5 py-1 rounded-full bg-[#0c0c0e] border border-[#252529] text-[#9f9fa3]">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Strengths({ d }) {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="reveal max-w-[720px]">
          <SectionLabel num="03" label="STRENGTHS" />
          <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[42px] leading-none">Not buzzwords. <br /><span className="text-[#9f9fa3]">Just how I work.</span></h2>
          <p className="mt-4 text-sm leading-6 text-[#9f9fa3]">These aren't things I put on a slide, they're patterns in how I actually approach projects, practice, and ideas.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {d.strengths.map((s, i) => (
            <div key={s.title} className={`reveal ${i === 1 ? "reveal-delay-1" : i === 2 ? "reveal-delay-2" : i === 3 ? "reveal-delay-3" : ""} bg-[#161618] border border-[#252529] rounded-2xl p-5 flex flex-col`}>
              <div className="font-mono text-[11px] tracking-[0.14em] text-[#D97706]">{s.detail}</div>
              <h3 className="mt-2 font-display font-semibold text-[16px] leading-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#9f9fa3] flex-1">{s.desc}</p>
              <div className="mt-4 w-8 h-8 rounded-full bg-[#0c0c0e] border border-[#252529] grid place-items-center text-xs">→</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowILearn() {
  return (
    <section id="learn" className="py-16 md:py-24 bg-[#0f0f11] border-y border-[#161618]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="reveal">
          <SectionLabel num="04" label="HOW I LEARN" />
          <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[42px] leading-none">Try first, <span className="text-[#D97706]">then understand.</span></h2>
          <p className="mt-4 max-w-[560px] text-sm leading-6 text-[#9f9fa3]">I usually try to figure things out myself first. If I get stuck I look for help, but I don't just copy the answer. I try again until it makes sense in my own way.</p>
        </div>
        <div className="reveal mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { n: "01", t: "Try myself", d: "Start on my own", icon: "◈" },
            { n: "02", t: "Get stuck", d: "Hit a problem", icon: "◎" },
            { n: "03", t: "Search", d: "AI, YouTube, tutorials", icon: "⬡" },
            { n: "04", t: "Understand", d: "Figure out why", icon: "✦" },
            { n: "05", t: "Try again", d: "Do it myself", icon: "↗" },
            { n: "06", t: "Make it my own", d: "Until it clicks", icon: "✓" },
          ].map((s, i) => (
            <div key={s.n} className={`reveal ${i === 1 ? "reveal-delay-1" : i === 2 ? "reveal-delay-2" : i === 3 ? "reveal-delay-3" : ""} bg-[#161618] border border-[#252529] rounded-2xl p-4 text-center hover:border-[#3a3a3e] transition-colors`}>
              <div className="w-8 h-8 mx-auto rounded-lg bg-[#0c0c0e] border border-[#252529] grid place-items-center font-mono text-xs">{s.icon}</div>
              <div className="mt-3 font-mono text-[10px] tracking-widest text-[#6b6b6e]">{s.n}</div>
              <div className="font-display font-semibold text-sm">{s.t}</div>
              <div className="text-xs text-[#9f9fa3] mt-1">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="reveal mt-6 bg-[#161618] border border-[#252529] rounded-2xl p-5 text-sm leading-6 text-[#9f9fa3] text-center">
          I use AI, YouTube and tutorials to help me learn, but the goal is understanding, not just getting the answer.
        </div>
      </div>
    </section>
  )
}

function Growth({ d }) {
  return (
    <section id="growth" className="py-16 md:py-24 bg-[#0f0f11] border-y border-[#161618]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="reveal">
          <SectionLabel num="05" label="GROWTH STORY" />
          <h2 className="font-display font-bold tracking-[-0.03em] text-[28px] md:text-[42px] leading-[0.95] max-w-[720px]">{d.growth.title}</h2>
        </div>
        <div className="mt-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          <div className="reveal relative bg-[#161618] border border-[#252529] rounded-[20px] p-6 md:p-8 overflow-hidden">
            <div className="absolute left-8 md:left-10 top-[88px] bottom-24 w-px bg-gradient-to-b from-[#D97706]/60 via-[#fb923c]/40 to-transparent hidden sm:block" />
            <div className="space-y-8">
              {[
                { step: "01", title: "Before", text: d.growth.story.before, dot: "bg-[#6b6b6e]" },
                { step: "02", title: "Practice", text: d.growth.story.work, dot: "bg-[#D97706] shadow-[0_0_12px_rgba(217,119,6,0.35)]" },
                { step: "03", title: "Progress", text: d.growth.story.after, dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" },
              ].map((item) => (
                <div key={item.step} className="relative flex gap-4 md:gap-5">
                  <div className={`hidden sm:grid w-5 h-5 rounded-full ${item.dot} place-items-center shrink-0 mt-1`} />
                  <div className="flex-1 bg-[#0c0c0e] border border-[#252529] rounded-2xl p-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs tracking-widest text-[#6b6b6e]">{item.step}</span>
                      <span className="font-display font-semibold">{item.title}</span>
                      {item.step === "03" && <span className="ml-auto font-mono text-[11px] bg-emerald-400 text-[#0c0c0e] px-2 py-0.5 rounded-full font-bold">NOW</span>}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#9f9fa3]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-[#161618] border border-[#D97706]/20 rounded-2xl p-5">
              <div className="font-mono text-xs tracking-widest text-[#D97706]">THE PRINCIPLE</div>
              <p className="mt-2 font-display font-semibold leading-snug text-[16px] text-white">"{d.growth.principle}"</p>
            </div>
          </div>
          <div className="reveal reveal-delay-1 space-y-5">
            <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6">
              <div className="font-mono text-xs tracking-widest text-[#6b6b6e]">GROWTH: VISUAL</div>
              <div className="mt-4 relative bg-[#0c0c0e] border border-[#252529] rounded-2xl p-5 overflow-hidden">
                <div className="relative h-[220px] rounded-xl border border-[#2a2a2e] bg-[#111113] overflow-hidden">
                  <div className="absolute inset-3 border border-[#2a2a2e] rounded-lg" />
                  <div className="absolute left-1/2 top-3 bottom-3 w-px bg-[#252529]" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-[#252529]" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#D97706]" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-20 h-28 border border-[#D97706]/30 bg-[#D97706]/5 rounded" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-14 border border-[#D97706]/40 rounded-r" />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 220" fill="none">
                    <path d="M 40 170 C 90 170 110 80 160 110" stroke="#D97706" strokeWidth="2" strokeDasharray="6 6" opacity="0.9" />
                    <circle cx="160" cy="110" r="6" fill="#D97706" />
                    <circle cx="40" cy="170" r="4" fill="#6b6b6e" />
                  </svg>
                  <div className="absolute bottom-2 left-2 font-mono text-[10px] tracking-widest text-[#6b6b6e]">BEFORE → AFTER</div>
                  <div className="absolute top-2 right-2 bg-[#D97706] text-[#0c0c0e] font-mono text-[10px] font-bold px-2 py-1 rounded-full">+ UNDERSTANDING</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="bg-[#161618] border border-[#252529] rounded-xl px-3 py-2 text-center"><span className="text-[#6b6b6e]">BEFORE</span><div className="font-semibold text-white">Getting answers</div></div>
                  <div className="bg-[#D97706] rounded-xl px-3 py-2 text-center text-[#0c0c0e]"><span className="opacity-60">WORK</span><div className="font-bold">Understanding</div></div>
                  <div className="bg-[#0c0c0e] border border-emerald-500/30 rounded-xl px-3 py-2 text-center"><span className="text-emerald-400">NOW</span><div className="font-semibold text-white">My own way</div></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#161618] border border-[#252529] rounded-2xl p-5">
                <div className="text-2xl">◐</div>
                <div className="mt-2 font-medium text-sm">Consistency beats talent</div>
                <div className="mt-1 text-xs leading-5 text-[#9f9fa3]">Small reps, done often, add up.</div>
              </div>
              <div className="bg-[#0c0c0e] border border-[#252529] rounded-2xl p-5">
                <div className="text-2xl text-[#D97706]">↗</div>
                <div className="mt-2 font-medium text-sm">Progress is the motivator</div>
                <div className="mt-1 text-xs leading-5 text-[#9f9fa3]">Seeing improvement keeps me going.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Projects({ d }) {
  return (
    <section id="projects" className="py-16 md:py-24">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 reveal">
          <div>
            <SectionLabel num="06" label="PROJECTS" />
            <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[42px] leading-none">Things I've <span className="text-[#D97706]">built.</span></h2>
            <p className="mt-3 text-sm leading-6 text-[#9f9fa3] max-w-[520px]">Arduino and experiments, now editable from your private admin.</p>
          </div>
          <a href="#contact" className="hidden md:inline-flex text-sm font-mono tracking-wide text-[#9f9fa3] hover:text-white group">Have an idea? Let's talk <span className="card-arrow inline-block">→</span></a>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {d.projects.map((p, i) => (
            <div key={i} className={`reveal ${i === 1 ? "reveal-delay-1" : i === 2 ? "reveal-delay-2" : ""} project-card group bg-[#161618] border border-[#252529] rounded-[20px] overflow-hidden flex flex-col`}>
              <div className="h-44 bg-[#0c0c0e] border-b border-[#252529] relative overflow-hidden p-0 flex flex-col justify-between">
                {p.image && p.image !== "#" && p.image.trim() !== "" ? (
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] tracking-widest text-[#6b6b6e]">{p.status.toUpperCase()}</span>
                      <span className="w-8 h-8 rounded-lg bg-[#1e1e20] border border-[#252529] grid place-items-center text-xs">◈</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 opacity-60">
                      {Array.from({ length: 36 }).map((_, k) => (
                        <span key={k} className={`h-1.5 rounded-full ${k % 7 === 0 ? "bg-[#D97706]" : k % 5 === 0 ? "bg-[#38bdf8]" : "bg-[#252529]"}`} />
                      ))}
                    </div>
                    <div className="font-mono text-[11px] text-[#6b6b6e]">what I learned → <span className="text-[#d4d4d8]">{p.learned}</span></div>
                  </div>
                )}
                {p.image && p.image !== "#" && p.image.trim() !== "" && <div className="absolute top-3 left-3 bg-[#0c0c0e]/80 backdrop-blur border border-[#252529] rounded-full px-2.5 py-1 font-mono text-[11px] tracking-widest text-[#d4d4d8]">{p.status.toUpperCase()}</div>}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-display font-semibold text-[17px] leading-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#9f9fa3] flex-1">{p.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.tech.map((t) => (
                    <span key={t} className="tag-hover font-mono text-[11px] px-2.5 py-1 rounded-full bg-[#0c0c0e] border border-[#252529] text-[#9f9fa3]">{t}</span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  {p.links.github && p.links.github !== "#" && p.links.github.trim() !== "" ? <a href={p.links.github} target="_blank" rel="noreferrer" className="btn-press flex-1 bg-white text-[#0c0c0e] text-center text-xs font-semibold py-2.5 rounded-full hover:bg-[#D97706] transition-colors">GitHub <span className="card-arrow inline-block">↗</span></a> : <span className="flex-1 bg-[#1e1e20] border border-[#252529] text-[#6b6b6e] text-center text-xs font-semibold py-2.5 rounded-full">GitHub: add in Admin</span>}
                  {p.links.demo && p.links.demo !== "#" && p.links.demo.trim() !== "" ? <a href={p.links.demo} target="_blank" rel="noreferrer" className="btn-press flex-1 bg-transparent border border-[#252529] text-white text-center text-xs font-semibold py-2.5 rounded-full hover:bg-[#0c0c0e] hover:border-[#3a3a3e] transition-colors">Demo <span className="card-arrow inline-block">→</span></a> : <span className="flex-1 bg-transparent border border-dashed border-[#252529] text-[#6b6b6e] text-center text-xs font-semibold py-2.5 rounded-full">Demo: soon</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Goals({ d }) {
  return (
    <section id="goals" className="py-16 md:py-24 bg-[#0f0f11] border-y border-[#161618]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-start">
          <div className="reveal">
            <SectionLabel num="07" label="WHAT'S NEXT" />
            <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[42px] leading-none">Not figured out.<br /><span className="text-[#D97706]">Still becoming.</span></h2>
            <p className="mt-4 text-sm leading-6 text-[#9f9fa3]">I don't have every answer yet, and that's the point. I'm focused on getting better at what I care about and seeing how far I can take it.</p>
            <div className="mt-8 bg-[#161618] border border-[#D97706]/20 rounded-[20px] p-6">
              <div className="font-mono text-xs tracking-[0.16em] text-[#D97706]">THE LOOP</div>
              <div className="mt-3 font-display font-bold text-[28px] tracking-[-0.03em] leading-none text-white">Learn → Build →<br />Improve → Repeat</div>
              <div className="mt-3 text-sm leading-6 text-[#9f9fa3]">Progress → improvement → the next challenge. That's the rhythm I like.</div>
            </div>
          </div>
          <div className="reveal reveal-delay-1">
            <div className="relative bg-[#161618] border border-[#252529] rounded-[20px] p-6 md:p-7">
              <div className="absolute left-6 md:left-7 top-12 bottom-12 w-px bg-[#252529] hidden sm:block" />
              <div className="space-y-6">
                {d.goals.map((g, i) => (
                  <div key={g.k} className="relative flex gap-4">
                    <div className="hidden sm:grid w-8 h-8 rounded-full bg-[#0c0c0e] border border-[#252529] place-items-center font-mono text-xs font-bold shrink-0">{String(i + 1).padStart(2, "0")}</div>
                    <div className="flex-1 bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4">
                      <div className="font-display font-semibold tracking-tight">{g.k}</div>
                      <div className="mt-1 text-sm leading-6 text-[#9f9fa3]">{g.v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Highlights({ d }) {
  const has = d.highlights.length > 0
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel num="08" label="HIGHLIGHTS" />
            <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[42px] leading-none">Highlights &<br /><span className="text-[#9f9fa3]">achievements.</span></h2>
          </div>
          <p className="max-w-[420px] text-sm leading-6 text-[#9f9fa3]">This space is ready for awards, competitions, certificates, and sports moments, only when you have them. No filler, no fake entries.</p>
        </div>
        {has ? (
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {d.highlights.map((h, idx) => (
              <div key={idx} className="reveal bg-[#161618] border border-[#252529] rounded-2xl p-5">
                <div className="font-mono text-[11px] tracking-widest text-[#D97706]">{h.date} {h.org ? `· ${h.org}` : ''}</div>
                <h3 className="mt-2 font-display font-semibold">{h.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#9f9fa3]">{h.desc}</p>
                {h.link && h.link !== '#' && <a href={h.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-mono tracking-wide text-white hover:text-[#D97706]">View →</a>}
              </div>
            ))}
          </div>
        ) : (
          <div className="reveal mt-10 bg-[#161618] border border-[#252529] rounded-[20px] p-8 md:p-10">
            <div className="max-w-[680px]">
              <div className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-[#6b6b6e]">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" /> NOTHING FABRICATED: READY WHEN YOU ARE
              </div>
              <h3 className="mt-4 font-display font-semibold text-[20px]">No made-up awards here.</h3>
              <p className="mt-2 text-sm leading-6 text-[#9f9fa3]">This section is intentionally empty until you add real highlights. Add them privately in Admin → Highlights.</p>
              <div className="mt-6 grid sm:grid-cols-3 gap-3">
                {[
                  { icon: "🏆", label: "Awards & prizes", hint: "Competitions" },
                  { icon: "◎", label: "Sports", hint: "Basketball / Football" },
                  { icon: "✦", label: "Projects & certs", hint: "Arduino, courses" },
                ].map((c) => (
                  <div key={c.label} className="bg-[#0c0c0e] border border-[#252529] rounded-2xl p-4">
                    <div className="text-lg">{c.icon}</div>
                    <div className="mt-2 font-medium text-sm">{c.label}</div>
                    <div className="font-mono text-xs text-[#6b6b6e]">{c.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function Personal({ d }) {
  return (
    <section id="working" className="py-16 md:py-24 bg-[#0f0f11] border-y border-[#161618]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="reveal">
          <SectionLabel num="09" label="WORKING ON" />
          <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[42px] leading-none">Not finished. <span className="text-[#D97706]">Still improving.</span></h2>
          <p className="mt-3 text-sm leading-6 text-[#9f9fa3] max-w-[560px]">I'm not finished developing these skills. These are areas I'm actively trying to improve. I haven't solved them yet, but I'm working on them honestly.</p>
        </div>
        <div className="mt-10 grid lg:grid-cols-3 gap-5">
          {[
            { title: "Flexibility", items: d.personal.now, accent: "bg-[#D97706] text-[#0c0c0e]" },
            { title: "Creativity outside interests", items: d.personal.learning, accent: "bg-[#38bdf8] text-[#0c0c0e]" },
            { title: "Consistency", items: d.personal.improving, accent: "bg-[#fb923c] text-[#0c0c0e]" },
          ].map((col, idx) => (
            <div key={col.title} className={`reveal ${idx === 1 ? "reveal-delay-1" : idx === 2 ? "reveal-delay-2" : ""} bg-[#161618] border border-[#252529] rounded-[20px] p-6`}>
              <div className={`inline-flex font-mono text-xs tracking-widest px-2.5 py-1 rounded-full font-bold ${col.accent}`}>{col.title.toUpperCase()}</div>
              <ul className="mt-4 space-y-3">
                {col.items.map((it) => (
                  <li key={it} className="flex gap-3 text-sm leading-6 text-[#d4d4d8]">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#3a3a3e] shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="reveal mt-6 bg-[#161618] border border-[#252529] rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#0c0c0e] border border-[#252529] grid place-items-center">◍</span>
            <div>
              <div className="font-medium text-sm">Resilience: without the cheesy story</div>
              <div className="text-sm leading-6 text-[#9f9fa3]">I haven't written a dramatic backstory, and I'm not going to invent one. Growth for me is quieter: keep showing up, learn from setbacks, try again.</div>
            </div>
          </div>
          <span className="font-mono text-xs tracking-widest text-[#6b6b6e] shrink-0">HONEST &gt; INSPIRATIONAL</span>
        </div>
      </div>
    </section>
  )
}

function Values() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="reveal">
          <SectionLabel num="10" label="WHAT MATTERS" />
          <h2 className="font-display font-bold tracking-[-0.03em] text-[32px] md:text-[42px] leading-none">What matters <span className="text-[#D97706]">to me.</span></h2>
          <p className="mt-4 max-w-[560px] text-sm leading-6 text-[#9f9fa3]">Three values that guide how I approach things. They shape how I learn, build, and decide what to do next.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { title: "Freedom", desc: "I want the freedom to choose how I live and how I approach things. To do things my own way, not just how I'm told to.", detail: "Live my way" },
            { title: "Improvement", desc: "I want to keep developing instead of staying at the same level. Getting a little better as I go matters to me.", detail: "Keep growing" },
            { title: "Enjoying my career", desc: "I want a career I genuinely enjoy, not just one that sounds impressive. Enjoying what I do is important.", detail: "Enjoy the work" },
          ].map((v, i) => (
            <div key={v.title} className={`reveal ${i === 1 ? "reveal-delay-1" : i === 2 ? "reveal-delay-2" : ""} bg-[#161618] border border-[#252529] rounded-2xl p-6`}>
              <div className="font-mono text-[11px] tracking-[0.14em] text-[#D97706]">{v.detail}</div>
              <h3 className="mt-2 font-display font-semibold text-lg">{v.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#9f9fa3]">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhatMakesMeMe() {
  return (
    <section className="py-16 md:py-24 bg-[#0f0f11] border-y border-[#161618]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="reveal max-w-[720px] mx-auto text-center">
          <SectionLabel num="11" label="WHAT MAKES ME ME" />
          <h2 className="font-display font-bold tracking-[-0.03em] text-[28px] md:text-[38px] leading-tight">I look at things <span className="text-[#D97706]">my own way.</span></h2>
          <p className="mt-4 text-[15px] leading-7 text-[#d4d4d8]">One of the biggest things that makes me who I am is my creativity and the way I look at things differently at first. I like understanding how things work, then thinking about what I could do with that understanding.</p>
          <p className="mt-3 text-sm leading-6 text-[#9f9fa3]">I'm still figuring myself out, but I know I enjoy understanding things, building things, and doing things my own way. That curiosity is what keeps me going.</p>
          <div className="mt-8 inline-flex flex-wrap justify-center items-center gap-2 bg-[#161618] border border-[#252529] rounded-full px-4 py-2 font-mono text-[10px] md:text-xs tracking-widest text-[#6b6b6e]">
            <span>CURIOSITY</span><span className="text-[#D97706]">→</span><span>CREATIVITY</span><span className="text-[#D97706]">→</span><span>INDEPENDENCE</span><span className="text-[#D97706]">→</span><span>UNDERSTANDING</span><span className="text-[#D97706]">→</span><span>IMPROVEMENT</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer({ d }) {
  return (
    <footer id="contact" className="py-16 md:py-20">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="reveal grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-[#6b6b6e]"><span className="w-2 h-2 rounded-full bg-emerald-400" /> LET'S CONNECT</div>
            <h2 className="mt-3 font-display font-bold tracking-[-0.04em] text-[36px] md:text-[48px] leading-[0.9]">Say hi.<br /><span className="text-[#D97706]">Show me</span> what<br />you're building.</h2>
            <p className="mt-4 max-w-[480px] text-sm leading-6 text-[#9f9fa3]">{d.contact.note}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {d.contact.email && d.contact.email.trim() !== "" ? <a href={`mailto:${d.contact.email}`} className="bg-white text-[#0c0c0e] font-medium text-sm px-6 py-3 rounded-full hover:bg-[#D97706] transition-colors">Email me →</a> : <span className="bg-[#1e1e20] border border-[#252529] text-[#6b6b6e] font-medium text-sm px-6 py-3 rounded-full">Add email in Admin → Settings</span>}
              {d.contact.github && d.contact.github.trim() !== "" ? <a href={d.contact.github} target="_blank" rel="noreferrer" className="border border-[#252529] bg-[#161618] text-white font-medium text-sm px-6 py-3 rounded-full hover:bg-[#1e1e20] transition-colors">GitHub</a> : <span className="border border-dashed border-[#252529] bg-[#0c0c0e] text-[#6b6b6e] font-medium text-sm px-6 py-3 rounded-full">Add GitHub in Admin</span>}
            </div>
          </div>
          <div className="bg-[#161618] border border-[#252529] rounded-[20px] p-6 md:p-7">
            <div className="font-mono text-xs tracking-widest text-[#6b6b6e]">CONTACT</div>
            <div className="mt-4 space-y-3">
              {d.contact.email && d.contact.email.trim() !== "" ? <a href={`mailto:${d.contact.email}`} className="flex items-center justify-between bg-[#0c0c0e] border border-[#252529] rounded-2xl px-4 py-3 hover:border-[#3a3a3e] transition-colors"><span className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-[#D97706] grid place-items-center text-[#0c0c0e] text-sm">✉</span><span className="text-sm font-medium">{d.contact.email}</span></span><span className="text-[#6b6b6e]">↗</span></a> : <div className="bg-[#0c0c0e] border border-dashed border-[#252529] rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-[#6b6b6e]"><span className="w-8 h-8 rounded-lg bg-[#1e1e20] grid place-items-center">✉</span> No email yet: add in Admin → Settings</div>}
              {d.contact.github && d.contact.github.trim() !== "" ? <a href={d.contact.github} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-[#0c0c0e] border border-[#252529] rounded-2xl px-4 py-3 hover:border-[#3a3a3e] transition-colors"><span className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-[#0c0c0e] border border-[#252529] grid place-items-center text-sm">⬡</span><span className="text-sm font-medium">GitHub</span></span><span className="text-[#6b6b6e]">↗</span></a> : <div className="bg-[#0c0c0e] border border-dashed border-[#252529] rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-[#6b6b6e]"><span className="w-8 h-8 rounded-lg bg-[#1e1e20] grid place-items-center">⬡</span> No GitHub yet: add in Admin</div>}
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-[#1e1e20] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono tracking-wide text-[#6b6b6e]">
          <span>© {new Date().getFullYear()}. Built with curiosity, practice, and iteration.</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Learn → Build → Improve → Repeat
          </span>
        </div>
      </div>
    </footer>
  )
}

function PortfolioPage() {
  const { data } = usePortfolio()
  useReveal()
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const els=document.querySelectorAll('.parallax')
    let ticking=false
    const onScroll=()=>{
      if(ticking) return
      ticking=true
      requestAnimationFrame(()=>{
        const y=window.scrollY
        els.forEach((el,i)=>{
          const speed = 0.04 + (i%3)*0.02
          el.style.transform=`translate3d(0, ${y*speed*0.35}px, 0)`
        })
        ticking=false
      })
    }
    window.addEventListener('scroll', onScroll, {passive:true})
    return ()=> window.removeEventListener('scroll', onScroll)
  },[])
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white selection:bg-[#D97706] selection:text-white">
      <ScrollProgress />
      <CursorLight />
      <Navbar />
      <main>
        <Hero d={data} />
        <About d={data} />
        <WhatIDo d={data} />
        <Strengths d={data} />
        <HowILearn />
        <Growth d={data} />
        <Projects d={data} />
        <Personal d={data} />
        <Values />
        <Goals d={data} />
        <WhatMakesMeMe />
        <Highlights d={data} />
      </main>
      <Footer d={data} />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0c0c0e] grid place-items-center font-mono text-xs text-[#9f9fa3]">Loading…</div>}>
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<PortfolioPage />} />
      </Routes>
    </Suspense>
  )
}
