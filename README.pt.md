<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/dsh-site-log-check-hero-en-dark.webp">
  <img src="docs/assets/dsh-site-log-check-hero-en-light.webp" width="100%" alt="Banner do dsh-site-log-check: à esquerda, o nome, a proposta de valor e as 14 regras com cláusula citada; à direita, a faixa de dias do período de supervisão — dois registos empilhados em 2026-03-01, quatro dias vazios de 03-02 a 03-05, SL-001 marcado warn e SL-002 com quatro achados info; abaixo, o cartão real de ocorrência (dois registos com data 2026-03-01) e a lista skipped (12: 7 verificações que não podem correr por falta de material e 5 que correram sem diferenças); uma lista de diferenças vazia não significa que está tudo bem e a decisão fica com quem revê">
</picture>

# dsh-site-log-check

**Aponta cada dia sem registo, cada registo duplicado e cada parte sem fiscalização no local na data, na coluna e na cláusula exatas.**

Um verificador do DeepSeek Harness para engenheiros de fiscalização e diretores de obra: recebe uma exportação legível por máquina do arquivo de fiscalização de uma obra e 14 regras com a cláusula citada devolvem a lista de diferenças literais — sem juízo de conformidade, sem atribuição de responsabilidade e sem alterar o original.

[Instalar](#instalação-em-três-passos) · [Configuração](#configuração) · [FAQ](#faq) · [简体中文](README.md) · [English](README.en.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

[![License](https://img.shields.io/badge/license-Apache--2.0-3366CC?style=flat-square&labelColor=2B3245)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-%E2%89%A50.2.1%20%3C0.3.0-4B67B4?style=flat-square&labelColor=2B3245)](#compatibilidade)
[![npm](https://img.shields.io/npm/v/dsh-site-log-check?style=flat-square&labelColor=2B3245&color=CB3837)](https://www.npmjs.com/package/dsh-site-log-check)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-site-log-check/ci.yml?branch=main&label=CI&style=flat-square&labelColor=2B3245)](https://github.com/PerryLink/dsh-site-log-check/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-339933?style=flat-square&labelColor=2B3245)](#compatibilidade)

[![Stars](https://img.shields.io/github/stars/PerryLink/dsh-site-log-check?style=flat-square&labelColor=2B3245)](https://github.com/PerryLink/dsh-site-log-check/stargazers)
[![npm downloads](https://img.shields.io/npm/dm/dsh-site-log-check?style=flat-square&labelColor=2B3245&color=CB3837)](https://www.npmjs.com/package/dsh-site-log-check)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-site-log-check?metric=downloads)](https://dshfind.com/plugins/PerryLink/dsh-site-log-check?ref=badge)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/PerryLink/dsh-site-log-check/badge)](https://securityscorecards.dev/viewer/?uri=github.com/PerryLink/dsh-site-log-check)
[![DSH Market](https://img.shields.io/badge/DSH_Market-listed-4B67B4?style=flat-square&labelColor=2B3245)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-C71D23?style=flat-square&labelColor=2B3245&logo=gitee)](https://gitee.com/perrylink/dsh-site-log-check)

```sh
dsh plugin --profile <name> add dsh-site-log-check
```

</div>

<sub>Plugin da comunidade, sem relação com a DeepSeek. Repositório único: <https://github.com/PerryLink/dsh-site-log-check> (o Gitee é um espelho).</sub>

## O que é

O `dsh-site-log-check` lê o arquivo de fiscalização de uma obra — o período de serviço de fiscalização, os registos diários de fiscalização, a lista declarada de partes e processos-chave que exigem fiscalização no local e os próprios registos de fiscalização no local — e confronta-o com as cláusulas citadas pelo seu pacote de regras: se um mesmo dia de calendário tem mais de um registo ou um registo com data fora do período de serviço, que dias do período não têm registo, se cada registo preenche as suas colunas e indica quem o elaborou, se a lista declarada existe e cada parte declarada tem o seu registo de fiscalização no local, se o registo traz hora de início e de fim por ordem, a parte e o processo-chave, a empresa construtora, o que foi encontrado e as assinaturas, e se a fiscalização no local declarada num registo diário tem registo na mesma data. Tudo o que reporta são diferenças literais, cada uma com a cláusula de onde vem, para revisão por uma pessoa.

**Limite:** este plugin verifica a **continuidade do registo diário de fiscalização e a cobertura dos registos de fiscalização no local** de uma obra — o domínio da fiscalização de obras (工程监理). Não é o `dsh-archive-check` (que verifica se os registos do projeto estão completos para arquivo), não é o `dsh-hazplan-check` (que verifica as secções do plano de uma parte de obra perigosa) nem é um inspetor de segurança no local. Lê uma exportação legível por máquina dos registos do próprio gabinete de fiscalização e reporta divergências literais frente às cláusulas citadas.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/dsh-site-log-check-flow-v5-dark.svg">
  <img src="docs/assets/dsh-site-log-check-flow-v5-light.svg" width="100%" alt="Estrutura do dsh-site-log-check: três faixas de evidência (logs[], keyWorks[], onsite[]) empilhadas sobre uma única régua de dias do período de supervisão; a faixa logs[] desenha dois registos em 03-01 e quatro dias em falta de 03-02 a 03-05 atrás das portas SL-001 / SL-002 / SL-003…SL-007; keyWorks[] é a lista declarada e onsite[] a forma do registo, com SL-008 / SL-012 e SL-009 / SL-010 / SL-011 / SL-014; as pontes tracejadas entre faixas são SL-012 (nome declarado vs nome do registo) e SL-013 (declaração de supervisão no local do registo diário vs registo do mesmo dia); as faixas convergem em issues[] e skipped[], e uma execução do quickstart dá 1 warn + 4 info com 12 skipped — 7 que não puderam correr e 5 que correram sem diferenças">
</picture>

## Instalação em três passos

1. **Instalar** (escolha um canal):

   ```sh
   # canal npm (versões publicadas)
   dsh plugin --profile web add dsh-site-log-check
   # canal git (última main; a instalação corre o passo tsdown de package.json#prepare para produzir lib/)
   dsh plugin --profile web add github:PerryLink/dsh-site-log-check
   # canal tarball: após pnpm pack neste repositório
   dsh plugin --profile web add ./dsh-site-log-check-<version>.tgz
   ```

   Também pode ser encontrado como parte da «Coleção de verificação de documentos profissionais» no WorkBuddy / Coze — a coleção inclui este verificador, e a listagem depende de cada mercado.

2. **Configuração mínima** (os valores por omissão já servem):

   ```yaml
   - insert:
       - id: dsh-site-log-check
         name: dsh-site-log-check
   ```

   Todos os parâmetros ajustáveis ficam no esquema Schemastery de `src/config.ts`; os limites por regra estão em `rules/site-log-check.yaml`.

3. **Confirmar que ficou montado**:

   ```sh
   dsh --profile <name> --dump-config | grep 'dsh-site-log-check'
   ```

   Depois corra o exemplo incluído (cerca de um minuto; o script importa `lib/index.mjs`, por isso compile primeiro):

   ```sh
   pnpm install && pnpm run build
   node samples/quickstart/run.mjs
   ```

   ```text
   $ node samples/quickstart/run.mjs
   site_log_check: 5 issue(s) — error 0, warn 1, info 4
   skipped: 12
   ```

   A entrada do exemplo está em `samples/quickstart/input/SL-001-unsafe.yaml` e a saída esperada em `samples/quickstart/expected/result.json`; `node samples/quickstart/run.mjs --json` imprime o mesmo resumo em JSON.

**Desinstalar**: `dsh plugin --profile <name> remove dsh-site-log-check` (ou remova a linha do patch do perfil).

<details>
<summary>Instalar a partir do mercado do DSH Desktop</summary>

Todos os plugins da PerryLink podem ser vistos no mercado integrado do DSH Desktop: **Mercado → Fontes → Adicionar fonte → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua a exigir a verificação de identidade npm do mercado e a sua confirmação.

</details>

## Capacidades principais

O plugin registra a ferramenta `site_log_check`: lê um arquivo de fiscalização (JSON ou YAML), aplica um pacote de regras versionado e devolve um relatório estruturado; cada achado traz `found` / `expected` / `fix` e a cláusula de onde vem.

- **O pacote de regras é dado, não código** — as 14 regras estão em `rules/site-log-check.yaml`; substituir o ficheiro troca o conjunto de regras sem tocar em TypeScript, e o pacote é validado ao carregar em vez de ser presumido correto.
- **A gravidade segue a prova** — uma regra assente num princípio geral (`derived-from-principle`) fica limitada a `warn`; uma assente na configuração da sua instituição (`institutional-configuration`) fica limitada a `info`; nenhuma pode ser declarada `error` (há um teste que o garante).
- **Uma lista vazia nunca é «está tudo bem»** — cada verificação que não pôde correr declara-se em `skipped` com o id da regra e o motivo, e uma regra cuja lista exigida não está configurada declara-se em `skipped` em vez de passar em silêncio.
- **Sem juízo** — o relatório enumera diferenças e nunca se pronuncia sobre conformidade, responsabilidade ou correção; um guarda de redação bloqueia os termos que julgam e o relatório leva sempre o aviso.
- **Apenas citações literais** — cada regra traz documento, número, cláusula na numeração própria da fonte, trecho literal de pelo menos oito caracteres e o URL de onde foi lido; quando o texto não foi obtido o trecho di-lo e a regra é marcada `derived-from-principle`; nunca se apresenta uma paráfrase como citação.
- **Três formas de entrega** — cada execução devolve `markdown` (para o modelo ler), `reportJson` (legível por máquina) e `workbookBase64` (um xlsx com três folhas: resumo, lista de diferenças e verificações não executadas), para o resultado poder ser anexado ao processo.

```text
material de fiscalização (período · registos · lista de partes-chave · registos no local) ──site_log_check──▶ regras SL-001…SL-014 ──▶ relatório (achados + skipped)
        ▲                                                                                                              │
        └──────────────────────────── a entrada só é lida, o original nunca é alterado ────────────────────────────────┘
```

### As regras num relance

| Regra | Verifica | Gravidade | Base |
|---|---|---|---|
| `SL-001` | um registo por dia de calendário, dentro do período de serviço | warn | GB/T 50319-2013, cláusula 2.0.21 |
| `SL-002` | nenhum dia de calendário do período de serviço fica sem registo | info | GB/T 50319-2013, cláusula 2.0.21 · DBJT 13-144-2019 7.1.1 |
| `SL-003` | o registo anota o tempo e as condições do estaleiro | warn | GB/T 50319-2013, cláusula 7.2.2 ponto 1 |
| `SL-004` | o registo anota o progresso da obra do dia | warn | GB/T 50319-2013, cláusula 7.2.2 ponto 2 |
| `SL-005` | o registo anota o trabalho de fiscalização do dia | warn | GB/T 50319-2013, cláusula 7.2.2 ponto 3 |
| `SL-006` | o registo anota os problemas do dia **e como foram tratados** | warn | GB/T 50319-2013, cláusula 7.2.2 ponto 4 |
| `SL-007` | o registo nomeia quem o elaborou | warn | GB/T 50319-2013, cláusula 3.2.3 ponto 10 |
| `SL-008` | a obra tem uma lista declarada de partes e processos-chave que exigem fiscalização no local | warn | GB/T 50319-2013, cláusula 5.2.11 · Decreto do Conselho de Estado n.º 279, artigo 38 |
| `SL-009` | o registo no local traz hora de início e de fim, por ordem | warn | GB/T 50319-2013, tabela A.0.6 |
| `SL-010` | o registo no local indica o que foi encontrado e como foi tratado | warn | GB/T 50319-2013, tabela A.0.6 |
| `SL-011` | o registo no local está assinado, e não só por uma parte | warn | GB/T 50319-2013, tabela A.0.6 · 建市〔2002〕189号, artigo 7 |
| `SL-012` | toda a parte e processo-chave declarado tem pelo menos um registo no local | warn | 建市〔2002〕189号, artigos 2 e 9 |
| `SL-013` | a fiscalização no local declarada num registo coincide com o livro de registos no local | warn | GB/T 50319-2013, cláusula 7.2.2 ponto 3 |
| `SL-014` | o registo no local nomeia a parte ou processo-chave e a empresa construtora | warn | GB/T 50319-2013, tabela A.0.6 |

O pacote não tem nenhuma regra de nível `error`; o motivo está em «Normas que segue».

### Exemplos

Estas são as entradas reais do plugin; instale uma vez e chame uma.

**Saída detalhada** — ferramenta `site_log_check`, entrada:

```yaml
project:
  serviceStart: "2026-03-01"
  serviceEnd: "2026-03-05"
logs:
  - date: "2026-03-01"
  - date: "2026-03-05"
```

Saída:

```json
{
  "id": "dsh-site-log-check.SL-002.378ce636",
  "ruleId": "SL-002",
  "severity": "info",
  "locator": {
    "cell": "2026-03-02"
  },
  "found": "2026-03-02 无监理日志记录",
  "expected": "监理服务期 2026-03-01 ~ 2026-03-05 内应按日历日记录",
  "fix": "核对是否因停工、节假日或日志未归档；确无施工活动的应有说明"
}
```

*Observed from `dsh-site-log-check/tests/fixtures/SL-002/SL-002-unsafe.yaml`*

**Exemplo curto**: `site_log_check` · `only: ["SL-001"]` · `rulesFile: rules/site-log-check.yaml` (permite substituir o pacote de regras na chamada, para uma comparação pontual).

### O que ele responde

| Você pergunta | O que ele responde |
|---|---|
| Dois registos diários trazem a mesma data de calendário — isso é reportado? | Sim. `SL-001` aplica `params.maxPerDay` (1) e assinala cada dia de calendário com mais de um registo; assinala também o registo cuja data fica fora do período de serviço obtido de `project.serviceStart` e `project.serviceEnd`. Compara datas e contagens; não decide qual dos dois lançamentos é o do dia nem se um lançamento acrescentado depois se justificava. Se nenhuma data do material for legível, a regra reporta que não pôde ser executada em vez de passar em silêncio. |
| Faltam três dias de registo a meio do período de serviço. O que faz a verificação? | `SL-002` conta os dias de calendário entre `project.serviceStart` e `project.serviceEnd` sem registo. É a única regra `info` do pacote: a exigência de datas consecutivas consta da norma provincial de Fujian DBJT 13-144-2019, não da GB/T 50319-2013, por isso avisa e nunca bloqueia. Abaixo de `params.minCoverageRatio` (0.9) lista cada dia em falta como diferença; nesse valor ou acima reporta que não pôde ser executada e nomeia aí os dias em falta. Se a falha foi uma paragem, um feriado ou um registo não arquivado, decide uma pessoa. |
| O registo de um dia deixa vazia a coluna dos problemas. | `SL-006` assinala esse lançamento: todos os registos diários devem preencher a coluna dos problemas do dia e da forma como foram resolvidos. Verifica que a coluna está preenchida, não que o texto está certo, pelo que uma anotação a dizer que nada foi encontrado passa e uma célula vazia não. O pacote registra que as duas leituras disponíveis da cláusula 7.2.2 ponto 4 divergem na redação e que o documento oficial digitalizado não pôde ser relido, pelo que a regra se abstém de propósito de julgar a redação e olha apenas para o preenchimento da coluna. |
| Nada no material declara que partes e processos-chave exigem fiscalização no local. Passa em silêncio? | Não. Quando o material mostra que houve fiscalização no local — existe um registo no local, ou a coluna do trabalho de fiscalização de algum registo menciona a fiscalização no local —, `SL-008` reporta a falta da lista declarada. Quando nada aponta para fiscalização no local, a regra reporta que não pôde ser executada com esse motivo, em vez de inventar uma exigência que a obra pode não ter. O pacote nota que o texto da GB/T 50319-2013 não enumera essas partes e processos, e que a lista vem do artigo 2 do 建市〔2002〕189号. |
| O nosso registo no local só tem a assinatura do engenheiro de fiscalização. Isso é reportado? | Sim. Com `params.requireContractorSignature` ligado, `SL-011` assinala tanto a falta de assinatura do responsável pela fiscalização no local como a do inspetor de qualidade no local da empresa construtora. O pacote separa de propósito as duas bases: a tabela A.0.6 tem apenas a caixa de assinatura do responsável pela fiscalização no local, e a segunda assinatura vem do artigo 7 do 建市〔2002〕189号, pelo que não deve ser atribuída à GB/T 50319-2013. A regra verifica que as assinaturas estão registadas, não que sejam autênticas. |
| Um registo diz que houve fiscalização no local a 12 de maio, mas o livro de registos não tem nada nesse dia. | `SL-013` assinala-o: coteja as datas dos registos cuja coluna de fiscalização menciona a fiscalização no local com as datas de início dos registos no local. Verifica apenas que ambos coincidem; o pacote afirma que nem a GB/T 50319-2013 nem o 建市〔2002〕189号 exigem que os dois documentos se liguem por número. Se nenhum registo no local tiver hora de início, ou nenhum registo declarar fiscalização no local, a regra reporta que não pôde ser executada em vez de passar em silêncio. |

## Configuração

Todos os parâmetros ajustáveis ficam no esquema Schemastery de `src/config.ts`, portanto mudam pelo `cordis.yml` sem editar código; os limites por regra ficam no pacote de regras sob `rules/`. As cinco chaves abaixo são a lista completa; os parâmetros por regra vêm depois.

| Chave | Tipo | Padrão | Descrição |
|---|---|---|---|
| `rulesFile` | string | `rules/site-log-check.yaml` | Caminho do pacote de regras, relativo à raiz do pacote |
| `disabledRules` | string[] | `[]` | Ids de regras a desativar; cada uma aparece em `skipped` |
| `onlyRules` | string[] | `[]` | Executar apenas estas regras; vazio executa todas |
| `skipNotes` | string | `""` | Nota acrescentada a cada motivo de `skipped`, p. ex. as normas de aplicação da sua instituição |
| `timeoutMs` | number | `120000` | Orçamento cooperativo de tempo limite da ferramenta |

Parâmetros por regra que vale a pena conhecer:

- `SL-001` `maxPerDay` — quantos registos admite um mesmo dia de calendário; por omissão `1`.
- `SL-002` `minCoverageRatio` (por omissão `0.9`) e `ignoreWeekends` (por omissão `false`) — quando a cobertura atinge o rácio, a regra reporta através de `skipped` e enumera aí os dias em falta em vez de uma diferença por dia.
- `SL-009` `requireEndTime` (por omissão `true`) — ponha `false` para deixar de exigir a hora de fim.
- `SL-011` `requireContractorSignature` (por omissão `true`) — ponha `false` se o seu contrato não aplica a assinatura das duas partes.
- `SL-012` `keyWorks` — o catálogo de partes e processos-chave, por omissão literal do artigo 2 do 建市〔2002〕189号; esse artigo cobre apenas a **edificação de habitação**, e outras disciplinas remetem-se a ele pelo artigo 12 da mesma norma, pelo que deve substituir a lista.

Exemplo de substituição no patch do perfil:

```yaml
- insert:
    - id: dsh-site-log-check
      name: dsh-site-log-check
      config:
        onlyRules: [SL-001, SL-002]
        skipNotes: normas de aplicação desta instituição, edição 2026
```

## FAQ

<details>
<summary>O meu material é alterado ou enviado para algum lado?</summary>

Não. A ferramenta só lê o JSON/YAML que lhe entrega (`file` ou `material`) e **nunca altera o original**; o plugin é ESM puro, sem código nativo, **sem rede e sem chamada ao modelo** (ver «Compatibilidade»), e o `package.json#dsh.demo` declara `network: false` com `writes: []`. O xlsx do relatório é um campo `workbookBase64`: é você que decide guardá-lo, e o plugin não escreve nada no disco.

</details>

<details>
<summary>Uma lista de diferenças vazia pode ser lida como «não há nada de errado»?</summary>

Não. Uma lista vazia significa apenas que as regras que **correram** não encontraram diferenças; uma regra que não pôde correr declara o seu id e o motivo em `skipped`. O exemplo incluído demonstra-o: dois registos, sem lista de partes-chave e sem registos no local produzem 1 achado `warn` e 4 `info`, além de 12 verificações omitidas. O relatório leva sempre o aviso de que não constitui um juízo sobre qualquer facto, ato ou documento.

</details>

<details>
<summary>Entra em conflito com outros plugins por nomes de ferramenta, comandos ou rotas?</summary>

Não. Registra uma única ferramenta com espaço de nomes próprio, `site_log_check`, e o seu `inject` declara apenas `tools`; não fornece nenhuma chave de serviço, não registra slot de cliente nem rota `webServer`, e o patch de bundle apenas faz `insert` da sua própria linha sem sobrescrever o `config` de uma linha integrada. O registro é um efeito Cordis, por isso descarregar ou recarregar a quente remove-o.

</details>

<details>
<summary>Aguenta um lote de obras?</summary>

Sim. O núcleo de verificação é uma função pura: leitura de um ficheiro e comparações de cadeias com 14 regras, sem pedidos de rede nem chamadas ao modelo; `timeoutMs` é o orçamento cooperativo (120000 ms por omissão). A ferramenta funciona em modo `native` e `ptc`; para um diretório completo convém `ptc`, assim o custo do esquema paga-se uma vez.

</details>

<details>
<summary>A nossa norma local ou o regulamento interno é mais exigente — pode entrar?</summary>

Pode, e sem tocar em código: aponte `rulesFile` para o seu próprio YAML. O tipo de base fixa o teto de gravidade — o raciocínio por princípio geral (`derived-from-principle`) em `warn`, os limites institucionais (`institutional-configuration`) em `info` —, pelo que o pacote nunca produz `error`, e o trecho deve continuar a ser uma citação literal de pelo menos oito caracteres.

</details>

## Normas que segue

| Documento | Número | Regras que o citam |
|---|---|---|
| 《建设工程监理规范》 (código de prática da fiscalização de obras) | GB/T 50319-2013 | SL-001, SL-002, SL-003, SL-004, SL-005, SL-006, SL-007, SL-008, SL-009, SL-010, SL-011, SL-013, SL-014 |
| 福建省《建设工程监理文件资料管理标准》 (norma provincial de Fujian sobre documentos de fiscalização) | DBJT 13-144-2019 | SL-002 |
| 《建设工程质量管理条例》 (regulamento da qualidade das obras) | 国务院令第279号 (Decreto do Conselho de Estado n.º 279) | SL-008 |
| 《房屋建筑工程施工旁站监理管理办法（试行）》 (norma da fiscalização no local de partes-chave) | 建市〔2002〕189号 | SL-011, SL-012 |

> ### ⚠️ Aqui nada é `error`, porque a norma é *recomendada*
>
> **A GB/T 50319-2013 é uma norma nacional recomendada** — o Aviso n.º 35 do Ministério da
> Habitação e Desenvolvimento Urbano-Rural aprova-a como «norma nacional, **numerada GB/T
> 50319-2013**», e o seu prefácio **não declara obrigatório nenhum capítulo**. Compare com a
> **GB 26860—2011**, cujo prefácio diz expressamente que «o capítulo 5 e o 7.3.4 são
> recomendatórios e **o resto obrigatório**». O «deve» destas cláusulas é convenção de redação de
> normas de engenharia, **não obrigação legal**, pelo que toda regra fica limitada a `warn` e
> **este plugin não bloqueia nada**.
>
> Isso não significa que os requisitos não importem: **o registo diário de fiscalização e a
> fiscalização no local são deveres legais nos termos do regulamento da qualidade das obras**. Mas
> a norma que contém as *cláusulas concretas aqui verificadas* é recomendatória, por isso o plugin
> avisa em vez de bloquear.

## Formato do material

A ferramenta aceita JSON ou YAML. Na camada de leitura os campos são opcionais e são validados pelo motor de verificação, pelo que uma exportação parcial produz achados sobre o que falta em vez de uma falha.

```yaml
target: 某住宅楼工程 监理日志与旁站记录
project:
  name: 某住宅楼工程
  serviceStart: "2026-03-01"
  serviceEnd: "2026-03-05"
logs:
  - date: "2026-03-01"
    weather: 晴，具备施工条件
    progress: 三层顶板钢筋绑扎完成 80%
    supervision: 巡视 2 次；旁站混凝土浇筑 1 次
    issues: 个别箍筋间距偏大，已要求班组整改并复查
    recorder: 张监理
keyWorks:
  - name: 土方回填
    contractor: 某基础工程公司
onsite:
  - id: PZ-0001
    keyWork: 混凝土浇筑
    contractor: 某建筑公司
    startedAt: "2026-03-04 08:00"
    endedAt: "2026-03-04 12:30"
    issues: 未发现问题；坍落度经检测符合要求
    supervisorSignature: 张监理
    contractorSignature: 李质检
```

- `project.serviceStart` / `project.serviceEnd` fixam o período de serviço medido por `SL-001`, `SL-002` e `SL-013`.
- `logs[]` traz `weather` / `progress` / `supervision` / `issues` / `recorder`, verificados por `SL-003` a `SL-007`.
- `keyWorks[]` é a lista declarada: `SL-008` verifica que exista e `SL-012` que cada elemento tenha um registo no local.
- `onsite[]` traz `startedAt` / `endedAt` para `SL-009`, `issues` para `SL-010`, ambas as assinaturas para `SL-011` e `keyWork` / `contractor` para `SL-014`.

## Fontes das regras

Os dados das regras ficam em `rules/site-log-check.yaml`, separados do código. Cada regra traz documento, número, cláusula na numeração própria da fonte, trecho literal e o URL de onde foi lido. O carregador impõe que o trecho seja uma citação real de pelo menos oito caracteres e que uma verificação assente apenas num princípio geral (`kind: derived-from-principle`, teto `warn`) ou na configuração da instituição (`kind: institutional-configuration`, teto `info`) **nunca** possa ser declarada `error`. Um pacote que exagere a sua base falha ao carregar em vez de produzir um relatório com aparência segura.

Os números de cláusula foram cotejados com o texto completo da GB/T 50319-2013 e do 建市〔2002〕189号. Três conclusões deram forma ao pacote e ficam registadas aqui para que quem revê veja o que **deliberadamente não** foi afirmado:

1. **A «continuidade diária» não tem cláusula nacional.** A GB/T 50319-2013 diz apenas «diário» na definição do registo de fiscalização (cláusula 2.0.21). As palavras «as datas devem ser consecutivas» vêm da norma provincial de Fujian DBJT 13-144-2019, uma norma *local*, e é por isso que `SL-002` fica limitada a `info`.
2. **A assinatura das duas partes não é um requisito da 50319.** A tabela A.0.6 tem uma única caixa de assinatura, a do responsável pela fiscalização no local. A exigência de que o inspetor de qualidade da empresa construtora também assine vem do artigo 7 do 建市〔2002〕189号, e `SL-011` cita os dois documentos em separado em vez de os fundir.
3. **A assinatura diária e o visto do diretor são requisitos locais.** Vêm da norma de Shandong DB37/T 5009, não da norma nacional, pelo que o pacote só verifica que se nomeie quem elaborou (`SL-007`) e não inventa uma obrigação de assinatura.

O catálogo de partes-chave de `SL-012` também foi cotejado carácter a carácter com o artigo 2 do 建市〔2002〕189号. O registo completo de verificação de cláusulas, incluindo as fontes verificadas e rejeitadas, está em `rules/evidence/`.

## Limitações conhecidas

- **Apenas itens literais e decidíveis por máquina.** Não decide se um lançamento tardio se justificava, se uma falha foi uma paragem, um feriado ou um registo não arquivado, se uma assinatura é autêntica ou se o texto de uma coluna está certo: isso fica para uma pessoa.
- **Nenhuma regra de nível `error`.** A norma que contém as cláusulas concretas aqui verificadas, a GB/T 50319-2013, é uma norma nacional recomendada, pelo que as 14 regras ficam em `warn` ou `info`; o dever está no artigo 38 do regulamento da qualidade das obras e a prática numa norma recomendatória.
- **O limite de continuidade é uma configuração institucional.** `SL-002` e o seu `minCoverageRatio` (por omissão `0.9`) só passam os dias em falta para `skipped` quando a cobertura atinge o rácio, em vez de enumerar cada dia; `ignoreWeekends` vale `false` por omissão, pelo que os fins de semana também contam.
- **O catálogo de `SL-012` cobre apenas a edificação de habitação.** É literal do artigo 2 do 建市〔2002〕189号; outras disciplinas remetem-se a essa norma pelo artigo 12 e devem substituir `keyWorks`.
- **Coexistem duas leituras da cláusula 7.2.2 ponto 4.** As duas fontes disponíveis redigem-na de forma diferente e o documento oficial digitalizado não pôde ser relido nesta ronda, pelo que `SL-006` só verifica que a coluna está preenchida e não se pronuncia sobre a redação: é um limite da verificação, não uma afirmação de que uma leitura esteja errada.
- **A assinatura diária e o visto do diretor não estão na norma nacional.** Vêm da norma de Shandong DB37/T 5009; o plugin só verifica que se nomeie um responsável pela elaboração e não inventa uma obrigação de assinatura.
- **As datas são aritmética de cadeia em hora local.** Todos os cálculos são feitos em hora local sobre as cadeias de entrada, sem conversão de fusos horários.

## Compatibilidade

| Superfície | Estado |
|---|---|
| Harness | Faixa de peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.2.0-0 <0.3.0` — verificada para aceitar tanto `0.2.0-rc.2` quanto `0.2.1-rc.2`. `engines.dsh` é declarado como `>=0.2.1-0 <0.3.0` e o host aplica-o desde 0.2.1 |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (ESM puro; sem código nativo, sem rede, sem chamada ao modelo) |
| Modo de ferramenta | Funciona em `native` e `ptc`; para um lote de verificações use `ptc`, assim o custo do esquema paga-se uma vez |

## Resolução de problemas

- **O plugin instala mas a ferramenta não aparece.** Confirme que `main` resolve para `lib/index.mjs` e que `pnpm run build` o gerou; um `main` errado faz o carregador ignorar a entrada em silêncio.
- **`dsh plugin add` recusa o pacote por incompatibilidade.** A faixa de peers cobre `0.1.x` e `0.2.x`; se o seu ambiente estiver fora, conceda isenção explícita: `dsh plugin --profile <name> allow-version dsh-site-log-check@0.1.0 --dsh-version <runtime> --accept-risk`.
- **`SL-002` não reporta nada.** A cobertura continua acima de `minCoverageRatio`, pelo que os dias em falta são nomeados no `skipped` dessa regra; baixe o rácio se quiser cada falha como diferença.
- **Uma regra não executou.** Leia a lista de «verificações não executadas» no fim do relatório: indica o id da regra e o motivo (desativada, lista não configurada, entrada inutilizável).
- **`check` informa `manifest-peers` como falha.** O verificador estático compara com uma faixa de peers fixa anterior à linha 0.2; o runtime aplica a compatibilidade na instalação, pelo que a faixa declarada é a correta. É um problema conhecido do `dsh-plugin-dev`.
- **Um achado diz que o texto da cláusula não foi obtido.** O pacote nunca inventa texto de cláusulas: se o texto literal não estiver disponível, a regra fica em `warn` / `info` e di-lo no seu `excerpt`. Trate isso como uma lacuna de verificação, não como prova de que o documento está bem.
- **Os horários parecem deslocados.** Todos os cálculos são em hora local sobre as cadeias de entrada, sem conversão de fusos horários.

## Ecossistema e qualidade

- [Espelho no Gitee](https://gitee.com/perrylink/dsh-site-log-check) (espelho sincronizado; o GitHub é a referência)
- [Página do plugin no dshfind](https://dshfind.com/plugins/PerryLink/dsh-site-log-check) (instalações e classificação)
- [Relatório OpenSSF Scorecard](https://securityscorecards.dev/viewer/?uri=github.com/PerryLink/dsh-site-log-check) (alimentado por [.github/workflows/scorecard.yml](.github/workflows/scorecard.yml))
- [DSH Market](https://dsh.market/) (publicado)
- [Base de conhecimento do ecossistema — escolher um verificador por material](https://perrylink.github.io/zh/checkers/choose/) (índice completo da família: 62 verificadores + plugins gerais)

## Desenvolvimento

```sh
pnpm install
pnpm run typecheck        # tsc --noEmit
pnpm test                 # vitest, fixtures emparelhados por regra (tests/fixtures/<RULE>/)
pnpm run build            # tsdown -> lib/index.mjs + lib/index.d.mts
pnpm run verify:self-contained   # as dependências resolvem a partir do registro
pnpm run check:lockfile   # pnpm-lock sem deriva
pnpm run check:readmes    # coerência dos README em cinco idiomas
pnpm run check:citations  # cada excerpt (incluindo alsoBasis) é citação literal
pnpm pack                 # o tarball publicado
node ../scripts/sync-shared.mjs dsh-site-log-check   # atualizar src/shared a partir de ../_shared
```

Estrutura:

| Caminho | Papel |
|---|---|
| `src/index.ts` | contrato de plugin de função (`name` / `inject` / `Config` / `apply`); registra a ferramenta `site_log_check` |
| `src/config.ts` | esquema Schemastery; todos os parâmetros vivem aqui, sem limites codificados |
| `src/check.ts` | núcleo puro de verificação `(input, ruleset, options) => Report`: sem contexto de plugin, sem E/S, sem relógio |
| `src/parse.ts` | leitor do material canónico (JSON ou YAML) |
| `src/view.ts` | projeção do relatório para o modelo; `output.schema` reflete-a |
| `src/shared/` | kit partilhado (carga do pacote de regras, forma do relatório, subconjunto YAML, aritmética de calendário, guarda de redação); copiado para o pacote ficar autocontido |
| `rules/site-log-check.yaml` | o pacote de regras, 14 regras |
| `rules/evidence/` | registo de verificação de cláusulas de cada citação |
| `tests/` | vitest; cada regra tem o seu par de fixtures conforme/infrator em `tests/fixtures/<RULE>/` |
| `samples/quickstart/` | exemplo rápido reexecutável (entrada e saída esperada) |

O pacote de regras é dado, não código: edite `rules/*.yaml` para trocar o conjunto de regras sem tocar em TypeScript; o pacote é validado ao carregar, não é presumido correto. As imagens do README são geradas programaticamente por [`scripts/gen-readme-assets.py`](scripts/gen-readme-assets.py) (Python + Pillow): o hero é um WebP de 1440×576 em quatro variantes (zh/en × claro/escuro), o diagrama de estrutura é um SVG desenhado à mão (par claro + escuro) e ambos podem ser reexecutados sem risco; este plugin não tem interface, pelo que as figuras desenham apenas as superfícies do material, as portas das regras e os canais do relatório.

Topics: `dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `site`, `log`

## Família e agradecimentos

Este projeto faz parte da família de plugins do DeepSeek Harness mantida pela [PerryLink](https://github.com/PerryLink) (todos Apache-2.0). Se este plugin lhe for útil, **uma estrela** não desbloqueia nada mas facilita que a próxima pessoa o encontre.

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: a ferramenta `site_log_check`, o pacote de regras com citações literais e o seu registo de verificação de cláusulas (`rules/evidence/`), e a documentação em cinco idiomas.

<details>
<summary>Expandir todos os plugins</summary>

| Plugin | Estado |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** |  |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** |  |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** |  |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | 🚫 APOSENTADO (repo arquivado) |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | 🚫 APOSENTADO (repo arquivado) |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | 🚫 APOSENTADO (repo arquivado) |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** |  |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** |  |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | 🚫 APOSENTADO (repo arquivado) |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 CONGELADO — ver o README do repo |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 APOSENTADO (repo arquivado) |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 APOSENTADO (repo arquivado) |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 APOSENTADO (repo arquivado) |

</details>

## Licença

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-site-log-check contributors

<p align="center"><sub>Apache-2.0 · plugin da comunidade, sem relação com a DeepSeek.</sub></p>
