# parthm667.github.io

Personal site of Parth Mhaske, deployed to GitHub Pages.

Two routes, one React app:

- `/` — **the darkroom.** The room is dark because a darkroom is dark. It opens on a short film you scrub with your scroll, and behind that is a contact sheet of one roll — sixteen exposures covering research, robotics, low-latency systems, a bike, a heron and a crash. Every frame enlarges.
- `/public_remediation` — a standalone long-form page on street design and cycling safety. Linked from the three cycling frames (4, 6 and 8) and nowhere else; it is not in the rail.

Plus one plain-HTML page with no React at all:

- `/scavenger-hunt` — a view-source scavenger hunt for students learning HTML/CSS (static files in `public/scavenger-hunt/`, copied into the build verbatim; also unlinked)
- `/goose-chase` — the harder sequel: ten pieces of evidence chained so each one's puzzle is AES-encrypted under the previous one's answer, making it impossible to skip ahead. Built by `tools/build-goose-chase.mjs`; see `tools/README.md`

## The darkroom

**The concept never hides a fact.** A photograph is a bad way to state a
graduation year, so the page does not try. Immediately after the hero comes the
**data sheet**: the plain version, in the order a stranger asks for it, with five
selected numbers and the two links that matter. Every frame carries both a
`title` (the caption a photographer writes on the back of a print, which is what
the contact sheet shows) and a `subject` plus `role` (what the work actually was
and who it was for, which is what the work ledger and the enlargement lead with).

**There is no stock photography on this site.** All sixteen frames are drawn
procedurally in `src/darkroom/emulsion.js` — the heron is bezier curves, the
order book is a loop, the corpus is a grid of paper slips either side of a
decision boundary, the CAN bus is a scope trace with reflections off an
unterminated stub, and frame 6 is a night road with two thirds of the emulsion
removed by a `destination-out` composite. Only the portrait starts from a real
photograph.

A shared post-process then does what film does: a per-frame exposure stop, an
S-curve blended toward linear so the toe keeps its shadow detail, grain whose
amplitude peaks in the midtones, and a vignette painted *after* the grain so it
does not get speckled.

**The develop.** A print does not fade in — dense areas surface first and
highlights arrive last — so nothing here fades in. The sweep moves a *density
threshold*, not an alpha, with a per-pixel noise term to roughen the edge. The
tone curve and grain are baked once into a `Float32Array`, so per-frame work is
a threshold and a write. That also stops the grain crawling.

**Things to find.** The lights switch is a real light theme and also a small
disaster — turning the lights on in a darkroom fogs everything, and it says so
once. There is dust and hair on the page; move the cursor near a speck and it
goes, and there is a note if you get all thirteen. Hovering a frame gives you a
loupe that magnifies the frame's own canvas. Scrolling the opening film
backward un-develops the print, which chemistry does not allow and is the one
place this room cheats. And there is something in the console.

### Adding a frame

1. Add an entry to `ROLL` in `src/darkroom/roll.js` (`n`, `id`, `title`,
   `subject`, `role`, `kind`, `gen`, `exposure`, optional `keeper` / `note` /
   `damaged` / `stack`, and a `print` block for the enlargement).
2. If it needs a new picture, add a scene to `SCENES` in `emulsion.js` — draw in
   grayscale and the post-process handles the rest. Give it an `EXPOSURE` entry
   if it prints dark.
3. `STRIPS` slices the roll into strips of four, so keep the count a multiple of
   four or adjust that. `WORK` derives the work ledger from `kind === 'WORK'`.

## Stack

React 19 + Vite 7, `react-router-dom` for the two routes, `framer-motion`
(remediation page only), `lucide-react` icons. No CSS framework.

Three stylesheets, deliberately non-overlapping:

| File | Scope |
|---|---|
| `src/index.css` | shared reset only — nothing with a point of view |
| `src/darkroom/darkroom.css` | the landing page, scoped under `.dr` |
| `src/remediation/remediation.css` | the essay, scoped under `.rm` |

The darkroom's element-level rules go through `:where(.dr)` so they keep the
specificity of a bare type selector — writing them as `.dr p` would out-rank
every utility class in the file and invert the cascade.

The landing route self-hosts its four faces (Bebas / Inter Tight / a mono /
Caveat, in `public/fonts/`) and makes **no third-party request**; the essay
fetches its own Google faces when that route mounts. `<html data-room="darkroom">`
is set before first paint by an inline script in `index.html` so the safelight
never flickers, and removed when the route unmounts.

Client-side routing on GitHub Pages uses the
[spa-github-pages](https://github.com/rafgraph/spa-github-pages) redirect trick
(`public/404.html` + the restore script in `index.html`).

## Structure

```
index.html                  entry, meta, font preload, room settle script
public/
  fonts/                    the four self-hosted faces
  img/                      portrait + goose (the only two real images)
  scavenger-hunt/           standalone static page (own html/css/js)
  goose-chase/              the chained hunt, generated by tools/
tools/                      build-goose-chase.mjs and its notes
src/
  App.jsx                   routes
  index.css                 shared reset
  darkroom/                 the landing page
    Darkroom.jsx            the room: atmosphere, rail, composition, overlay state
    Film.jsx                NIGHT WORK — the scroll film
    Hero.jsx                the enlarger and the title it throws light across
    Sheet.jsx               reel of negatives, contact sheet, index of exposures
    Easel.jsx               a frame, enlarged, with its long-form content
    Rooms.jsx               data sheet, self, the work ledger, correspondence
    roll.js                 THE ROLL — sixteen frames and their prints
    content.js              the data sheet, results, bench, apparatus, channels
    emulsion.js             every photograph, and how it develops
    noir.js                 the film's one rAF loop
    engine.js               develop / loupe / reel / dust / tilt / lights hooks
    darkroom.css            two printings
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
