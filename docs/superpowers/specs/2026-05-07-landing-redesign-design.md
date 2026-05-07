# Landing page redesign — editorial spread

**Date:** 2026-05-07
**Status:** Approved
**Scope:** Full landing page (`/` route → `Portfolio.jsx`): Hero, About, Skills, Projects, Contact, Footer.

## Goal

Rebuild the landing page so it reads as the work of a senior frontend developer rather than an AI-generated template. Concretely: kill the repeating "bordered card on cream surface" pattern that appears in five sections, and replace it with editorial typography. Preserve the existing palette, font stack, section order, and information content.

## Non-goals

- No palette change. The `:root` token block in `index.css` (cream surfaces, deep teal accent, three-font stack) stays.
- No new dependencies, libraries, or framework changes.
- No content change to Skills entries, Projects entries, or Contact links.
- No change to Navbar, App, Portfolio, or routing — the new "Cycling" link to `/public_remediation` already added in `Navbar.jsx` stays as-is.
- No restructuring of section order or section IDs (anchor links keep working).

## Design principles

1. **One typographic move, repeated.** Serif (Newsreader) for headlines and emphasized phrases; mono (IBM Plex Mono) for micro-labels and inline metadata; sans (Manrope) for body. Never invent a fourth voice.
2. **Hairlines over fills.** A 1px line on one edge replaces a 4-edge bordered card wherever the content doesn't need a true container.
3. **Cards earn their place.** A card is justified only when items must be visually separated and there are too many to read as a list. Projects passes this test (9 items, dense). Hero "Current Focus," About meta, Skills, and Contact links do not.
4. **Whitespace is a structural element.** Replace fills with space. Section padding stays as-is; section content tightens up.

## Section-by-section design

### Hero (`Hero.jsx`)

**Delete:** the `<aside className="hero-panel">` block (lines 57–82) — three boxed bullets repeating info already in About.

**New shape (single column under `.hero-layout`):**

- Mono label: `Portfolio` (kept).
- Serif h1: `Parth Mhaske` (kept, scale to ~5rem at 1280px).
- Serif italic role line: `Software engineer building across quant systems, robotics, and research computing.` (~1.6rem, max-width ~28ch).
- Sans bio paragraph (kept verbatim).
- Inline fact row: `College Park, MD · SWE Intern @ Corsha · University of Maryland` — middot-separated, mono, ~0.85rem, no icons, no boxes. (Replaces the current `.hero-facts` chip row and applies the role copy update.)
- CTA row: primary pill `View Work →` plus plain underlined link `Contact`. Drop the second pill (`btn-o Contact`) — two pills feel template-y; a pill + link is more confident.
- Social row: `GitHub · LinkedIn · Photography · Email` — middot-separated, no icons, ~0.85rem.

**CSS:** `.hero-layout` becomes single-column; remove `.hero-panel` and child rules; replace `.hero-facts/.fact` chip styling with `.hero-meta` middot row; replace `.hero-soc/.soc-link` icon-button styling with `.hero-soc-inline` text row.

### About (`About.jsx`)

**Delete:** the `.about-meta` 4-card grid (lines 30–59).

**New shape:**

- Photo column unchanged in size, but loses heavy `box-shadow: var(--shadow-soft)` and visible border. Keeps the rounded crop and aspect ratio.
- Right column: keep the `lbl` + `h2 "Who I am"` opening unchanged.
- Three prose paragraphs:
  1. `I am Parth Mhaske, a software engineer and student building across quant systems, robotics, and simulation-heavy research.` (kept verbatim)
  2. `Currently SWE Intern @ Corsha, where I work on backend development for OT authentication systems.` (option **b**, copy locked from resume)
  3. `My recent work spans low-latency trading infrastructure, autonomous robotics control, and computational modeling projects in academic research environments.` (kept verbatim)
- **Definition list** replacing the meta grid. Top hairline, bottom hairline, no per-row borders. Two columns: mono uppercase label (`width: ~9.5rem`), sans value:
  - `LOCATION` — College Park, Maryland
  - `STATUS` — Looking for internship opportunities
  - `EDUCATION` — University of Maryland — Computer Science and Applied Mathematics
  - `FOCUS` — Robotics · Research Computing · Quant Systems
- Action row: `Resume ↗` (primary pill) + `Photo Portfolio →` (plain link). The Resume button switches from `download` attribute to `target="_blank" rel="noreferrer"`.

**CSS:** introduce `.dl` (display:grid; grid-template-columns: 9.5rem 1fr; row-gap: 0.75rem) and `.dl-label` (mono uppercase, 0.7rem). Top/bottom hairlines as `border-top` / `border-bottom` on `.dl`. Mobile (<860px): collapse to single column, label sits above value, smaller row gap.

### Skills (`Skills.jsx`)

**Delete:** the `.skills-grid` of 5 `.skill-card` elements.

**New shape:** typographic table, no card chrome, no icons, no tag pills.

```
LANGUAGES        Python · JavaScript · Java · C++ · C · R · HTML/CSS · LaTeX
LIBRARIES        NumPy · SciPy · scikit-learn · pandas · Matplotlib · TensorFlow
TOOLS            Git · GitHub · Jupyter · Linux/Bash · REST APIs · Optuna
TECHNICAL AREAS  Monte Carlo Simulation · ODE Modeling · PID Control · A* Pathfinding · Logistic Regression · K-means Clustering
PUBLIC REPO      Jupyter Notebook · Python · JavaScript
```

Same `.dl` pattern as About. Render skills inline with middot separators, not as `<span class="tag">` chips.

**CSS:** reuse `.dl` from About. Drop `.skills-grid`, `.skill-card`, `.skill-head`, `.skill-icon`, `.sk-tags`. Drop `lucide-react` icon imports from `Skills.jsx`.

### Projects (`Projects.jsx`)

**Keep:** `projects` data array, `KindIcon` component, kind tag visual treatment (color-coded info that earns its container).

**Replace card visual:**

- Remove `border` (all 4 edges), `background` fill, `box-shadow`, `padding` of card.
- Add: `border-left: 1px solid var(--line)`, `padding: 0.25rem 0 0.25rem 1.4rem`, `gap: 0.6rem`.
- Title: `font-family: var(--serif)`, `font-size: 1.18rem`, `line-height: 1.3` (up from 1.02rem sans).
- Stack: drop `.tag` chips, render as middot-separated mono text in `--ink-soft`.
- Kind tag stays in `.proj-head`, links stay on the right.
- Hover: subtle `border-left-color` shift to `--accent` (acts as the affordance instead of card lift).

**Layout:** 2-column grid (`grid-template-columns: repeat(2, minmax(0, 1fr))`) with `gap: 2rem 3rem`. Mobile: single column, `gap: 1.6rem`.

### Contact (`Contact.jsx`)

**Delete:** the `.ct-link` boxed-row pattern (lines 58–67) and its `.ct-icon` circular icon chip.

**New shape:**

- Keep the section heading, lbl, sub paragraph, `ct-info h3`, intro paragraph.
- Replace 3 boxed rows with 3 plain typographic rows:
  - Each row: `display: flex; justify-content: space-between; align-items: baseline; padding: 0.85rem 0; border-bottom: 1px solid var(--line);` first row gets `border-top` too.
  - Left side: `<strong>Email</strong>` (or LinkedIn / GitHub) in sans bold, mono `value` immediately after on the same row.
  - Right side: trailing `→` arrow.
  - Hover: row background lightens to `--surface-strong`, no border movement.
- Form: keep structure and behavior. Visual: remove `box-shadow`, switch border to single hairline (`1px solid var(--line)`), reduce `border-radius` from `--radius-lg` (14px) to `--radius-md` (12px), thin out the inputs slightly.

### Footer (`Footer.jsx`)

No structural changes. CSS-only: increase top padding from `1.8rem` to `2.6rem` to give the page a quieter exit.

## CSS strategy

`index.css` rewrite scope: **~50% of file**. Sections rewritten:

- `.hero-*` block (drop panel, simplify facts/socials)
- `.about-*` block (drop meta-grid, add dl pattern, flatten photo)
- `.skills-*` block (entirely replaced by `.dl` reuse)
- `.proj-*` block (card visuals only; structure kept)
- `.ct-link*` block (replaced by row pattern)
- `.ct-form/.fg/.sent-card` block (flatten, no behavioral change)
- `@media` blocks: update for new selectors, keep breakpoints (1024px, 860px, 640px)

Sections **kept verbatim**: `:root` tokens, `*` reset, `body`, `.container`, `.section`, `.lbl`, `.h2`, `.sub`, `.btn/.btn-p/.btn-o`, `.tag` (still used in some places), `.navbar`, `.nav-shell`, `.nav-logo`, `.nav-links`, `.nav-resume`, `.hamburger`, `.footer`.

New utilities introduced:

- `.dl` — definition-list grid, used by About and Skills.
- `.middot-row` — inline list with middot separators, used by hero facts/socials, project stack, skills values.

## Component file changes

| File                | Change                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Hero.jsx`          | Remove panel aside; rewrite hero-facts as middot row; rewrite hero-soc as text-only middot row; drop one CTA; role copy |
| `About.jsx`         | Replace meta-grid with `.dl`; update Corsha paragraph (option a); switch Resume button from `download` to `target=_blank` |
| `Skills.jsx`        | Replace card grid with `.dl`; drop icon imports                                                                          |
| `Projects.jsx`      | Replace card visuals (CSS class names stay or get suffixed); data unchanged                                              |
| `Contact.jsx`       | Replace `.ct-link` boxed rows with flat row pattern                                                                      |
| `Footer.jsx`        | No JSX change                                                                                                            |
| `index.css`         | ~50% rewrite per CSS strategy section                                                                                    |
| `Navbar.jsx`        | Unchanged (already updated with Cycling link in prior task)                                                              |

## Resume button behavior change

Both occurrences of resume links audited:

- `Navbar.jsx` line 65: already `target="_blank" rel="noreferrer"` — no change needed.
- `About.jsx` line 62: currently `<a href="/resume.pdf" download className="btn btn-p">`. Change to `<a href="/resume.pdf" target="_blank" rel="noreferrer" className="btn btn-p">`. Icon switches from `Download` to `ArrowUpRight` (or kept as `FileText` for consistency with navbar — final pick during impl).

## Verification

1. `npm run build` — must succeed without warnings.
2. `npm run lint` — must pass.
3. Dev server smoke test: load `/`, scroll through all sections, verify no console errors.
4. Visual check at 1280px and 375px — compare against existing screenshots in repo root for regressions on layout, palette, font sizes.
5. Anchor link smoke test: clicking each navbar link (`#about`, `#skills`, `#projects`, `#contact`) scrolls to the right section.
6. Resume link smoke test: clicking Resume in About opens `/resume.pdf` in a new tab (not a download).
7. Cycling link still routes to `/public_remediation`.

## Out of scope (explicitly)

- Animation, transitions beyond what already exists (e.g. nav scroll fade).
- Dark mode.
- Any change to the `/public_remediation` cycling site.
- New copy for projects, skills, or contact — only Hero/About copy changes.
- New icons or icon library.
