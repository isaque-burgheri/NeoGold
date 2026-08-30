/**
 * Guarda e devolve o pacote cifrado do plano.
 *
 * Esta função é deliberadamente burra: ela não sabe a senha do usuário,
 * não consegue abrir o pacote e não tem noção do que há dentro. Só
 * conhece um identificador opaco de 64 caracteres e um blob de bytes.
 *
 * Requer as variáveis de ambiente injetadas pela integração Upstash da
 * Vercel (KV_REST_API_URL / KV_REST_API_TOKEN). Sem elas, responde 503 e
 * o app continua funcionando só com o armazenamento local.
 */

const URL_KV = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN_KV = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

const IDENTIFICADOR_VALIDO = /^[0-9a-f]{64}$/
const LIMITE_BYTES = 512 * 1024

/** Executa um comando Redis pela API REST do Upstash. */
async function comando(argumentos) {
  const resposta = await fetch(URL_KV, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN_KV}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(argumentos),
  })

  if (!resposta.ok) {
    throw new Error(`Armazenamento respondeu ${resposta.status}`)
  }
  const corpo = await resposta.json()
  return corpo.result
}

function lerCorpo(req) {
  if (typeof req.body === 'string') return req.body
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body)
  return null
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (!URL_KV || !TOKEN_KV) {
    return res.status(503).json({
      erro: 'sync_nao_configurado',
      mensagem:
        'A sincronização ainda não foi provisionada. Crie um banco Upstash Redis no Marketplace da Vercel e conecte-o a este projeto.',
    })
  }

  const identificador = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
  if (!IDENTIFICADOR_VALIDO.test(String(identificador ?? ''))) {
    return res.status(400).json({ erro: 'identificador_invalido' })
  }

  const chave = `neogold:plano:${identificador}`

  try {
    if (req.method === 'GET') {
      const guardado = await comando(['GET', chave])
      if (!guardado) return res.status(404).json({ erro: 'nao_encontrado' })
      return res.status(200).json(JSON.parse(guardado))
    }

    if (req.method === 'PUT') {
      const corpo = lerCorpo(req)
      if (!corpo) return res.status(400).json({ erro: 'corpo_vazio' })
      if (Buffer.byteLength(corpo, 'utf8') > LIMITE_BYTES) {
        return res.status(413).json({ erro: 'pacote_grande_demais' })
      }

      let pacote
      try {
        pacote = JSON.parse(corpo)
      } catch {
        return res.status(400).json({ erro: 'json_invalido' })
      }
      if (!pacote?.dados || !pacote?.iv || !pacote?.sal || !pacote?.atualizadoEm) {
        return res.status(400).json({ erro: 'pacote_incompleto' })
      }

      // Trava de concorrência: se o que está guardado é mais novo do que a
      // versão que este aparelho conhecia, recusa em vez de sobrescrever.
      // O cliente então busca a versão da nuvem e pergunta ao usuário.
      const conhecido = Array.isArray(req.query?.desde) ? req.query.desde[0] : req.query?.desde
      const guardado = await comando(['GET', chave])
      if (guardado) {
        try {
          const atual = JSON.parse(guardado)
          if (atual.atualizadoEm && atual.atualizadoEm !== conhecido) {
            if (!conhecido || atual.atualizadoEm > conhecido) {
              return res.status(409).json({ erro: 'conflito', remoto: atual })
            }
          }
        } catch {
          // Pacote guardado ilegível: deixa a escrita seguir e substituí-lo.
        }
      }

      await comando(['SET', chave, JSON.stringify(pacote)])
      return res.status(200).json({ ok: true, atualizadoEm: pacote.atualizadoEm })
    }

    if (req.method === 'DELETE') {
      await comando(['DEL', chave])
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ erro: 'metodo_nao_permitido' })
  } catch (erro) {
    // Nunca ecoa o corpo da requisição no log — ele é o dado do usuário.
    console.error('[NeoGold] Falha no armazenamento:', erro.message)
    return res.status(502).json({ erro: 'armazenamento_indisponivel' })
  }
}
