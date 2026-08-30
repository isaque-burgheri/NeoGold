/**
 * Planejador de metas — o objetivo financeiro para depois da dívida.
 */

import { moeda, percentual, dataExtenso, daquiAMeses, pluralizar } from '../lib/format.js'
import { calcularMeta, calcularDividas } from '../lib/calculos.js'
import {
  Cartao,
  CabecalhoCartao,
  Botao,
  Selo,
  BarraProgresso,
  EstadoVazio,
  InputMoeda,
} from './ui.jsx'
import { IconeMeta, IconeMais } from './icones.jsx'

function ItemMeta({ meta, estado, aoAportar, aoEditar, aoAlterarAcumulado }) {
  const c = calcularMeta(meta, estado)

  return (
    <article
      className={`rounded-xl border p-4 transition-colors sm:p-5 ${
        c.concluida ? 'border-esmeralda-500/30 bg-esmeralda-500/[0.06]' : 'border-carvao-700 bg-carvao-850'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-carvao-100">
              {meta.titulo || 'Meta sem nome'}
            </h3>
            {c.concluida ? <Selo cor="esmeralda">Alcançada</Selo> : null}
          </div>
          <p className="tabular mt-1 text-sm text-carvao-400">
            {moeda(c.acumulado)} de {moeda(c.alvo)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => aoEditar(meta.id)}
          className="alvo-toque shrink-0 rounded-lg px-2 py-1 text-xs text-carvao-400 transition-colors hover:bg-carvao-800 hover:text-carvao-100"
        >
          Editar
        </button>
      </div>

      <div className="mt-4">
        <BarraProgresso
          fracao={c.fracao}
          cor={c.concluida ? 'esmeralda' : 'ouro'}
          rotulo={`Progresso da meta ${meta.titulo || 'sem nome'}`}
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="tabular font-medium text-ouro-300">{percentual(c.fracao, 0)}</span>
          <span className="tabular text-carvao-500">
            {c.alvo <= 0
              ? 'Defina o valor da meta'
              : c.falta > 0
                ? `Faltam ${moeda(c.falta)}`
                : 'Meta batida'}
          </span>
        </div>
      </div>

      {!c.concluida ? (
        <div className="mt-4 grid gap-3 border-t border-carvao-700 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[0.8125rem] text-carvao-500">
              Aporte mensal
            </p>
            <p className="tabular mt-1 text-sm font-semibold text-carvao-100">
              {moeda(c.aporte)}
              {c.semAporte ? (
                <span className="ml-2 font-normal text-rubi-400">defina um aporte</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="text-[0.8125rem] text-carvao-500">Previsão</p>
            <p className="mt-1 text-sm font-semibold text-carvao-100">
              {c.mesesRestantes > 0 ? (
                <>
                  {c.mesesRestantes} {pluralizar(c.mesesRestantes, 'mês', 'meses')}
                  <span className="ml-1 font-normal text-carvao-500">
                    · {dataExtenso(daquiAMeses(c.mesesRestantes))}
                  </span>
                </>
              ) : (
                <span className="text-carvao-500">—</span>
              )}
            </p>
          </div>
        </div>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-end gap-3 border-t border-carvao-700 pt-4">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-[0.8125rem] text-carvao-500">
            Já guardado
          </span>
          <InputMoeda
            valor={meta.acumulado}
            onChange={(v) => aoAlterarAcumulado(meta.id, v)}
            aria-label={`Valor já guardado para ${meta.titulo || 'a meta'}`}
          />
        </label>
        {!c.concluida && c.aporte > 0 ? (
          <Botao variante="primario" onClick={() => aoAportar(meta.id)}>
            + Registrar aporte de {moeda(c.aporte)}
          </Botao>
        ) : null}
      </footer>
    </article>
  )
}

export function MetasCard({ estado, aoAportar, aoAbrirConfig, aoAlterarAcumulado }) {
  const { totalPendente } = calcularDividas(estado)
  const semMetas = estado.metas.length === 0

  return (
    <Cartao>
      <CabecalhoCartao
        icone={<IconeMeta />}
        titulo="Planejador de metas"
        subtitulo="O que vem depois de zerar a dívida"
        acao={
          semMetas ? null : (
            <Botao variante="secundario" tamanho="sm" onClick={() => aoAbrirConfig('metas')}>
              + Nova meta
            </Botao>
          )
        }
      />

      {totalPendente > 0 && !semMetas ? (
        <p className="mb-4 rounded-xl border border-ouro-600/30 bg-ouro-500/[0.06] px-4 py-3 text-sm text-carvao-300">
          Ainda há {moeda(totalPendente)} de dívida em aberto. Quitar primeiro rende mais do que
          qualquer aplicação — os juros do rotativo são maiores que qualquer rendimento.
        </p>
      ) : null}

      {semMetas ? (
        <EstadoVazio
          icone={<IconeMeta />}
          titulo="Defina seu objetivo pós-dívida"
          descricao="Reserva de emergência, uma viagem, a entrada de um imóvel. Informe o valor e o aporte mensal — a barra de progresso e a data prevista aparecem sozinhas."
          acao={
            <Botao variante="primario" onClick={() => aoAbrirConfig('metas')}>
              Criar primeira meta
            </Botao>
          }
        />
      ) : (
        <div className="space-y-3">
          {estado.metas.map((meta) => (
            <ItemMeta
              key={meta.id}
              meta={meta}
              estado={estado}
              aoAportar={aoAportar}
              aoEditar={() => aoAbrirConfig('metas')}
              aoAlterarAcumulado={aoAlterarAcumulado}
            />
          ))}
        </div>
      )}
    </Cartao>
  )
}
