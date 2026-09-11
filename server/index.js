import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import bcrypt from 'bcryptjs'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import cors from 'cors'
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

// ensure upload dir
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

// ---------- security headers ----------
app.use(helmet({
  contentSecurityPolicy: false, // allow Vite dev, enable in prod if needed
  crossOriginEmbedderPolicy: false,
}))
app.use(cookieParser())

// CORS for dev Vite
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ---------- session ----------
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error('SESSION_SECRET must be at least 32 chars. Check .env')
  process.exit(1)
}
app.use(session({
  name: 'portfolio.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 2, // 2h
  }
}))

// ---------- helpers ----------
function getCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex')
  }
  return req.session.csrfToken
}
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
function requireCsrf(req, res, next) {
  // safe methods skip
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const token = req.headers['x-csrf-token']
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  next()
}
function sanitizeString(str, max = 2000) {
  if (typeof str !== 'string') return ''
  let s = str.trim().slice(0, max)
  // strip html tags
  s = s.replace(/<[^>]*>/g, '')
  return s
}
function sanitizeUrl(str) {
  if (typeof str !== 'string') return '#'
  const u = str.trim().slice(0, 500)
  if (u === '' || u === '#') return '#'
  // allow http/https, mailto, or relative
  if (/^(https?:\/\/|mailto:|#|\/)/.test(u)) {
    // also strip < >
    return u.replace(/[<>"']/g, '')
  }
  return '#'
}

function loadPortfolio() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load portfolio', e)
    return null
  }
}
function savePortfolio(data) {
  const tmp = DATA_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, DATA_PATH)
}

// ---------- rate limit for login ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, try again later' }
})

// ---------- auth routes ----------
app.get('/api/csrf-token', (req, res) => {
  const token = getCsrfToken(req)
  res.json({ csrfToken: token })
})

app.get('/api/auth/me', (req, res) => {
  if (req.session.user) {
    return res.json({ authenticated: true, user: req.session.user, csrfToken: req.session.csrfToken })
  }
  res.json({ authenticated: false })
})

app.post('/api/auth/login', loginLimiter, body('username').isString().trim().isLength({ min: 1, max: 64 }), body('password').isString().isLength({ min: 1, max: 128 }), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input' })
  const { username, password } = req.body
  const expectedUser = process.env.ADMIN_USERNAME
  const expectedHash = process.env.ADMIN_PASSWORD_HASH
  if (!expectedUser || !expectedHash) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }
  if (username !== expectedUser) {
    // still hash compare to mitigate timing, but we can just fail
    await bcrypt.compare(password, expectedHash) // burn time
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const ok = await bcrypt.compare(password, expectedHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  // regenerate session to prevent fixation
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Login failed' })
    req.session.user = { username }
    req.session.csrfToken = crypto.randomBytes(32).toString('hex')
    req.session.save((e) => {
      if (e) return res.status(500).json({ error: 'Login failed' })
      res.json({ success: true, csrfToken: req.session.csrfToken })
    })
  })
})

app.post('/api/auth/logout', requireAuth, requireCsrf, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' })
    res.clearCookie('portfolio.sid')
    res.json({ success: true })
  })
})

// ---------- portfolio public ----------
app.get('/api/portfolio', (req, res) => {
  const data = loadPortfolio()
  if (!data) return res.status(500).json({ error: 'Failed to load' })
  res.json(data)
})

// ---------- portfolio protected save ----------
function validatePortfolioPayload(req, res, next) {
  // we will sanitize manually instead of strict validation to allow flexible content
  // but we check types
  const data = req.body
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Invalid payload' })
  next()
}

app.put('/api/portfolio', requireAuth, requireCsrf, validatePortfolioPayload, (req, res) => {
  try {
    const incoming = req.body
    // sanitize all string fields deeply but preserve structure
    const current = loadPortfolio()
    if (!current) return res.status(500).json({ error: 'Load failed' })

    // build sanitized copy
    const out = JSON.parse(JSON.stringify(current)) // start from current to keep shape

    // simple sanitizers per section
    if (typeof incoming.name === 'string') out.name = sanitizeString(incoming.name, 64)
    if (incoming.hero) {
      if (typeof incoming.hero.subtitle === 'string') out.hero.subtitle = sanitizeString(incoming.hero.subtitle, 500)
      if (typeof incoming.hero.status === 'string') out.hero.status = sanitizeString(incoming.hero.status, 200)
    }
    if (incoming.about) {
      if (Array.isArray(incoming.about.paragraphs)) out.about.paragraphs = incoming.about.paragraphs.slice(0, 5).map(p => sanitizeString(p, 1000)).filter(Boolean)
      if (Array.isArray(incoming.about.traits)) out.about.traits = incoming.about.traits.slice(0, 8).map(t => sanitizeString(t, 64)).filter(Boolean)
    }
    if (Array.isArray(incoming.whatIDo)) {
      out.whatIDo = incoming.whatIDo.slice(0, 6).map(card => ({
        id: sanitizeString(card.id || '', 32).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'item',
        label: sanitizeString(card.label || '', 32),
        title: sanitizeString(card.title || '', 64),
        desc: sanitizeString(card.desc || '', 500),
        tags: Array.isArray(card.tags) ? card.tags.slice(0, 6).map(t => sanitizeString(t, 32)).filter(Boolean) : [],
        icon: sanitizeString(card.icon || '◈', 4),
      }))
    }
    if (Array.isArray(incoming.strengths)) {
      out.strengths = incoming.strengths.slice(0, 6).map(s => ({
        title: sanitizeString(s.title || '', 64),
        desc: sanitizeString(s.desc || '', 500),
        detail: sanitizeString(s.detail || '', 64),
      }))
    }
    if (incoming.growth) {
      if (typeof incoming.growth.title === 'string') out.growth.title = sanitizeString(incoming.growth.title, 120)
      if (incoming.growth.story) {
        if (typeof incoming.growth.story.before === 'string') out.growth.story.before = sanitizeString(incoming.growth.story.before, 1000)
        if (typeof incoming.growth.story.work === 'string') out.growth.story.work = sanitizeString(incoming.growth.story.work, 1000)
        if (typeof incoming.growth.story.after === 'string') out.growth.story.after = sanitizeString(incoming.growth.story.after, 1000)
      }
      if (typeof incoming.growth.principle === 'string') out.growth.principle = sanitizeString(incoming.growth.principle, 500)
    }
    if (Array.isArray(incoming.projects)) {
      out.projects = incoming.projects.slice(0, 12).map(p => ({
        title: sanitizeString(p.title || '', 80),
        desc: sanitizeString(p.desc || '', 800),
        tech: Array.isArray(p.tech) ? p.tech.slice(0, 10).map(t => sanitizeString(t, 32)).filter(Boolean) : [],
        learned: sanitizeString(p.learned || '', 500),
        status: sanitizeString(p.status || '', 64),
        links: {
          github: sanitizeUrl(p.links?.github || '#'),
          demo: sanitizeUrl(p.links?.demo || '#'),
        },
        image: sanitizeUrl(p.image || ''),
      }))
    }
    if (Array.isArray(incoming.goals)) {
      out.goals = incoming.goals.slice(0, 10).map(g => ({
        k: sanitizeString(g.k || '', 32),
        v: sanitizeString(g.v || '', 500),
      }))
    }
    if (Array.isArray(incoming.highlights)) {
      out.highlights = incoming.highlights.slice(0, 20).map(h => ({
        title: sanitizeString(h.title || '', 120),
        org: sanitizeString(h.org || '', 120),
        date: sanitizeString(h.date || '', 64),
        desc: sanitizeString(h.desc || '', 800),
        link: sanitizeUrl(h.link || ''),
      })).filter(h => h.title)
    }
    if (incoming.personal) {
      if (Array.isArray(incoming.personal.now)) out.personal.now = incoming.personal.now.slice(0, 10).map(s => sanitizeString(s, 200)).filter(Boolean)
      if (Array.isArray(incoming.personal.learning)) out.personal.learning = incoming.personal.learning.slice(0, 10).map(s => sanitizeString(s, 200)).filter(Boolean)
      if (Array.isArray(incoming.personal.improving)) out.personal.improving = incoming.personal.improving.slice(0, 10).map(s => sanitizeString(s, 200)).filter(Boolean)
    }
    if (incoming.contact) {
      if (typeof incoming.contact.email === 'string') out.contact.email = sanitizeString(incoming.contact.email, 120)
      if (typeof incoming.contact.github === 'string') out.contact.github = sanitizeUrl(incoming.contact.github)
      if (typeof incoming.contact.note === 'string') out.contact.note = sanitizeString(incoming.contact.note, 500)
    }

    savePortfolio(out)
    res.json({ success: true, data: out })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Save failed' })
  }
})

// ---------- upload ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || 'img'
    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${ext}`
    cb(null, name)
  }
})
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new Error('Invalid file type'))
    const ext = path.extname(file.originalname).toLowerCase()
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) return cb(new Error('Invalid extension'))
    cb(null, true)
  }
})

app.post('/api/upload', requireAuth, requireCsrf, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const url = `/uploads/${req.file.filename}`
  res.json({ url })
})

// serve uploads
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d', immutable: false }))

// ---------- production: serve frontend ----------
if (isProd) {
  const distPath = path.join(ROOT, 'dist')
  if (fs.existsSync(distPath)) {
    // protect /admin HTML server-side: require auth, else 401
    app.get('/admin*', (req, res, next) => {
      if (!req.session.user) return res.status(401).send('Unauthorized — please login at /login')
      next()
    })
    app.use(express.static(distPath))
    // SPA fallback: serve index.html for non-api routes
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }
}

// ---------- error handler (no sensitive leak) ----------
app.use((err, req, res, next) => {
  console.error(err)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 2MB)' })
    return res.status(400).json({ error: 'Upload error' })
  }
  if (err.message === 'Invalid file type' || err.message === 'Invalid extension') {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: 'Internal error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} env=${process.env.NODE_ENV}`)
})
