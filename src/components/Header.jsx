/**
 * Cabeçalho: identidade, aviso de privacidade e acesso à configuração.
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

export function Header({ nome, persistencia, aoAbrirConfig }) {
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
            Seus dados ficam só neste navegador.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {persistencia === 'ok' ? (
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
