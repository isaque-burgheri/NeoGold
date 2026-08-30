/**
 * Cabeçalho: identidade, estado do armazenamento e acesso à configuração.
 */

import { Botao, Selo } from './ui.jsx'

function Logo() {
  return (
    <span
      aria-hidden="true"
      className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-ouro-400 to-ouro-600 text-lg font-bold text-carvao-950"
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
        <Selo cor="rubi">⚠ Versões em conflito</Selo>
      </button>
    )
  }
  if (sync.situacao === 'sincronizando' || sync.situacao === 'abrindo') {
    return <Selo cor="ouro">☁ Sincronizando…</Selo>
  }
  if (sync.situacao === 'ok') {
    return (
      <Selo cor="esmeralda" className="hidden sm:inline-flex">
        ☁ Sincronizado
      </Selo>
    )
  }
  if (sync.situacao === 'erro') {
    return (
      <button type="button" onClick={() => aoAbrirConfig('sync')}>
        <Selo cor="rubi">☁ Falha na sincronização</Selo>
      </button>
    )
  }
  return null
}

export function Header({ nome, persistencia, sync, aoAbrirConfig }) {
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
            🔒 Salvo localmente
          </Selo>
        ) : null}
        {persistencia === 'indisponivel' ? (
          <Selo cor="rubi">Armazenamento bloqueado neste navegador</Selo>
        ) : null}
        {persistencia === 'erro' ? <Selo cor="rubi">Falha ao salvar</Selo> : null}

        <Botao variante="secundario" onClick={() => aoAbrirConfig('perfil')}>
          <span aria-hidden="true">⚙</span> Configurar
        </Botao>
      </div>
    </header>
  )
}
