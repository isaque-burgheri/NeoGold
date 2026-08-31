/**
 * Ícones de traço, monocromáticos, herdando a cor do texto.
 *
 * Substituem os emoji que havia antes. Emoji carrega cor e estilo próprios
 * de cada sistema — no Windows, no iPhone e no Android eles são desenhos
 * diferentes —, o que quebra qualquer unidade visual. Traço uniforme de
 * 1,5 e `currentColor` resolvem os dois problemas.
 */

function Base({ children, className = 'size-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

/** Orçamento: as três fatias da renda. */
export function IconeOrcamento(props) {
  return (
    <Base {...props}>
      <path d="M4 7h16M4 12h10M4 17h6" />
    </Base>
  )
}

/** Estratégia: aporte que cresce. */
export function IconeAportes(props) {
  return (
    <Base {...props}>
      <path d="M3 17l5.5-5.5 3.5 3.5L20 7" />
      <path d="M15 7h5v5" />
    </Base>
  )
}

/** Metas: o alvo. */
export function IconeMeta(props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
    </Base>
  )
}

/** Reserva: o escudo. */
export function IconeReserva(props) {
  return (
    <Base {...props}>
      <path d="M12 3.5l7 2.8v5.1c0 4.2-2.9 7.4-7 9.1-4.1-1.7-7-4.9-7-9.1V6.3l7-2.8z" />
    </Base>
  )
}

/** Dívidas: a fatura. */
export function IconeDivida(props) {
  return (
    <Base {...props}>
      <path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6L8.4 20.5 6 18.9V3.5z" />
      <path d="M9.5 8.5h5M9.5 12.5h5" />
    </Base>
  )
}

/** Sincronização. */
export function IconeNuvem(props) {
  return (
    <Base {...props}>
      <path d="M7 18.5a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.6-1.2A3.8 3.8 0 0 1 17.5 18.5H7z" />
    </Base>
  )
}

/** Privacidade: dados presos no aparelho. */
export function IconeCadeado(props) {
  return (
    <Base {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.6" />
      <path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
    </Base>
  )
}

export function IconeConfig(props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.5 7.5l2 1.2M17.5 15.3l2 1.2M4.5 16.5l2-1.2M17.5 8.7l2-1.2" />
    </Base>
  )
}

export function IconeCheck(props) {
  return (
    <Base {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Base>
  )
}

export function IconeMais(props) {
  return (
    <Base {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Base>
  )
}

export function IconeSeta(props) {
  return (
    <Base {...props}>
      <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
    </Base>
  )
}

export function IconeAlerta(props) {
  return (
    <Base {...props}>
      <path d="M12 4.5l8.5 15h-17l8.5-15z" />
      <path d="M12 10v4M12 16.6v.1" />
    </Base>
  )
}

export function IconeFechar(props) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  )
}

/* Tema claro. */
export function IconeSol(props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2.1M12 19.3v2.1M4.3 4.3l1.5 1.5M18.2 18.2l1.5 1.5M2.6 12h2.1M19.3 12h2.1M4.3 19.7l1.5-1.5M18.2 5.8l1.5-1.5" />
    </Base>
  )
}

/* Tema escuro. */
export function IconeLua(props) {
  return (
    <Base {...props}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
    </Base>
  )
}

/* Segue o aparelho. */
export function IconeSistema(props) {
  return (
    <Base {...props}>
      <rect x="2.8" y="4.5" width="18.4" height="12.5" rx="2.2" />
      <path d="M9 20.5h6" />
    </Base>
  )
}
