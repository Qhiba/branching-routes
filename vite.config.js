/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { Buffer } from 'buffer'

// Save/Load: during `npm run dev` this exposes <repo>/saves at /__saves so Ctrl+S can write real files.
//   GET  /__saves        -> [{ name, size, modified }] newest first
//   GET  /__saves/<file> -> file bytes
//   PUT  /__saves/<file> -> write file (overwrites)
// Only .json/.zip files with a plain name; writes need the x-br-saves header. Dev server only: never in the build.
function savesPlugin() {
  const dir = path.resolve(__dirname, 'saves')
  const NAME = /^[A-Za-z0-9_-]{1,100}.(json|zip)$/
  const MAX_BYTES = 100 * 1024 * 1024
  return {
    name: 'br-saves',
    configureServer(server) {
      server.middlewares.use('/__saves', async (req, res) => {
        const reply = (code, body, type = 'application/json') => {
          res.statusCode = code
          res.setHeader('x-br-saves', '1')
          res.setHeader('content-type', type)
          res.end(body)
        }
        const fail = (code, error) => reply(code, JSON.stringify({ error }))
        try {
          const name = decodeURIComponent((req.url || '/').split('?')[0].slice(1))
          if (req.method === 'GET' && name === '') {
            const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => NAME.test(n)) : []
            const list = files.map(n => {
              const st = fs.statSync(path.join(dir, n))
              return { name: n, size: st.size, modified: st.mtimeMs }
            }).sort((a, b) => b.modified - a.modified)
            return reply(200, JSON.stringify(list))
          }
          if (!NAME.test(name)) return fail(400, 'invalid_name')
          const file = path.join(dir, name)
          if (req.method === 'GET') {
            if (!fs.existsSync(file)) return fail(404, 'not_found')
            return reply(200, fs.readFileSync(file), 'application/octet-stream')
          }
          if (req.method === 'PUT') {
            if (req.headers['x-br-saves'] !== '1') return fail(403, 'forbidden')
            const chunks = []
            let size = 0
            for await (const chunk of req) {
              size += chunk.length
              if (size > MAX_BYTES) return fail(413, 'too_large')
              chunks.push(chunk)
            }
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(file, Buffer.concat(chunks))
            return reply(200, JSON.stringify({ name, size }))
          }
          return fail(405, 'method_not_allowed')
        } catch (err) {
          return fail(500, String(err.message || err))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), savesPlugin()],
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
      store:      path.resolve(__dirname, 'src/store'),
      utils:      path.resolve(__dirname, 'src/utils'),
      styles:     path.resolve(__dirname, 'src/styles'),
      hooks:      path.resolve(__dirname, 'src/hooks'),
    }
  },
  test: {
    globals: true,
    environment: 'node',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor_react';
          }
          if (id.includes('node_modules/@xyflow')) {
            return 'vendor_reactflow';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor_icons';
          }
        }
      }
    }
  }
})
