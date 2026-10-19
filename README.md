# dsh-site-log-check — Construction supervision log continuity and on-site supervision record coverage check

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-site-log-check
```


[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)

`dsh-site-log-check` reads one construction project's supervision archive — the supervision service period, the daily supervision logs, the declared list of key works requiring on-site supervision, and the on-site supervision records — and checks that archive against the clauses its rule pack cites: whether one calendar day carries more than one log or a log dated outside the service period, which days of the period have no log, whether each log fills its content items and names a recorder, whether the declared key-work list exists and every declared key work has an on-site record, whether an on-site record carries start and end times in order, its key work, its contractor, what was found and the signatures, and whether on-site supervision claimed in a log is matched by an on-site record on the same date. Every difference it reports is literal and carries the clause it came from, and the report lists those differences for a human to review.

## Install

```sh
dsh plugin --profile <name> add dsh-site-log-check
dsh --profile <name> --dump-config | grep 'dsh-site-log-check'
```

## What it looks like

![Workflow diagram for dsh-site-log-check: document → rule pack → findings.](docs/assets/dsh-site-log-check-flow.svg)

*Workflow overview: document → rule pack → findings. The examples below use the real command surface.*



## What it answers

### Examples

The table below is the example set: the first row is the detailed walkthrough, the remaining rows are short cases.

| You ask | What it answers |
|---|---|
| Two log entries carry the same calendar date — is that reported? | Yes. `SL-001` applies `params.maxPerDay` (1) and reports every calendar day that carries more than one log; it also reports a log whose date falls outside the service period taken from `project.serviceStart` and `project.serviceEnd`. It compares dates and counts; it does not decide which of the two entries is that day's record, nor whether an entry added later was justified. If no log date in the material can be read, the rule reports itself in `skipped` instead of passing. |
| Three days in the middle of the service period have no log. What does the check do? | `SL-002` counts the calendar days between `project.serviceStart` and `project.serviceEnd` that have no log. It is the pack's only `info` rule: the requirement that dates run consecutively comes from the Fujian standard DBJT 13-144-2019, not from GB/T 50319-2013, so it flags and never blocks. Below `params.minCoverageRatio` (0.9) it lists each missing day as a finding; at or above that ratio it reports itself in `skipped` and names the missing days there. Whether a gap was a stoppage, a holiday or a log that was never archived is left to a human. |
| A day's log leaves the problems column empty. | `SL-006` reports that entry: every log must fill the column for the day's problems and how they were handled. It checks that the column is filled, not that the text is right, so an entry saying that nothing was found passes while a blank one does not. The pack records that the two available readings of 第7.2.2条第4款 differ in wording and that the official scan could not be re-read, so the rule deliberately stays silent on the wording and looks only at whether the column is filled. |
| Nothing in the material declares which key works require on-site supervision. Does that pass silently? | No. When the material shows on-site supervision was in play — an on-site record exists, or a log's supervision column mentions 旁站 — `SL-008` reports the missing declared list. When nothing points to on-site supervision at all, the rule reports itself in `skipped` with that reason instead of inventing a requirement the project may not be subject to. The pack notes that the text of GB/T 50319-2013 does not itself list the key works and that the list comes from 建市〔2002〕189号第二条. |
| Our on-site record is signed only by the supervision engineer. Is that reported? | Yes. With `params.requireContractorSignature` on, `SL-011` reports both a missing 旁站监理人员 signature and a missing 施工企业现场质检人员 signature. The pack keeps the two bases apart on purpose: 表 A.0.6 carries only the 旁站监理人员（签字） column, and the second signature comes from 建市〔2002〕189号第七条, so it must not be attributed to GB/T 50319-2013. The rule checks that the signatures are recorded; it does not check that they are genuine. |
| A log says on-site supervision happened on 12 May, but the ledger has no record for that date. | `SL-013` reports it: it matches the dates of logs whose supervision column mentions 旁站 against the dates on which the on-site records start. It checks only that the two line up; the pack states that neither GB/T 50319-2013 nor 建市〔2002〕189号 requires the two documents to cross-reference each other's serial numbers. If no on-site record carries a start time, or no log claims on-site supervision, the rule reports itself in `skipped` instead of passing. |

## Standards it follows

| Document | Number | Cited by rules |
|---|---|---|
| 《建设工程监理规范》 | GB/T 50319-2013 | SL-001, SL-002, SL-003, SL-004, SL-005, SL-006, SL-007, SL-008, SL-009, SL-010, SL-011, SL-013, SL-014 |
| 福建省《建设工程监理文件资料管理标准》 | DBJT 13-144-2019 | SL-002 |
| 《建设工程质量管理条例》 | 国务院令第279号 | SL-008 |
| 《房屋建筑工程施工旁站监理管理办法（试行）》 | 建市〔2002〕189号 | SL-011, SL-012 |

**Boundary:** this plugin checks the **continuity of the daily supervision log and the coverage of
on-site supervision records** for a construction project — the site-supervision domain (工程监理).
It is not `dsh-archive-check` (which checks whether project records are complete for archiving), not
`dsh-hazplan-check` (which checks the sections of a plan for a hazardous sub-project), and not a
site-safety inspector. It reads a machine-readable export of the supervision office's own records and
reports literal mismatches against cited clauses.

## Compatibility

| Surface | Status |
|---|---|
| Harness | Peer range `>=0.1.2-rc.1 <0.2.0 \|\| >=0.2.0-0 <0.3.0` — verified to accept both `0.2.0-rc.2` and `0.2.1-rc.2`. `engines.dsh` is declared as `>=0.2.1-0 <0.3.0` and is enforced by the host since 0.2.1 |
| Node | `^22.19.0 || >=24.0.0` |
| Platforms | All (plain ESM; no native code, no network, no model call) |
| Tool mode | Works in `native` and `ptc`; for a folder of projects use `ptc` |

## What it does

Registers the `site_log_check` tool. It reads one project's supervision archive — the service period,
the daily logs, the declared list of key works, and the on-site supervision records — applies a
versioned rule pack, and returns a report whose every finding names the clause it came from.

> ### ⚠️ Nothing here is `error`, because the standard is *recommended*
>
> **GB/T 50319-2013 is a recommended national standard** — 住建部公告第 35 号 approves it as 「国家标准，
> **编号为 GB/T 50319-2013**」, and its foreword **declares no chapter mandatory**. Contrast
> **GB 26860—2011**, whose foreword states outright that 「第5章和7.3.4为推荐性，**其余为强制性**」. The 应
> wording inside these clauses is engineering drafting convention, **not legal compulsion**, so every
> rule is capped at `warn` and **this plugin blocks nothing**.
>
> That is not a claim that the requirements are unimportant: **the supervision log and on-site
> supervision are statutory duties under 《建设工程质量管理条例》**. But the standard carrying the
> *specific clauses checked here* is recommendatory, so the plugin flags rather than blocks.

| Rule | Check | Severity |
|---|---|---|
| `SL-001` | one log per calendar day, inside the service period | warn |
| `SL-002` | no calendar day in the service period lacks a log | info |
| `SL-003` | the log records weather and site conditions | warn |
| `SL-004` | the log records the day's construction progress | warn |
| `SL-005` | the log records the day's supervision work | warn |
| `SL-006` | the log records the day's problems **and how they were handled** | warn |
| `SL-007` | the log names the person who compiled it | warn |
| `SL-008` | the project has a declared list of key works requiring on-site supervision | warn |
| `SL-009` | an on-site record carries start and end times, in order | warn |
| `SL-010` | an on-site record states what was found and how it was handled | warn |
| `SL-011` | an on-site record is signed, by the supervisor and the contractor | warn |
| `SL-012` | every declared key work has at least one on-site record | warn |
| `SL-013` | on-site supervision claimed in a log matches the on-site record ledger | warn |
| `SL-014` | an on-site record names the key work and the contractor | warn |

## Configuration

Every tunable lives in the Schemastery schema in `src/config.ts`, so it can be changed from
`cordis.yml` without editing code. The per-rule thresholds live in `rules/site-log-check.yaml`.

| Key | Type | Default | Description |
|---|---|---|---|
| `rulesFile` | string | `rules/site-log-check.yaml` | Rule-pack path, relative to the package root |
| `disabledRules` | string[] | `[]` | Rule ids to stop running; each appears in `skipped` |
| `onlyRules` | string[] | `[]` | Run only these rule ids; empty runs every rule |
| `skipNotes` | string | `""` | Note appended to every `skipped` reason |
| `timeoutMs` | number | `120000` | Cooperative tool timeout budget |

Rule-level parameters worth knowing:

- `SL-002` `minCoverageRatio` (default `0.9`) and `ignoreWeekends` — a project whose coverage stays
  above the ratio is reported through `skipped` with the missing dates listed, instead of one finding
  per missing day.
- `SL-011` `requireContractorSignature` (default `true`) — set to `false` if your contract does not
  apply the two-party signature rule.
- `SL-012` `keyWorks` — the catalogue of key works. It defaults to the list verbatim from
  建市〔2002〕189号 第二条, but the article only covers **housing construction**; other disciplines
  refer to it under that办法's 第十二条 and should replace the list.

## Material format

The tool accepts JSON or YAML. Fields are optional at the reader level and validated by the check
engine, so a partial export produces findings about the missing parts instead of a crash.

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

## Rule sources

Rule data lives in `rules/site-log-check.yaml`. Every rule carries a document, a document number, a
clause in the source's own numbering, a verbatim excerpt and the URL the excerpt was read from. The
loader enforces that an excerpt is a real quotation of at least eight characters, and that a check
whose basis is only a general principle (`kind: derived-from-principle`, capped at `warn`) or a local
policy (`kind: institutional-configuration`, capped at `info`) may never be declared `error`.

The clause numbers were checked against the full text of 《建设工程监理规范》GB/T 50319-2013 and
《房屋建筑工程施工旁站监理管理办法（试行）》建市〔2002〕189号. Three findings shaped the pack, and
are recorded here so a reviewer can see what was deliberately **not** claimed:

1. **"Daily continuity" has no national clause.** GB/T 50319-2013 says only 每日 in its definition of
   监理日志 (第2.0.21条). The words "dates shall be continuous" come from 福建省 DBJT 13-144-2019, a
   *local* standard, which is why `SL-002` is capped at `info`.
2. **Two-party signatures are not a 50319 requirement.** 表 A.0.6 has a single signature line,
   旁站监理人员（签字）. The requirement that the contractor's quality inspector also signs comes from
   建市〔2002〕189号 第七条, and `SL-011` cites both documents separately rather than merging them.
3. **A daily signature and the chief supervisor's review are local requirements.** They come from
   山东省 DB37/T 5009, not from the national standard, so the pack checks only that a compiler is named
   (`SL-007`) and does not invent a signing obligation.

The key-work catalogue in `SL-012` was also checked character by character against 建市〔2002〕189号
第二条.

## Troubleshooting

- **The plugin installs but the tool never appears.** Check that `main` resolves to `lib/index.mjs`
  and that `pnpm run build` produced it; a wrong `main` makes the loader skip the entry silently.
- **`dsh plugin add` refuses the package as incompatible.** The peer range covers `0.1.x` and `0.2.x`;
  if your runtime sits outside it, grant an explicit exemption:
  `dsh plugin --profile <name> allow-version dsh-site-log-check@0.1.0 --dsh-version <runtime> --accept-risk`
- **The coverage check reports nothing on a project with gaps.** `SL-002` reports through `skipped`
  while the coverage ratio stays at or above `minCoverageRatio`, listing the missing dates there. Lower
  the ratio, or read the `skipped` entry, if you want each gap as a separate finding.
- **`check` reports `manifest-peers` as failed.** The static checker compares against a hard-coded peer
  range that predates the 0.2 line. The runtime enforces peer compatibility at install time, so the
  declared range is the correct one; this is a known upstream issue in `dsh-plugin-dev`.
- **Dates look shifted.** All arithmetic is wall-clock on the strings you supply, with no time-zone
  conversion.

## Development

```sh
pnpm install
pnpm run typecheck   # tsc --noEmit
pnpm test            # vitest, paired fixtures per rule
pnpm run build       # tsdown -> lib/index.mjs + lib/index.d.mts
node ../scripts/sync-shared.mjs dsh-site-log-check   # refresh src/shared from ../_shared
```

## PerryLink DSH Plugin Family

This project is part of the DeepSeek Harness plugin family from [PerryLink](https://github.com/PerryLink). The roster stays collapsed below so every README keeps a short first screen; expand it to see every row and its status.

<details>
<summary>Expand all plugins</summary>

| Plugin | Status |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** |  |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** |  |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** |  |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** |  |
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
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** |  |
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
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** |  |
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
| **[dsh-score](https://github.com/PerryLink/dsh-score)** |  |
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
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 FROZEN — see the repo README |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 FROZEN — see the repo README |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 FROZEN — see the repo README |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 FROZEN — see the repo README |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 FROZEN — see the repo README |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRED — see the repo README |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRED — see the repo README |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRED — see the repo README |

</details>

## License

[Apache License 2.0](LICENSE) © 2026 dsh-site-log-check contributors.
