/**
 * Regra 50 / 30 / 20 sobre a renda mensal.
 */

import { moeda } from '../lib/format.js'
import { calcularOrcamento } from '../lib/calculos.js'
import { Cartao, CabecalhoCartao, Botao, Selo, EstadoVazio } from './ui.jsx'

const CORES_FATIA = {
  essenciais: { barra: 'bg-safira-500', texto: 'text-safira-400' },
  lazer: { barra: 'bg-ouro-500', texto: 'text-ouro-400' },
  investimentos: { barra: 'bg-esmeralda-500', texto: 'text-esmeralda-400' },
}

export function OrcamentoCard({ estado, aoAbrirConfig }) {
  const o = calcularOrcamento(estado)

  if (o.renda <= 0) {
    return (
      <Cartao>
        <CabecalhoCartao icone="⚖️" titulo="Orçamento 50 / 30 / 20" subtitulo="Regra do Primo Rico" />
        <EstadoVazio
          icone="⚖️"
          titulo="Informe sua renda mensal"
          descricao="Com a renda cadastrada, o painel divide automaticamente entre essenciais, lazer e investimentos."
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
        icone="⚖️"
        titulo="Orçamento 50 / 30 / 20"
        subtitulo={`Sobre ${moeda(o.renda)} de renda mensal`}
        acao={
          <Botao variante="fantasma" tamanho="sm" onClick={() => aoAbrirConfig('perfil')}>
            Ajustar
          </Botao>
        }
      />

      {!o.fechaCem ? (
        <p className="mb-4 rounded-xl border border-rubi-500/30 bg-rubi-500/[0.08] px-4 py-3 text-sm text-rubi-400">
          As fatias somam {o.somaPercentuais}% — ajuste os percentuais para fechar em 100%.
        </p>
      ) : null}

      {/* Barra única segmentada */}
      <div
        className="mb-5 flex h-3 w-full overflow-hidden rounded-full bg-carvao-800"
        role="img"
        aria-label={o.fatias.map((f) => `${f.rotulo} ${f.percentual}%`).join(', ')}
      >
        {o.fatias.map((f) => (
          <div
            key={f.id}
            className={`h-full transition-[width] duration-700 ease-out ${CORES_FATIA[f.id].barra}`}
            style={{ width: `${Math.max(f.percentual, 0)}%` }}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {o.fatias.map((f) => (
          <div key={f.id} className="rounded-xl bg-carvao-850 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-carvao-400">
                {f.rotulo}
              </span>
              <span className={`tabular text-xs font-semibold ${CORES_FATIA[f.id].texto}`}>
                {f.percentual}%
              </span>
            </div>
            <p className="tabular mt-1.5 text-lg font-semibold text-carvao-100">{moeda(f.valor)}</p>
            <p className="mt-1 text-xs leading-relaxed text-carvao-500">{f.descricao}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-carvao-500">
        <Selo cor="esmeralda">Regra prática</Selo>
        Separe {moeda(o.cotaInvestimento)} assim que o salário cair — antes de qualquer gasto.
      </p>
    </Cartao>
  )
}
