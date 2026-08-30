/**
 * Painel de configuração — permite mudar qualquer número do painel
 * sem tocar no código-fonte.
 */

import { useRef, useState } from 'react'
import { moeda, hojeISO } from '../lib/format.js'
import { novaDivida, novaMeta } from '../lib/defaults.js'
import { calcularOrcamento } from '../lib/calculos.js'
import { exportarArquivo, lerArquivo } from '../lib/storage.js'
import { SyncTab } from './SyncTab.jsx'
import {
  Modal,
  Botao,
  Campo,
  InputTexto,
  InputMoeda,
  InputNumero,
  InputData,
  Selo,
  EstadoVazio,
} from './ui.jsx'

const ABAS = [
  { id: 'perfil', rotulo: 'Renda e orçamento', icone: '⚖️' },
  { id: 'dividas', rotulo: 'Dívidas', icone: '🧾' },
  { id: 'metas', rotulo: 'Metas', icone: '🎯' },
  { id: 'investimentos', rotulo: 'Investimentos', icone: '📈' },
  { id: 'dados', rotulo: 'Backup e privacidade', icone: '🔒' },
  { id: 'sync', rotulo: 'Sincronizar', icone: '☁️' },
]

function Secao({ titulo, descricao, children }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-carvao-100">{titulo}</h3>
      {descricao ? <p className="mt-0.5 mb-3 text-sm text-carvao-400">{descricao}</p> : <div className="mb-3" />}
      {children}
    </div>
  )
}

function BotaoRemover({ onClick, rotulo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-carvao-400 transition-colors hover:bg-rubi-600/15 hover:text-rubi-400"
    >
      Remover
    </button>
  )
}

/* ------------------------------------------------------------------ Perfil */

function AbaPerfil({ estado, atualizar }) {
  const o = calcularOrcamento(estado)

  return (
    <>
      <Secao titulo="Seus números" descricao="Base de todo o cálculo do painel.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Como quer ser chamado" dica="Aparece só no cabeçalho, no seu navegador.">
            <InputTexto
              value={estado.perfil.nome}
              placeholder="Seu nome"
              onChange={(e) => atualizar((r) => { r.perfil.nome = e.target.value })}
            />
          </Campo>
          <Campo rotulo="Renda mensal líquida">
            <InputMoeda
              valor={estado.perfil.rendaMensal}
              onChange={(v) => atualizar((r) => { r.perfil.rendaMensal = v })}
            />
          </Campo>
          <Campo
            rotulo="Custo de vida mensal"
            dica="Quanto você gasta por mês para viver. Define a meta da reserva."
            className="sm:col-span-2"
          >
            <InputMoeda
              valor={estado.perfil.custoVidaMensal}
              onChange={(v) => atualizar((r) => { r.perfil.custoVidaMensal = v })}
            />
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Divisão do orçamento"
        descricao="O padrão é 50 / 30 / 20. Ajuste se o seu momento pedir outra proporção."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Essenciais" dica={moeda(o.fatias[0].valor)}>
            <InputNumero
              valor={estado.orcamento.essenciais}
              sufixo="%"
              max={100}
              onChange={(v) => atualizar((r) => { r.orcamento.essenciais = v })}
            />
          </Campo>
          <Campo rotulo="Lazer e hobbies" dica={moeda(o.fatias[1].valor)}>
            <InputNumero
              valor={estado.orcamento.lazer}
              sufixo="%"
              max={100}
              onChange={(v) => atualizar((r) => { r.orcamento.lazer = v })}
            />
          </Campo>
          <Campo rotulo="Investimentos" dica={moeda(o.fatias[2].valor)}>
            <InputNumero
              valor={estado.orcamento.investimentos}
              sufixo="%"
              max={100}
              onChange={(v) => atualizar((r) => { r.orcamento.investimentos = v })}
            />
          </Campo>
        </div>
        <p
          className={`mt-3 text-sm ${o.fechaCem ? 'text-esmeralda-400' : 'text-rubi-400'}`}
          role="status"
        >
          {o.fechaCem
            ? `✓ As fatias somam 100% — ${moeda(o.cotaInvestimento)} por mês para investir.`
            : `As fatias somam ${o.somaPercentuais}%. Ajuste para fechar em 100%.`}
        </p>
      </Secao>
    </>
  )
}

/* ----------------------------------------------------------------- Dívidas */

function AbaDividas({ estado, atualizar }) {
  function alterar(id, campo, valor) {
    atualizar((r) => {
      const d = r.dividas.find((x) => x.id === id)
      if (d) d[campo] = valor
    })
  }

  return (
    <>
      <Secao
        titulo="Dívidas em negociação"
        descricao="Cadastre o valor original e o valor da proposta. A economia é calculada sozinha."
      >
        {estado.dividas.length === 0 ? (
          <EstadoVazio
            icone="🧾"
            titulo="Nenhuma dívida cadastrada"
            descricao="Adicione a dívida que você está renegociando para acompanhar prazo e economia."
          />
        ) : (
          <div className="space-y-4">
            {estado.dividas.map((d) => {
              const economia = Math.max(d.valorOriginal - d.valorNegociado, 0)
              return (
                <div key={d.id} className="rounded-xl border border-carvao-700 bg-carvao-850 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-carvao-500">
                      {d.credor || 'Nova dívida'}
                    </span>
                    <div className="flex items-center gap-2">
                      {economia > 0 ? <Selo cor="esmeralda">Economia {moeda(economia)}</Selo> : null}
                      <BotaoRemover
                        rotulo={`Remover dívida ${d.credor || 'sem nome'}`}
                        onClick={() =>
                          atualizar((r) => {
                            r.dividas = r.dividas.filter((x) => x.id !== d.id)
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo rotulo="Credor">
                      <InputTexto
                        value={d.credor}
                        placeholder="Nome do banco ou credor"
                        onChange={(e) => alterar(d.id, 'credor', e.target.value)}
                      />
                    </Campo>
                    <Campo rotulo="Descrição" dica="Opcional">
                      <InputTexto
                        value={d.descricao}
                        placeholder="Cartão de crédito, empréstimo…"
                        onChange={(e) => alterar(d.id, 'descricao', e.target.value)}
                      />
                    </Campo>
                    <Campo rotulo="Valor original da dívida">
                      <InputMoeda
                        valor={d.valorOriginal}
                        onChange={(v) => alterar(d.id, 'valorOriginal', v)}
                      />
                    </Campo>
                    <Campo rotulo="Proposta à vista">
                      <InputMoeda
                        valor={d.valorNegociado}
                        onChange={(v) => alterar(d.id, 'valorNegociado', v)}
                      />
                    </Campo>
                    <Campo rotulo="Proposta válida até" dica="Opcional — o painel avisa o prazo">
                      <InputData
                        value={d.vencimentoProposta}
                        onChange={(e) => alterar(d.id, 'vencimentoProposta', e.target.value)}
                      />
                    </Campo>
                    <Campo rotulo="Situação">
                      <div className="flex h-[42px] items-center gap-3 rounded-xl border border-carvao-600 bg-carvao-850 px-3.5">
                        <input
                          type="checkbox"
                          id={`quitada-${d.id}`}
                          checked={d.quitada}
                          onChange={(e) =>
                            atualizar((r) => {
                              const alvo = r.dividas.find((x) => x.id === d.id)
                              if (!alvo) return
                              alvo.quitada = e.target.checked
                              alvo.quitadaEm = e.target.checked ? hojeISO() : null
                            })
                          }
                          className="size-4 accent-esmeralda-500"
                        />
                        <label htmlFor={`quitada-${d.id}`} className="text-sm text-carvao-200">
                          Marcar como quitada
                        </label>
                      </div>
                    </Campo>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Botao
          variante="secundario"
          className="mt-4"
          onClick={() => atualizar((r) => { r.dividas.push(novaDivida()) })}
        >
          + Adicionar dívida
        </Botao>
      </Secao>
    </>
  )
}

/* ------------------------------------------------------------------- Metas */

function AbaMetas({ estado, atualizar }) {
  function alterar(id, campo, valor) {
    atualizar((r) => {
      const m = r.metas.find((x) => x.id === id)
      if (m) m[campo] = valor
    })
  }

  return (
    <Secao
      titulo="Metas financeiras"
      descricao="Objetivo, valor e aporte mensal. A previsão de conclusão é calculada automaticamente."
    >
      {estado.metas.length === 0 ? (
        <EstadoVazio icone="🎯" titulo="Nenhuma meta cadastrada" descricao="Crie a primeira abaixo." />
      ) : (
        <div className="space-y-4">
          {estado.metas.map((m) => (
            <div key={m.id} className="rounded-xl border border-carvao-700 bg-carvao-850 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-carvao-500">
                  {m.titulo || 'Nova meta'}
                </span>
                <BotaoRemover
                  rotulo={`Remover meta ${m.titulo || 'sem nome'}`}
                  onClick={() =>
                    atualizar((r) => {
                      r.metas = r.metas.filter((x) => x.id !== m.id)
                    })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Objetivo" className="sm:col-span-2">
                  <InputTexto
                    value={m.titulo}
                    placeholder="Ex.: entrada do apartamento, viagem, carro"
                    onChange={(e) => alterar(m.id, 'titulo', e.target.value)}
                  />
                </Campo>
                <Campo rotulo="Meta em dinheiro">
                  <InputMoeda valor={m.valorAlvo} onChange={(v) => alterar(m.id, 'valorAlvo', v)} />
                </Campo>
                <Campo rotulo="Aporte mensal">
                  <InputMoeda
                    valor={m.aporteMensal}
                    onChange={(v) => alterar(m.id, 'aporteMensal', v)}
                  />
                </Campo>
                <Campo rotulo="Já guardado" className="sm:col-span-2">
                  <InputMoeda valor={m.acumulado} onChange={(v) => alterar(m.id, 'acumulado', v)} />
                </Campo>
              </div>
            </div>
          ))}
        </div>
      )}

      <Botao
        variante="secundario"
        className="mt-4"
        onClick={() => atualizar((r) => { r.metas.push(novaMeta()) })}
      >
        + Adicionar meta
      </Botao>
    </Secao>
  )
}

/* ----------------------------------------------------------- Investimentos */

function AbaInvestimentos({ estado, atualizar }) {
  const percReserva = estado.reserva.percentualDoAporte

  return (
    <>
      <Secao
        titulo="Divisão dos 20%"
        descricao="Quanto da cota mensal vai para a reserva e quanto vai para a renda variável."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Reserva de emergência" dica={`Renda variável fica com ${100 - percReserva}%`}>
            <InputNumero
              valor={percReserva}
              sufixo="%"
              max={100}
              onChange={(v) =>
                atualizar((r) => {
                  r.reserva.percentualDoAporte = Math.min(Math.max(v, 0), 100)
                })
              }
            />
          </Campo>
          <Campo rotulo="Meses de reserva" dica="O plano recomenda de 6 a 12 meses.">
            <InputNumero
              valor={estado.reserva.mesesAlvo}
              sufixo="meses"
              min={1}
              max={36}
              onChange={(v) => atualizar((r) => { r.reserva.mesesAlvo = v })}
            />
          </Campo>
          <Campo rotulo="Saldo atual da reserva" className="sm:col-span-2">
            <InputMoeda
              valor={estado.reserva.acumulado}
              onChange={(v) => atualizar((r) => { r.reserva.acumulado = v })}
            />
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Pilares da renda variável"
        descricao="Os aportes são divididos igualmente entre os três. Você pode trocar os ativos de exemplo."
      >
        <div className="space-y-4">
          {estado.investimentos.pilares.map((p) => (
            <div key={p.id} className="rounded-xl border border-carvao-700 bg-carvao-850 p-4">
              <p className="mb-3 text-sm font-semibold text-carvao-100">{p.nome}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Ativos de referência">
                  <InputTexto
                    value={p.exemplos}
                    onChange={(e) =>
                      atualizar((r) => {
                        const alvo = r.investimentos.pilares.find((x) => x.id === p.id)
                        if (alvo) alvo.exemplos = e.target.value
                      })
                    }
                  />
                </Campo>
                <Campo rotulo="Total já aportado">
                  <InputMoeda
                    valor={p.acumulado}
                    onChange={(v) =>
                      atualizar((r) => {
                        const alvo = r.investimentos.pilares.find((x) => x.id === p.id)
                        if (alvo) alvo.acumulado = v
                      })
                    }
                  />
                </Campo>
              </div>
            </div>
          ))}
        </div>
      </Secao>
    </>
  )
}

/* -------------------------------------------------------------------- Dados */

function AbaDados({ estado, substituir, apagarTudo, aoFechar }) {
  const inputArquivo = useRef(null)
  const [mensagem, setMensagem] = useState(null)
  const [confirmandoReset, setConfirmandoReset] = useState(false)

  async function importar(evento) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return
    try {
      substituir(await lerArquivo(arquivo))
      setMensagem({ tipo: 'ok', texto: 'Backup restaurado com sucesso.' })
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <>
      <Secao titulo="Onde ficam os seus dados">
        <div className="space-y-2 rounded-xl border border-esmeralda-500/25 bg-esmeralda-500/[0.06] p-4 text-sm text-carvao-300">
          <p>
            <span className="font-semibold text-esmeralda-400">Tudo fica neste navegador.</span> Os
            números que você digita são gravados no <code className="text-carvao-200">localStorage</code>{' '}
            deste dispositivo.
          </p>
          <p>
            Não existe servidor, banco de dados nem login. A página não faz nenhuma requisição de
            rede — nem fontes externas, nem analytics.
          </p>
          <p>
            Como consequência: limpar os dados do site, usar aba anônima ou trocar de navegador
            começa do zero. Para levar seus dados a outro dispositivo, use o backup abaixo.
          </p>
        </div>
      </Secao>

      <Secao
        titulo="Backup"
        descricao="Baixe um arquivo .json com tudo, ou restaure um backup anterior."
      >
        <div className="flex flex-wrap gap-3">
          <Botao variante="secundario" onClick={() => exportarArquivo(estado)}>
            ↓ Baixar backup
          </Botao>
          <Botao variante="secundario" onClick={() => inputArquivo.current?.click()}>
            ↑ Restaurar backup
          </Botao>
          <input
            ref={inputArquivo}
            type="file"
            accept="application/json,.json"
            onChange={importar}
            className="hidden"
          />
        </div>
        {mensagem ? (
          <p
            role="status"
            className={`mt-3 text-sm ${mensagem.tipo === 'ok' ? 'text-esmeralda-400' : 'text-rubi-400'}`}
          >
            {mensagem.texto}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-carvao-500">
          O arquivo de backup contém os seus valores reais. Guarde num lugar seguro e não suba para
          repositórios nem para a nuvem pública.
        </p>
      </Secao>

      <Secao titulo="Apagar tudo" descricao="Volta o painel ao estado inicial. Não tem desfazer.">
        {confirmandoReset ? (
          <div className="rounded-xl border border-rubi-500/30 bg-rubi-500/[0.08] p-4">
            <p className="text-sm text-carvao-200">
              Apagar todos os dados deste navegador? Baixe um backup antes se quiser recuperar
              depois.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Botao
                variante="perigo"
                onClick={() => {
                  apagarTudo()
                  setConfirmandoReset(false)
                  aoFechar()
                }}
              >
                Sim, apagar tudo
              </Botao>
              <Botao variante="fantasma" onClick={() => setConfirmandoReset(false)}>
                Cancelar
              </Botao>
            </div>
          </div>
        ) : (
          <Botao variante="perigo" onClick={() => setConfirmandoReset(true)}>
            Apagar todos os dados
          </Botao>
        )}
      </Secao>
    </>
  )
}

/* -------------------------------------------------------------------- Modal */

export function ConfigModal({
  aberto,
  aba,
  aoTrocarAba,
  aoFechar,
  estado,
  atualizar,
  substituir,
  apagarTudo,
  sync,
}) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Configuração"
      descricao="Ajuste qualquer valor do painel — nada aqui exige mexer no código."
      largura="52rem"
    >
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => aoTrocarAba(item.id)}
            aria-current={aba === item.id ? 'page' : undefined}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-sm transition-colors ${
              aba === item.id
                ? 'bg-ouro-500/15 font-semibold text-ouro-300'
                : 'text-carvao-400 hover:bg-carvao-800 hover:text-carvao-100'
            }`}
          >
            <span aria-hidden="true" className="mr-1.5">
              {item.icone}
            </span>
            {item.rotulo}
          </button>
        ))}
      </div>

      {aba === 'perfil' ? <AbaPerfil estado={estado} atualizar={atualizar} /> : null}
      {aba === 'dividas' ? <AbaDividas estado={estado} atualizar={atualizar} /> : null}
      {aba === 'metas' ? <AbaMetas estado={estado} atualizar={atualizar} /> : null}
      {aba === 'investimentos' ? <AbaInvestimentos estado={estado} atualizar={atualizar} /> : null}
      {aba === 'dados' ? (
        <AbaDados
          estado={estado}
          substituir={substituir}
          apagarTudo={apagarTudo}
          aoFechar={aoFechar}
        />
      ) : null}
      {aba === 'sync' ? <SyncTab sync={sync} /> : null}

      <footer className="mt-6 flex items-center justify-between gap-3 border-t border-carvao-700 pt-4">
        <p className="text-xs text-carvao-500">Alterações são salvas automaticamente.</p>
        <Botao variante="primario" onClick={aoFechar}>
          Concluir
        </Botao>
      </footer>
    </Modal>
  )
}
