import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Plugin لخدمة ملفات العميل الثابتة على /customer/*
function customerStaticPlugin() {
  const customerDir = path.resolve(import.meta.dirname, '../customer')
  return {
    name: 'customer-static',
    configureServer(server) {
      server.middlewares.use('/customer', (req, res, next) => {
        const filePath = path.join(customerDir, req.url === '/' ? 'index.html' : req.url)
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath)
          const mime = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : 'application/javascript'
          res.setHeader('Content-Type', mime)
          res.end(fs.readFileSync(filePath))
        } else {
          next()
        }
      })
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), customerStaticPlugin()],
  server: {
    port: 5173,
  },
})
