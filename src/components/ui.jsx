/**
 * Peças visuais reaproveitadas por todo o painel.
 */

import { useEffect, useId, useRef } from 'react'
import { digitosParaValor, numero } from '../lib/format.js'

/* ------------------------------------------------------------------ Cartão */

export function Cartao({ children, className = '', ...props }) {
  return (
    <section className={`cartao p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </section>
  )
}

export function CabecalhoCartao({ titulo, subtitulo, icone, acao }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icone ? (
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-carvao-800 text-lg"
          >
            {icone}
          </span>
        ) : null}
        <div>
          <h2 className="text-base font-semibold tracking-tight text-carvao-100">{titulo}</h2>
          {subtitulo ? <p className="mt-0.5 text-sm text-carvao-400">{subtitulo}</p> : null}
        </div>
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </header>
  )
}

/* ------------------------------------------------------------------ Botão */

const ESTILOS_BOTAO = {
  primario: 'bg-ouro-500 text-carvao-950 hover:bg-ouro-400 font-semibold',
  secundario: 'bg-carvao-800 text-carvao-100 hover:bg-carvao-700 border border-carvao-600',
  fantasma: 'text-carvao-300 hover:text-carvao-100 hover:bg-carvao-800',
  sucesso: 'bg-esmeralda-600 text-white hover:bg-esmeralda-500 font-semibold',
  perigo: 'bg-rubi-600/15 text-rubi-400 hover:bg-rubi-600/25 border border-rubi-600/40',
}

const TAMANHOS_BOTAO = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-sm gap-2',
}

export function Botao({
  children,
  variante = 'secundario',
  tamanho = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${ESTILOS_BOTAO[variante]} ${TAMANHOS_BOTAO[tamanho]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ Campos */

export function Campo({ rotulo, dica, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carvao-400">
        {rotulo}
      </span>
      {children}
      {dica ? <span className="mt-1.5 block text-xs text-carvao-500">{dica}</span> : null}
    </label>
  )
}

const CLASSE_INPUT =
  'w-full rounded-xl border border-carvao-600 bg-carvao-850 px-3.5 py-2.5 text-sm text-carvao-100 placeholder:text-carvao-500 transition-colors focus:border-ouro-600 focus:bg-carvao-800'

export function InputTexto({ className = '', ...props }) {
  return <input type="text" className={`${CLASSE_INPUT} ${className}`} {...props} />
}

export function InputData({ className = '', ...props }) {
  return <input type="date" className={`${CLASSE_INPUT} tabular ${className}`} {...props} />
}

/**
 * Campo de dinheiro com máscara de centavos: quem digita "552389" vê
 * "5.523,89". Sempre entrega um número para o `onChange`.
 */
export function InputMoeda({ valor, onChange, className = '', ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-carvao-500">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={numero(valor)}
        onChange={(e) => onChange(digitosParaValor(e.target.value))}
        // Sem isto, o primeiro dígito digitado depende de onde o cursor caiu:
        // clicar no início de "0,00" e teclar 5 daria R$ 50,00 em vez de R$ 0,05.
        onFocus={(e) => e.target.select()}
        className={`${CLASSE_INPUT} tabular pl-10 text-right ${className}`}
        {...props}
      />
    </div>
  )
}

export function InputNumero({
  valor,
  onChange,
  sufixo,
  min = 0,
  max,
  passo = 1,
  className = '',
  ...props
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={Number.isFinite(valor) ? valor : 0}
        min={min}
        max={max}
        step={passo}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        onFocus={(e) => e.target.select()}
        className={`${CLASSE_INPUT} tabular ${sufixo ? 'pr-12' : ''} ${className}`}
        {...props}
      />
      {sufixo ? (
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-carvao-500">
          {sufixo}
        </span>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------- Barra de progresso */

const CORES_BARRA = {
  ouro: 'from-ouro-600 to-ouro-400',
  esmeralda: 'from-esmeralda-600 to-esmeralda-400',
  safira: 'from-safira-600 to-safira-400',
  rubi: 'from-rubi-600 to-rubi-400',
}

export function BarraProgresso({ fracao, cor = 'ouro', altura = 'h-2.5', rotulo }) {
  const pct = Math.min(Math.max(Number.isFinite(fracao) ? fracao : 0, 0), 1)
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
      className={`w-full overflow-hidden rounded-full bg-carvao-800 ${altura}`}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${CORES_BARRA[cor]} transition-[width] duration-700 ease-out`}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ Selo */

const CORES_SELO = {
  neutro: 'bg-carvao-800 text-carvao-300 border-carvao-600',
  ouro: 'bg-ouro-500/12 text-ouro-300 border-ouro-600/40',
  esmeralda: 'bg-esmeralda-500/12 text-esmeralda-400 border-esmeralda-500/40',
  safira: 'bg-safira-500/12 text-safira-400 border-safira-500/40',
  rubi: 'bg-rubi-500/12 text-rubi-400 border-rubi-500/40',
}

export function Selo({ children, cor = 'neutro', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${CORES_SELO[cor]} ${className}`}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ Métrica */

export function Metrica({ rotulo, valor, detalhe, cor = 'text-carvao-100', className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-carvao-400">{rotulo}</p>
      <p className={`tabular mt-1 text-xl font-semibold sm:text-2xl ${cor}`}>{valor}</p>
      {detalhe ? <p className="mt-0.5 text-xs text-carvao-500">{detalhe}</p> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ Modal */

export function Modal({ aberto, aoFechar, titulo, descricao, children, largura = 'max-w-3xl' }) {
  const painel = useRef(null)
  const tituloId = useId()

  useEffect(() => {
    if (!aberto) return undefined

    function aoTeclar(e) {
      if (e.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    painel.current?.focus()

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-carvao-950/85 backdrop-blur-sm"
        onClick={aoFechar}
        aria-hidden="true"
      />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className="cartao relative my-auto w-full overflow-hidden p-0 shadow-2xl"
        style={{ maxWidth: largura }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-carvao-700 px-5 py-4 sm:px-6">
          <div>
            <h2 id={tituloId} className="text-base font-semibold tracking-tight">
              {titulo}
            </h2>
            {descricao ? <p className="mt-0.5 text-sm text-carvao-400">{descricao}</p> : null}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="-mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-carvao-400 transition-colors hover:bg-carvao-800 hover:text-carvao-100"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Estado vazio */

export function EstadoVazio({ icone, titulo, descricao, acao }) {
  return (
    <div className="rounded-xl border border-dashed border-carvao-600 px-6 py-10 text-center">
      {icone ? (
        <span aria-hidden="true" className="mb-3 block text-2xl opacity-60">
          {icone}
        </span>
      ) : null}
      <p className="text-sm font-medium text-carvao-200">{titulo}</p>
      {descricao ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-carvao-500">{descricao}</p>
      ) : null}
      {acao ? <div className="mt-4">{acao}</div> : null}
    </div>
  )
}
