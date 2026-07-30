/* =============================================================
   engine.js — everything in the room that moves.

   The Astro original ran one imperative boot function per page
   load. In React the same work becomes hooks that own their own
   teardown: every listener carries an AbortSignal, every observer
   is disconnected, every develop is cancellable. That matters more
   than it looks, because StrictMode mounts each effect twice in
   development and a leaked rAF would double the grain.
   ============================================================= */

import { useEffect, useState } from 'react'
import { paint, developInto, loadAssets, rng } from './emulsion.js'

const REDUCE = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const CAN_HOVER = () => typeof matchMedia !== 'undefined' && matchMedia('(hover:hover)').matches

/* The grease-pencil aside, bottom left. Anything in the room can
   ask for it; only one shows at a time. */
export function showNote(text, ms = 4200) {
  document.dispatchEvent(new CustomEvent('dr:note', { detail: { text, ms } }))
}

export function useNote() {
  const [note, setNote] = useState('')
  useEffect(() => {
    let timer = null
    const onNote = (e) => {
      setNote(e.detail.text)
      clearTimeout(timer)
      timer = setTimeout(() => setNote(''), e.detail.ms)
    }
    document.addEventListener('dr:note', onNote)
    return () => { document.removeEventListener('dr:note', onNote); clearTimeout(timer) }
  }, [])
  return note
}

/* ── the lights ────────────────────────────────────────────────
   Turning them on is a real light theme and also a small disaster,
   which the room mentions exactly once per session. */
export function useLights() {
  const [on, setOn] = useState(() => {
    try { return localStorage.getItem('lights') === 'on' } catch { return false }
  })

  useEffect(() => {
    const root = document.documentElement
    root.dataset.lights = on ? 'on' : 'off'
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = on ? '#cfc8b8' : '#080706'
    try { localStorage.setItem('lights', on ? 'on' : 'off') } catch { /* private mode */ }
    document.dispatchEvent(new CustomEvent('lights', { detail: on ? 'on' : 'off' }))
  }, [on])

  const toggle = () => {
    const next = !on
    if (next) {
      try {
        if (!sessionStorage.getItem('fogged')) {
          sessionStorage.setItem('fogged', '1')
          showNote('you just fogged\nevery print in here')
        }
      } catch { /* private mode */ }
    }
    if (REDUCE() || !document.startViewTransition) return setOn(next)
    document.startViewTransition(() => setOn(next))
  }

  return [on, toggle]
}

/* ── every photograph: develop on arrival, repaint on lights ──── */
export function useDevelop(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ctl = new AbortController()
    const { signal } = ctl
    const sweeps = []
    const observers = []
    let cancelled = false

    loadAssets().then(() => {
      if (cancelled) return
      const canvases = [...root.querySelectorAll('canvas[data-gen]')]
        .filter((c) => c.dataset.noir === undefined)
      if (!canvases.length) return

      let stagger = 0
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const cv = e.target
          io.unobserve(cv)
          if (cv.dataset.instant !== undefined || REDUCE()) {
            paint(cv, cv.dataset.gen, { t: 1 })
            cv.dataset.developed = '1'
            afterDevelop(cv)
            continue
          }
          const delay = Math.min(stagger * 130, 650)
          stagger++
          setTimeout(() => {
            if (signal.aborted) return
            sweeps.push(developInto(cv, cv.dataset.gen, {
              duration: cv.dataset.slow !== undefined ? 1500 : 1000,
              onDone: () => afterDevelop(cv),
            }))
          }, delay)
        }
      }, { rootMargin: '180px' })

      canvases.forEach((c) => io.observe(c))
      observers.push(io)

      function afterDevelop(cv) {
        const frame = cv.closest('.frame')
        if (!frame) return
        const china = frame.querySelector('.china')
        if (china && !china.classList.contains('drawn')) drawRing(china, frame)
        const noteEl = root.querySelector(`.dr-china-note[data-for="${frame.dataset.frame}"]`)
        if (noteEl) setTimeout(() => noteEl.classList.add('show'), 420)
      }

      const redraw = () => canvases.forEach((c) => {
        if (c.dataset.developed) paint(c, c.dataset.gen, { t: 1 })
      })
      document.addEventListener('lights', redraw, { signal })

      let timer = null
      const ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(redraw, 140) })
      ro.observe(root)
      observers.push(ro)
    })

    return () => {
      cancelled = true
      ctl.abort()
      sweeps.forEach((s) => s.cancel())
      observers.forEach((o) => o.disconnect())
    }
  }, [rootRef])
}

/* A chinagraph circle, drawn the way a hand draws one: past the
   start, slightly out of round, never quite closed. */
function drawRing(svg, frame) {
  const p = svg.querySelector('path')
  if (!p) return
  const r = rng((frame.dataset.frame || 'x').length * 131 + 7)
  const cx = 50, cy = 34, rx = 47, ry = 31
  const start = -0.5 + r() * 0.6
  const turns = 1.06 + r() * 0.12
  const pts = []
  for (let i = 0; i <= 54; i++) {
    const a = start + (i / 54) * Math.PI * 2 * turns
    const wob = 1 + Math.sin(a * 3.1 + r()) * 0.028 + (r() - 0.5) * 0.02
    pts.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob])
  }
  p.setAttribute('d', 'M' + pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L'))
  const len = p.getTotalLength ? p.getTotalLength() : 300
  p.style.setProperty('--len', len)
  if (REDUCE()) { p.style.strokeDashoffset = '0'; return }
  requestAnimationFrame(() => svg.classList.add('drawn'))
}

/* ── the loupe ─────────────────────────────────────────────────
   A real loupe magnifies the negative under it, so this one reads
   pixels back out of the frame's own canvas rather than scaling a
   copy of the page. */
export function useLoupe(sheetRef, loupeRef) {
  useEffect(() => {
    const sheet = sheetRef.current
    const loupe = loupeRef.current
    if (!sheet || !loupe || REDUCE() || !CAN_HOVER()) return

    const ctl = new AbortController()
    const { signal } = ctl
    const L = 190, DPR = Math.min(devicePixelRatio || 1, 2), ZOOM = 2.6
    loupe.width = L * DPR
    loupe.height = L * DPR
    const lctx = loupe.getContext('2d')
    let active = null

    sheet.addEventListener('pointerover', (e) => {
      const frame = e.target.closest('.frame')
      if (!frame) return
      active = frame
      loupe.classList.add('on')
    }, { signal })

    sheet.addEventListener('pointerout', (e) => {
      const frame = e.target.closest('.frame')
      if (!frame || frame !== active) return
      if (e.relatedTarget && frame.contains(e.relatedTarget)) return
      active = null
      loupe.classList.remove('on')
    }, { signal })

    addEventListener('pointermove', (e) => {
      if (!active) return
      const cv = active.querySelector('canvas')
      if (!cv || !cv.dataset.developed) return
      const b = active.getBoundingClientRect()
      const fx = (e.clientX - b.left) / b.width
      const fy = (e.clientY - b.top) / b.height
      const sw = cv.width / ZOOM, sh = cv.height / ZOOM
      const sx = Math.max(0, Math.min(cv.width - sw, fx * cv.width - sw / 2))
      const sy = Math.max(0, Math.min(cv.height - sh, fy * cv.height - sh / 2))
      lctx.setTransform(1, 0, 0, 1, 0, 0)
      lctx.clearRect(0, 0, loupe.width, loupe.height)
      lctx.drawImage(cv, sx, sy, sw, sh, 0, 0, loupe.width, loupe.height)
      loupe.style.left = e.clientX + 'px'
      loupe.style.top = e.clientY + 'px'
    }, { passive: true, signal })

    return () => { ctl.abort(); loupe.classList.remove('on') }
  }, [sheetRef, loupeRef])
}

/* ── the reel of negatives: scroll-linked scrub ─────────────── */
export function useReel(trackRef) {
  useEffect(() => {
    const reel = trackRef.current
    if (!reel) return
    const ctl = new AbortController()
    let target = 0, cur = 0, raf = null

    const step = () => {
      cur += (target - cur) * 0.08
      reel.style.transform = `translateX(${cur.toFixed(1)}px)`
      if (Math.abs(target - cur) > 0.4) raf = requestAnimationFrame(step)
      else raf = null
    }

    const onScroll = () => {
      const overflow = reel.scrollWidth - reel.parentElement.clientWidth
      if (overflow <= 0) return
      const doc = document.documentElement
      const p = doc.scrollTop / Math.max(1, doc.scrollHeight - innerHeight)
      target = -Math.min(overflow, p * overflow * 1.65)
      if (REDUCE()) { reel.style.transform = `translateX(${target}px)`; return }
      if (!raf) raf = requestAnimationFrame(step)
    }

    addEventListener('scroll', onScroll, { passive: true, signal: ctl.signal })
    onScroll()
    return () => { ctl.abort(); if (raf) cancelAnimationFrame(raf) }
  }, [trackRef])
}

/* ── sprocket parallax ─────────────────────────────────────── */
export function usePerf(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || REDUCE()) return
    const perfs = [...root.querySelectorAll('.dr-perf')]
    if (!perfs.length) return
    const ctl = new AbortController()
    addEventListener('scroll', () => {
      const y = scrollY
      perfs.forEach((el, i) => {
        el.style.backgroundPositionX = ((i % 2 ? 1 : -1) * y * 0.06).toFixed(1) + 'px'
      })
    }, { passive: true, signal: ctl.signal })
    return () => ctl.abort()
  }, [rootRef])
}

/* ── prints lean toward the cursor ─────────────────────────── */
export function useTilt(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || REDUCE() || !CAN_HOVER()) return
    const ctl = new AbortController()
    const { signal } = ctl
    const frames = []

    for (const el of root.querySelectorAll('.dr-tilt')) {
      if (!el.querySelector('.sheen')) {
        const s = document.createElement('i')
        s.className = 'sheen'
        el.appendChild(s)
      }
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null
      const step = () => {
        cx += (tx - cx) * 0.12
        cy += (ty - cy) * 0.12
        el.style.transform = `perspective(900px) rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg)`
        if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.02) raf = requestAnimationFrame(step)
        else raf = null
      }
      frames.push(() => { if (raf) cancelAnimationFrame(raf) })
      el.addEventListener('pointermove', (e) => {
        const b = el.getBoundingClientRect()
        const fx = (e.clientX - b.left) / b.width - 0.5
        const fy = (e.clientY - b.top) / b.height - 0.5
        tx = fx * 5; ty = -fy * 5
        el.style.setProperty('--shx', ((fx + 0.5) * 100).toFixed(1) + '%')
        el.style.setProperty('--shy', ((fy + 0.5) * 100).toFixed(1) + '%')
        if (!raf) raf = requestAnimationFrame(step)
      }, { signal })
      el.addEventListener('pointerleave', () => {
        tx = 0; ty = 0
        if (!raf) raf = requestAnimationFrame(step)
      }, { signal })
    }

    return () => { ctl.abort(); frames.forEach((f) => f()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, ...deps])
}

/* ── dust and hair ─────────────────────────────────────────────
   Thirteen of them, on the glass rather than in the picture. Move
   the cursor near one and it goes. */
export function useDust(dustRef) {
  useEffect(() => {
    const dustEl = dustRef.current
    if (!dustEl || REDUCE()) return
    const ctl = new AbortController()
    dustEl.textContent = ''

    const N = 13
    const specks = []
    for (let i = 0; i < N; i++) {
      const s = document.createElement('i')
      const hair = i % 4 === 0
      s.className = 'dr-speck' + (hair ? ' hair' : '')
      const w = hair ? 1.2 + Math.random() * 1.4 : 1.4 + Math.random() * 2.6
      s.style.width = w.toFixed(1) + 'px'
      s.style.height = (hair ? w * (6 + Math.random() * 12) : w).toFixed(1) + 'px'
      const x = 6 + Math.random() * 88, y = 8 + Math.random() * 84
      s.style.left = x + 'vw'
      s.style.top = y + 'vh'
      s.style.rotate = (Math.random() * 180).toFixed(0) + 'deg'
      dustEl.appendChild(s)
      specks.push({ el: s, x, y, gone: false })
    }

    let cleaned = 0
    addEventListener('pointermove', (e) => {
      const px = (e.clientX / innerWidth) * 100
      const py = (e.clientY / innerHeight) * 100
      for (const sp of specks) {
        if (sp.gone) continue
        const dx = sp.x - px, dy = sp.y - py
        if (Math.hypot(dx, dy * 0.6) > 3.2) continue
        sp.gone = true
        const ang = Math.atan2(dy, dx)
        sp.el.style.transform = `translate(${Math.cos(ang) * 180}px, ${Math.sin(ang) * 180 - 40}px) rotate(220deg)`
        sp.el.classList.add('off')
        if (++cleaned === N) showNote("sheet's clean.\nit never is.", 5200)
      }
    }, { passive: true, signal: ctl.signal })

    return () => { ctl.abort(); dustEl.textContent = '' }
  }, [dustRef])
}

/* ── dust motes in the enlarger beam ───────────────────────────
   Spawned here so each gets its own lane, size and duration; the
   drift itself is CSS. */
export function useMotes(groupRef) {
  useEffect(() => {
    const g = groupRef.current
    if (!g || REDUCE() || g.childElementCount) return
    const NS = 'http://www.w3.org/2000/svg'
    for (let i = 0; i < 22; i++) {
      const c = document.createElementNS(NS, 'circle')
      const t = Math.random()
      c.setAttribute('cx', String(230 - t * 560 + (Math.random() - 0.5) * 70))
      c.setAttribute('cy', String(320 + t * 300 + Math.random() * 60))
      c.setAttribute('r', (0.7 + Math.random() * 1.5).toFixed(1))
      c.setAttribute('fill', '#ffe9d2')
      c.style.setProperty('--o', (0.25 + Math.random() * 0.45).toFixed(2))
      c.style.animationDuration = (7 + Math.random() * 9).toFixed(1) + 's'
      c.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's'
      g.appendChild(c)
    }
    return () => { g.textContent = '' }
  }, [groupRef])
}

/* ── opening the console is the correct instinct ────────────── */
export function useConsoleNote() {
  useEffect(() => {
    if (window.__safelight_logged) return
    window.__safelight_logged = 1
    console.log(
      '%c●%c SAFELIGHT ON\n%cEverything you see was drawn in a canvas, in grayscale, then put\nthrough an emulsion curve. No stock photography anywhere on this site.\nThe develop is a density sweep: dark areas surface first.\n\nsrc: github.com/parthm667 · try the lights, and the dust.',
      'color:#c1272d;font-size:16px',
      'color:#ff7a45;font-weight:700;letter-spacing:.1em',
      'color:#8e8577;line-height:1.5'
    )
  }, [])
}

/* A ref-and-mount helper for the one-shot paints (the portrait in
   the self room, the big print on the easel) that are not part of
   the sheet's staggered develop. */
export function useOneShot(canvasRef, gen, { slow = false, key } = {}) {
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !gen) return
    let sweep = null
    let cancelled = false
    loadAssets().then(() => {
      if (cancelled || !canvasRef.current) return
      sweep = developInto(cv, gen, { duration: slow ? 1500 : 1000 })
    })
    return () => { cancelled = true; sweep?.cancel() }
  }, [canvasRef, gen, slow, key])
}

export { REDUCE, CAN_HOVER }
