/**
 * Persistência local.
 *
 * Tudo mora no localStorage do navegador. Nada sai do dispositivo:
 * não existe backend, nem chamada de rede, nem analytics.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { estadoInicial, VERSAO_ESTADO, PILARES_PADRAO } from './defaults.js'

export const CHAVE_STORAGE = 'neogold:v1'

/** localStorage pode não existir (SSR, modo restrito, cookies bloqueados). */
function storageDisponivel() {
  try {
    const teste = '__neogold_teste__'
    window.localStorage.setItem(teste, '1')
    window.localStorage.removeItem(teste)
    return true
  } catch {
    return false
  }
}

/**
 * Normaliza qualquer objeto vindo do storage ou de um arquivo importado
 * contra o formato atual, preenchendo o que faltar. Evita que uma versão
 * antiga dos dados quebre a tela.
 */
export function normalizar(bruto) {
  const base = estadoInicial()
  if (!bruto || typeof bruto !== 'object') return base

  const num = (v, padrao = 0) => (Number.isFinite(Number(v)) ? Number(v) : padrao)
  const texto = (v, padrao = '') => (typeof v === 'string' ? v : padrao)

  const pilaresSalvos = Array.isArray(bruto.investimentos?.pilares) ? bruto.investimentos.pilares : []

  return {
    versao: VERSAO_ESTADO,
    criadoEm: texto(bruto.criadoEm, base.criadoEm),
    atualizadoEm: texto(bruto.atualizadoEm, base.atualizadoEm),

    perfil: {
      nome: texto(bruto.perfil?.nome),
      rendaMensal: num(bruto.perfil?.rendaMensal),
      custoVidaMensal: num(bruto.perfil?.custoVidaMensal),
    },

    orcamento: {
      essenciais: num(bruto.orcamento?.essenciais, base.orcamento.essenciais),
      lazer: num(bruto.orcamento?.lazer, base.orcamento.lazer),
      investimentos: num(bruto.orcamento?.investimentos, base.orcamento.investimentos),
    },

    dividas: (Array.isArray(bruto.dividas) ? bruto.dividas : []).map((d) => ({
      id: texto(d?.id) || crypto.randomUUID(),
      credor: texto(d?.credor),
      descricao: texto(d?.descricao),
      valorOriginal: num(d?.valorOriginal),
      valorNegociado: num(d?.valorNegociado),
      vencimentoProposta: texto(d?.vencimentoProposta),
      quitada: Boolean(d?.quitada),
      quitadaEm: d?.quitadaEm ?? null,
    })),

    reserva: {
      acumulado: num(bruto.reserva?.acumulado),
      mesesAlvo: num(bruto.reserva?.mesesAlvo, base.reserva.mesesAlvo),
      percentualDoAporte: num(bruto.reserva?.percentualDoAporte, base.reserva.percentualDoAporte),
    },

    investimentos: {
      cicloIndice: num(bruto.investimentos?.cicloIndice, 0),
      // Os pilares são fixos por id; só o acumulado e os exemplos são editáveis.
      pilares: PILARES_PADRAO.map((padrao) => {
        const salvo = pilaresSalvos.find((p) => p?.id === padrao.id)
        return {
          ...padrao,
          exemplos: texto(salvo?.exemplos, padrao.exemplos),
          acumulado: num(salvo?.acumulado),
        }
      }),
    },

    metas: (Array.isArray(bruto.metas) ? bruto.metas : []).map((m) => ({
      id: texto(m?.id) || crypto.randomUUID(),
      titulo: texto(m?.titulo),
      valorAlvo: num(m?.valorAlvo),
      aporteMensal: num(m?.aporteMensal),
      acumulado: num(m?.acumulado),
      concluida: Boolean(m?.concluida),
    })),

    ui: {
      boasVindasVista: Boolean(bruto.ui?.boasVindasVista),
    },
  }
}

function ler() {
  if (!storageDisponivel()) return estadoInicial()
  try {
    const cru = window.localStorage.getItem(CHAVE_STORAGE)
    if (!cru) return estadoInicial()
    return normalizar(JSON.parse(cru))
  } catch (erro) {
    console.warn('[NeoGold] Não foi possível ler os dados salvos. Começando do zero.', erro)
    return estadoInicial()
  }
}

/**
 * Hook central do app. Devolve o estado, um atualizador e utilitários
 * de exportar / importar / apagar.
 */
export function usePlano() {
  const [estado, setEstado] = useState(ler)
  const [persistencia, setPersistencia] = useState(() =>
    storageDisponivel() ? 'ok' : 'indisponivel',
  )
  const primeiraRenderizacao = useRef(true)

  // Salva a cada mudança.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    if (persistencia === 'indisponivel') return
    try {
      window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado))
      setPersistencia('ok')
    } catch (erro) {
      console.error('[NeoGold] Falha ao salvar no localStorage.', erro)
      setPersistencia('erro')
    }
  }, [estado, persistencia])

  // Mantém abas abertas do mesmo navegador em sincronia.
  useEffect(() => {
    function aoMudarStorage(evento) {
      if (evento.key !== CHAVE_STORAGE || !evento.newValue) return
      try {
        setEstado(normalizar(JSON.parse(evento.newValue)))
      } catch {
        /* ignora payload inválido vindo de outra aba */
      }
    }
    window.addEventListener('storage', aoMudarStorage)
    return () => window.removeEventListener('storage', aoMudarStorage)
  }, [])

  /** atualizar(rascunho => { rascunho.perfil.nome = 'x' }) — recebe uma cópia rasa segura. */
  const atualizar = useCallback((receita) => {
    setEstado((anterior) => {
      const copia = structuredClone(anterior)
      const retorno = receita(copia)
      const proximo = retorno ?? copia
      proximo.atualizadoEm = new Date().toISOString()
      return proximo
    })
  }, [])

  const substituir = useCallback((bruto) => {
    setEstado(normalizar(bruto))
  }, [])

  const apagarTudo = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE_STORAGE)
    } catch {
      /* segue com o reset em memória mesmo se o storage falhar */
    }
    setEstado(estadoInicial())
  }, [])

  return { estado, atualizar, substituir, apagarTudo, persistencia }
}

/** Baixa um .json com tudo, para backup ou para levar a outro dispositivo. */
export function exportarArquivo(estado) {
  const conteudo = JSON.stringify(estado, null, 2)
  const blob = new Blob([conteudo], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const carimbo = new Date().toISOString().slice(0, 10)
  const link = document.createElement('a')
  link.href = url
  link.download = `backup-neogold-${carimbo}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Lê um .json escolhido pelo usuário e devolve o objeto já normalizado. */
export function lerArquivo(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => {
      try {
        resolve(normalizar(JSON.parse(String(leitor.result))))
      } catch {
        reject(new Error('Arquivo inválido: não é um JSON de backup do NeoGold.'))
      }
    }
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    leitor.readAsText(arquivo)
  })
}
