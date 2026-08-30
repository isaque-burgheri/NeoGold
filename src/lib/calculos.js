/**
 * Todo o cálculo derivado do plano fica aqui — nenhum componente calcula
 * dinheiro por conta própria.
 *
 * Base: regra 50/30/20 (Thiago Nigro) com os 20% divididos em paralelo
 * entre reserva de emergência e renda variável (Bruno OM), e a renda
 * variável pulverizada em três pilares iguais.
 */

const ROTULOS_CICLO = ['Fundos Imobiliários', 'Ações do Brasil', 'Bolsa Americana (IVVB11)']

function seguro(n) {
  return Number.isFinite(n) ? n : 0
}

/** Divide protegendo contra 0 e NaN. Devolve fração entre 0 e 1. */
export function progresso(atual, alvo) {
  const a = seguro(atual)
  const t = seguro(alvo)
  if (t <= 0) return 0
  return Math.min(Math.max(a / t, 0), 1)
}

export function calcularOrcamento(estado) {
  const renda = seguro(estado.perfil.rendaMensal)
  const { essenciais, lazer, investimentos } = estado.orcamento

  const fatias = [
    { id: 'essenciais', rotulo: 'Essenciais', percentual: seguro(essenciais), descricao: 'Moradia, água, luz, mercado' },
    { id: 'lazer', rotulo: 'Lazer e hobbies', percentual: seguro(lazer), descricao: 'Streamings, saídas, cartão' },
    { id: 'investimentos', rotulo: 'Investimentos', percentual: seguro(investimentos), descricao: 'Reserva e renda variável' },
  ].map((f) => ({ ...f, valor: (renda * f.percentual) / 100 }))

  const somaPercentuais = fatias.reduce((total, f) => total + f.percentual, 0)

  return {
    renda,
    fatias,
    somaPercentuais,
    fechaCem: Math.abs(somaPercentuais - 100) < 0.01,
    cotaInvestimento: (renda * seguro(investimentos)) / 100,
  }
}

export function calcularAportes(estado) {
  const { cotaInvestimento } = calcularOrcamento(estado)
  const percReserva = Math.min(Math.max(seguro(estado.reserva.percentualDoAporte), 0), 100)

  const paraReserva = (cotaInvestimento * percReserva) / 100
  const paraRendaVariavel = cotaInvestimento - paraReserva
  const pilares = estado.investimentos.pilares
  const porPilar = pilares.length > 0 ? paraRendaVariavel / pilares.length : 0

  const indice = pilares.length > 0
    ? ((seguro(estado.investimentos.cicloIndice) % pilares.length) + pilares.length) % pilares.length
    : 0

  return {
    cotaInvestimento,
    percReserva,
    percRendaVariavel: 100 - percReserva,
    paraReserva,
    paraRendaVariavel,
    porPilar,
    pilares: pilares.map((p, i) => ({
      ...p,
      aporteMensal: porPilar,
      daVez: i === indice,
    })),
    indiceCiclo: indice,
    pilarDaVez: pilares[indice] ?? null,
    rotuloDaVez: ROTULOS_CICLO[indice] ?? pilares[indice]?.nome ?? '—',
    totalInvestido: pilares.reduce((t, p) => t + seguro(p.acumulado), 0),
  }
}

export function calcularReserva(estado) {
  const custoVida = seguro(estado.perfil.custoVidaMensal)
  const meses = Math.max(seguro(estado.reserva.mesesAlvo), 0)
  const alvo = custoVida * meses
  const acumulado = seguro(estado.reserva.acumulado)
  const { paraReserva } = calcularAportes(estado)
  const falta = Math.max(alvo - acumulado, 0)

  return {
    acumulado,
    alvo,
    falta,
    meses,
    custoVida,
    aporteMensal: paraReserva,
    fracao: progresso(acumulado, alvo),
    mesesRestantes: paraReserva > 0 && falta > 0 ? Math.ceil(falta / paraReserva) : 0,
    mesesCobertos: custoVida > 0 ? acumulado / custoVida : 0,
    completa: alvo > 0 && acumulado >= alvo,
  }
}

export function calcularDividas(estado) {
  const lista = estado.dividas.map((d) => {
    const original = seguro(d.valorOriginal)
    const negociado = seguro(d.valorNegociado)
    const economia = Math.max(original - negociado, 0)
    return {
      ...d,
      valorOriginal: original,
      valorNegociado: negociado,
      economia,
      desconto: original > 0 ? economia / original : 0,
    }
  })

  const pendentes = lista.filter((d) => !d.quitada)
  const quitadas = lista.filter((d) => d.quitada)

  return {
    lista,
    pendentes,
    quitadas,
    totalPendente: pendentes.reduce((t, d) => t + d.valorNegociado, 0),
    totalOriginalPendente: pendentes.reduce((t, d) => t + d.valorOriginal, 0),
    economiaNegociada: lista.reduce((t, d) => t + d.economia, 0),
    economiaRealizada: quitadas.reduce((t, d) => t + d.economia, 0),
    totalQuitado: quitadas.reduce((t, d) => t + d.valorNegociado, 0),
    tudoQuitado: lista.length > 0 && pendentes.length === 0,
    vazio: lista.length === 0,
  }
}

export function calcularMeta(meta, estado) {
  const alvo = seguro(meta.valorAlvo)
  const acumulado = seguro(meta.acumulado)
  const aporte = seguro(meta.aporteMensal)
  const falta = Math.max(alvo - acumulado, 0)
  const mesesRestantes = aporte > 0 && falta > 0 ? Math.ceil(falta / aporte) : 0

  // Depois que as dívidas saem, a parcela que ia para elas pode virar aporte.
  const { totalPendente } = calcularDividas(estado)
  const livreDeDividas = totalPendente === 0

  return {
    alvo,
    acumulado,
    aporte,
    falta,
    mesesRestantes,
    fracao: progresso(acumulado, alvo),
    concluida: meta.concluida || (alvo > 0 && acumulado >= alvo),
    semAporte: aporte <= 0 && falta > 0,
    livreDeDividas,
  }
}

export function calcularResumo(estado) {
  const orcamento = calcularOrcamento(estado)
  const aportes = calcularAportes(estado)
  const reserva = calcularReserva(estado)
  const dividas = calcularDividas(estado)

  const patrimonio = reserva.acumulado + aportes.totalInvestido
  const metasAcumuladas = estado.metas.reduce((t, m) => t + seguro(m.acumulado), 0)

  return {
    orcamento,
    aportes,
    reserva,
    dividas,
    patrimonio,
    metasAcumuladas,
    patrimonioLiquido: patrimonio + metasAcumuladas - dividas.totalPendente,
    configurado: orcamento.renda > 0,
  }
}
