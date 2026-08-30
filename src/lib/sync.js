/**
 * Sincronização entre aparelhos.
 *
 * O ciclo é: derivar o identificador da senha, buscar o pacote na nuvem,
 * derivar a chave com o sal que veio junto, abrir, comparar as datas e
 * decidir quem manda. Depois disso, toda alteração local sobe sozinha
 * depois de um respiro de 1,5 s.
 *
 * O servidor nunca recebe a senha. Ver `cripto.js`.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { planoVazio } from './defaults.js'
import {
  derivarIdentificador,
  derivarChave,
  empacotar,
  desempacotar,
  criptografiaDisponivel,
  SenhaIncorreta,
} from './cripto.js'

export const CHAVE_SYNC = 'neogold:sync:v1'
const ESPERA_ENVIO = 1500

/** desligado · abrindo · sincronizando · ok · conflito · erro */
const ENDERECO = '/api/plano'

function lerMeta() {
  try {
    const cru = localStorage.getItem(CHAVE_SYNC)
    return cru ? JSON.parse(cru) : null
  } catch {
    return null
  }
}

function gravarMeta(meta) {
  try {
    if (meta) localStorage.setItem(CHAVE_SYNC, JSON.stringify(meta))
    else localStorage.removeItem(CHAVE_SYNC)
  } catch {
    /* modo restrito: a sincronização segue só em memória nesta aba */
  }
}

async function buscarPacote(identificador) {
  const resposta = await fetch(`${ENDERECO}?id=${identificador}`, { method: 'GET' })
  if (resposta.status === 404) return { tipo: 'vazio' }
  if (resposta.status === 503) return { tipo: 'nao_configurado' }
  if (!resposta.ok) return { tipo: 'erro', status: resposta.status }
  return { tipo: 'ok', pacote: await resposta.json() }
}

async function enviarPacote(identificador, pacote, conhecidoEm) {
  const query = conhecidoEm ? `&desde=${encodeURIComponent(conhecidoEm)}` : ''
  const resposta = await fetch(`${ENDERECO}?id=${identificador}${query}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pacote),
  })
  if (resposta.status === 409) {
    const corpo = await resposta.json().catch(() => ({}))
    return { tipo: 'conflito', remoto: corpo.remoto }
  }
  if (resposta.status === 503) return { tipo: 'nao_configurado' }
  if (!resposta.ok) return { tipo: 'erro', status: resposta.status }
  return { tipo: 'ok' }
}

export function useSync({ estado, substituir }) {
  const [situacao, setSituacao] = useState('desligado')
  const [mensagem, setMensagem] = useState(null)
  const [conflito, setConflito] = useState(null)
  const [ultimoSyncEm, setUltimoSyncEm] = useState(() => lerMeta()?.ultimoSyncEm ?? null)

  // Vive só em memória enquanto a aba está aberta.
  const cofre = useRef(null)
  // O `atualizadoEm` que sabemos estar guardado na nuvem. Serve para não
  // reenviar o que acabou de chegar de lá e para detectar conflito.
  const sincronizadoEm = useRef(lerMeta()?.ultimoSyncEm ?? null)
  const timerEnvio = useRef(null)

  const marcarSincronizado = useCallback((quando, extras = {}) => {
    sincronizadoEm.current = quando
    setUltimoSyncEm(quando)
    const meta = lerMeta() ?? {}
    gravarMeta({ ...meta, ligado: true, ultimoSyncEm: quando, ...extras })
  }, [])

  /* ------------------------------------------------------------ enviar */

  const enviar = useCallback(
    async (paraEnviar) => {
      if (!cofre.current) return
      setSituacao('sincronizando')
      try {
        const pacote = await empacotar(paraEnviar, cofre.current.chave, cofre.current.salB64)
        const r = await enviarPacote(cofre.current.identificador, pacote, sincronizadoEm.current)

        if (r.tipo === 'conflito') {
          const remoto = await desempacotar(r.remoto, cofre.current.chave)
          setConflito({ local: paraEnviar, remoto, pacoteRemoto: r.remoto })
          setSituacao('conflito')
          setMensagem('Outro aparelho salvou uma versão mais nova.')
          return
        }
        if (r.tipo === 'nao_configurado') {
          setSituacao('erro')
          setMensagem('A sincronização ainda não foi provisionada na Vercel.')
          return
        }
        if (r.tipo === 'erro') {
          setSituacao('erro')
          setMensagem('Não foi possível salvar na nuvem. Seus dados locais estão intactos.')
          return
        }

        marcarSincronizado(pacote.atualizadoEm)
        setSituacao('ok')
        setMensagem(null)
      } catch (erro) {
        setSituacao('erro')
        setMensagem(
          erro instanceof SenhaIncorreta
            ? 'O pacote na nuvem não abre com esta senha.'
            : 'Falha ao sincronizar. Seus dados locais estão intactos.',
        )
      }
    },
    [marcarSincronizado],
  )

  /* ----------------------------------------------------------- conectar */

  const conectar = useCallback(
    async (senha, lembrarNesteAparelho = false) => {
      if (!criptografiaDisponivel()) {
        setSituacao('erro')
        setMensagem('Este navegador não oferece a criptografia necessária (exige HTTPS).')
        return
      }

      setSituacao('abrindo')
      setMensagem(null)
      setConflito(null)

      try {
        // O identificador depende só da senha, então vem primeiro: é ele
        // que diz qual pacote buscar. O sal da chave vem de dentro do
        // pacote — por isso a chave só pode ser derivada depois.
        const identificador = await derivarIdentificador(senha)
        const busca = await buscarPacote(identificador)

        if (busca.tipo === 'nao_configurado') {
          setSituacao('erro')
          setMensagem(
            'A sincronização ainda não foi provisionada. Crie um banco Upstash Redis no Marketplace da Vercel e conecte a este projeto.',
          )
          return
        }
        if (busca.tipo === 'erro') {
          setSituacao('erro')
          setMensagem('Não foi possível falar com a nuvem agora.')
          return
        }

        const guardarSenha = () =>
          gravarMeta({
            ...(lerMeta() ?? {}),
            ligado: true,
            senhaLembrada: lembrarNesteAparelho ? senha : null,
          })

        // Primeira vez com esta senha: cria o pacote a partir do que já
        // existe neste aparelho.
        if (busca.tipo === 'vazio') {
          const { chave, salB64 } = await derivarChave(senha, null)
          cofre.current = { identificador, chave, salB64 }
          guardarSenha()
          await enviar(estado)

          // Cada senha abre um cofre diferente, então uma senha digitada
          // errada não dá "senha inválida": ela simplesmente abre um cofre
          // novo e vazio. Sem este aviso, quem errasse a senha num aparelho
          // novo veria o painel em branco e acharia que perdeu tudo.
          if (planoVazio(estado)) {
            setMensagem(
              'Nenhum dado encontrado para esta senha — um cofre novo foi criado. Se você esperava reencontrar seus dados, confira a senha: uma letra diferente já é outro cofre.',
            )
          }
          return
        }

        const { chave } = await derivarChave(senha, busca.pacote.sal)
        cofre.current = { identificador, chave, salB64: busca.pacote.sal }

        const remoto = await desempacotar(busca.pacote, chave)
        guardarSenha()

        const dataRemota = busca.pacote.atualizadoEm
        const dataLocal = estado.atualizadoEm
        const conhecida = sincronizadoEm.current

        // Ninguém mexeu de um lado só: os dois divergiram desde o último
        // encontro. Quem decide é o usuário.
        const localMudou = !conhecida || dataLocal > conhecida
        const remotoMudou = !conhecida || dataRemota > conhecida

        if (dataRemota === dataLocal) {
          marcarSincronizado(dataRemota)
          setSituacao('ok')
          return
        }
        // Aparelho novo (ou recém-limpo): não há nada local para perder,
        // então adota a nuvem sem incomodar o usuário. É o caso mais
        // comum de todos — entrar no celular pela primeira vez.
        if (planoVazio(estado)) {
          substituir(remoto)
          marcarSincronizado(dataRemota)
          setSituacao('ok')
          return
        }
        // Espelho do caso acima: a nuvem está zerada e este aparelho tem
        // os dados de verdade. Sobe sem perguntar.
        if (planoVazio(remoto)) {
          await enviar(estado)
          return
        }
        if (localMudou && remotoMudou) {
          setConflito({ local: estado, remoto, pacoteRemoto: busca.pacote })
          setSituacao('conflito')
          setMensagem('Este aparelho e a nuvem têm versões diferentes.')
          return
        }
        if (dataRemota > dataLocal) {
          substituir(remoto)
          marcarSincronizado(dataRemota)
          setSituacao('ok')
          return
        }
        await enviar(estado)
      } catch (erro) {
        if (erro instanceof SenhaIncorreta) {
          cofre.current = null
          setSituacao('erro')
          setMensagem('Senha incorreta para o pacote guardado nesta nuvem.')
          return
        }
        setSituacao('erro')
        setMensagem('Falha ao conectar. Seus dados locais estão intactos.')
      }
    },
    [estado, substituir, enviar, marcarSincronizado],
  )

  /* -------------------------------------------------------- desconectar */

  const desconectar = useCallback(async ({ apagarDaNuvem = false } = {}) => {
    if (apagarDaNuvem && cofre.current) {
      await fetch(`${ENDERECO}?id=${cofre.current.identificador}`, { method: 'DELETE' }).catch(
        () => {},
      )
    }
    cofre.current = null
    sincronizadoEm.current = null
    gravarMeta(null)
    setUltimoSyncEm(null)
    setConflito(null)
    setMensagem(null)
    setSituacao('desligado')
  }, [])

  /* ---------------------------------------------------------- conflito */

  const resolverConflito = useCallback(
    async (escolha) => {
      if (!conflito) return
      if (escolha === 'remoto') {
        substituir(conflito.remoto)
        marcarSincronizado(conflito.pacoteRemoto.atualizadoEm)
        setConflito(null)
        setSituacao('ok')
        setMensagem(null)
        return
      }
      // Manter o local: assume a versão da nuvem como conhecida para que o
      // próximo envio passe pela trava de concorrência.
      sincronizadoEm.current = conflito.pacoteRemoto.atualizadoEm

      // O carimbo precisa ser novo (para vencer o da nuvem) e precisa
      // valer também para o estado em memória. Sem o `substituir`, o React
      // seguiria com a data antiga e o envio automático dispararia de novo
      // logo em seguida, regravando por cima com o carimbo velho.
      const local = { ...conflito.local, atualizadoEm: new Date().toISOString() }
      setConflito(null)
      substituir(local)
      await enviar(local)
    },
    [conflito, substituir, enviar, marcarSincronizado],
  )

  /* --------------------------------------------- religar ao abrir a aba */

  const jaTentouReligar = useRef(false)
  useEffect(() => {
    if (jaTentouReligar.current) return
    jaTentouReligar.current = true
    const meta = lerMeta()
    if (meta?.ligado && meta?.senhaLembrada) {
      conectar(meta.senhaLembrada, true)
    } else if (meta?.ligado) {
      setSituacao('desligado')
      setMensagem('Digite sua senha mestra para retomar a sincronização.')
    }
  }, [conectar])

  /* ------------------------------------------- subir alterações locais */

  useEffect(() => {
    if (situacao !== 'ok' || !cofre.current) return undefined
    if (estado.atualizadoEm === sincronizadoEm.current) return undefined

    clearTimeout(timerEnvio.current)
    timerEnvio.current = setTimeout(() => enviar(estado), ESPERA_ENVIO)
    return () => clearTimeout(timerEnvio.current)
  }, [estado, situacao, enviar])

  return {
    situacao,
    mensagem,
    conflito,
    ultimoSyncEm,
    ligado: situacao === 'ok' || situacao === 'sincronizando' || situacao === 'conflito',
    senhaLembrada: Boolean(lerMeta()?.senhaLembrada),
    conectar,
    desconectar,
    resolverConflito,
  }
}
