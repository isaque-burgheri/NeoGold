/**
 * Tema claro/escuro.
 *
 * A preferência tem três estados: `sistema`, `claro` e `escuro`. Só a
 * escolha é guardada; o tema efetivo é resolvido a cada leitura, para que
 * quem está em `sistema` acompanhe o aparelho mudando de dia para noite
 * sem precisar recarregar.
 *
 * O tema resolvido é escrito em `data-tema` no <html>, e é esse atributo
 * que o CSS lê. Media query sozinha não serviria: ela enxerga a
 * preferência do sistema, nunca a escolha da pessoa — e sem a escolha não
 * há botão de troca.
 *
 * O primeiro valor é aplicado por um script inline no index.html, antes
 * da primeira pintura. Sem ele a página apareceria no tema errado por um
 * instante a cada carregamento.
 */

import { useCallback, useEffect, useState } from 'react'

export const CHAVE_TEMA = 'neogold:tema'
export const PREFERENCIAS = ['sistema', 'claro', 'escuro']

const ROTULOS = {
  sistema: 'Tema do sistema',
  claro: 'Tema claro',
  escuro: 'Tema escuro',
}

function lerPreferencia() {
  try {
    const guardada = localStorage.getItem(CHAVE_TEMA)
    return PREFERENCIAS.includes(guardada) ? guardada : 'sistema'
  } catch {
    return 'sistema'
  }
}

function sistemaPrefereEscuro() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true
}

export function resolver(preferencia) {
  if (preferencia === 'claro' || preferencia === 'escuro') return preferencia
  return sistemaPrefereEscuro() ? 'escuro' : 'claro'
}

function aplicar(tema) {
  document.documentElement.dataset.tema = tema
}

export function useTema() {
  const [preferencia, setPreferencia] = useState(lerPreferencia)
  const [efetivo, setEfetivo] = useState(() => resolver(lerPreferencia()))

  // Aplica e persiste a cada mudança de preferência.
  useEffect(() => {
    const tema = resolver(preferencia)
    aplicar(tema)
    setEfetivo(tema)
    try {
      localStorage.setItem(CHAVE_TEMA, preferencia)
    } catch {
      /* modo restrito: o tema vale só nesta aba */
    }
  }, [preferencia])

  // Em `sistema`, segue o aparelho mudando ao vivo.
  useEffect(() => {
    if (preferencia !== 'sistema' || !window.matchMedia) return undefined
    const consulta = window.matchMedia('(prefers-color-scheme: dark)')
    const aoMudar = () => {
      const tema = resolver('sistema')
      aplicar(tema)
      setEfetivo(tema)
    }
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [preferencia])

  // Mantém abas do mesmo navegador em sincronia.
  useEffect(() => {
    function aoMudarStorage(evento) {
      if (evento.key === CHAVE_TEMA) setPreferencia(lerPreferencia())
    }
    window.addEventListener('storage', aoMudarStorage)
    return () => window.removeEventListener('storage', aoMudarStorage)
  }, [])

  const alternar = useCallback(() => {
    setPreferencia((atual) => {
      const i = PREFERENCIAS.indexOf(atual)
      return PREFERENCIAS[(i + 1) % PREFERENCIAS.length]
    })
  }, [])

  return {
    preferencia,
    efetivo,
    rotulo: ROTULOS[preferencia],
    definir: setPreferencia,
    alternar,
  }
}
