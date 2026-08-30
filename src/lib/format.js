/**
 * Formatação e parsing de valores em português do Brasil.
 */

const moedaBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numeroBRL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 1234.5 -> "R$ 1.234,50" */
export function moeda(valor) {
  return moedaBRL.format(Number.isFinite(valor) ? valor : 0)
}

/** 1234.5 -> "1.234,50" (sem o símbolo, para dentro de inputs) */
export function numero(valor) {
  return numeroBRL.format(Number.isFinite(valor) ? valor : 0)
}

/** 1234.5 -> "R$ 1,2 mil" — para números grandes em espaço curto */
export function moedaCompacta(valor) {
  const v = Number.isFinite(valor) ? valor : 0
  if (Math.abs(v) < 1000) return moeda(v)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v)
}

/** 0.4567 -> "45,7%" (recebe fração de 0 a 1) */
export function percentual(fracao, casas = 1) {
  const f = Number.isFinite(fracao) ? fracao : 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(f)
}

/**
 * Converte o texto digitado num campo de moeda para número.
 * Trata a digitação como centavos: "552389" -> 5523.89
 */
export function digitosParaValor(texto, maxDigitos = 13) {
  const digitos = String(texto ?? '').replace(/\D/g, '').slice(0, maxDigitos)
  if (!digitos) return 0
  return Number(digitos) / 100
}

/** "2026-08-30" -> "30/08/2026". Aceita Date ou string ISO. */
export function data(valor) {
  if (!valor) return '—'
  const d = valor instanceof Date ? valor : new Date(`${valor}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** "2026-08-30" -> "30 de agosto de 2026" */
export function dataExtenso(valor) {
  if (!valor) return '—'
  const d = valor instanceof Date ? valor : new Date(`${valor}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Data de hoje no formato YYYY-MM-DD, no fuso local. */
export function hojeISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Soma `meses` a partir de hoje e devolve YYYY-MM-DD. */
export function daquiAMeses(meses) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + Math.max(0, Math.ceil(meses)))
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-01`
}

/** Quantos dias faltam até a data (negativo = já passou). */
export function diasAte(valor) {
  if (!valor) return null
  const alvo = new Date(`${valor}T23:59:59`)
  if (Number.isNaN(alvo.getTime())) return null
  const hoje = new Date()
  return Math.ceil((alvo - hoje) / 86_400_000)
}

/** Plural simples: pluralizar(1, 'mês', 'meses') -> "mês" */
export function pluralizar(n, singular, plural) {
  return Math.abs(n) === 1 ? singular : plural
}
