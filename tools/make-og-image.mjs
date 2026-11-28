// Renders public/og.png, the 1200 x 630 card shown when the site is shared.
// Run with: node tools/make-og-image.mjs
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { FEATURED_WORK } from '../src/desktop/filesystem.js'

const font = async name => (await readFile(new URL(`../public/fonts/${name}`, import.meta.url))).toString('base64')
const escape = text => text.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])
const rows = FEATURED_WORK.map(work => `<div class="row"><span class="title">${escape(work.title)}</span><span class="note">${escape(work.evidence)}</span></div>`).join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Ubuntu Mono'; src: url(data:font/ttf;base64,${await font('ubuntu-mono.ttf')}); font-weight: 400; }
@font-face { font-family: 'Ubuntu Mono'; src: url(data:font/ttf;base64,${await font('ubuntu-mono-bold.ttf')}); font-weight: 700; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #08090a; font-family: 'Ubuntu Mono', monospace; color: #dedee3; display: grid; place-items: center; }
.window { width: 1104px; height: 534px; background: #101113; border: 1px solid #2a2b30; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
.bar { height: 46px; background: #17181b; border-bottom: 1px solid #2a2b30; display: flex; align-items: center; justify-content: center; color: #aaaab2; font-size: 21px; position: relative; }
.dots { position: absolute; left: 20px; display: flex; gap: 9px; }
.dots i { width: 13px; height: 13px; border-radius: 50%; background: #3a3b41; }
.screen { flex: 1; padding: 30px 40px; font-size: 27px; line-height: 1.32; display: flex; flex-direction: column; }
.prompt { color: #85858d; }
.name { font-size: 76px; font-weight: 700; color: #f3f3f5; line-height: 1.05; margin-top: 14px; letter-spacing: -1px; }
.about { color: #aaaab2; margin: 8px 0 26px; }
.row { display: flex; gap: 24px; }
.title { color: #a3bdd8; font-weight: 700; width: 320px; flex: none; }
.note { color: #c9c9cf; }
.last { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; }
.cursor { display: inline-block; width: 14px; height: 28px; background: #dedee3; vertical-align: -4px; margin-left: 2px; }
.site { color: #85858d; }
</style></head><body><div class="window">
<div class="bar"><span class="dots"><i></i><i></i><i></i></span>parth@portfolio: ~</div>
<div class="screen">
<div><span class="prompt">parth@portfolio:~$</span> overview</div>
<div class="name">parth mhaske</div>
<div class="about">cs + math, umd '28.</div>
${rows}
<div class="last"><div><span class="prompt">parth@portfolio:~$</span> run uav<span class="cursor"></span></div><div class="site">mhaske.com</div></div>
</div></div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
const path = fileURLToPath(new URL('../public/og.png', import.meta.url))
await page.screenshot({ path, type: 'png' })
await browser.close()
console.log(`wrote ${path}`)
