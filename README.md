# NeoGold

Painel pessoal de **plano financeiro e controle de dívidas**. Roda inteiro no navegador,
sem login e sem cadastro. Por padrão nada sai do seu dispositivo; a sincronização entre
aparelhos é opcional e sobe apenas conteúdo cifrado.

> Estrutura baseada na regra **50 / 30 / 20** e na divisão dos 20% em paralelo entre
> reserva de emergência e renda variável, com a renda variável pulverizada em três
> pilares iguais (Ações BR, FIIs e bolsa americana em dólar).

---

## Privacidade

Este repositório **não contém nenhum dado financeiro real**. Os arquivos de código
nascem com valores neutros (zerados); os seus números são digitados na própria
interface e gravados apenas no `localStorage` do seu navegador.

Consequências práticas:

- Ninguém que abra o repositório ou o site vê os seus dados — nem quem hospeda.
- Cada navegador/dispositivo tem a sua própria cópia. Para levar os dados de um para
  outro, use **Configurar → Backup e privacidade → Baixar backup**.
- Limpar os dados do site, usar aba anônima ou desinstalar o navegador apaga tudo.
- O arquivo de backup (`backup-neogold-AAAA-MM-DD.json`) **contém os seus valores
  reais**. Guarde-o num local seguro e nunca faça commit dele — o `.gitignore` já
  bloqueia esse padrão de nome.

Não há Google Fonts, CDN nem analytics: a página carrega apenas os arquivos servidos
por ela mesma. Com a sincronização desligada — o padrão — ela não faz nenhuma requisição
de rede depois de carregar.

### Sincronização entre aparelhos (opcional)

Desligada por padrão. Quando ligada, ela resolve o problema de ter que preencher
tudo de novo em cada aparelho — sem abrir mão da privacidade.

Você define uma **senha mestra**. Não há cadastro, e-mail nem login. Dela saem
duas coisas independentes, por PBKDF2 com sais diferentes:

| Derivação | Para quê |
| --- | --- |
| Identificador (64 hex) | O endereço onde o pacote fica guardado |
| Chave AES-GCM 256 | Embaralha o conteúdo antes de sair do navegador |

O servidor recebe apenas bytes cifrados, o sal e o vetor de inicialização. Nem
quem hospeda, nem quem tiver acesso ao banco consegue ler seus valores. A única
coisa em texto claro é a data da última edição — é ela que permite detectar
divergência entre aparelhos sem que o servidor precise abrir o pacote.

Duas consequências que valem repetir:

- **Esqueceu a senha, perdeu o pacote da nuvem.** Não existe recuperação quando
  ninguém tem a chave. Os dados locais e o backup `.json` continuam servindo de
  rede de proteção.
- **Cada senha abre um cofre diferente.** Digitar a senha errada não dá erro:
  abre um cofre novo e vazio. O painel avisa quando isso acontece num aparelho
  sem dados, justamente para ninguém achar que perdeu tudo.

Se dois aparelhos forem editados separadamente, o painel mostra as duas versões
lado a lado com os valores de cada uma e pergunta qual vale.

---

## O que o painel faz

| Bloco | Para quê |
| --- | --- |
| **Resumo geral** | Dívida em aberto, economia negociada, patrimônio guardado e aporte mensal |
| **Dívidas e renegociações** | Valor original × proposta à vista, economia e % de desconto, prazo da proposta com alerta de vencimento e botão **Marcar como quitada** |
| **Planejador de metas** | Objetivo, meta em dinheiro, aporte mensal, barra de progresso e data prevista de conclusão |
| **Reserva de emergência** | Meta de 6 a 12 meses do custo de vida, progresso e previsão |
| **Orçamento 50/30/20** | Divisão da renda entre essenciais, lazer e investimentos |
| **Estratégia dos 20%** | Split reserva × renda variável, os três pilares e o ciclo mensal de compra |
| **Configuração** | Edita qualquer valor, adiciona dívidas e metas, exporta/importa backup, apaga tudo |
| **Sincronizar** | Liga a sincronização criptografada entre aparelhos e resolve conflitos |

Nenhuma dessas telas exige mexer no código-fonte.

---

## Rodando localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Outros comandos:

```bash
npm run build      # gera dist/ para produção
npm run preview    # serve o dist/ localmente
```

---

## Publicando de graça

### Vercel (recomendado)

1. Acesse [vercel.com/new](https://vercel.com/new) e entre com a conta do GitHub.
2. Escolha **Import** no repositório `NeoGold`.
3. Não mexa em nada: o `vercel.json` já define framework, comando de build e a pasta
   de saída. Clique em **Deploy**.
4. Cada `git push` na `main` publica sozinho a partir daí.

O plano Hobby é gratuito e funciona também com repositório privado.

#### Ligando a sincronização (opcional)

A sincronização exige um armazenamento. Sem ele, `/api/plano` responde 503 e o
painel segue funcionando normalmente só com o armazenamento local.

1. No projeto da Vercel, vá em **Storage → Marketplace → Upstash for Redis**.
2. Crie o banco no plano gratuito e conecte-o a este projeto.
3. A integração injeta `KV_REST_API_URL` e `KV_REST_API_TOKEN` sozinha — não é
   preciso copiar nada à mão nem criar arquivo `.env`.
4. Faça um novo deploy para que a função enxergue as variáveis.

Nenhuma dessas credenciais entra no código: `api/plano.js` as lê de
`process.env`.

### GitHub Pages (alternativa, sem criar outra conta)

O workflow em `.github/workflows/deploy-pages.yml` já está pronto. Basta ativar:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

O site sai em `https://<seu-usuario>.github.io/NeoGold/`. O `vite.config.js` ajusta o
caminho base sozinho quando o build roda pelo workflow.

---

## Estrutura

```
api/
└── plano.js                 # função serverless: guarda o pacote cifrado
src/
├── main.jsx                 # ponto de entrada
├── index.css                # Tailwind + paleta NeoGold
├── App.jsx                  # composição do painel e todas as ações
├── lib/
│   ├── defaults.js          # estado inicial (sem dado real) e referência do plano
│   ├── format.js            # moeda, percentual e datas em pt-BR
│   ├── storage.js           # localStorage, backup, importação e normalização
│   ├── calculos.js          # todo o cálculo derivado do plano
│   ├── cripto.js            # PBKDF2 + AES-GCM da sincronização
│   └── sync.js              # ciclo de sincronização e resolução de conflito
└── components/
    ├── ui.jsx               # cartão, botão, campos, barra, selo, modal
    ├── Header.jsx           # cabeçalho e estado do armazenamento
    ├── ResumoGeral.jsx      # faixa de indicadores
    ├── DividasCard.jsx      # dívidas e renegociações
    ├── MetasCard.jsx        # planejador de metas
    ├── ReservaCard.jsx      # reserva de emergência
    ├── OrcamentoCard.jsx    # regra 50/30/20
    ├── AportesCard.jsx      # estratégia dos 20% e ciclo de compra
    ├── SyncTab.jsx          # aba de sincronização
    └── ConfigModal.jsx      # painel de configuração
```

Em `npm run dev` a rota `/api/plano` é atendida por um plugin do Vite com um Map
em memória (ver `vite.config.js`), para dar para exercitar a sincronização sem
depender da Vercel.

Stack: React 19, Vite 8 e Tailwind CSS 4.

---

## Aviso

Ferramenta de organização pessoal. Os ativos citados na interface são exemplos de
referência do plano que originou o projeto, **não recomendação de investimento**.
Decisões sobre onde aplicar dinheiro são suas.
