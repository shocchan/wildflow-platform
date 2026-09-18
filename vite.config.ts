import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 開発サーバー用: 拡張子なしURL → public/*.html。
 * 本番（Cloudflare Workers assets）は /beginner を beginner.html に自動で解決するが、
 * vite dev はしないので、ここで同じ挙動に揃える（/animalflow も同様）。
 */
const STATIC_HTML_PAGES = ['animalflow', 'beginner', 'badminton', 'routine', 'about-animalflow', 'zh/beginner', 'zh/badminton', 'zh/routine', 'zh/about-animalflow']
const cleanStaticUrls = (): Plugin => ({
  name: 'wildflow-clean-static-urls',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const path = (req.url ?? '').split('?')[0]
      const name = path.replace(/^\/|\/$/g, '')
      if (STATIC_HTML_PAGES.includes(name)) req.url = `/${name}.html`
      next()
    })
  },
})

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cleanStaticUrls(),
  ],
})
