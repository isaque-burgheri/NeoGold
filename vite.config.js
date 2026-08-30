import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Em deploy no GitHub Pages a app roda em /NeoGold/.
// Na Vercel (e em dev) roda na raiz.
const base = process.env.GITHUB_PAGES === 'true' ? '/NeoGold/' : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
