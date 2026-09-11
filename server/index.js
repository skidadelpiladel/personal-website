import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import bcrypt from 'bcryptjs'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { body, validationResult } from 'express-validator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.join(__dirname, '..')
const DATA_PATH = path.join(__dirname, 'data', 'portfolio.json')
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

// --- security headers ---
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// --- session (secrets in env, not committed) ---
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error('SESSION_SECRET must be >=32 chars in .env')
  process.exit(1)
}
app.use(session({
  name: 'portfolio.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'strict', maxAge: 1000*60*60*2 }
}))

function getCsrf(req){ if(!req.session.csrfToken) req.session.csrfToken=crypto.randomBytes(32).toString('hex'); return req.session.csrfToken }
function requireAuth(req,res,next){ if(!req.session.user) return res.status(401).json({error:'Unauthorized'}); next() }
function requireCsrf(req,res,next){ if(['GET','HEAD','OPTIONS'].includes(req.method)) return next(); const t=req.headers['x-csrf-token']; if(!t || t!==req.session.csrfToken) return res.status(403).json({error:'Invalid CSRF token'}); next() }
function sanitizeString(s,max=2000){ if(typeof s!=='string') return ''; return s.trim().slice(0,max).replace(/<[^>]*>/g,'') }
function sanitizeUrl(s){ if(typeof s!=='string') return '#'; const u=s.trim().slice(0,500); if(u===''||u==='#') return '#'; if(/^(https?:\/\/|mailto:|#|\/)/.test(u)) return u.replace(/[<>"']/g,''); return '#'}
function loadPortfolio(){ try{ return JSON.parse(fs.readFileSync(DATA_PATH,'utf-8')) }catch(e){ console.error(e); return null } }
function savePortfolio(d){ const t=DATA_PATH+'.tmp'; fs.writeFileSync(t, JSON.stringify(d,null,2),'utf-8'); fs.renameSync(t, DATA_PATH) }

const loginLimiter = rateLimit({ windowMs:15*60*1000, max:10, standardHeaders:true, legacyHeaders:false, message:{error:'Too many login attempts'} })

// --- auth (public login, server-side session) ---
app.get('/api/csrf-token', (req,res)=> res.json({csrfToken:getCsrf(req)}))
app.get('/api/auth/me', (req,res)=> {
  if(req.session.user) return res.json({authenticated:true, user:req.session.user, csrfToken:req.session.csrfToken})
  res.json({authenticated:false})
})
app.post('/api/auth/login', loginLimiter, body('username').isString().trim().isLength({min:1,max:64}), body('password').isString().isLength({min:1,max:128}), async (req,res)=>{
  const err=validationResult(req); if(!err.isEmpty()) return res.status(400).json({error:'Invalid input'})
  const {username,password}=req.body
  const expU=process.env.ADMIN_USERNAME, expH=process.env.ADMIN_PASSWORD_HASH
  if(!expU||!expH) return res.status(500).json({error:'Server misconfigured'})
  if(username!==expU){ await bcrypt.compare(password,expH); return res.status(401).json({error:'Invalid credentials'}) }
  if(!await bcrypt.compare(password,expH)) return res.status(401).json({error:'Invalid credentials'})
  req.session.regenerate(er=>{
    if(er) return res.status(500).json({error:'Login failed'})
    req.session.user={username}; req.session.csrfToken=crypto.randomBytes(32).toString('hex')
    req.session.save(e=> e? res.status(500).json({error:'Login failed'}) : res.json({success:true, csrfToken:req.session.csrfToken}))
  })
})
app.post('/api/auth/logout', requireAuth, requireCsrf, (req,res)=>{
  req.session.destroy(er=>{ if(er) return res.status(500).json({error:'Logout failed'}); res.clearCookie('portfolio.sid'); res.json({success:true}) })
})

// --- portfolio (public read, protected write) ---
app.get('/api/portfolio', (req,res)=>{ const d=loadPortfolio(); if(!d) return res.status(500).json({error:'Failed to load'}); res.json(d) })
app.put('/api/portfolio', requireAuth, requireCsrf, (req,res)=>{
  try{
    const inc=req.body; if(!inc||typeof inc!=='object') return res.status(400).json({error:'Invalid payload'})
    const cur=loadPortfolio(); if(!cur) return res.status(500).json({error:'Load failed'})
    const out=JSON.parse(JSON.stringify(cur))
    if(typeof inc.name==='string') out.name=sanitizeString(inc.name,64)
    if(inc.hero){ if(typeof inc.hero.subtitle==='string') out.hero.subtitle=sanitizeString(inc.hero.subtitle,500); if(typeof inc.hero.status==='string') out.hero.status=sanitizeString(inc.hero.status,200) }
    if(inc.about){ if(Array.isArray(inc.about.paragraphs)) out.about.paragraphs=inc.about.paragraphs.slice(0,5).map(p=>sanitizeString(p,1000)).filter(Boolean); if(Array.isArray(inc.about.traits)) out.about.traits=inc.about.traits.slice(0,8).map(t=>sanitizeString(t,64)).filter(Boolean) }
    if(Array.isArray(inc.whatIDo)) out.whatIDo=inc.whatIDo.slice(0,6).map(c=>({ id:sanitizeString(c.id||'',32).toLowerCase().replace(/[^a-z0-9_-]/g,'')||'item', label:sanitizeString(c.label||'',32), title:sanitizeString(c.title||'',64), desc:sanitizeString(c.desc||'',500), tags:Array.isArray(c.tags)?c.tags.slice(0,6).map(t=>sanitizeString(t,32)).filter(Boolean):[], icon:sanitizeString(c.icon||'◈',4) }))
    if(Array.isArray(inc.strengths)) out.strengths=inc.strengths.slice(0,6).map(s=>({ title:sanitizeString(s.title||'',64), desc:sanitizeString(s.desc||'',500), detail:sanitizeString(s.detail||'',64) }))
    if(inc.growth){ if(typeof inc.growth.title==='string') out.growth.title=sanitizeString(inc.growth.title,120); if(inc.growth.story){ if(typeof inc.growth.story.before==='string') out.growth.story.before=sanitizeString(inc.growth.story.before,1000); if(typeof inc.growth.story.work==='string') out.growth.story.work=sanitizeString(inc.growth.story.work,1000); if(typeof inc.growth.story.after==='string') out.growth.story.after=sanitizeString(inc.growth.story.after,1000) } if(typeof inc.growth.principle==='string') out.growth.principle=sanitizeString(inc.growth.principle,500) }
    if(Array.isArray(inc.projects)) out.projects=inc.projects.slice(0,12).map(p=>({ title:sanitizeString(p.title||'',80), desc:sanitizeString(p.desc||'',800), tech:Array.isArray(p.tech)?p.tech.slice(0,10).map(t=>sanitizeString(t,32)).filter(Boolean):[], learned:sanitizeString(p.learned||'',500), status:sanitizeString(p.status||'',64), links:{github:sanitizeUrl(p.links?.github||'#'), demo:sanitizeUrl(p.links?.demo||'#')}, image:sanitizeUrl(p.image||'') }))
    if(Array.isArray(inc.goals)) out.goals=inc.goals.slice(0,10).map(g=>({k:sanitizeString(g.k||'',32), v:sanitizeString(g.v||'',500)}))
    if(Array.isArray(inc.highlights)) out.highlights=inc.highlights.slice(0,20).map(h=>({title:sanitizeString(h.title||'',120), org:sanitizeString(h.org||'',120), date:sanitizeString(h.date||'',64), desc:sanitizeString(h.desc||'',800), link:sanitizeUrl(h.link||'')})).filter(h=>h.title)
    if(inc.personal){ if(Array.isArray(inc.personal.now)) out.personal.now=inc.personal.now.slice(0,10).map(s=>sanitizeString(s,200)).filter(Boolean); if(Array.isArray(inc.personal.learning)) out.personal.learning=inc.personal.learning.slice(0,10).map(s=>sanitizeString(s,200)).filter(Boolean); if(Array.isArray(inc.personal.improving)) out.personal.improving=inc.personal.improving.slice(0,10).map(s=>sanitizeString(s,200)).filter(Boolean) }
    if(inc.contact){ if(typeof inc.contact.email==='string') out.contact.email=sanitizeString(inc.contact.email,120); if(typeof inc.contact.github==='string') out.contact.github=sanitizeUrl(inc.contact.github); if(typeof inc.contact.note==='string') out.contact.note=sanitizeString(inc.contact.note,500) }
    savePortfolio(out); res.json({success:true, data:out})
  }catch(e){ console.error(e); res.status(500).json({error:'Save failed'}) }
})

// --- upload (protected, validated) ---
const storage=multer.diskStorage({ destination:(req,file,cb)=>cb(null,UPLOAD_DIR), filename:(req,file,cb)=>{ const ext=path.extname(file.originalname).toLowerCase(); const base=path.basename(file.originalname,ext).replace(/[^a-z0-9_-]/gi,'').slice(0,20)||'img'; cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${ext}`)} })
const ALLOWED=new Set(['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
const upload=multer({ storage, limits:{fileSize:2*1024*1024, files:1}, fileFilter:(req,file,cb)=>{ if(!ALLOWED.has(file.mimetype)) return cb(new Error('Invalid file type')); const ext=path.extname(file.originalname).toLowerCase(); if(!['.jpg','.jpeg','.png','.webp','.gif','.svg'].includes(ext)) return cb(new Error('Invalid extension')); cb(null,true) } })
app.post('/api/upload', requireAuth, requireCsrf, upload.single('image'), (req,res)=>{ if(!req.file) return res.status(400).json({error:'No file'}); res.json({url:`/uploads/${req.file.filename}`}) })
app.use('/uploads', express.static(UPLOAD_DIR, {maxAge:'1d'}))

// --- frontend: single origin so /admin can be server-protected in dev & prod ---
let vite
if(!isProd){
  const { createServer: createViteServer } = await import('vite')
  vite = await createViteServer({ server:{ middlewareMode:true }, appType:'spa' })
  // server-side guard for /admin HTML — do not rely on frontend hiding
  app.use((req,res,next)=>{
    if(req.path.startsWith('/admin') && !req.session.user){
      // for API already 401s; for page, redirect to login (server-side)
      if(req.path.startsWith('/api/')) return next()
      return res.redirect('/login')
    }
    next()
  })
  app.use(vite.middlewares)
} else {
  const dist=path.join(ROOT,'dist')
  if(fs.existsSync(dist)){
    app.get('/admin*', (req,res,next)=>{ if(!req.session.user) return res.status(401).send('Unauthorized — <a href="/login">login</a>'); next() })
    app.use(express.static(dist))
    app.get('*', (req,res)=>{ if(req.path.startsWith('/api/')) return res.status(404).json({error:'Not found'}); res.sendFile(path.join(dist,'index.html')) })
  }
}

app.use((err,req,res,next)=>{
  console.error(err)
  if(err instanceof multer.MulterError) return res.status(400).json({error: err.code==='LIMIT_FILE_SIZE'?'File too large (max 2MB)':'Upload error'})
  if(err.message==='Invalid file type'||err.message==='Invalid extension') return res.status(400).json({error:err.message})
  res.status(500).json({error:'Internal error'})
})

app.listen(PORT, ()=> console.log(`Server http://localhost:${PORT} env=${process.env.NODE_ENV} — /login public, /admin server-protected`))
