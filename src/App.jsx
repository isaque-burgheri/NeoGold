/**
 * NeoGold — painel de plano financeiro e controle de dívidas.
 *
 * Por padrão o estado inteiro vive no localStorage do navegador: sem
 * backend, sem login, sem rede. A sincronização entre aparelhos é
 * opcional e, quando ligada, sobe apenas bytes cifrados — a chave nunca
 * sai daqui. Ver `lib/sync.js` e `lib/cripto.js`.
 */

import { useCallback, useState } from 'react'
import { usePlano } from './lib/storage.js'
import { useSync } from './lib/sync.js'
import { hojeISO } from './lib/format.js'
import { novaDivida, novaMeta } from './lib/defaults.js'

import { Header } from './components/Header.jsx'
import { ResumoGeral } from './components/ResumoGeral.jsx'
import { DividasCard } from './components/DividasCard.jsx'
import { MetasCard } from './components/MetasCard.jsx'
import { OrcamentoCard } from './components/OrcamentoCard.jsx'
import { AportesCard } from './components/AportesCard.jsx'
import { ReservaCard } from './components/ReservaCard.jsx'
import { ConfigModal } from './components/ConfigModal.jsx'
import { Cartao, Botao } from './components/ui.jsx'

function BoasVindas({ aoComecar, aoDispensar }) {
  return (
    <Cartao className="mb-5 border-ouro-600/30 bg-gradient-to-br from-ouro-500/[0.08] to-transparent">
      <h2 className="text-lg font-semibold tracking-tight text-carvao-100">
        Bem-vindo ao seu painel
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-carvao-300">
        Ele começa vazio de propósito: nenhum número seu está escrito no código. Preencha sua renda,
        a dívida que está negociando e sua meta — tudo é gravado apenas neste navegador, no seu
        dispositivo. Ninguém mais vê, nem quem hospeda a página.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Botao variante="primario" onClick={aoComecar}>
          Preencher meus dados
        </Botao>
        <Botao variante="fantasma" onClick={aoDispensar}>
          Depois
        </Botao>
      </div>
    </Cartao>
  )
}

export default function App() {
  const { estado, atualizar, substituir, apagarTudo, persistencia } = usePlano()
  const sync = useSync({ estado, substituir })
  const [config, setConfig] = useState({ aberto: false, aba: 'perfil' })

  const abrirConfig = useCallback((aba = 'perfil') => {
    setConfig({ aberto: true, aba })
  }, [])

  const fecharConfig = useCallback(() => {
    setConfig((c) => ({ ...c, aberto: false }))
  }, [])

  /* ------------------------------------------------------------- Dívidas */

  const alternarQuitada = useCallback(
    (id) => {
      atualizar((r) => {
        const d = r.dividas.find((x) => x.id === id)
        if (!d) return
        d.quitada = !d.quitada
        d.quitadaEm = d.quitada ? hojeISO() : null
      })
    },
    [atualizar],
  )

  /* -------------------------------------------------------------- Reserva */

  const alterarReserva = useCallback(
    (valor) => {
      atualizar((r) => {
        r.reserva.acumulado = valor
      })
    },
    [atualizar],
  )

  const aportarReserva = useCallback(() => {
    atualizar((r) => {
      const cota = (r.perfil.rendaMensal * r.orcamento.investimentos) / 100
      r.reserva.acumulado += (cota * r.reserva.percentualDoAporte) / 100
    })
  }, [atualizar])

  /* -------------------------------------------------------- Investimentos */

  const avancarCiclo = useCallback(() => {
    atualizar((r) => {
      const total = r.investimentos.pilares.length || 1
      const indice = ((r.investimentos.cicloIndice % total) + total) % total
      const cota = (r.perfil.rendaMensal * r.orcamento.investimentos) / 100
      const rendaVariavel = cota - (cota * r.reserva.percentualDoAporte) / 100

      // Registra o aporte do pilar da vez antes de girar o ciclo.
      const pilar = r.investimentos.pilares[indice]
      if (pilar) pilar.acumulado += rendaVariavel / total

      r.investimentos.cicloIndice = (indice + 1) % total
    })
  }, [atualizar])

  const alterarPilar = useCallback(
    (id, valor) => {
      atualizar((r) => {
        const p = r.investimentos.pilares.find((x) => x.id === id)
        if (p) p.acumulado = valor
      })
    },
    [atualizar],
  )

  /* ---------------------------------------------------------------- Metas */

  const aportarMeta = useCallback(
    (id) => {
      atualizar((r) => {
        const m = r.metas.find((x) => x.id === id)
        if (!m) return
        m.acumulado += m.aporteMensal
        if (m.valorAlvo > 0 && m.acumulado >= m.valorAlvo) m.concluida = true
      })
    },
    [atualizar],
  )

  const alterarMeta = useCallback(
    (id, valor) => {
      atualizar((r) => {
        const m = r.metas.find((x) => x.id === id)
        if (!m) return
        m.acumulado = valor
        m.concluida = m.valorAlvo > 0 && valor >= m.valorAlvo
      })
    },
    [atualizar],
  )

  /* ----------------------------------------------------------- Boas-vindas */

  const primeiroUso =
    !estado.ui.boasVindasVista &&
    estado.perfil.rendaMensal === 0 &&
    estado.dividas.length === 0 &&
    estado.metas.length === 0

  const dispensarBoasVindas = useCallback(() => {
    atualizar((r) => {
      r.ui.boasVindasVista = true
    })
  }, [atualizar])

  const comecarPreenchimento = useCallback(() => {
    atualizar((r) => {
      r.ui.boasVindasVista = true
      if (r.dividas.length === 0) r.dividas.push(novaDivida())
      if (r.metas.length === 0) r.metas.push(novaMeta())
    })
    abrirConfig('perfil')
  }, [atualizar, abrirConfig])

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Header
        nome={estado.perfil.nome}
        persistencia={persistencia}
        sync={sync}
        aoAbrirConfig={abrirConfig}
      />

      {primeiroUso ? (
        <BoasVindas aoComecar={comecarPreenchimento} aoDispensar={dispensarBoasVindas} />
      ) : null}

      {/* Ordem pensada para o uso do dia a dia: o plano em cima, porque é
          o que se abre com frequência; a dívida no fim, porque é consulta
          ocasional e não precisa dominar a primeira tela. */}
      <main className="grid gap-5">
        <OrcamentoCard estado={estado} aoAbrirConfig={abrirConfig} />

        <AportesCard
          estado={estado}
          aoAvancarCiclo={avancarCiclo}
          aoAlterarAcumulado={alterarPilar}
          aoAbrirConfig={abrirConfig}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <MetasCard
            estado={estado}
            aoAportar={aportarMeta}
            aoAlterarAcumulado={alterarMeta}
            aoAbrirConfig={abrirConfig}
          />
          <ReservaCard
            estado={estado}
            aoAlterarAcumulado={alterarReserva}
            aoAportar={aportarReserva}
            aoAbrirConfig={abrirConfig}
          />
        </div>

        <ResumoGeral estado={estado} />

        <DividasCard
          estado={estado}
          aoAlternarQuitada={alternarQuitada}
          aoAbrirConfig={abrirConfig}
        />
      </main>

      <footer className="relative z-10 mt-8 border-t border-carvao-700 pt-5 text-xs leading-relaxed text-carvao-500">
        <p>
          Painel de uso pessoal. Estrutura baseada na regra 50/30/20 e na divisão de aportes em
          paralelo entre reserva e renda variável. Os ativos citados são exemplos de referência do
          plano, não recomendação de investimento — decisões sobre onde aplicar são suas.
        </p>
        <p className="mt-2">
          {sync.ligado
            ? 'A sincronização envia apenas o pacote cifrado: a senha mestra nunca sai deste navegador e sem ela ninguém abre o conteúdo.'
            : 'Nenhum dado sai deste navegador. Faça backup pelo painel de configuração antes de limpar os dados do site.'}
        </p>
      </footer>

      <ConfigModal
        aberto={config.aberto}
        aba={config.aba}
        aoTrocarAba={(aba) => setConfig((c) => ({ ...c, aba }))}
        aoFechar={fecharConfig}
        estado={estado}
        atualizar={atualizar}
        substituir={substituir}
        apagarTudo={apagarTudo}
        sync={sync}
      />
    </div>
  )
}
