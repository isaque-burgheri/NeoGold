/**
 * Cabeçalho: identidade, estado do armazenamento e acesso à configuração.
 */

import { Botao, Selo } from './ui.jsx'
import {
  IconeConfig,
  IconeNuvem,
  IconeCadeado,
  IconeAlerta,
  IconeSol,
  IconeLua,
  IconeSistema,
} from './icones.jsx'

function Logo() {
  return (
    <span
      aria-hidden="true"
      className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violeta-500 to-violeta-600 text-lg font-bold text-sobre-acento"
    >
      N
    </span>
  )
}

function SeloSync({ sync, aoAbrirConfig }) {
  if (!sync) return null

  if (sync.situacao === 'conflito') {
    return (
      <button type="button" onClick={() => aoAbrirConfig('sync')}>
        <Selo cor="rubi">
          <IconeAlerta className="size-3.5" /> Versões em conflito
        </Selo>
      </button>
    )
  }
  if (sync.situacao === 'sincronizando' || sync.situacao === 'abrindo') {
    return <Selo cor="violeta">
        <IconeNuvem className="size-3.5" /> Sincronizando…
      </Selo>
  }
  if (sync.situacao === 'ok') {
    return (
      <Selo cor="esmeralda" className="hidden sm:inline-flex">
        <IconeNuvem className="size-3.5" /> Sincronizado
      </Selo>
    )
  }
  if (sync.situacao === 'erro') {
    return (
      <button type="button" onClick={() => aoAbrirConfig('sync')}>
        <Selo cor="rubi">
          <IconeNuvem className="size-3.5" /> Falha na sincronização
        </Selo>
      </button>
    )
  }
  return null
}

const ICONE_DO_TEMA = { claro: IconeSol, escuro: IconeLua, sistema: IconeSistema }

/**
 * Percorre sistema -> claro -> escuro. O ícone mostra a preferência
 * escolhida, não o tema em vigor: é ela que o clique altera, e ver
 * "sistema" explicitamente evita a dúvida de por que o tema mudou
 * sozinho ao anoitecer.
 */
function BotaoTema({ tema }) {
  const Icone = ICONE_DO_TEMA[tema.preferencia] ?? IconeSistema
  return (
    <button
      type="button"
      onClick={tema.alternar}
      title={`${tema.rotulo} — clique para alternar`}
      aria-label={`${tema.rotulo}. Clique para alternar entre sistema, claro e escuro.`}
      className="alvo-toque grid size-10 shrink-0 place-items-center rounded-full bg-carvao-800 text-carvao-300 transition-colors hover:bg-carvao-700 hover:text-carvao-100"
    >
      <Icone className="size-[1.15rem]" />
    </button>
  )
}

export function Header({ nome, persistencia, sync, tema, aoAbrirConfig }) {
  const sincronizando = sync?.ligado

  return (
    <header className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Logo />
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-carvao-100">
            NeoGold
            <span className="ml-2 text-sm font-normal text-carvao-400">Plano financeiro</span>
          </h1>
          <p className="text-sm text-carvao-400">
            {nome ? `Olá, ${nome}. ` : ''}
            {sincronizando
              ? 'Seus dados sincronizam criptografados entre seus aparelhos.'
              : 'Seus dados ficam só neste navegador.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SeloSync sync={sync} aoAbrirConfig={aoAbrirConfig} />

        {persistencia === 'ok' && !sincronizando ? (
          <Selo cor="esmeralda" className="hidden sm:inline-flex">
            <IconeCadeado className="size-3.5" /> Salvo localmente
          </Selo>
        ) : null}
        {persistencia === 'indisponivel' ? (
          <Selo cor="rubi">Armazenamento bloqueado neste navegador</Selo>
        ) : null}
        {persistencia === 'erro' ? <Selo cor="rubi">Falha ao salvar</Selo> : null}

        <BotaoTema tema={tema} />

        <Botao variante="secundario" onClick={() => aoAbrirConfig('perfil')}>
          <IconeConfig className="size-4" /> Configurar
        </Botao>
      </div>
    </header>
  )
}
