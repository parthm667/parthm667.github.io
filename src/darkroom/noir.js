/* =============================================================
   noir.js — NIGHT WORK

   The opening of the site is a short film you scrub with your
   scroll: one night in the darkroom, developing the roll. The
   story is the process itself — expose, develop, stop, fix, wash,
   hang — told in eight light lines. Noir is the lighting, not a
   plot.

   Scroll owns everything. Every state is a pure function of how
   far down the page you are, which is why the film plays equally
   well backward (the print un-develops, which chemistry does not
   allow, and which is the one place this room cheats).

   One rAF loop:
     - rain, the window, the venetian blinds and their light shafts
     - a hanging lamp on real pendulum physics, excited by how hard
       you scroll
     - the enlarger's exposure flash
     - a print coming up in the tray with the same density sweep as
       everything else on the site — held by the stop bath, finished
       by the fixer
     - narration revealed word by word, process cards tracked in
       like intertitles

   Ported from the Astro original: it now takes its root element
   instead of reaching for an id, and every listener and frame it
   starts is torn down by the handle it returns.
   ============================================================= */

import { paint, rng } from './emulsion.js'

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const smooth = (x) => x * x * (3 - 2 * x)
const trap = (x, a, b, c, d) => {
  if (x <= a || x >= d) return 0
  if (x < b) return smooth((x - a) / (b - a))
  if (x > c) return 1 - smooth((x - c) / (d - c))
  return 1
}
const seg = (x, a, b) => clamp((x - a) / (b - a), 0, 1)

/* ── the script: one night, eight lines, no drama ──────────── */
const LINES = [
  { a: 0.055, b: 0.15, text: 'Lights out. Count to sixty while your eyes come around. The red one stays on. House rule.' },
  { a: 0.15, b: 0.24, text: 'Tonight’s roll. Thirty six chances, and if four of them are any good, that was a good roll.' },
  { a: 0.24, b: 0.34, text: 'Paper under the enlarger. A few seconds of light, then off. That is the entire trick. Everything after this is chemistry.' },
  { a: 0.34, b: 0.52, text: 'Into the developer. Rock the tray. Watch it come up out of nothing. This part has never once gotten old.' },
  { a: 0.52, b: 0.62, text: 'Stop bath. Twenty seconds. Development freezes right where it stands. Also, it smells like salad. Nobody warns you about that.' },
  { a: 0.62, b: 0.74, text: 'Fixer makes it permanent. Three minutes, and after that it can live in the light like the rest of us.' },
  { a: 0.74, b: 0.87, text: 'Wash. Squeegee. Hang. The clothesline does the last hour of the work, and it never complains.' },
  { a: 0.87, b: 1.01, text: 'Sixteen frames made it out of the tank tonight. The whole sheet is below. Take the loupe.' },
]
const CARDS = [
  { a: 0.055, b: 0.145, text: 'NIGHT WORK' },
  { a: 0.245, b: 0.335, text: 'EXPOSURE' },
  { a: 0.345, b: 0.51, text: 'DEVELOPER' },
  { a: 0.52, b: 0.61, text: 'STOP' },
  { a: 0.62, b: 0.73, text: 'FIX' },
  { a: 0.74, b: 0.86, text: 'WASH & DRY' },
  { a: 0.875, b: 0.985, text: 'THE SHEET' },
]
const HUD = [
  [0.0, 'LEADER'], [0.055, 'INT. DARKROOM. NIGHT.'], [0.15, 'THE ROLL'],
  [0.24, 'EXPOSURE · 8s'], [0.34, 'DEVELOPER · 20.0 °C'], [0.52, 'STOP · 0:20'],
  [0.62, 'FIX · 3:00'], [0.74, 'WASH & DRY'], [0.87, 'CONTACT SHEET'],
]

/* the print in the tray: developed by scroll, held by the stop
   bath, finished by the fixer */
const printT = (t) => {
  if (t < 0.36) return 0
  if (t < 0.52) return smooth(seg(t, 0.36, 0.515)) * 0.85
  if (t < 0.63) return 0.85
  return 0.85 + smooth(seg(t, 0.63, 0.71)) * 0.15
}

/* ── print baking (develop scrubbed by scroll) ─────────────── */
function bakeScrub(canvas, gen) {
  const dpr = Math.min(devicePixelRatio || 1, 1.5)
  const W = Math.max(2, Math.round(canvas.clientWidth * dpr))
  const H = Math.max(2, Math.round(canvas.clientHeight * dpr))
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
  let last = -2
  return (t) => {
    t = clamp(t, 0, 1)
    if (Math.abs(t - last) < 0.004) return
    last = t
    for (let q = 0, i = 0; q < lum.length; q++, i += 4) {
      const L = lum[q]
      const v = t >= 1 ? L : ((1 - L) < (1 - t) + noise[q] ? 1 : L)
      d[i] = 25 + v * 208; d[i + 1] = 21 + v * 206; d[i + 2] = 18 + v * 195; d[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }
}

/* ── controller ────────────────────────────────────────────── */
export function initNoir(film) {
  if (!film) return null
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) { film.classList.add('static'); return null }

  const stage = film.querySelector('.stage')
  const bg = film.querySelector('#noir-bg')
  if (!stage || !bg) return null
  const bgx = bg.getContext('2d')
  const world = film.querySelector('.world')
  const narrEl = film.querySelector('.narr')
  const cardEl = film.querySelector('.card')
  const hudEl = film.querySelector('.hud-scene')
  const trayEl = film.querySelector('.n-tray')
  const printEl = film.querySelector('.n-print')
  const printCv = printEl.querySelector('canvas')
  const canisterEl = film.querySelector('.n-canister')
  const lineEl = film.querySelector('.n-line')
  const leaderEl = film.querySelector('.n-leader')
  const leaderCv = film.querySelector('#leader-cv')

  const ctl = new AbortController()
  const { signal } = ctl

  // narration words
  narrEl.innerHTML = ''
  const lineDivs = LINES.map((L) => {
    const div = document.createElement('p')
    for (const w of L.text.split(' ')) {
      const s = document.createElement('span')
      s.textContent = w + ' '
      div.appendChild(s)
    }
    narrEl.appendChild(div)
    return { ...L, div, words: [...div.children] }
  })

  // the one print of the night
  let scrub = null
  const bake = () => { if (!scrub) scrub = bakeScrub(printCv, 'heron') }

  // rain
  const R = rng(1947)
  const drops = Array.from({ length: 130 }, () => ({
    x: R(), y: R(), s: 0.5 + R() * 0.9, l: 0.35 + R() * 0.9,
  }))

  // lamp physics
  let theta = 0.09, omega = 0, lastP = 0

  // master progress
  let target = 0, p = 0, running = true, raf = null, vw = 0, vh = 0

  const size = () => {
    vw = stage.clientWidth; vh = stage.clientHeight
    const dpr = Math.min(devicePixelRatio || 1, 1.75)
    bg.width = Math.round(vw * dpr); bg.height = Math.round(vh * dpr)
    bgx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const ld = Math.min(devicePixelRatio || 1, 2)
    leaderCv.width = leaderCv.clientWidth * ld; leaderCv.height = leaderCv.clientHeight * ld
  }
  size()

  const onScroll = () => {
    const r = film.getBoundingClientRect()
    target = clamp(-r.top / (r.height - vh), 0, 1)
  }
  addEventListener('scroll', onScroll, { passive: true, signal })
  addEventListener('resize', () => { size(); onScroll() }, { signal })
  onScroll()

  /* ── background painting ── */
  function paintBg(t) {
    bgx.clearRect(0, 0, vw, vh)
    const roomA = trap(t, 0.04, 0.09, 2, 3)

    // window with the city behind it, upper right
    const wx = vw * 0.66, wy = vh * 0.10, ww = vw * 0.24, wh = vh * 0.44
    if (roomA > 0.01) {
      bgx.save()
      bgx.globalAlpha = roomA

      const cg = bgx.createLinearGradient(0, wy, 0, wy + wh)
      cg.addColorStop(0, 'rgba(64,46,60,.55)')
      cg.addColorStop(1, 'rgba(28,20,26,.55)')
      bgx.fillStyle = cg
      bgx.fillRect(wx, wy, ww, wh)
      bgx.fillStyle = 'rgba(255,214,150,.10)'
      const wr = rng(8)
      for (let i = 0; i < 14; i++) {
        bgx.fillRect(wx + wr() * ww * 0.9, wy + wh * 0.3 + wr() * wh * 0.6, 3 + wr() * 5, 2 + wr() * 4)
      }
      const neon = 0.5 + 0.5 * Math.sin(performance.now() / 900)
      bgx.fillStyle = `rgba(193,39,45,${0.10 + 0.10 * neon})`
      bgx.fillRect(wx + ww * 0.08, wy + wh * 0.16, ww * 0.20, wh * 0.05)

      // rain inside the glass
      bgx.save()
      bgx.beginPath(); bgx.rect(wx, wy, ww, wh); bgx.clip()
      bgx.strokeStyle = 'rgba(220,225,235,.34)'
      bgx.lineWidth = 1
      const now = performance.now()
      for (const dr of drops) {
        const fall = ((dr.y + (now / 1000) * dr.s * 0.9) % 1)
        const x = wx + dr.x * ww + fall * ww * 0.06
        const y = wy + fall * wh
        bgx.globalAlpha = roomA * (0.14 + dr.s * 0.25)
        bgx.beginPath(); bgx.moveTo(x, y); bgx.lineTo(x - ww * 0.012, y + wh * 0.05 * dr.l); bgx.stroke()
      }
      bgx.restore()

      // blinds
      bgx.fillStyle = 'rgba(8,7,6,.92)'
      const slats = 11
      const gap = wh / slats
      const tilt = theta * 6
      for (let i = 0; i < slats; i++) {
        bgx.fillRect(wx - 4, wy + i * gap + tilt, ww + 8, gap * 0.62)
      }
      bgx.strokeStyle = 'rgba(90,83,73,.8)'; bgx.lineWidth = 3
      bgx.strokeRect(wx, wy, ww, wh)

      // shafts across the floor
      bgx.globalAlpha = roomA * 0.5
      for (let i = 0; i < slats; i += 2) {
        const sy = wy + i * gap
        const grad = bgx.createLinearGradient(wx, sy, wx - vw * 0.5, sy + vh * 0.34)
        grad.addColorStop(0, 'rgba(180,170,190,.055)')
        grad.addColorStop(1, 'rgba(180,170,190,0)')
        bgx.fillStyle = grad
        bgx.beginPath()
        bgx.moveTo(wx, sy)
        bgx.lineTo(wx, sy + gap * 0.34)
        bgx.lineTo(wx - vw * 0.52 + theta * 160, sy + vh * 0.36)
        bgx.lineTo(wx - vw * 0.52 + theta * 160, sy + vh * 0.30)
        bgx.closePath(); bgx.fill()
      }
      bgx.restore()
    }

    // the lamp
    if (roomA > 0.01) {
      const ax = vw * 0.38, ay = -8, len = vh * 0.22
      const bx = ax + Math.sin(theta) * len
      const by = ay + Math.cos(theta) * len
      bgx.save()
      bgx.globalAlpha = roomA
      const coneA = 0.10 + 0.05 * Math.sin(performance.now() / 1400)
      const cone = bgx.createRadialGradient(bx, by, 4, bx, by + vh * 0.45, vh * 0.75)
      cone.addColorStop(0, `rgba(255,214,170,${coneA + 0.14})`)
      cone.addColorStop(0.5, `rgba(255,200,160,${coneA * 0.4})`)
      cone.addColorStop(1, 'rgba(255,200,160,0)')
      bgx.fillStyle = cone
      bgx.beginPath()
      bgx.moveTo(bx, by)
      bgx.lineTo(bx - vw * 0.30 + theta * 200, vh + 10)
      bgx.lineTo(bx + vw * 0.30 + theta * 200, vh + 10)
      bgx.closePath(); bgx.fill()
      bgx.strokeStyle = 'rgba(120,110,98,.9)'; bgx.lineWidth = 2
      bgx.beginPath(); bgx.moveTo(ax, ay); bgx.lineTo(bx, by); bgx.stroke()
      bgx.fillStyle = '#2a231d'
      bgx.beginPath(); bgx.arc(bx, by + 6, 9, Math.PI, 0); bgx.fill()
      bgx.fillStyle = 'rgba(255,210,160,.95)'
      bgx.beginPath(); bgx.arc(bx, by + 10, 5, 0, 7); bgx.fill()
      bgx.restore()
    }

    // the exposure: the enlarger fires, the room goes warm for a beat
    const expo = trap(t, 0.265, 0.285, 0.30, 0.325)
    if (expo > 0) {
      bgx.fillStyle = `rgba(255,232,200,${expo * 0.34})`
      bgx.fillRect(0, 0, vw, vh)
    }
  }

  /* ── the leader countdown ── */
  function paintLeader(t) {
    const a = 1 - seg(t, 0.04, 0.055)
    leaderEl.style.opacity = a
    leaderEl.style.pointerEvents = 'none'
    if (a <= 0) return
    const c = leaderCv.getContext('2d')
    const w = leaderCv.width, h = leaderCv.height
    c.clearRect(0, 0, w, h)
    const local = seg(t, 0, 0.045)
    const n = 3 - Math.min(2, Math.floor(local * 3))
    const sweep = (local * 3) % 1
    c.strokeStyle = 'rgba(233,227,215,.5)'; c.lineWidth = 2
    c.beginPath(); c.arc(w / 2, h / 2, h * 0.34, 0, 7); c.stroke()
    c.beginPath(); c.arc(w / 2, h / 2, h * 0.28, 0, 7); c.stroke()
    c.fillStyle = 'rgba(233,227,215,.16)'
    c.beginPath(); c.moveTo(w / 2, h / 2)
    c.arc(w / 2, h / 2, h * 0.5, -Math.PI / 2, -Math.PI / 2 + sweep * Math.PI * 2)
    c.closePath(); c.fill()
    c.strokeStyle = 'rgba(233,227,215,.35)'
    c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke()
    c.fillStyle = 'rgba(233,227,215,.92)'
    c.font = `${h * 0.42}px Bebas, Impact, sans-serif`
    c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText(String(n), w / 2, h / 2 + h * 0.02)
  }

  /* ── scene DOM updates ── */
  function update(t) {
    paintLeader(t)
    paintBg(t)

    // the roll arrives
    const cT = trap(t, 0.145, 0.18, 0.225, 0.26)
    const cRoll = seg(t, 0.15, 0.225)
    canisterEl.style.opacity = cT
    canisterEl.style.transform = `translateX(${(1 - cRoll) * 46 - 8}vw) rotate(${(1 - cRoll) * -520}deg)`

    // the tray arrives with the exposure beat and stays for the night
    const trayT = trap(t, 0.24, 0.28, 0.715, 0.755)
    trayEl.style.opacity = trayT
    trayEl.style.transform = `translate(-50%,-50%) translateY(${(1 - seg(t, 0.24, 0.29)) * 7}vh) rotate(${theta * 2.2}deg)`

    // blank paper slides into the bath after the flash
    const paperIn = seg(t, 0.325, 0.355)
    printEl.style.opacity = t > 0.325 ? 1 : 0
    printEl.style.transform = `translateX(${(1 - smooth(paperIn)) * 110}%) rotate(${(1 - paperIn) * 2}deg)`
    if (trayT > 0 && !scrub) bake()
    if (scrub && t > 0.3) scrub(printT(t))

    // wash & dry: the line comes down, the world pulls back
    lineEl.style.opacity = trap(t, 0.735, 0.775, 2, 3)
    lineEl.style.transform = `translateY(${(1 - smooth(seg(t, 0.735, 0.79))) * -34}px)`
    const fin = seg(t, 0.87, 0.97)
    world.style.transform = `scale(${1 - smooth(fin) * 0.06}) translateY(${smooth(fin) * -2}vh)`
    stage.style.opacity = 1 - seg(t, 0.975, 1)

    // narration
    for (const L of lineDivs) {
      const on = trap(t, L.a, L.a + 0.008, L.b - 0.015, L.b)
      L.div.style.opacity = on > 0 ? 1 : 0
      if (on <= 0) continue
      const reveal = seg(t, L.a + 0.006, L.a + (L.b - L.a) * 0.55)
      const n = Math.floor(reveal * L.words.length)
      L.words.forEach((w, i) => { w.style.opacity = i <= n ? 1 : 0.06 })
      L.div.style.transform = `translateY(${(1 - clamp(on * 2, 0, 1)) * 10}px)`
    }

    // cards
    let card = null
    for (const C of CARDS) { if (t >= C.a && t <= C.b) { card = C; break } }
    if (card) {
      const local = seg(t, card.a, card.b)
      const vis = trap(t, card.a, card.a + (card.b - card.a) * 0.22, card.b - (card.b - card.a) * 0.3, card.b)
      if (cardEl.textContent !== card.text) cardEl.textContent = card.text
      cardEl.style.opacity = vis * 0.94
      cardEl.style.letterSpacing = `${0.42 - smooth(local) * 0.3}em`
    } else cardEl.style.opacity = 0

    // hud
    let scene = HUD[0][1]
    for (const [a, label] of HUD) if (t >= a) scene = label
    if (hudEl.textContent !== scene) hudEl.textContent = scene
  }

  /* ── the loop ── */
  let lastNow = performance.now()
  function frame(now) {
    if (!running) return
    const dt = Math.min(0.05, (now - lastNow) / 1000)
    lastNow = now

    const dP = target - p
    p += dP * Math.min(1, dt * 7)

    const kick = clamp((p - lastP) * 260, -1.6, 1.6)
    lastP = p
    omega += (-9.5 * theta - 1.15 * omega) * dt + kick * dt * 6
    theta += omega * dt

    const r = film.getBoundingClientRect()
    const onscreen = r.bottom > 0 && r.top < vh * 1.2
    if (onscreen) update(clamp(p, 0, 1))
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return {
    stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      ctl.abort()
    },
  }
}
