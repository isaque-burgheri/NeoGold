/**
 * Reserva de emergência: de 6 a 12 meses do custo de vida, em liquidez diária.
 */

import { moeda, percentual, dataExtenso, daquiAMeses, pluralizar } from '../lib/format.js'
import { calcularReserva } from '../lib/calculos.js'
import {
  Cartao,
  CabecalhoCartao,
  Botao,
  Selo,
  BarraProgresso,
  EstadoVazio,
  InputMoeda,
} from './ui.jsx'
import { IconeReserva } from './icones.jsx'

export function ReservaCard({ estado, aoAlterarAcumulado, aoAportar, aoAbrirConfig }) {
  const r = calcularReserva(estado)

  if (r.custoVida <= 0) {
    return (
      <Cartao>
        <CabecalhoCartao icone={<IconeReserva />} titulo="Reserva de emergência" subtitulo="Seu colchão de segurança" />
        <EstadoVazio
          icone={<IconeReserva />}
          titulo="Informe seu custo de vida mensal"
          descricao="A meta da reserva é de 6 a 12 vezes o quanto você gasta por mês para viver."
          acao={
            <Botao variante="primario" onClick={() => aoAbrirConfig('perfil')}>
              Informar custo de vida
            </Botao>
          }
        />
      </Cartao>
    )
  }

  return (
    <Cartao>
      <CabecalhoCartao
        icone={<IconeReserva />}
        titulo="Reserva de emergência"
        subtitulo={`Meta de ${r.meses} ${pluralizar(r.meses, 'mês', 'meses')} de custo de vida`}
        acao={
          <Botao variante="fantasma" tamanho="sm" onClick={() => aoAbrirConfig('investimentos')}>
            Ajustar
          </Botao>
        }
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="tabular text-2xl font-semibold text-carvao-100 sm:text-3xl">
          {moeda(r.acumulado)}
        </p>
        <p className="tabular text-sm text-carvao-400">de {moeda(r.alvo)}</p>
      </div>

      <div className="mt-3">
        <BarraProgresso
          fracao={r.fracao}
          cor={r.completa ? 'esmeralda' : 'violeta'}
          altura="h-3"
          rotulo="Progresso da reserva de emergência"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="tabular font-medium text-carvao-400">{percentual(r.fracao, 0)}</span>
          <span className="tabular text-carvao-500">
            {r.mesesCobertos > 0
              ? `Cobre ${r.mesesCobertos.toFixed(1).replace('.', ',')} ${pluralizar(
                  Math.round(r.mesesCobertos),
                  'mês',
                  'meses',
                )} de despesas`
              : 'Ainda sem cobertura'}
          </span>
        </div>
      </div>

      {r.completa ? (
        <p className="mt-4 rounded-xl bg-esmeralda-500/[0.10] px-4 py-3.5 text-sm text-esmeralda-400">
          Reserva completa. A partir daqui você pode redirecionar os {moeda(r.aporteMensal)}{' '}
          mensais para a renda variável ou para as suas metas.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 rounded-xl bg-carvao-850 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[0.8125rem] text-carvao-500">Faltam</p>
            <p className="tabular mt-1 text-sm font-semibold text-carvao-100">{moeda(r.falta)}</p>
          </div>
          <div>
            <p className="text-[0.8125rem] text-carvao-500">
              Aporte mensal
            </p>
            <p className="tabular mt-1 text-sm font-semibold text-carvao-100">
              {moeda(r.aporteMensal)}
            </p>
          </div>
          <div>
            <p className="text-[0.8125rem] text-carvao-500">Previsão</p>
            <p className="mt-1 text-sm font-semibold text-carvao-100">
              {r.mesesRestantes > 0 ? (
                <>
                  {r.mesesRestantes} {pluralizar(r.mesesRestantes, 'mês', 'meses')}
                  <span className="block text-xs font-normal text-carvao-500">
                    {dataExtenso(daquiAMeses(r.mesesRestantes))}
                  </span>
                </>
              ) : (
                <span className="text-carvao-500">defina um aporte</span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-[0.8125rem] text-carvao-500">
            Saldo atual da reserva
          </span>
          <InputMoeda
            valor={estado.reserva.acumulado}
            onChange={aoAlterarAcumulado}
            aria-label="Saldo atual da reserva de emergência"
          />
        </label>
        {r.aporteMensal > 0 && !r.completa ? (
          <Botao variante="primario" onClick={aoAportar}>
            + Registrar aporte de {moeda(r.aporteMensal)}
          </Botao>
        ) : null}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-carvao-500">
        <Selo cor="violeta">Onde deixar</Selo>
        Tesouro Selic, CDB 100% do CDI ou caixinhas com liquidez diária — resgate no mesmo dia.
      </p>
    </Cartao>
  )
}
