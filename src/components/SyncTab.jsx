/**
 * Aba de sincronização: conectar, desconectar e resolver conflito.
 */

import { useState } from 'react'
import { moeda, data } from '../lib/format.js'
import { avaliarSenha } from '../lib/cripto.js'
import { calcularResumo } from '../lib/calculos.js'
import { Botao, Campo, InputSenha, Selo, Metrica } from './ui.jsx'
import { IconeCheck } from './icones.jsx'

const CORES_FORCA = {
  fraca: 'text-rubi-400',
  media: 'text-violeta-400',
  forte: 'text-esmeralda-400',
  vazia: 'text-carvao-500',
}

function Secao({ titulo, descricao, children }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-carvao-100">{titulo}</h3>
      {descricao ? <p className="mt-0.5 mb-3 text-sm text-carvao-400">{descricao}</p> : <div className="mb-3" />}
      {children}
    </div>
  )
}

function ResumoVersao({ titulo, estado, quando, destaque }) {
  const r = calcularResumo(estado)
  return (
    <div
      className={`rounded-xl border p-4 ${
        destaque ? 'border-violeta-600/40 bg-violeta-500/[0.06]' : 'border-carvao-700 bg-carvao-850'
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-carvao-100">{titulo}</span>
        <span className="text-xs text-carvao-500">{data(quando?.slice(0, 10))}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metrica rotulo="Dívida em aberto" valor={moeda(r.dividas.totalPendente)} />
        <Metrica rotulo="Guardado" valor={moeda(r.patrimonio + r.metasAcumuladas)} />
      </div>
      <p className="mt-3 text-xs text-carvao-500">
        {estado.dividas.length} dívida(s) · {estado.metas.length} meta(s)
      </p>
    </div>
  )
}

/* ----------------------------------------------------------- Conflito */

function PainelConflito({ conflito, aoResolver }) {
  return (
    <Secao
      titulo="Versões diferentes"
      descricao="Este aparelho e a nuvem foram editados separadamente. Escolha qual versão vale — a outra é descartada."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ResumoVersao
          titulo="Deste aparelho"
          estado={conflito.local}
          quando={conflito.local.atualizadoEm}
          destaque
        />
        <ResumoVersao
          titulo="Da nuvem"
          estado={conflito.remoto}
          quando={conflito.pacoteRemoto.atualizadoEm}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Botao variante="primario" onClick={() => aoResolver('local')}>
          Usar a deste aparelho
        </Botao>
        <Botao variante="secundario" onClick={() => aoResolver('remoto')}>
          Usar a da nuvem
        </Botao>
      </div>
      <p className="mt-3 text-xs text-carvao-500">
        Na dúvida, baixe um backup na aba anterior antes de decidir — ele guarda a versão deste
        aparelho num arquivo.
      </p>
    </Secao>
  )
}

/* ----------------------------------------------------------- Conectado */

function PainelConectado({ sync, aoDesconectar }) {
  const [confirmandoApagar, setConfirmandoApagar] = useState(false)

  return (
    <>
      <Secao titulo="Sincronização ativa">
        <div className="rounded-xl border border-esmeralda-500/25 bg-esmeralda-500/[0.06] p-4">
          <div className="flex flex-wrap items-center gap-3">
            {sync.situacao === 'sincronizando' ? (
              <Selo cor="violeta">Enviando…</Selo>
            ) : (
              <Selo cor="esmeralda">
                <IconeCheck className="size-3.5" /> Em dia com a nuvem
              </Selo>
            )}
            {sync.senhaLembrada ? <Selo cor="neutro">Senha lembrada neste aparelho</Selo> : null}
          </div>
          <p className="mt-3 text-sm text-carvao-300">
            Suas alterações sobem sozinhas alguns segundos depois de cada edição. Em outro aparelho,
            abra o painel e digite a mesma senha mestra.
          </p>
          {sync.ultimoSyncEm ? (
            <p className="mt-2 text-xs text-carvao-500">
              Última sincronização: {new Date(sync.ultimoSyncEm).toLocaleString('pt-BR')}
            </p>
          ) : null}
        </div>
      </Secao>

      <Secao
        titulo="Desconectar"
        descricao="Seus dados continuam neste aparelho de qualquer forma."
      >
        <div className="flex flex-wrap gap-3">
          <Botao variante="secundario" onClick={() => aoDesconectar({ apagarDaNuvem: false })}>
            Parar de sincronizar
          </Botao>
          {confirmandoApagar ? (
            <>
              <Botao variante="perigo" onClick={() => aoDesconectar({ apagarDaNuvem: true })}>
                Confirmar: apagar da nuvem
              </Botao>
              <Botao variante="fantasma" onClick={() => setConfirmandoApagar(false)}>
                Cancelar
              </Botao>
            </>
          ) : (
            <Botao variante="perigo" onClick={() => setConfirmandoApagar(true)}>
              Apagar o pacote da nuvem
            </Botao>
          )}
        </div>
      </Secao>
    </>
  )
}

/* ------------------------------------------------------------ Conectar */

function PainelConectar({ sync, aoConectar }) {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [lembrar, setLembrar] = useState(false)

  const forca = avaliarSenha(senha)
  const confere = confirmacao.length === 0 || senha === confirmacao
  const ocupado = sync.situacao === 'abrindo' || sync.situacao === 'sincronizando'
  const podeEnviar = forca.aceitavel && confere && !ocupado

  return (
    <>
      <Secao
        titulo="Ligar a sincronização"
        descricao="Uma senha mestra, sem cadastro e sem e-mail. Ela abre seus dados em qualquer aparelho."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Senha mestra" dica={forca.rotulo}>
            <InputSenha
              value={senha}
              autoComplete="new-password"
              placeholder="Uma frase longa que só você saiba"
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && podeEnviar) aoConectar(senha, lembrar)
              }}
            />
          </Campo>
          <Campo
            rotulo="Repita a senha"
            dica={confere ? 'Opcional na volta, útil na primeira vez' : 'As senhas não conferem'}
          >
            <InputSenha
              value={confirmacao}
              autoComplete="new-password"
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </Campo>
        </div>

        {senha ? (
          <p className={`mt-2 text-xs ${CORES_FORCA[forca.nivel]}`} role="status">
            {forca.rotulo}
          </p>
        ) : null}

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-carvao-700 bg-carvao-850 p-3.5">
          <input
            type="checkbox"
            checked={lembrar}
            onChange={(e) => setLembrar(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-violeta-500"
          />
          <span className="text-sm text-carvao-300">
            Lembrar a senha neste aparelho
            <span className="mt-0.5 block text-xs text-carvao-500">
              Evita digitar toda vez, mas guarda a senha no navegador. Deixe desmarcado em
              computador compartilhado.
            </span>
          </span>
        </label>

        <Botao
          variante="primario"
          className="mt-4"
          disabled={!podeEnviar}
          onClick={() => aoConectar(senha, lembrar)}
        >
          {ocupado ? 'Abrindo…' : 'Conectar'}
        </Botao>

        {ocupado ? (
          <p className="mt-2 text-xs text-carvao-500">
            A derivação da chave é lenta de propósito — é isso que torna a senha cara de adivinhar.
          </p>
        ) : null}
      </Secao>

      <Secao titulo="Como funciona">
        <div className="space-y-2 rounded-xl border border-carvao-700 bg-carvao-850 p-4 text-sm text-carvao-300">
          <p>
            Sua senha nunca sai deste navegador. Dela saem duas coisas: o endereço onde o pacote
            fica guardado e a chave que embaralha o conteúdo.
          </p>
          <p>
            O servidor recebe apenas bytes embaralhados. Nem eu, nem a Vercel, nem quem tiver acesso
            ao banco consegue ler seus valores.
          </p>
        </div>
      </Secao>

      <Secao titulo="O preço disso">
        <div className="space-y-2 rounded-xl border border-rubi-500/25 bg-rubi-500/[0.06] p-4 text-sm text-carvao-300">
          <p>
            <span className="font-semibold text-rubi-400">Esqueceu a senha, perdeu o pacote.</span>{' '}
            Não existe "recuperar senha" quando ninguém no mundo tem a chave — nem eu.
          </p>
          <p>
            Seus dados neste aparelho e o backup <code className="text-carvao-200">.json</code> da
            aba anterior continuam funcionando como rede de proteção. Baixe um antes de ligar isto.
          </p>
        </div>
      </Secao>
    </>
  )
}

/* ------------------------------------------------------------------ Aba */

export function SyncTab({ sync }) {
  return (
    <>
      {sync.mensagem ? (
        <p
          role="status"
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            sync.situacao === 'erro' || sync.situacao === 'conflito'
              ? 'border-rubi-500/30 bg-rubi-500/[0.08] text-rubi-400'
              : 'border-carvao-700 bg-carvao-850 text-carvao-300'
          }`}
        >
          {sync.mensagem}
        </p>
      ) : null}

      {sync.situacao === 'conflito' && sync.conflito ? (
        <PainelConflito conflito={sync.conflito} aoResolver={sync.resolverConflito} />
      ) : sync.ligado ? (
        <PainelConectado sync={sync} aoDesconectar={sync.desconectar} />
      ) : (
        <PainelConectar sync={sync} aoConectar={sync.conectar} />
      )}
    </>
  )
}
