# dsh-site-log-check

**Boundary:** this plugin checks the **continuity of the daily supervision log and the coverage of
on-site supervision records** for a construction project — the site-supervision domain (工程监理).
It is not `dsh-archive-check` (which checks whether project records are complete for archiving), not
`dsh-hazplan-check` (which checks the sections of a plan for a hazardous sub-project), and not a
site-safety inspector. It reads a machine-readable export of the supervision office's own records and
reports literal mismatches against cited clauses.

## Compatibility

| Surface | Status |
|---|---|
| Harness | Peer range `>=0.1.2-rc.1 <0.2.0 \|\| >=0.2.0-0 <0.3.0` — verified to accept both `0.2.0-rc.2` and `0.2.1-alpha.1`. `engines.dsh` is deliberately not declared: it has no reader and cannot reject a host |
| Node | `^22.19.0 || >=24.0.0` |
| Platforms | All (plain ESM; no native code, no network, no model call) |
| Tool mode | Works in `native`, `ptc` and `both`; for a folder of projects use `ptc` |

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

## Install

```sh
dsh plugin --profile <name> add dsh-site-log-check
dsh --profile <name> --dump-config | grep 'dsh-site-log-check'
```

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

## License

[Apache License 2.0](LICENSE) © 2026 dsh-site-log-check contributors.
