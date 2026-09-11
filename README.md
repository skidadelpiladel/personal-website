# Personal Portfolio — Quiet Builder. Steady Improver.

Modern dark portfolio with **private editing system** — Vite + React + Tailwind 4 + Express.

## Quick start

```bash
npm install
# set secrets (first time)
# .env already contains dev defaults — see .env.example
# generate your own password hash:
npm run hash your_new_password

# run both server + client (recommended)
npm run dev
# → client http://localhost:5173
# → server http://localhost:3001

# or run separately
npm run dev:server
npm run dev:client
```

Build for production:
```bash
npm run build
npm start          # serves dist via Express on PORT (default 3001)
```

## Public site

- `/` — portfolio (fetches `/api/portfolio`, falls back to `src/data.js` if server offline)
- No admin controls visible to visitors

## Private editing

- `/login` — admin login (server-side session, bcrypt, rate-limited)
- `/admin` — dashboard with tabs: Overview / Portfolio / Projects / Highlights / Contact

What you can edit without code:
- Name, hero subtitle/status, about paragraphs/traits
- Interests (whatIDo), strengths, growth story, goals, personal (now/learning/improving)
- Projects: title, desc, tech tags, learned, status, GitHub/demo links, image (upload 2MB max, jpg/png/webp/gif/svg)
- Highlights/achievements, contact email/github/note

Changes save to `server/data/portfolio.json` via `PUT /api/portfolio` (auth + CSRF protected) and persist after refresh. Images go to `public/uploads/`.

### Default credentials (dev)

- Username: `admin`
- Password: `Admin123!`  — hash in `.env` → `ADMIN_PASSWORD_HASH`
- Change immediately: `npm run hash MyStrongPass123!` → copy hash to `.env` → restart server

## Security architecture

- **Stack**: Express 5, express-session (httpOnly, SameSite=strict, Secure via `COOKIE_SECURE`), bcryptjs, helmet, CORS, express-rate-limit, multer, express-validator
- **Secrets**: never in frontend — `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` in `.env` (gitignored, see `.env.example`)
- **Auth**: `POST /api/auth/login` validates via `bcrypt.compare`, regenerates session (fixation protection), stores `req.session.user`; `GET /api/auth/me` checks session; `POST /api/auth/logout` requires auth+CSRF
- **CSRF**: per-session token via `GET /api/csrf-token`; client sends `x-csrf-token` header; server middleware `requireCsrf` checks for all mutating routes
- **Rate limit**: login 10 / 15min per IP
- **Validation/sanitize**: all fields stripped of `<>` tags, length-capped, URLs validated (`http/https/mailto/#/relative` only); file uploads: MIME + extension whitelist, max 2MB, random filename, served via `express.static`
- **Helmet**: `X-Content-Type-Options: nosniff` etc.; generic error messages (no stack leak)
- **Route protection**: `requireAuth` on `PUT /api/portfolio` and `POST /api/upload`; in production `GET /admin*` checks `req.session.user` before serving `dist`
- **XSS/injection mitigation**: React escapes, server sanitizes, no DB injection (JSON file, atomic write via tmp+rename)

## Files

- `server/index.js` — Express + security middleware + API + upload + prod static serving
- `server/data/portfolio.json` — persisted portfolio (editable via admin, not via code)
- `server/scripts/generate-hash.js` — `node server/scripts/generate-hash.js <pwd>`
- `src/data.js` — static fallback for offline dev
- `src/lib/api.js` — CSRF-aware fetch helpers
- `src/pages/Login.jsx` / `src/pages/Admin.jsx` — private UI (responsive, forms, not shown publicly)
- `src/App.jsx` — public portfolio (data-driven, `usePortfolio` fetches `/api/portfolio`)
- `vite.config.js` — proxies `/api` + `/uploads` to server in dev

## Design

- Dark `#0c0c0e` / `#161618`, yellow `#facc15`, blue secondary, Space Grotesk + Inter + JetBrains Mono, grid+glow, reveal animations, fully responsive
