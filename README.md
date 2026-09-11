# Personal Portfolio — Quiet Builder. Steady Improver.

Modern dark portfolio built with Vite + React + Tailwind CSS 4. Designed to feel like a real identity — not a generic template.

## Run

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
npm run preview
```

## Edit your info — one file

All personal content lives in `src/data.js`:

- `siteData.name` — your name (shown in hero)
- `siteData.hero` — subtitle & status pill
- `siteData.about` — paragraphs & traits
- `siteData.whatIDo` — 4 cards (Arduino, Basketball, Football, Art)
- `siteData.strengths` — 4 strengths
- `siteData.growth` — basketball footwork story (Before → Practice → Progress)
- `siteData.projects` — 3 placeholder cards (title, desc, tech, learned, links)
- `siteData.goals` — Learn / Build / Improve / Repeat
- `siteData.highlights` — leave empty until you have real awards (no fake entries)
- `siteData.personal` — Right now / Learning / Improving
- `siteData.contact` — email + GitHub (add more links as needed)

> No achievements, awards, or backstories are fabricated. Empty sections show an inviting placeholder instead.

## Structure

- `src/App.jsx` — all sections (Hero, About, Work, Strengths, Growth, Projects, Goals, Highlights, Personal, Footer)
- `src/index.css` — Tailwind + reveal animations + dark theme
- `src/hooks/useReveal.js` — IntersectionObserver scroll-reveal
- `src/data.js` — single source of truth for copy

## Design

- Dark neutral theme (`#0c0c0e` / `#161618`), yellow accent `#facc15`, blue secondary
- Space Grotesk + Inter + JetBrains Mono
- Subtle grid, radial glows, card hovers, scroll-reveal, smooth scroll
- Fully responsive (mobile nav, stacked grids)
