/**
 * Cartão principal: as dívidas em aberto e as propostas de renegociação.
 */

import { moeda, percentual, data, diasAte, pluralizar } from '../lib/format.js'
import { calcularDividas } from '../lib/calculos.js'
import { Cartao, CabecalhoCartao, Botao, Selo, Metrica, EstadoVazio, BarraProgresso } from './ui.jsx'
import { IconeDivida, IconeCheck } from './icones.jsx'

function AvisoPrazo({ vencimento }) {
  const dias = diasAte(vencimento)
  if (dias === null) return null

  if (dias < 0) {
    return <Selo cor="rubi">Proposta vencida em {data(vencimento)}</Selo>
  }
  if (dias === 0) {
    return <Selo cor="rubi">Vence hoje</Selo>
  }
  if (dias <= 7) {
    return (
      <Selo cor="rubi">
        Vence em {dias} {pluralizar(dias, 'dia', 'dias')} — {data(vencimento)}
      </Selo>
    )
  }
  return (
    <Selo cor="neutro">
      Válida até {data(vencimento)} · {dias} {pluralizar(dias, 'dia', 'dias')}
    </Selo>
  )
}

function ItemDivida({ divida, aoAlternarQuitada, aoEditar }) {
  const { credor, descricao, valorOriginal, valorNegociado, economia, desconto, quitada } = divida

  return (
    <article
      className={`rounded-xl p-4 transition-colors sm:p-5 ${
        quitada ? 'bg-esmeralda-500/[0.09]' : 'bg-carvao-850'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-carvao-100">
              {credor || 'Dívida sem nome'}
            </h3>
            {quitada ? <Selo cor="esmeralda">Quitada</Selo> : <Selo cor="violeta">Em aberto</Selo>}
          </div>
          {descricao ? <p className="mt-1 text-sm text-carvao-400">{descricao}</p> : null}
        </div>

        <button
          type="button"
          onClick={() => aoEditar(divida.id)}
          className="alvo-toque shrink-0 rounded-lg px-2 py-1 text-xs text-carvao-400 transition-colors hover:bg-carvao-800 hover:text-carvao-100"
        >
          Editar
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[0.8125rem] text-carvao-500">Valor original</p>
          <p className="tabular mt-1 text-base text-carvao-400 line-through decoration-rubi-500/60">
            {moeda(valorOriginal)}
          </p>
        </div>
        <div>
          <p className="text-[0.8125rem] text-carvao-500">
            {quitada ? 'Valor pago' : 'Proposta à vista'}
          </p>
          <p
            className={`tabular mt-1 text-lg font-semibold sm:text-xl ${
              quitada ? 'text-esmeralda-400' : 'text-violeta-400'
            }`}
          >
            {moeda(valorNegociado)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[0.8125rem] text-carvao-500">Economia</p>
          <p className="tabular mt-1 text-lg font-semibold text-esmeralda-400 sm:text-xl">
            {moeda(economia)}
          </p>
          {desconto > 0 ? (
            <p className="mt-0.5 text-xs text-carvao-500">{percentual(desconto)} de desconto</p>
          ) : null}
        </div>
      </div>

      {desconto > 0 ? (
        <div className="mt-4">
          <BarraProgresso
            fracao={desconto}
            cor={quitada ? 'esmeralda' : 'violeta'}
            altura="h-1.5"
            rotulo={`Desconto obtido na negociação com ${credor || 'o credor'}`}
          />
        </div>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {quitada ? (
          <Selo cor="esmeralda">Quitada em {data(divida.quitadaEm)}</Selo>
        ) : (
          <AvisoPrazo vencimento={divida.vencimentoProposta} />
        )}

        {quitada ? (
          <Botao variante="fantasma" tamanho="sm" onClick={() => aoAlternarQuitada(divida.id)}>
            Reabrir dívida
          </Botao>
        ) : (
          <Botao variante="sucesso" tamanho="sm" onClick={() => aoAlternarQuitada(divida.id)}>
            <IconeCheck className="size-3.5" /> Marcar como quitada
          </Botao>
        )}
      </footer>
    </article>
  )
}

export function DividasCard({ estado, aoAlternarQuitada, aoAbrirConfig }) {
  const d = calcularDividas(estado)

  return (
    <Cartao>
      <CabecalhoCartao
        icone={<IconeDivida />}
        titulo="Dívidas e renegociações"
        subtitulo={
          d.vazio
            ? 'Nenhuma dívida cadastrada ainda'
            : `${d.pendentes.length} em aberto · ${d.quitadas.length} ${pluralizar(d.quitadas.length, 'quitada', 'quitadas')}`
        }
        acao={
          d.vazio ? null : (
            <Botao variante="secundario" tamanho="sm" onClick={() => aoAbrirConfig('dividas')}>
              + Nova dívida
            </Botao>
          )
        }
      />

      {d.vazio ? (
        <EstadoVazio
          icone={<IconeDivida />}
          titulo="Comece cadastrando a dívida que você está negociando"
          descricao="Informe o valor original, o valor da proposta à vista e o prazo. O painel calcula sua economia e acompanha o prazo para você."
          acao={
            <Botao variante="primario" onClick={() => aoAbrirConfig('dividas')}>
              Cadastrar primeira dívida
            </Botao>
          }
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl bg-carvao-850 p-4 sm:grid-cols-3">
            <Metrica
              rotulo="Falta pagar"
              valor={moeda(d.totalPendente)}
              cor={d.totalPendente > 0 ? 'text-violeta-400' : 'text-esmeralda-400'}
              detalhe={
                d.totalPendente > 0
                  ? `De ${moeda(d.totalOriginalPendente)} originais`
                  : 'Nada em aberto'
              }
            />
            <Metrica
              rotulo="Economia negociada"
              valor={moeda(d.economiaNegociada)}
              cor="text-esmeralda-400"
              detalhe="Diferença entre o original e a proposta"
            />
            <Metrica
              rotulo="Já quitado"
              valor={moeda(d.totalQuitado)}
              detalhe={`${moeda(d.economiaRealizada)} de economia realizada`}
              className="col-span-2 sm:col-span-1"
            />
          </div>

          {d.tudoQuitado ? (
            <div className="mb-5 rounded-xl bg-esmeralda-500/[0.10] p-5 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-semibold text-esmeralda-400">
                <IconeCheck className="size-4" /> Todas as dívidas quitadas
              </p>
              <p className="mt-1 text-sm text-carvao-300">
                Você economizou {moeda(d.economiaRealizada)}. A partir de agora o dinheiro que ia
                para a dívida pode ir para a sua meta.
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            {d.pendentes.map((divida) => (
              <ItemDivida
                key={divida.id}
                divida={divida}
                aoAlternarQuitada={aoAlternarQuitada}
                aoEditar={() => aoAbrirConfig('dividas')}
              />
            ))}
            {d.quitadas.map((divida) => (
              <ItemDivida
                key={divida.id}
                divida={divida}
                aoAlternarQuitada={aoAlternarQuitada}
                aoEditar={() => aoAbrirConfig('dividas')}
              />
            ))}
          </div>
        </>
      )}
    </Cartao>
  )
}
