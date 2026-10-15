import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Readable } from 'node:stream'
import { Buffer } from 'node:buffer'

// Exercise the same authenticated API locally that Vercel runs in production.
function resumePickerApi() {
  return {
    name: 'resume-picker-api',
    async configureServer(server) {
      const { handleRequest } = await import('./server/resume-picker.mjs')
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/resume-picker') return next()
        try {
          const method = req.method || 'GET'
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method,
            headers: req.headers,
            ...(!['GET', 'HEAD'].includes(method) ? { body: Readable.toWeb(req), duplex: 'half' } : {}),
          })
          const response = await handleRequest(request)
          res.statusCode = response.status
          for (const [name, value] of response.headers) res.setHeader(name, value)
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ error: 'The resume picker API is unavailable.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
// base: '/' works for username.github.io repos (root domain)
export default defineConfig({
  plugins: [react(), resumePickerApi()],
  base: '/',
})
