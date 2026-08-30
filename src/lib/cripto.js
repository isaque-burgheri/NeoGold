/**
 * Criptografia da sincronização.
 *
 * A senha mestra nunca sai deste arquivo em texto claro e nunca é enviada
 * ao servidor. Dela derivamos duas coisas independentes:
 *
 *   1. o identificador remoto — onde o pacote fica guardado;
 *   2. a chave AES-GCM — que embaralha o conteúdo.
 *
 * Os dois usam PBKDF2 com "sais" diferentes, para que conhecer um não
 * ajude a descobrir o outro. O servidor recebe apenas o pacote cifrado,
 * o sal e o vetor de inicialização — nada disso revela a senha nem o
 * conteúdo.
 */

const ITERACOES = 210_000
const SAL_DO_ID = 'neogold:identificador:v1'
const VERSAO_PACOTE = 1

const codificador = new TextEncoder()
const decodificador = new TextDecoder()

export class SenhaIncorreta extends Error {
  constructor() {
    super('Senha mestra incorreta, ou o pacote na nuvem está corrompido.')
    this.name = 'SenhaIncorreta'
  }
}

export function criptografiaDisponivel() {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

/* -------------------------------------------------------------- base64 */

function paraBase64(bytes) {
  let binario = ''
  const view = new Uint8Array(bytes)
  for (let i = 0; i < view.length; i += 1) binario += String.fromCharCode(view[i])
  return btoa(binario)
}

function deBase64(texto) {
  const binario = atob(texto)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
  return bytes
}

function paraHex(bytes) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/* ------------------------------------------------------------ derivação */

async function materialDaSenha(senha) {
  return crypto.subtle.importKey('raw', codificador.encode(senha), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ])
}

/**
 * Identificador remoto: 64 caracteres hexadecimais derivados da senha.
 * É o "endereço" do pacote. Sem a senha não há como adivinhá-lo.
 */
export async function derivarIdentificador(senha) {
  const material = await materialDaSenha(senha)
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: codificador.encode(SAL_DO_ID),
      iterations: ITERACOES,
      hash: 'SHA-256',
    },
    material,
    256,
  )
  return paraHex(bits)
}

/**
 * Chave AES-GCM. O sal é aleatório na primeira vez e depois reaproveitado
 * do pacote guardado — por isso ele viaja em texto claro junto ao pacote,
 * o que é seguro e é como PBKDF2 foi projetado para funcionar.
 */
export async function derivarChave(senha, salB64) {
  const sal = salB64 ? deBase64(salB64) : crypto.getRandomValues(new Uint8Array(16))
  const material = await materialDaSenha(senha)
  const chave = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sal, iterations: ITERACOES, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  return { chave, salB64: paraBase64(sal) }
}

/* ------------------------------------------------------ pacote cifrado */

/**
 * Monta o pacote que vai para o servidor.
 *
 * `atualizadoEm` viaja em texto claro de propósito: é o que permite
 * detectar conflito entre aparelhos sem que o servidor precise (ou possa)
 * ler o conteúdo. O preço é revelar *quando* você editou, nunca o quê.
 */
export async function empacotar(estado, chave, salB64) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const texto = codificador.encode(JSON.stringify(estado))
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, texto)

  return {
    v: VERSAO_PACOTE,
    atualizadoEm: estado.atualizadoEm ?? new Date().toISOString(),
    sal: salB64,
    iv: paraBase64(iv),
    dados: paraBase64(cifrado),
  }
}

/** Abre o pacote. Senha errada cai em SenhaIncorreta, não em erro genérico. */
export async function desempacotar(pacote, chave) {
  if (!pacote || typeof pacote !== 'object' || !pacote.dados || !pacote.iv) {
    throw new SenhaIncorreta()
  }
  try {
    const aberto = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: deBase64(pacote.iv) },
      chave,
      deBase64(pacote.dados),
    )
    return JSON.parse(decodificador.decode(aberto))
  } catch {
    // AES-GCM falha na verificação de integridade quando a chave está
    // errada — é indistinguível de pacote adulterado, e o tratamento é o
    // mesmo dos dois lados.
    throw new SenhaIncorreta()
  }
}

/* ------------------------------------------------------ força da senha */

/**
 * Avaliação deliberadamente simples: comprimento manda mais do que
 * variedade de símbolos. Serve para barrar "123456", não para dar nota.
 */
export function avaliarSenha(senha) {
  const s = String(senha ?? '')
  if (s.length === 0) return { nivel: 'vazia', rotulo: '', aceitavel: false }
  if (s.length < 8) {
    return { nivel: 'fraca', rotulo: 'Curta demais — use ao menos 8 caracteres', aceitavel: false }
  }

  const variedade =
    (/[a-z]/.test(s) ? 1 : 0) +
    (/[A-Z]/.test(s) ? 1 : 0) +
    (/[0-9]/.test(s) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(s) ? 1 : 0)

  if (s.length >= 16 || (s.length >= 12 && variedade >= 3)) {
    return { nivel: 'forte', rotulo: 'Senha forte', aceitavel: true }
  }
  if (s.length >= 12 || variedade >= 3) {
    return { nivel: 'media', rotulo: 'Aceitável — uma frase longa seria melhor', aceitavel: true }
  }
  return {
    nivel: 'fraca',
    rotulo: 'Fraca — prefira uma frase de 4 palavras a uma palavra com símbolos',
    aceitavel: false,
  }
}
