/**
 * Estratégia dos 20%: reserva e renda variável em paralelo (Bruno OM),
 * com a renda variável dividida em três pilares iguais e um ciclo mensal
 * de compra — FIIs, depois Ações BR, depois IVVB11 acumulado.
 */

import { moeda } from '../lib/format.js'
import { calcularAportes } from '../lib/calculos.js'
import { Cartao, CabecalhoCartao, Botao, Selo, EstadoVazio, InputMoeda } from './ui.jsx'

const CORES_PILAR = {
  esmeralda: { borda: 'border-esmeralda-500/40', fundo: 'bg-esmeralda-500/[0.07]', texto: 'text-esmeralda-400' },
  ouro: { borda: 'border-ouro-600/40', fundo: 'bg-ouro-500/[0.07]', texto: 'text-ouro-400' },
  safira: { borda: 'border-safira-500/40', fundo: 'bg-safira-500/[0.07]', texto: 'text-safira-400' },
}

function Pilar({ pilar, aoAlterarAcumulado }) {
  const cores = CORES_PILAR[pilar.cor] ?? CORES_PILAR.ouro

  return (
    <article
      className={`rounded-xl border p-4 transition-colors ${
        pilar.daVez ? `${cores.borda} ${cores.fundo}` : 'border-carvao-700 bg-carvao-850'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-carvao-100">{pilar.nome}</h3>
          <p className={`tabular mt-1 text-lg font-semibold ${cores.texto}`}>
            {moeda(pilar.aporteMensal)}
            <span className="ml-1 text-xs font-normal text-carvao-500">/mês</span>
          </p>
        </div>
        {pilar.daVez ? <Selo cor={pilar.cor}>Vez deste mês</Selo> : null}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-carvao-500">{pilar.exemplos}</p>

      <label className="mt-3 block border-t border-carvao-700 pt-3">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carvao-500">
          Total já aportado
        </span>
        <InputMoeda
          valor={pilar.acumulado}
          onChange={(v) => aoAlterarAcumulado(pilar.id, v)}
          aria-label={`Total já aportado em ${pilar.nome}`}
        />
      </label>
    </article>
  )
}

export function AportesCard({ estado, aoAvancarCiclo, aoAlterarAcumulado, aoAbrirConfig }) {
  const a = calcularAportes(estado)

  if (a.cotaInvestimento <= 0) {
    return (
      <Cartao>
        <CabecalhoCartao
          icone="📈"
          titulo="Estratégia dos 20%"
          subtitulo="Reserva e renda variável em paralelo"
        />
        <EstadoVazio
          icone="📈"
          titulo="Sem cota de investimento definida"
          descricao="Informe sua renda mensal para o painel calcular quanto vai para a reserva e quanto vai para cada pilar da renda variável."
          acao={
            <Botao variante="primario" onClick={() => aoAbrirConfig('perfil')}>
              Informar renda
            </Botao>
          }
        />
      </Cartao>
    )
  }

  return (
    <Cartao>
      <CabecalhoCartao
        icone="📈"
        titulo="Estratégia dos 20%"
        subtitulo={`${moeda(a.cotaInvestimento)} por mês, divididos em paralelo`}
        acao={
          <Botao variante="fantasma" tamanho="sm" onClick={() => aoAbrirConfig('investimentos')}>
            Ajustar
          </Botao>
        }
      />

      {/* Divisão reserva x renda variável */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-carvao-850 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-carvao-400">
              Reserva de emergência
            </span>
            <span className="tabular text-xs font-semibold text-safira-400">{a.percReserva}%</span>
          </div>
          <p className="tabular mt-1.5 text-xl font-semibold text-carvao-100">
            {moeda(a.paraReserva)}
          </p>
          <p className="mt-1 text-xs text-carvao-500">
            Tesouro Selic, CDB 100% CDI, caixinhas — liquidez diária
          </p>
        </div>
        <div className="rounded-xl bg-carvao-850 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-carvao-400">
              Renda variável
            </span>
            <span className="tabular text-xs font-semibold text-ouro-400">
              {a.percRendaVariavel}%
            </span>
          </div>
          <p className="tabular mt-1.5 text-xl font-semibold text-carvao-100">
            {moeda(a.paraRendaVariavel)}
          </p>
          <p className="mt-1 text-xs text-carvao-500">
            {moeda(a.porPilar)} para cada um dos três pilares
          </p>
        </div>
      </div>

      {/* Ciclo do mês */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ouro-600/30 bg-ouro-500/[0.06] px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-carvao-400">
            Compra deste mês
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ouro-300">{a.rotuloDaVez}</p>
        </div>
        <Botao variante="secundario" tamanho="sm" onClick={aoAvancarCiclo}>
          Comprei — avançar ciclo →
        </Botao>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {a.pilares.map((pilar) => (
          <Pilar key={pilar.id} pilar={pilar} aoAlterarAcumulado={aoAlterarAcumulado} />
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-carvao-500">
        O ciclo evita comprar cota fracionada: gire os aportes mês a mês entre FIIs, Ações BR e
        IVVB11. Como a cota do IVVB11 é alta, acumule dois a três meses antes de comprar.
      </p>
    </Cartao>
  )
}
