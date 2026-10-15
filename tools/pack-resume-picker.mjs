import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createCipheriv, pbkdf2Sync, randomBytes, createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// PDF sources remain outside the repository. Only encrypted data is published.
const sourceDirectory = process.argv[2]
const password = process.env.RESUME_PICKER_BUILD_PASSWORD
if (!sourceDirectory || !password) {
  throw new Error('Usage: set RESUME_PICKER_BUILD_PASSWORD, then node tools/pack-resume-picker.mjs <PDF directory>')
}
const resumes = {}
for (const variant of ['SWE', 'AI', 'Defense', 'QD', 'Quant']) {
  const filename = `ParthMhaske${variant}Resume.pdf`
  const source = resolve(sourceDirectory, filename)
  const pdf = await readFile(source)
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error(`Invalid PDF: ${filename}`)
  const extraction = spawnSync('pdftotext', ['-layout', source, '-'], { encoding: 'utf8', maxBuffer: 5_000_000 })
  if (extraction.status !== 0) throw new Error(`pdftotext failed for ${filename}`)
  const text = extraction.stdout.replace(/\f/g, '').split('\n').map(line => line.trimEnd()).join('\n').trim()
  if (text.length < 500) throw new Error(`Insufficient extracted text: ${filename}`)
  resumes[variant] = { filename, text, pdf: pdf.toString('base64'), sha256: createHash('sha256').update(pdf).digest('hex') }
}
const payload = {
  sessionSecret: randomBytes(32).toString('hex'),
  resumes,
  facts: 'Citizenship / work authorization / sponsorship: not confirmed. Education / enrollment: not confirmed (the PDFs list a B.S. in Computer Science and Applied Mathematics at the University of Maryland). Graduation date needs confirmation: the SWE, AI, Defense and QD PDFs show May 2028; the Quant PDF shows May 2029. Only use a graduation date that is truthful for this application. Clearance, internship availability, location and willingness to relocate: not confirmed.',
}
const salt = randomBytes(32)
const iv = randomBytes(12)
const iterations = 310000
const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256')
const cipher = createCipheriv('aes-256-gcm', key, iv)
const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
const pack = { version: 1, iterations, salt: salt.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') }
const destination = fileURLToPath(new URL('../server/data/resumes.enc.json', import.meta.url))
await mkdir(dirname(destination), { recursive: true })
await writeFile(destination, `${JSON.stringify(pack)}\n`)
console.log(`Encrypted ${Object.keys(resumes).length} PDFs and their extracted text into server/data/resumes.enc.json`)
