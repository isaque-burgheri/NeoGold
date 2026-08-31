/**
 * Gera as imagens do README, nos dois temas.
 *
 *   npm run build && npm run prints
 *
 * Roda o `dist/` num servidor estático efêmero e fotografa a página com o
 * Chrome já instalado na máquina (via puppeteer-core, que não baixa
 * navegador nenhum). Se o Chrome estiver em outro lugar, aponte com
 * CHROME_PATH.
 *
 * Os dados semeados são FICTÍCIOS de propósito: essas imagens vão para um
 * repositório público, e valor financeiro real não entra em print.
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicado = join(raiz, 'dist')
const destino = join(raiz, 'docs')

const CAMINHOS_CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean)

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

/**
 * Dados de vitrine. Nenhum valor real — nem mesmo a renda: um README
 * público ligado ao dono do repositório transforma qualquer salário ali
 * em divulgação de renda. Números redondos, escolhidos para a conta
 * 50/30/20 fechar limpa.
 */
const DADOS = {
  versao: 1,
  criadoEm: '2026-08-01T12:00:00.000Z',
  atualizadoEm: '2026-08-01T12:00:00.000Z',
  perfil: { nome: '', rendaMensal: 6000, custoVidaMensal: 3000 },
  orcamento: { essenciais: 50, lazer: 30, investimentos: 20 },
  dividas: [
    {
      id: 'd1',
      credor: 'Credor Exemplo',
      descricao: 'Cartão de crédito',
      valorOriginal: 12400,
      valorNegociado: 1980,
      vencimentoProposta: '',
      quitada: false,
      quitadaEm: null,
    },
  ],
  reserva: { acumulado: 4200, mesesAlvo: 6, percentualDoAporte: 60 },
  investimentos: {
    cicloIndice: 0,
    pilares: [
      { id: 'fiis', acumulado: 880 },
      { id: 'acoes-br', acumulado: 734 },
      { id: 'eua', acumulado: 440 },
    ],
  },
  metas: [
    {
      id: 'm1',
      titulo: 'Entrada do apartamento',
      valorAlvo: 30000,
      aporteMensal: 900,
      acumulado: 7200,
      concluida: false,
    },
  ],
  ui: { boasVindasVista: true },
}

function servir() {
  const servidor = createServer(async (req, res) => {
    const caminho = decodeURIComponent(req.url.split('?')[0])
    const arquivo = join(publicado, caminho === '/' ? 'index.html' : caminho)
    try {
      const conteudo = await readFile(arquivo)
      res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] ?? 'application/octet-stream' })
      res.end(conteudo)
    } catch {
      // SPA: qualquer rota desconhecida cai no index.
      res.writeHead(200, { 'Content-Type': TIPOS['.html'] })
      res.end(await readFile(join(publicado, 'index.html')))
    }
  })
  return new Promise((ok) => servidor.listen(0, () => ok({ servidor, porta: servidor.address().port })))
}

const chrome = CAMINHOS_CHROME.find((c) => existsSync(c))
if (!chrome) {
  console.error('Chrome não encontrado. Aponte o caminho com a variável CHROME_PATH.')
  process.exit(1)
}
if (!existsSync(publicado)) {
  console.error('Pasta dist/ não existe. Rode `npm run build` antes.')
  process.exit(1)
}
mkdirSync(destino, { recursive: true })

const { servidor, porta } = await servir()
const endereco = `http://localhost:${porta}/`

const navegador = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--hide-scrollbars'],
})

try {
  for (const tema of ['escuro', 'claro']) {
    const pagina = await navegador.newPage()
    await pagina.setViewport({ width: 1280, height: 880, deviceScaleFactor: 1.5 })

    // Semeia antes de qualquer script da página rodar — inclusive antes do
    // script anti-flash do index.html. Gravar depois e recarregar não serve:
    // o efeito do React regrava a preferência ao montar, e navegar para a
    // mesma URL nem sempre recarrega de fato.
    await pagina.evaluateOnNewDocument(
      (dados, escolha) => {
        localStorage.setItem('neogold:v1', JSON.stringify(dados))
        localStorage.setItem('neogold:tema', escolha)
      },
      DADOS,
      tema,
    )

    await pagina.goto(endereco, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 1400)) // deixa a entrada em cascata terminar

    const conferido = await pagina.evaluate(() => ({
      atributo: document.documentElement.dataset.tema,
      guardado: localStorage.getItem('neogold:tema'),
      fundo: getComputedStyle(document.body).backgroundColor,
    }))
    if (conferido.atributo !== tema) {
      throw new Error(
        `Tema não aplicou: pedi "${tema}", a página está em "${conferido.atributo}" ` +
          `(guardado: ${conferido.guardado}, fundo: ${conferido.fundo})`,
      )
    }
    console.log(`  ${tema}: fundo ${conferido.fundo}`)

    const saida = join(destino, `painel-${tema}.png`)
    await pagina.screenshot({ path: saida })
    console.log(`gerado: docs/painel-${tema}.png`)
    await pagina.close()
  }
} finally {
  await navegador.close()
  servidor.close()
}
