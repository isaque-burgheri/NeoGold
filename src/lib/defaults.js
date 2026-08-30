/**
 * Estado inicial da aplicação.
 *
 * IMPORTANTE: este arquivo vai para o repositório público.
 * Nenhum valor real, nome de credor ou saldo pessoal deve ser escrito aqui.
 * Os números de verdade são digitados no painel de Configuração e ficam
 * apenas no localStorage do navegador de quem usa.
 */

export const VERSAO_ESTADO = 1

/** Referência do plano: 50/30/20 (Thiago Nigro) + divisão dos 20% (Bruno OM). */
export const PLANO_REFERENCIA = {
  orcamento: { essenciais: 50, lazer: 30, investimentos: 20 },
  divisaoInvestimento: { reserva: 60, rendaVariavel: 40 },
  mesesReserva: 6,
}

/** Os três pilares da renda variável, com aportes iguais. */
export const PILARES_PADRAO = [
  {
    id: 'fiis',
    nome: 'Fundos Imobiliários',
    sigla: 'FIIs',
    exemplos: 'GARI11 (galpões), BTCI11 (papel), BDIF11 (infra), XPML11 (shoppings)',
    cor: 'esmeralda',
    acumulado: 0,
  },
  {
    id: 'acoes-br',
    nome: 'Ações do Brasil',
    sigla: 'Ações BR',
    exemplos: 'BOVA11 (ETF do Ibovespa) ou holdings sólidas como ITSA4',
    cor: 'ouro',
    acumulado: 0,
  },
  {
    id: 'eua',
    nome: 'Bolsa Americana em Dólar',
    sigla: 'EUA',
    exemplos: 'IVVB11 (S&P 500 na B3) — acumule 2 a 3 meses antes de comprar a cota',
    cor: 'safira',
    acumulado: 0,
  },
]

export function estadoInicial() {
  return {
    versao: VERSAO_ESTADO,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),

    perfil: {
      nome: '',
      rendaMensal: 0,
      custoVidaMensal: 0,
    },

    orcamento: { ...PLANO_REFERENCIA.orcamento },

    dividas: [],

    reserva: {
      acumulado: 0,
      mesesAlvo: PLANO_REFERENCIA.mesesReserva,
      percentualDoAporte: PLANO_REFERENCIA.divisaoInvestimento.reserva,
    },

    investimentos: {
      cicloIndice: 0,
      pilares: PILARES_PADRAO.map((p) => ({ ...p })),
    },

    metas: [],

    ui: {
      boasVindasVista: false,
    },
  }
}

/**
 * Um plano em que ninguém tocou ainda.
 *
 * Importa para a sincronização: um aparelho recém-aberto tem
 * `atualizadoEm` de agora e por isso *parece* mais novo que a nuvem.
 * Sem esta checagem, todo aparelho novo abriria com um falso conflito
 * em vez de simplesmente baixar os dados.
 */
export function planoVazio(estado) {
  if (!estado) return true
  return (
    !estado.perfil?.nome &&
    !estado.perfil?.rendaMensal &&
    !estado.perfil?.custoVidaMensal &&
    (estado.dividas?.length ?? 0) === 0 &&
    (estado.metas?.length ?? 0) === 0 &&
    !estado.reserva?.acumulado &&
    (estado.investimentos?.pilares ?? []).every((p) => !p.acumulado)
  )
}

/** Cria uma dívida vazia pronta para edição. */
export function novaDivida() {
  return {
    id: crypto.randomUUID(),
    credor: '',
    descricao: '',
    valorOriginal: 0,
    valorNegociado: 0,
    vencimentoProposta: '',
    quitada: false,
    quitadaEm: null,
  }
}

/** Cria uma meta vazia pronta para edição. */
export function novaMeta() {
  return {
    id: crypto.randomUUID(),
    titulo: '',
    valorAlvo: 0,
    aporteMensal: 0,
    acumulado: 0,
    concluida: false,
  }
}
