import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Em deploy no GitHub Pages a app roda em /NeoGold/.
// Na Vercel (e em dev) roda na raiz.
const base = process.env.GITHUB_PAGES === 'true' ? '/NeoGold/' : '/'

/**
 * Em produção, /api/plano é a função serverless de api/plano.js. O
 * servidor de desenvolvimento do Vite não executa aquela pasta, então
 * este plugin responde igual usando um Map em memória — o bastante para
 * exercitar o fluxo de sincronização localmente.
 *
 * Só existe em dev: o Map morre junto com o processo.
 */
function apiDeDesenvolvimento() {
  const guardados = new Map()
  const IDENTIFICADOR_VALIDO = /^[0-9a-f]{64}$/

  return {
    name: 'neogold-api-dev',
    apply: 'serve',
    configureServer(servidor) {
      servidor.middlewares.use('/api/plano', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const identificador = url.searchParams.get('id') ?? ''

        const responder = (status, corpo) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(corpo))
        }

        if (!IDENTIFICADOR_VALIDO.test(identificador)) {
          return responder(400, { erro: 'identificador_invalido' })
        }

        if (req.method === 'GET') {
          const guardado = guardados.get(identificador)
          return guardado ? responder(200, guardado) : responder(404, { erro: 'nao_encontrado' })
        }

        if (req.method === 'DELETE') {
          guardados.delete(identificador)
          return responder(200, { ok: true })
        }

        if (req.method === 'PUT') {
          let corpo = ''
          req.on('data', (pedaco) => {
            corpo += pedaco
          })
          req.on('end', () => {
            let pacote
            try {
              pacote = JSON.parse(corpo)
            } catch {
              return responder(400, { erro: 'json_invalido' })
            }

            const conhecido = url.searchParams.get('desde')
            const atual = guardados.get(identificador)
            if (atual?.atualizadoEm && atual.atualizadoEm !== conhecido) {
              if (!conhecido || atual.atualizadoEm > conhecido) {
                return responder(409, { erro: 'conflito', remoto: atual })
              }
            }

            guardados.set(identificador, pacote)
            return responder(200, { ok: true, atualizadoEm: pacote.atualizadoEm })
          })
          return undefined
        }

        return responder(405, { erro: 'metodo_nao_permitido' })
      })
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), apiDeDesenvolvimento()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
