# parthm667.github.io

Personal site of Parth Mhaske, deployed to GitHub Pages.

Two routes, one React app:

- `/` — portfolio (hero, about, skills, projects, contact)
- `/public_remediation` — a standalone long-form page on street design and cycling safety (intentionally unlinked from the portfolio; reachable only by direct URL)

## Stack

React 19 + Vite 7, `react-router-dom` for the two routes, `framer-motion` (remediation page only), `lucide-react` icons. No CSS framework — hand-written styles in `src/index.css` (portfolio) and `src/remediation/remediation.css` (scoped under `.rm`).

Client-side routing on GitHub Pages uses the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) redirect trick (`public/404.html` + the restore script in `index.html`).

## Structure

```
index.html                  entry + meta/fonts
public/                     static assets (resume, photos, favicon)
src/
  App.jsx                   routes
  Portfolio.jsx             landing page composition
  components/               portfolio sections (Navbar, Hero, About, ...)
  index.css                 portfolio styles + design tokens
  remediation/              the /public_remediation page
    sections/               page sections
    interactive/            charts, sliders, counters
    remediation.css         scoped styles
```

## Develop

```sh
npm install
npm run dev       # local dev server
npm run lint      # eslint
npm run build     # production build to dist/
npm run deploy    # build + publish dist/ to the gh-pages branch
```
