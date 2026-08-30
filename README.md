# NeoGold

Painel pessoal de **plano financeiro e controle de dívidas**. Roda inteiro no navegador:
sem backend, sem login, sem banco de dados e sem nenhuma requisição de rede.

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

Não há Google Fonts, CDN, analytics ou qualquer chamada externa: a página carrega
apenas os arquivos servidos por ela mesma.

---

## O que o painel faz

| Bloco | Para quê |
| --- | --- |
| **Resumo do topo** | Dívida em aberto, economia negociada, patrimônio guardado e aporte mensal |
| **Dívidas e renegociações** | Valor original × proposta à vista, economia e % de desconto, prazo da proposta com alerta de vencimento e botão **Marcar como quitada** |
| **Planejador de metas** | Objetivo, meta em dinheiro, aporte mensal, barra de progresso e data prevista de conclusão |
| **Reserva de emergência** | Meta de 6 a 12 meses do custo de vida, progresso e previsão |
| **Orçamento 50/30/20** | Divisão da renda entre essenciais, lazer e investimentos |
| **Estratégia dos 20%** | Split reserva × renda variável, os três pilares e o ciclo mensal de compra |
| **Configuração** | Edita qualquer valor, adiciona dívidas e metas, exporta/importa backup, apaga tudo |

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

### GitHub Pages (alternativa, sem criar outra conta)

O workflow em `.github/workflows/deploy-pages.yml` já está pronto. Basta ativar:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

O site sai em `https://<seu-usuario>.github.io/NeoGold/`. O `vite.config.js` ajusta o
caminho base sozinho quando o build roda pelo workflow.

---

## Estrutura

```
src/
├── main.jsx                 # ponto de entrada
├── index.css                # Tailwind + paleta NeoGold
├── App.jsx                  # composição do painel e todas as ações
├── lib/
│   ├── defaults.js          # estado inicial (sem dado real) e referência do plano
│   ├── format.js            # moeda, percentual e datas em pt-BR
│   ├── storage.js           # localStorage, backup, importação e normalização
│   └── calculos.js          # todo o cálculo derivado do plano
└── components/
    ├── ui.jsx               # cartão, botão, campos, barra, selo, modal
    ├── Header.jsx           # cabeçalho e indicador de "salvo localmente"
    ├── ResumoTopo.jsx       # faixa de indicadores
    ├── DividasCard.jsx      # dívidas e renegociações
    ├── MetasCard.jsx        # planejador de metas
    ├── ReservaCard.jsx      # reserva de emergência
    ├── OrcamentoCard.jsx    # regra 50/30/20
    ├── AportesCard.jsx      # estratégia dos 20% e ciclo de compra
    └── ConfigModal.jsx      # painel de configuração
```

Stack: React 19, Vite 8 e Tailwind CSS 4.

---

## Aviso

Ferramenta de organização pessoal. Os ativos citados na interface são exemplos de
referência do plano que originou o projeto, **não recomendação de investimento**.
Decisões sobre onde aplicar dinheiro são suas.
