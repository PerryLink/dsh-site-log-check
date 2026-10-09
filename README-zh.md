# dsh-site-log-check — 监理日志跨日连续性与旁站覆盖提示

[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)

`dsh-site-log-check` 读取一个工程项目的监理资料——监理服务期、逐日监理日志、声明需要旁站的关键部位与关键工序清单、旁站记录——并按本规则库引用的条款逐项核对：同一日历日是否出现两条以上日志、日志日期是否落在监理服务期内、服务期内哪些日子没有日志、每条日志是否填写了各项栏目与记录人、声明的旁站清单是否存在且每项关键部位或关键工序都有对应旁站记录、旁站记录是否填写了起止时间且先后顺序正确、关键部位或关键工序、施工单位、发现的问题及处理情况与签字，以及日志中声明的旁站情况在当日是否有旁站记录对应。报出的都是字面差异，每条差异都带出它依据的条款，供人工复核。

## 实际输出长什么样

![Terminal demo of dsh-site-log-check: real output over its SL-014 fixture](https://raw.githubusercontent.com/PerryLink/dsh-site-log-check/main/docs/assets/dsh-site-log-check-demo.png)

本插件对自己 `SL-014` 测试夹具的**真实输出**，不是示意图。规则库不伪造引文，因此每条发现都会同时写明所引条款，以及该条款原文本次未取得。

## 它回答什么问题

| 你会问 | 它怎么答 |
|---|---|
| 两条日志写的是同一个日历日，会被报出来吗？ | 会。`SL-001` 按 `params.maxPerDay`（1）核对，同一日历日出现多条日志的逐日列出；日志日期落在 `project.serviceStart` 与 `project.serviceEnd` 所定监理服务期之外的也会报出。它只比日期和条数，不判断两条里哪条才是当日的记录，也不判断补记是否成立。材料中的日志日期全都无法识别时，本条报告无法执行，而不是静默通过。 |
| 服务期中间缺了三天日志，检查会怎么处理？ | `SL-002` 数出 `project.serviceStart` 到 `project.serviceEnd` 之间没有日志的日历日。它是本规则库唯一的 `info` 级规则：「页次、日期应连续」的明文出自福建省 DBJT 13-144-2019，不是 GB/T 50319-2013，所以只提示、不阻断。覆盖率低于 `params.minCoverageRatio`（0.9）时逐日列为差异；达到或高于该比例时，本条报告无法执行，并在其中列出缺日。缺日究竟因停工、节假日还是日志未归档，留给人核实。 |
| 某一天的日志，存在的问题那一栏空着。 | `SL-006` 会报出该条：每条日志都应填写当日存在的问题及处理情况。它只核对这一栏是否填写，不核对写的内容对不对，所以写明「未发现问题」可以通过，留空不行。规则库如实记录：第7.2.2条第4款两种来源的措辞不一致、官方件未能复核，因此本条有意不对措辞作判断，只看栏位是否填写。 |
| 材料里没有声明哪些关键部位、关键工序需要旁站，会静默通过吗？ | 不会。当材料显示确实涉及旁站（存在旁站记录，或某条日志的监理工作栏提到旁站）时，`SL-008` 报出缺少本工程旁站清单；如果没有任何涉及旁站的迹象，本条报告无法执行并说明缺清单，而不是为工程凭空设定一项可能并不适用的要求。规则库说明：GB/T 50319-2013 正文未列举这份清单，清单来源是建市〔2002〕189号第二条。 |
| 旁站记录只有旁站监理人员签字，施工企业现场质检人员没签，会报吗？ | 会。`params.requireContractorSignature` 打开时，`SL-011` 既报缺少旁站监理人员签字，也报缺少施工企业现场质检人员签字。规则库有意把两个依据分开：表 A.0.6 只有「旁站监理人员（签字）」一个签字栏，双方签字的依据是建市〔2002〕189号第七条，不得归给 GB/T 50319-2013。本条只核对签字是否留下，不核对签字是否真实。 |
| 日志写着 5 月 12 日旁站了，但旁站记录台账里当天没有记录。 | `SL-013` 会报出。它把监理工作栏提到旁站的日志日期，与旁站记录开始时间的日期相比对。它只核对两者是否对得上；规则库说明 GB/T 50319-2013 与建市〔2002〕189号 都没有要求两份材料编号互链。旁站记录都没有填写开始时间，或没有日志声明旁站情况时，本条报告无法执行，而不是静默通过。 |

## 依据的标准

| 文件 | 文号 | 引用它的规则 |
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

| 项目 | 状态 |
|---|---|
| Harness | 对等版本范围 `>=0.1.2-rc.1 <0.2.0 \|\| >=0.2.0-0 <0.3.0` —— 已实测同时接受 `0.2.0-rc.2` 与 `0.2.1-alpha.1`。**刻意不声明 `engines.dsh`**：它没有任何读取者，也无法拒装任何宿主 |
| Node | `^22.19.0 || >=24.0.0` |
| 平台 | 全平台（纯 ESM；无原生代码、无联网、不调用模型） |
| 工具模式 | `native` / `ptc` / `both` 均可；批量校验整个目录时建议 `ptc`，schema 成本只付一次 |

## What it does

规则表、字段说明与行为细节见 [README.md](README.md#what-it-does)（英文主版本）。本插件只列出材料与所引条款之间的字面差异，并对无法执行的检查在 `skipped` 中逐项说明。

## Install

```sh
dsh plugin --profile <name> add dsh-site-log-check
dsh --profile <name> --dump-config | grep 'dsh-site-log-check'
```

## Configuration

全部可调参数都在 `src/config.ts` 的 Schemastery schema 中，只改 `cordis.yml` 即可生效，无需改代码；逐条阈值在 `rules/` 下的规则库文件里。

| 键 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `rulesFile` | string | `rules/site-log-check.yaml` | 规则库文件路径，相对插件包根目录 |
| `disabledRules` | string[] | `[]` | 要停用的规则 id 列表；每条都会出现在 `skipped` 中 |
| `onlyRules` | string[] | `[]` | 只执行这些规则 id；留空表示执行全部规则 |
| `skipNotes` | string | `""` | 附加到每条 `skipped` 说明后的备注 |
| `timeoutMs` | number | `120000` | 工具协作式超时预算（毫秒） |

## Material format

支持 JSON 与 YAML。完整字段示例见 [README.md](README.md#material-format)（英文主版本）。字段在读取层是可选的，由检查引擎校验，因此部分导出的材料会产生"缺项"类差异，而不是让程序崩溃。

## Rule sources

规则数据与代码分离，每条规则都带文件名、文号、按原文自身编号体系的条款号、逐字摘录与来源地址。加载期强制：摘录必须是真实引文且不少于八个字符；依据仅为原则性条款（`kind: derived-from-principle`，严重级上限 `warn`）或本机构配置（`kind: institutional-configuration`，上限 `info`）的检查不得标为 `error`。夸大依据的规则库会在加载期失败，而不会产出一份看起来很有底气的报告。

核验中确认的边界与"刻意没有作出的结论"见 [README.md](README.md#rule-sources)（英文主版本）与随包的 `rules/evidence/` 目录。

## Troubleshooting

- **插件装上了但工具不出现**：确认 `main` 指向 `lib/index.mjs` 且 `pnpm run build` 已生成该文件；`main` 写错会让加载器静默跳过该条目。
- **`dsh plugin add` 报版本不兼容**：peer 范围覆盖 `0.1.x` 与 `0.2.x`；若运行时在其之外，可显式豁免：`dsh plugin --profile <name> allow-version <包名@版本> --dsh-version <runtime> --accept-risk`
- **某条规则没有执行**：查看 `skipped` 数组，其中写明了规则 id 与原因。
- **`check` 报 `manifest-peers` 失败**：静态检查器比对的是一份早于 0.2 世代的硬编码 peer 范围；安装期的 peer 校验以运行时为准。这是 `dsh-plugin-dev` 的已知上游问题。
- **时间看起来偏移**：全部计算都是对输入字符串做墙上时钟运算，不做时区换算。

## Development

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
node ../scripts/sync-shared.mjs dsh-site-log-check
```

第 4 项把 `../_shared` 的共享件同步进 `src/shared/`；每次改动共享件后都要重跑。

## License

[Apache License 2.0](LICENSE) © 2026 dsh-site-log-check contributors.
