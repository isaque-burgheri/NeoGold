/**
 * Faixa de indicadores gerais do plano.
 */

import { moeda } from '../lib/format.js'
import { calcularResumo } from '../lib/calculos.js'
import { Cartao, Metrica } from './ui.jsx'

export function ResumoGeral({ estado }) {
  const r = calcularResumo(estado)

  return (
    <Cartao>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <Metrica
          rotulo="Dívida em aberto"
          valor={moeda(r.dividas.totalPendente)}
          cor={r.dividas.totalPendente > 0 ? 'text-rubi-400' : 'text-esmeralda-400'}
          detalhe={
            r.dividas.totalPendente > 0
              ? `${r.dividas.pendentes.length} pendente(s)`
              : 'Livre de dívidas'
          }
        />
        <Metrica
          rotulo="Economia negociada"
          valor={moeda(r.dividas.economiaNegociada)}
          cor="text-esmeralda-400"
          detalhe={`${moeda(r.dividas.economiaRealizada)} já realizada`}
        />
        <Metrica
          rotulo="Patrimônio guardado"
          valor={moeda(r.patrimonio + r.metasAcumuladas)}
          detalhe="Reserva + investimentos + metas"
        />
        <Metrica
          rotulo="Aporte mensal"
          valor={moeda(r.orcamento.cotaInvestimento)}
          cor="text-ouro-400"
          detalhe={`${moeda(r.aportes.paraReserva)} reserva · ${moeda(r.aportes.paraRendaVariavel)} bolsa`}
        />
      </div>
    </Cartao>
  )
}
