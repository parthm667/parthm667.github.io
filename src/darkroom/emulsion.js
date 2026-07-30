/* =============================================================
   emulsion.js — the photographs, and how they develop.

   Every frame on the roll is drawn here, in grayscale, by hand.
   Nothing is a stock image. A shared post-process then does what
   an emulsion does: an S-curve, grain that peaks in the midtones,
   a vignette, and bloom in the highlights.

   The same code develops a print. A print does not fade in — the
   dense (dark) areas surface first and the highlights arrive last,
   through a grainy threshold. So `t` sweeps a density threshold
   rather than an alpha, which is why it reads as chemistry and not
   as a CSS transition.
   ============================================================= */

const TAU = Math.PI * 2

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── assets ────────────────────────────────────────────────── */
const ASSETS = {}
let assetsReady = null
export function loadAssets() {
  if (assetsReady) return assetsReady
  const want = { portrait: '/img/parth-photo.webp', goose: '/img/goose.png' }
  assetsReady = Promise.all(
    Object.entries(want).map(
      ([k, src]) =>
        new Promise((res) => {
          const im = new Image()
          im.crossOrigin = 'anonymous'
          im.onload = () => { ASSETS[k] = im; res() }
          im.onerror = () => res()
          im.src = src
        })
    )
  )
  return assetsReady
}

/* ── scene helpers (all grayscale, 0–255) ──────────────────── */
const gray = (v) => `rgb(${v|0},${v|0},${v|0})`

function sky(ctx, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, gray(top)); g.addColorStop(1, gray(bottom))
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
}

function mist(ctx, w, h, r, bands, lo, hi) {
  for (let i = 0; i < bands; i++) {
    const y = r() * h, hh = h * (0.02 + r() * 0.07)
    const g = ctx.createLinearGradient(0, y, 0, y + hh)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.5, `rgba(255,255,255,${lo + r() * (hi - lo)})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g; ctx.fillRect(0, y, w, hh)
  }
}

function reeds(ctx, w, h, r, n, base, tone) {
  ctx.strokeStyle = gray(tone); ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const x = r() * w, len = h * (0.12 + r() * 0.24), lean = (r() - 0.5) * w * 0.05
    ctx.lineWidth = Math.max(0.6, w * 0.0022 * (0.5 + r()))
    ctx.beginPath(); ctx.moveTo(x, base)
    ctx.quadraticCurveTo(x + lean * 0.5, base - len * 0.6, x + lean, base - len)
    ctx.stroke()
  }
}

/* A graticule, for the frames that are really instruments. */
function graticule(ctx, w, h, cols, rows, a) {
  ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 0.6
  for (let i = 1; i < cols; i++) {
    ctx.beginPath(); ctx.moveTo((w / cols) * i, 0); ctx.lineTo((w / cols) * i, h); ctx.stroke()
  }
  for (let i = 1; i < rows; i++) {
    ctx.beginPath(); ctx.moveTo(0, (h / rows) * i); ctx.lineTo(w, (h / rows) * i); ctx.stroke()
  }
}

/* ── the scenes ────────────────────────────────────────────── */
const SCENES = {
  /* A photograph of a person, treated the way a darkroom would:
     contrast up, warmth out. */
  portrait(ctx, w, h) {
    const im = ASSETS.portrait
    sky(ctx, w, h, 26, 12)
    if (!im) return
    const s = Math.max(w / im.width, h / im.height)
    const dw = im.width * s, dh = im.height * s
    ctx.drawImage(im, (w - dw) / 2, (h - dh) * 0.16, dw, dh)
  },

  /* Great blue heron. Standing in flat water at dawn, which is the
     only time they let you close. */
  heron(ctx, w, h) {
    const r = rng(7)
    sky(ctx, w, h, 208, 150)
    const wl = h * 0.72
    // water
    const g = ctx.createLinearGradient(0, wl, 0, h)
    g.addColorStop(0, gray(120)); g.addColorStop(1, gray(58))
    ctx.fillStyle = g; ctx.fillRect(0, wl, w, h - wl)
    mist(ctx, w, wl, r, 7, 0.05, 0.16)
    // far bank
    ctx.fillStyle = gray(88); ctx.fillRect(0, wl - h * 0.045, w, h * 0.045)
    reeds(ctx, w, h, r, 26, wl, 46)
    // ripples
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = Math.max(0.5, w * 0.0015)
    for (let i = 0; i < 16; i++) {
      const y = wl + r() * (h - wl), x = r() * w, len = w * (0.04 + r() * 0.14)
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke()
    }
    // the bird — silhouette, facing left
    const bx = w * 0.62, by = wl
    const S = h / 100
    ctx.fillStyle = gray(16)
    ctx.strokeStyle = gray(16); ctx.lineCap = 'round'
    // legs
    ctx.lineWidth = Math.max(0.8, S * 0.9)
    ctx.beginPath(); ctx.moveTo(bx - S * 2, by); ctx.lineTo(bx - S * 1, by - S * 15); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx + S * 3, by); ctx.lineTo(bx + S * 1, by - S * 15); ctx.stroke()
    // body
    ctx.beginPath()
    ctx.ellipse(bx, by - S * 21, S * 10, S * 6.5, -0.14, 0, TAU)
    ctx.fill()
    // tail
    ctx.beginPath()
    ctx.moveTo(bx + S * 8, by - S * 22)
    ctx.lineTo(bx + S * 19, by - S * 18)
    ctx.lineTo(bx + S * 8, by - S * 17)
    ctx.closePath(); ctx.fill()
    // neck — the S
    ctx.lineWidth = S * 2.6
    ctx.beginPath()
    ctx.moveTo(bx - S * 5, by - S * 24)
    ctx.bezierCurveTo(bx - S * 12, by - S * 30, bx - S * 3, by - S * 36, bx - S * 7, by - S * 43)
    ctx.stroke()
    // head + beak
    ctx.beginPath(); ctx.ellipse(bx - S * 7.6, by - S * 45, S * 3.1, S * 2.4, -0.2, 0, TAU); ctx.fill()
    ctx.beginPath()
    ctx.moveTo(bx - S * 10, by - S * 45.4)
    ctx.lineTo(bx - S * 21, by - S * 43.4)
    ctx.lineTo(bx - S * 10, by - S * 43.6)
    ctx.closePath(); ctx.fill()
    // crest
    ctx.lineWidth = S * 0.7
    ctx.beginPath(); ctx.moveTo(bx - S * 5.6, by - S * 46.6); ctx.lineTo(bx + S * 1, by - S * 49); ctx.stroke()
    // reflection
    ctx.save(); ctx.globalAlpha = 0.20
    ctx.translate(0, by * 2); ctx.scale(1, -1)
    ctx.beginPath(); ctx.ellipse(bx, by - S * 21, S * 10, S * 6.5, -0.14, 0, TAU); ctx.fill()
    ctx.restore()
  },

  /* Barred owl on a limb. Mostly a shape and two eyes. */
  owl(ctx, w, h) {
    const r = rng(19)
    sky(ctx, w, h, 62, 22)
    // out-of-focus branches behind
    ctx.strokeStyle = 'rgba(255,255,255,.06)'
    for (let i = 0; i < 9; i++) {
      ctx.lineWidth = w * (0.004 + r() * 0.012)
      ctx.beginPath(); ctx.moveTo(r() * w, -10)
      ctx.quadraticCurveTo(r() * w, h * 0.5, r() * w, h + 10); ctx.stroke()
    }
    const S = h / 100, cx = w * 0.5, base = h * 0.80
    // the limb
    ctx.strokeStyle = gray(30); ctx.lineWidth = S * 5; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(0, base + S * 5); ctx.quadraticCurveTo(w * 0.5, base - S * 2, w, base + S * 8); ctx.stroke()
    // body
    ctx.fillStyle = gray(34)
    ctx.beginPath(); ctx.ellipse(cx, base - S * 20, S * 15, S * 21, 0, 0, TAU); ctx.fill()
    // head
    ctx.beginPath(); ctx.ellipse(cx, base - S * 40, S * 15.5, S * 13.5, 0, 0, TAU); ctx.fill()
    // ear tufts
    ctx.beginPath(); ctx.moveTo(cx - S * 13, base - S * 49); ctx.lineTo(cx - S * 17, base - S * 60); ctx.lineTo(cx - S * 7, base - S * 51); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(cx + S * 13, base - S * 49); ctx.lineTo(cx + S * 17, base - S * 60); ctx.lineTo(cx + S * 7, base - S * 51); ctx.closePath(); ctx.fill()
    // facial discs
    ctx.fillStyle = gray(52)
    ctx.beginPath(); ctx.ellipse(cx - S * 6.4, base - S * 41, S * 6.2, S * 7.4, 0, 0, TAU); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx + S * 6.4, base - S * 41, S * 6.2, S * 7.4, 0, 0, TAU); ctx.fill()
    // eyes
    ctx.fillStyle = gray(8)
    ctx.beginPath(); ctx.ellipse(cx - S * 6.4, base - S * 41, S * 3.5, S * 3.9, 0, 0, TAU); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx + S * 6.4, base - S * 41, S * 3.5, S * 3.9, 0, 0, TAU); ctx.fill()
    ctx.fillStyle = gray(190)
    ctx.beginPath(); ctx.arc(cx - S * 5.2, base - S * 42.4, S * 1.1, 0, TAU); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + S * 7.6, base - S * 42.4, S * 1.1, 0, TAU); ctx.fill()
    // beak
    ctx.fillStyle = gray(120)
    ctx.beginPath(); ctx.moveTo(cx, base - S * 36); ctx.lineTo(cx - S * 2, base - S * 32); ctx.lineTo(cx + S * 2, base - S * 32); ctx.closePath(); ctx.fill()
    // breast barring
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = S * 0.9
    for (let i = 0; i < 9; i++) {
      const y = base - S * 32 + i * S * 3.4
      ctx.beginPath(); ctx.moveTo(cx - S * 12, y); ctx.quadraticCurveTo(cx, y + S * 2, cx + S * 12, y); ctx.stroke()
    }
  },

  /* The goose. His drawing, treated as evidence. */
  goose(ctx, w, h) {
    sky(ctx, w, h, 40, 16)
    // lined-paper feel from the case files
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1
    for (let y = h * 0.1; y < h; y += h * 0.09) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    const im = ASSETS.goose
    if (im) {
      const s = Math.min(w / im.width, h / im.height) * 0.82
      const dw = im.width * s, dh = im.height * s
      ctx.globalAlpha = 0.96
      ctx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh)
      ctx.globalAlpha = 1
    }
    // evidence markers
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = Math.max(1, w * 0.004)
    const bx = w * 0.5, by = h * 0.5, bw = w * 0.34, bh = h * 0.34
    for (const [sx, sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
      const cx = bx + sx * bw, cy = by + sy * bh, L = w * 0.05
      ctx.beginPath(); ctx.moveTo(cx, cy - sy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx - sx * L, cy); ctx.stroke()
    }
  },

  /* 4,000 landings, plotted as a long exposure of touchdowns. */
  dispersion(ctx, w, h) {
    const r = rng(11)
    sky(ctx, w, h, 18, 8)
    const cx = w * 0.5, cy = h * 0.52, S = Math.min(w, h) / 7
    // deck rings
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = Math.max(0.7, w * 0.002)
    for (const m of [1, 2, 3]) { ctx.beginPath(); ctx.arc(cx, cy, m * S, 0, TAU); ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(cx - S * 3.2, cy); ctx.lineTo(cx + S * 3.2, cy)
    ctx.moveTo(cx, cy - S * 3.2); ctx.lineTo(cx, cy + S * 3.2); ctx.stroke()
    // the landings
    const norm = () => { let x = 0, y = 0; while (!x) x = r(); while (!y) y = r(); return Math.sqrt(-2 * Math.log(x)) * Math.cos(TAU * y) }
    for (let i = 0; i < 2600; i++) {
      const z1 = norm(), z2 = norm()
      const px = 0.28 + 0.72 * z1, py = 1.02 * (0.35 * z1 + 0.937 * z2)
      const inside = Math.hypot(px, py) <= 1.5
      ctx.fillStyle = inside ? 'rgba(255,255,255,.42)' : 'rgba(255,255,255,.13)'
      ctx.fillRect(cx + px * S, cy - py * S, 1.4, 1.4)
    }
    // tolerance
    ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = Math.max(1, w * 0.003)
    ctx.beginPath(); ctx.arc(cx, cy, 1.5 * S, 0, TAU); ctx.stroke()
  },

  /* Route 1 before dawn: a headlight cone and the reflectors. */
  nightroad(ctx, w, h) {
    const r = rng(23)
    sky(ctx, w, h, 34, 6)
    const hz = h * 0.42
    // sky gradient near horizon
    const g = ctx.createLinearGradient(0, hz - h * 0.2, 0, hz)
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.12)')
    ctx.fillStyle = g; ctx.fillRect(0, hz - h * 0.2, w, h * 0.2)
    // road
    ctx.fillStyle = gray(18)
    ctx.beginPath(); ctx.moveTo(w * 0.5 - w * 0.03, hz); ctx.lineTo(w * 0.5 + w * 0.03, hz)
    ctx.lineTo(w * 1.28, h); ctx.lineTo(-w * 0.28, h); ctx.closePath(); ctx.fill()
    // headlight cone
    const cone = ctx.createRadialGradient(w * 0.5, h * 1.02, 0, w * 0.5, h * 1.02, h * 0.95)
    cone.addColorStop(0, 'rgba(255,255,255,.34)'); cone.addColorStop(0.5, 'rgba(255,255,255,.08)')
    cone.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.save()
    ctx.beginPath(); ctx.moveTo(w * 0.5, h * 1.02); ctx.lineTo(w * 0.16, hz + h * 0.02); ctx.lineTo(w * 0.84, hz + h * 0.02); ctx.closePath()
    ctx.clip(); ctx.fillStyle = cone; ctx.fillRect(0, 0, w, h); ctx.restore()
    // center line, perspective-spaced
    ctx.fillStyle = 'rgba(255,255,255,.66)'
    for (let i = 1; i < 16; i++) {
      const t = i / 16, y = hz + (h - hz) * (t * t)
      const ww = w * 0.006 + w * 0.02 * t, hh = h * 0.004 + h * 0.03 * t
      ctx.fillRect(w * 0.5 - ww / 2, y, ww, hh)
    }
    // treeline — soft masses, not triangles; nearer ones are bigger
    // and darker, which is most of what sells the depth
    for (let i = 0; i < 26; i++) {
      const side = r() < 0.5 ? -1 : 1
      const t = 0.04 + r() * 0.96
      const x = w * 0.5 + side * (w * 0.08 + w * 0.72 * t * t)
      const y = hz + (h - hz) * (t * t)
      const th = h * (0.06 + 0.44 * t)
      ctx.fillStyle = `rgba(4,4,4,${0.55 + t * 0.45})`
      const lobes = 3 + Math.floor(r() * 3)
      ctx.beginPath()
      ctx.moveTo(x - th * 0.20, y + 2)
      for (let k = 0; k <= lobes; k++) {
        const f = k / lobes
        const lx = x - th * 0.20 + th * 0.40 * f
        const ly = y - th * (0.35 + 0.75 * Math.sin(f * Math.PI)) * (0.8 + r() * 0.4)
        ctx.quadraticCurveTo(lx - th * 0.10, (ly + y) / 2, lx, ly)
      }
      ctx.lineTo(x + th * 0.20, y + 2)
      ctx.closePath(); ctx.fill()
      // trunk
      ctx.fillRect(x - th * 0.022, y - th * 0.30, th * 0.044, th * 0.32)
    }
  },

  /* The maze, from above, with the route the planner chose. */
  maze(ctx, w, h) {
    const r = rng(5)
    sky(ctx, w, h, 30, 14)
    const N = 15, S = Math.min(w, h) * 0.94 / N
    const ox = (w - S * N) / 2, oy = (h - S * N) / 2
    const grid = Array.from({ length: N }, () => Array.from({ length: N }, () => (r() < 0.32 ? 1 : 0)))
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (grid[y][x]) { ctx.fillStyle = gray(64 + r() * 18); ctx.fillRect(ox + x * S, oy + y * S, S, S) }
    }
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 0.6
    for (let i = 0; i <= N; i++) {
      ctx.beginPath(); ctx.moveTo(ox + i * S, oy); ctx.lineTo(ox + i * S, oy + N * S)
      ctx.moveTo(ox, oy + i * S); ctx.lineTo(ox + N * S, oy + i * S); ctx.stroke()
    }
    // a route with few turns, which is the whole point of the planner
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(1.6, S * 0.26)
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    let x = 0, y = 0
    ctx.beginPath(); ctx.moveTo(ox + S / 2, oy + S / 2)
    while (x < N - 1 || y < N - 1) {
      const run = 2 + Math.floor(r() * 4)
      if ((r() < 0.5 && x < N - 1) || y >= N - 1) x = Math.min(N - 1, x + run)
      else y = Math.min(N - 1, y + run)
      ctx.lineTo(ox + x * S + S / 2, oy + y * S + S / 2)
    }
    ctx.stroke()
  },

  /* An order book: bids below, asks above, depth as a skyline. */
  orderbook(ctx, w, h) {
    const r = rng(31)
    sky(ctx, w, h, 16, 7)
    const mid = h * 0.5, n = 44, bw = w / n
    for (let i = 0; i < n; i++) {
      const d = Math.abs(i - n / 2) / (n / 2)
      const size = (0.12 + Math.pow(1 - d, 1.7) * 0.86) * (0.55 + r() * 0.7)
      const hh = size * h * 0.42
      const up = i > n / 2
      ctx.fillStyle = `rgba(255,255,255,${0.10 + (1 - d) * 0.42})`
      ctx.fillRect(i * bw + bw * 0.15, up ? mid - hh : mid, bw * 0.7, hh)
    }
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1, h * 0.004)
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke()
    // a print crossing the spread
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([w * 0.01, w * 0.012])
    ctx.beginPath(); ctx.moveTo(w * 0.52, 0); ctx.lineTo(w * 0.52, h); ctx.stroke(); ctx.setLineDash([])
  },

  /* Rank, over time, as light trails. A few runaway winners and
     thirty lines that never recover from a bad first hour — which
     is the finding, not the artefact. */
  rankflow(ctx, w, h) {
    const r = rng(67)
    sky(ctx, w, h, 15, 6)
    ctx.strokeStyle = 'rgba(255,255,255,.055)'; ctx.lineWidth = 0.6
    for (let i = 1; i < 10; i++) {
      const y = (h / 10) * i
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
    const N = 30, steps = 44
    for (let k = 0; k < N; k++) {
      let y = (0.05 + r() * 0.9) * h
      const lucky = r() < 0.16
      const pts = [[0, y]]
      for (let s = 1; s <= steps; s++) {
        const t = s / steps
        // the rich get richer; everyone else drifts down the page
        y += (lucky ? -1 : 0.34) * h * 0.013 * (0.4 + t) + (r() - 0.5) * h * 0.05 * (1 - t * 0.6)
        y = Math.max(h * 0.02, Math.min(h * 0.98, y))
        pts.push([t * w, y])
      }
      const winner = pts[pts.length - 1][1] < h * 0.2
      ctx.strokeStyle = `rgba(255,255,255,${winner ? 0.66 : 0.09 + r() * 0.13})`
      ctx.lineWidth = winner ? Math.max(1.3, w * 0.0032) : Math.max(0.5, w * 0.0013)
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i - 1]
        const [qx, qy] = pts[i]
        ctx.quadraticCurveTo(px, py, (px + qx) / 2, (py + qy) / 2)
      }
      ctx.stroke()
    }
    // the top of the ranking, where everything ends up
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.2)
    g.addColorStop(0, 'rgba(255,255,255,.13)'); g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.2)
  },

  /* Thirty five thousand papers, sorted by a model that is right
     most of the time. One slip is one abstract. */
  corpus(ctx, w, h) {
    const r = rng(73)
    sky(ctx, w, h, 17, 7)
    const cols = 36, rows = 21
    const pw = w / cols, ph = h / rows
    const boundary = (y) => w * 0.57 + Math.sin((y / h) * 3.1) * w * 0.055
    for (let ry = 0; ry < rows; ry++) {
      for (let cx = 0; cx < cols; cx++) {
        const x = cx * pw, y = ry * ph
        const left = x + pw / 2 < boundary(y + ph / 2)
        const misfiled = r() < 0.06 // the ones it gets wrong
        const keep = left !== misfiled
        const a = keep ? 0.28 + r() * 0.5 : 0.05 + r() * 0.07
        ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.fillRect(x + pw * 0.16, y + ph * 0.32, pw * 0.68, ph * 0.3)
      }
    }
    // the boundary, and the margin either side of it
    const trace = (off, style, dash) => {
      ctx.strokeStyle = style
      if (dash) ctx.setLineDash(dash); else ctx.setLineDash([])
      ctx.beginPath()
      for (let y = 0; y <= h; y += h / 44) {
        const x = boundary(y) + off
        if (y === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.lineWidth = Math.max(1, w * 0.0026)
    trace(0, 'rgba(255,255,255,.6)')
    ctx.lineWidth = Math.max(0.6, w * 0.0014)
    trace(-w * 0.05, 'rgba(255,255,255,.17)', [w * 0.008, w * 0.011])
    trace(w * 0.05, 'rgba(255,255,255,.17)', [w * 0.008, w * 0.011])
    ctx.setLineDash([])
  },

  /* A bus that is supposed to be square, photographed off a scope
     in a school workshop at one in the morning. */
  scope(ctx, w, h) {
    const r = rng(1923)
    sky(ctx, w, h, 13, 5)
    graticule(ctx, w, h, 10, 8, 0.07)
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1
    ctx.strokeRect(w * 0.02, h * 0.03, w * 0.96, h * 0.94)

    // the harness coming in from the corner
    ctx.lineCap = 'round'
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + r() * 0.1})`
      ctx.lineWidth = Math.max(1.4, w * 0.006)
      const y0 = h * (0.62 + i * 0.06)
      ctx.beginPath(); ctx.moveTo(-w * 0.05, y0)
      ctx.bezierCurveTo(w * 0.2, y0 - h * 0.1, w * 0.34, h * (0.9 + r() * 0.14), w * 0.62, h * 1.1)
      ctx.stroke()
    }

    // trace one: what the manual promises
    const square = (yMid, amp, a, lw, ring) => {
      ctx.strokeStyle = `rgba(255,255,255,${a})`
      ctx.lineWidth = lw
      ctx.lineJoin = 'round'
      ctx.beginPath()
      let x = w * 0.05, hi = false
      ctx.moveTo(x, yMid + amp)
      while (x < w * 0.95) {
        const run = w * (0.035 + r() * 0.05)
        hi = !hi
        const y = yMid + (hi ? -amp : amp)
        ctx.lineTo(x, y)
        if (ring) {
          // reflections off an unterminated stub
          for (let k = 0; k < 4; k++) {
            const rx = x + (k + 1) * w * 0.006
            const ry = y + (hi ? 1 : -1) * amp * 0.42 * Math.pow(0.5, k) * (k % 2 ? -1 : 1)
            ctx.lineTo(rx, ry)
          }
        }
        x += run
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    square(h * 0.3, h * 0.13, 0.86, Math.max(1.4, w * 0.0034), false)
    square(h * 0.72, h * 0.11, 0.4, Math.max(1, w * 0.0026), true)

    // trigger marker and the cursor
    ctx.fillStyle = 'rgba(255,255,255,.75)'
    ctx.fillRect(w * 0.05, h * 0.3 - h * 0.01, w * 0.012, h * 0.02)
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.setLineDash([h * 0.02, h * 0.02])
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(w * 0.66, h * 0.03); ctx.lineTo(w * 0.66, h * 0.97); ctx.stroke()
    ctx.setLineDash([])
  },

  /* Six hundred thousand people betting on a number that has to
     finish at either one or zero. */
  odds(ctx, w, h) {
    const r = rng(89)
    sky(ctx, w, h, 14, 6)
    // the traders, as a density
    for (let i = 0; i < 1400; i++) {
      const x = r() * w
      const y = h * 0.2 + Math.pow(r(), 0.7) * h * 0.7
      ctx.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.12})`
      ctx.fillRect(x, y, 1.2, 1.2)
    }
    // fifty-fifty
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.setLineDash([w * 0.012, w * 0.014]); ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke(); ctx.setLineDash([])
    // volume along the bottom
    for (let i = 0; i < 60; i++) {
      const bh = h * (0.01 + Math.pow(r(), 2.2) * 0.16)
      ctx.fillStyle = `rgba(255,255,255,${0.10 + r() * 0.16})`
      ctx.fillRect((w / 60) * i, h - bh, (w / 60) * 0.62, bh)
    }
    // the price, which resolves
    let y = h * 0.52
    const pts = [[0, y]]
    for (let i = 1; i <= 90; i++) {
      const t = i / 90
      const pull = (h * 0.16 - y) * 0.03 * Math.pow(t, 3) * 8
      y += pull + (r() - 0.5) * h * 0.05 * (1 - t * 0.5)
      if (t > 0.93) y += (h * 0.08 - y) * 0.4 // it settles at one
      y = Math.max(h * 0.06, Math.min(h * 0.94, y))
      pts.push([t * w, y])
    }
    ctx.strokeStyle = 'rgba(255,255,255,.9)'
    ctx.lineWidth = Math.max(1.4, w * 0.0032)
    ctx.lineJoin = 'round'
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
    for (const [px, py] of pts.slice(1)) ctx.lineTo(px, py)
    ctx.stroke()
    // resolution
    ctx.fillStyle = 'rgba(255,255,255,.95)'
    ctx.beginPath(); ctx.arc(w, h * 0.08, Math.max(2, w * 0.008), 0, TAU); ctx.fill()
  },

  /* New Jersey, and every place someone was hit. */
  roads(ctx, w, h) {
    const r = rng(41)
    sky(ctx, w, h, 12, 5)
    const nodes = []
    for (let i = 0; i < 34; i++) nodes.push([r() * w, r() * h])
    ctx.strokeStyle = 'rgba(255,255,255,.20)'
    for (let i = 0; i < nodes.length; i++) {
      const [ax, ay] = nodes[i]
      const near = nodes
        .map((p, j) => [Math.hypot(p[0] - ax, p[1] - ay), j])
        .sort((a, b) => a[0] - b[0]).slice(1, 4)
      for (const [, j] of near) {
        ctx.lineWidth = Math.max(0.6, w * 0.0016 * (0.6 + r()))
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(nodes[j][0], nodes[j][1]); ctx.stroke()
      }
    }
    // arterials
    ctx.strokeStyle = 'rgba(255,255,255,.44)'; ctx.lineWidth = Math.max(1.4, w * 0.005)
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-10, r() * h)
      ctx.bezierCurveTo(w * 0.3, r() * h, w * 0.7, r() * h, w + 10, r() * h); ctx.stroke()
    }
    // the injury network — hot spots
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = r() * h, rad = w * (0.012 + r() * 0.05)
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill()
    }
  },

  /* Dust around an interstellar comet. */
  comet(ctx, w, h) {
    const r = rng(53)
    sky(ctx, w, h, 10, 3)
    for (let i = 0; i < 320; i++) {
      const x = r() * w, y = r() * h, m = r()
      ctx.fillStyle = `rgba(255,255,255,${0.12 + m * 0.7})`
      const s = m > 0.95 ? 1.9 : m > 0.75 ? 1.2 : 0.8
      ctx.fillRect(x, y, s, s)
    }
    const cx = w * 0.34, cy = h * 0.6
    // tail
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.42)
    const tg = ctx.createLinearGradient(0, 0, w * 0.7, 0)
    tg.addColorStop(0, 'rgba(255,255,255,.55)'); tg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = tg
    ctx.beginPath(); ctx.moveTo(0, -h * 0.02); ctx.quadraticCurveTo(w * 0.4, -h * 0.16, w * 0.72, -h * 0.2)
    ctx.lineTo(w * 0.72, h * 0.06); ctx.quadraticCurveTo(w * 0.4, h * 0.06, 0, h * 0.02); ctx.closePath(); ctx.fill()
    ctx.restore()
    // coma
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.09)
    cg.addColorStop(0, 'rgba(255,255,255,1)'); cg.addColorStop(0.25, 'rgba(255,255,255,.6)'); cg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, w * 0.09, 0, TAU); ctx.fill()
  },

  /* March 2022. The frame survived; most of the emulsion did not. */
  damaged(ctx, w, h) {
    const r = rng(2022)
    // what is left of a road at night
    SCENES.nightroad(ctx, w, h)
    ctx.save()
    // the emulsion lifted off the right two thirds
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.moveTo(w * 0.30, -5)
    let x = w * 0.30
    for (let y = 0; y <= h; y += h / 14) { x += (r() - 0.45) * w * 0.10; ctx.lineTo(x, y) }
    ctx.lineTo(w + 5, h + 5); ctx.lineTo(w + 5, -5); ctx.closePath()
    ctx.fill()
    // bubbling / reticulation at the tear
    for (let i = 0; i < 90; i++) {
      const bx = w * 0.26 + r() * w * 0.16, by = r() * h
      ctx.beginPath(); ctx.arc(bx, by, w * (0.004 + r() * 0.016), 0, TAU); ctx.fill()
    }
    ctx.restore()
    // scratches through what remains
    ctx.strokeStyle = 'rgba(255,255,255,.55)'
    for (let i = 0; i < 7; i++) {
      ctx.lineWidth = Math.max(0.6, w * 0.0016)
      const sx = r() * w * 0.34
      ctx.beginPath(); ctx.moveTo(sx, -5)
      ctx.bezierCurveTo(sx + (r() - 0.5) * w * 0.06, h * 0.4, sx + (r() - 0.5) * w * 0.08, h * 0.7, sx + (r() - 0.5) * w * 0.1, h + 5)
      ctx.stroke()
    }
  },

  /* Rain on the glass at 2:47 a.m. The room, photographing itself. */
  rainwindow(ctx, w, h) {
    const r = rng(247)
    sky(ctx, w, h, 14, 6)
    const wx = w * 0.3, wy = h * 0.08, ww = w * 0.42, wh = h * 0.8
    // city behind glass
    const g = ctx.createLinearGradient(0, wy, 0, wy + wh)
    g.addColorStop(0, gray(74)); g.addColorStop(1, gray(30))
    ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh)
    // far buildings
    ctx.fillStyle = gray(20)
    let bx = wx
    while (bx < wx + ww) {
      const bw = ww * (0.08 + r() * 0.14), bh = wh * (0.25 + r() * 0.5)
      ctx.fillRect(bx, wy + wh - bh, bw, bh)
      bx += bw + ww * 0.02
    }
    // lit windows
    ctx.fillStyle = gray(200)
    for (let i = 0; i < 26; i++) {
      if (r() < 0.4) continue
      ctx.fillRect(wx + r() * ww * 0.94, wy + wh * 0.4 + r() * wh * 0.55, ww * 0.012, wh * 0.014)
    }
    // rain on the glass: streaks and beads
    ctx.strokeStyle = 'rgba(255,255,255,.5)'
    for (let i = 0; i < 60; i++) {
      const x = wx + r() * ww, y = wy + r() * wh, len = wh * (0.03 + r() * 0.12)
      ctx.lineWidth = Math.max(0.5, w * 0.0014 * (0.4 + r()))
      ctx.globalAlpha = 0.12 + r() * 0.3
      ctx.beginPath(); ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + w * 0.004, y + len * 0.5, x - w * 0.003, y + len)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    // beads
    ctx.fillStyle = 'rgba(255,255,255,.55)'
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.14 + r() * 0.4
      ctx.beginPath(); ctx.arc(wx + r() * ww, wy + r() * wh, w * (0.0012 + r() * 0.0028), 0, TAU); ctx.fill()
    }
    ctx.globalAlpha = 1
    // blinds, half open
    ctx.fillStyle = gray(6)
    const slats = 9, gap = wh / slats
    for (let i = 0; i < slats; i++) ctx.fillRect(wx - w * 0.006, wy + i * gap, ww + w * 0.012, gap * 0.5)
    // frame
    ctx.strokeStyle = gray(46); ctx.lineWidth = Math.max(2, w * 0.008)
    ctx.strokeRect(wx, wy, ww, wh)
    ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke()
  },

  /* A frame that never met any light. */
  unexposed(ctx, w, h) {
    const r = rng(97)
    sky(ctx, w, h, 22, 15)
    ctx.fillStyle = 'rgba(255,255,255,.03)'
    for (let i = 0; i < 40; i++) ctx.fillRect(r() * w, r() * h, w * 0.06 * r(), 1)
  },
}

/* Printing exposure, per frame. A contact sheet is exposed for the
   roll, not the frame, but this is a print — each gets its own time
   under the enlarger so the dark ones are readable. */
const EXPOSURE = {
  dispersion: 1.38, nightroad: 1.30, roads: 1.34, comet: 1.32,
  owl: 1.26, orderbook: 1.28, maze: 1.18, damaged: 1.24, goose: 1.12, rainwindow: 1.3,
  rankflow: 1.32, corpus: 1.28, scope: 1.34, odds: 1.3,
}

/* ── the post-process: what makes it look photographed ─────── */
function develop(ctx, w, h, t, seed, exposure = 1) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const r = rng(seed || 1)
  // a cheap stable hash per pixel, for grain that does not crawl
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let L = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255

    // exposure, then an S-curve blended toward linear so the toe
    // does not swallow the shadow detail
    L = Math.min(1, L * exposure)
    L = L * (L * (3 - 2 * L)) * 0.55 + L * 0.45
    L = 0.05 + L * 0.92

    // grain, strongest in the midtones as on real film
    const mid = 1 - Math.abs(2 * L - 1)
    const n = (r() - 0.5) * 0.30 * mid
    L = Math.max(0, Math.min(1, L + n))

    // developing: density (1-L) surfaces first, through a grainy
    // threshold, so highlights arrive last
    if (t < 1) {
      const density = 1 - L
      const edge = 1 - t + (r() - 0.5) * 0.16
      if (density < edge) L = 1 // still paper
    }

    // warm-neutral tone: paper is not white, emulsion is not black
    d[i] = 25 + L * 208
    d[i + 1] = 21 + L * 206
    d[i + 2] = 18 + L * 195
  }
  ctx.putImageData(img, 0, 0)

  // vignette, painted after so it does not get grained
  const g = ctx.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.16, w / 2, h * 0.5, Math.max(w, h) * 0.78)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,.55)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
}

/* ── public ────────────────────────────────────────────────── */
export function paint(canvas, gen, opts = {}) {
  const { t = 1, dpr: forceDpr, w: forceW, h: forceH } = opts
  const scene = SCENES[gen] || SCENES.unexposed
  const dpr = forceDpr || Math.min(window.devicePixelRatio || 1, 2)
  // A detached canvas reports clientWidth 0, so callers rendering
  // offscreen pass explicit pixel dimensions.
  const cw = canvas.clientWidth || 320
  const ch = canvas.clientHeight || Math.round(cw * 2 / 3)
  const w = Math.max(2, Math.round(forceW || cw * dpr))
  const h = Math.max(2, Math.round(forceH || ch * dpr))
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  scene(ctx, w, h)
  develop(ctx, w, h, t, gen.length * 977 + 13, EXPOSURE[gen] || 1)
  return ctx
}

/* ── the develop engine ────────────────────────────────────────
   Bake the finished print once (tone + grain + vignette), read its
   luminance back, then sweep a density threshold over it per frame.
   Dense areas cross first; per-pixel noise roughens the edge. This
   is the same chemistry as the film, shared by every canvas.  */
export function developInto(canvas, gen, opts = {}) {
  const { duration = 1100, dpr: forceDpr, onDone } = opts
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) { paint(canvas, gen, { t: 1 }); canvas.dataset.developed = '1'; onDone && onDone(); return { cancel() {} } }

  const dpr = forceDpr || Math.min(window.devicePixelRatio || 1, 1.5)
  const cw = canvas.clientWidth || 320
  const ch = canvas.clientHeight || Math.round(cw * 2 / 3)
  const W = Math.max(2, Math.round(cw * dpr))
  const H = Math.max(2, Math.round(ch * dpr))
  canvas.width = W; canvas.height = H

  const off = document.createElement('canvas')
  paint(off, gen, { t: 1, w: W, h: H })
  const src = off.getContext('2d').getImageData(0, 0, W, H).data
  const lum = new Float32Array(W * H)
  const noise = new Float32Array(W * H)
  const r = rng(gen.length * 733 + 29)
  for (let i = 0, q = 0; q < lum.length; i += 4, q++) {
    lum[q] = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255
    noise[q] = (r() - 0.5) * 0.2
  }
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  const ease = (x) => (x < 0.45 ? 1.6 * x * x : 1 - Math.pow(-2 * x + 2, 2.4) / 2)

  let dead = false
  const t0 = performance.now()
  function frame(now) {
    if (dead) return
    const t = Math.min(1, (now - t0) / duration)
    const e = ease(t)
    for (let q = 0, i = 0; q < lum.length; q++, i += 4) {
      const L = lum[q]
      const v = e >= 1 ? L : ((1 - L) < (1 - e) + noise[q] ? 1 : L)
      d[i] = 25 + v * 208; d[i + 1] = 21 + v * 206; d[i + 2] = 18 + v * 195; d[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    if (t < 1) requestAnimationFrame(frame)
    else { canvas.dataset.developed = '1'; onDone && onDone() }
  }
  requestAnimationFrame(frame)
  return { cancel() { dead = true } }
}

export const SCENE_NAMES = Object.keys(SCENES)
