/**
 * Pure check core: `(input, ruleset, options) => Report`.
 *
 * No plugin context, no I/O, no clock and no model access, so the whole rule set
 * is unit-testable without credentials. Every finding carries the verbatim
 * clause that produced it, and every check that could not run is reported in
 * `skipped` so an empty issue list can never be read as "nothing is wrong".
 */

import { diffDays, diffMinutes, eachDay, parseWallClock, weekday } from './shared/datetime.ts'
import { disabledAsSkipped, formatBasis } from './shared/rules.ts'
import { paramNumber, paramStrings, ruleById } from './shared/ruleset.ts'
import { issueId, makeReport } from './shared/report.ts'
import type { Issue, Locator, Report, Skipped } from './shared/report.ts'
import type { Ruleset } from './shared/rules.ts'
import type { OnsiteRecord, SiteLogEntry, SiteLogInput } from './model.ts'

/** Options that come from the plugin configuration rather than the rule pack. */
export interface CheckOptions {
  plugin: string
  checkedAt: string
  disabledRules: readonly string[]
  onlyRules: readonly string[]
  skipNotes?: string
}

interface RuleContext {
  input: SiteLogInput
  ruleset: Ruleset
  issues: Issue[]
  skipped: Skipped[]
  fired: Set<string>
  skipReasons: Map<string, string>
  add(ruleId: string, locator: Locator, found: string, expected: string, fix?: string): void
  skip(ruleId: string, reason: string): void
}

function locatorOfLog(entry: SiteLogEntry): Locator {
  const locator: Locator = {}
  if (entry.row !== undefined) locator.row = entry.row
  locator.cell = entry.id ?? entry.date
  return locator
}

function locatorOfOnsite(record: OnsiteRecord, index: number): Locator {
  const locator: Locator = { cell: record.id ?? `旁站记录${index + 1}` }
  if (record.row !== undefined) locator.row = record.row
  return locator
}

function basisOf(ruleset: Ruleset, ruleId: string): string {
  const rule = ruleById(ruleset, ruleId)
  return formatBasis(rule.basis, rule.alsoBasis ?? [])
}

function makeAdd(context: Omit<RuleContext, 'add' | 'skip'>): RuleContext['add'] {
  return (ruleId, locator, found, expected, fix) => {
    const rule = ruleById(context.ruleset, ruleId)
    const issue: Issue = {
      id: issueId(context.ruleset.plugin, ruleId, locator),
      ruleId,
      severity: rule.severity,
      locator,
      found,
      expected,
      basis: formatBasis(rule.basis, rule.alsoBasis ?? []),
    }
    if (fix !== undefined) issue.fix = fix
    context.issues.push(issue)
    context.fired.add(ruleId)
  }
}

/** The supervision service period, or undefined when the material omits it. */
function servicePeriod(input: SiteLogInput): { start: string; end: string } | undefined {
  const { serviceStart, serviceEnd } = input.project
  if (serviceStart === undefined || serviceEnd === undefined) return undefined
  return diffDays(serviceStart, serviceEnd) < 0 ? { start: serviceEnd, end: serviceStart } : { start: serviceStart, end: serviceEnd }
}

/** SL-001 — one log per calendar day, inside the supervision service period. */
function checkOnePerDay(context: RuleContext): void {
  const ruleId = 'SL-001'
  const rule = ruleById(context.ruleset, ruleId)
  const maxPerDay = paramNumber(rule, 'maxPerDay', 1)
  const dated = context.input.logs.filter((entry) => entry.date !== '')
  if (dated.length === 0) {
    context.skip(ruleId, '材料中的日志日期均无法识别，无法按日历日比对')
    return
  }
  const byDate = new Map<string, SiteLogEntry[]>()
  for (const entry of dated) {
    const bucket = byDate.get(entry.date)
    if (bucket === undefined) byDate.set(entry.date, [entry])
    else bucket.push(entry)
  }
  for (const [date, entries] of [...byDate.entries()].sort(([left], [right]) => (left < right ? -1 : 1))) {
    if (entries.length > maxPerDay) {
      context.add(
        ruleId,
        { cell: date },
        `${date} 出现 ${entries.length} 条日志`,
        `同一日历日只应有 ${maxPerDay} 条监理日志`,
        '核对是否存在重复归档或补充记录未标注',
      )
    }
  }
  const period = servicePeriod(context.input)
  if (period === undefined) {
    context.skip(`${ruleId}-period`, '材料未提供 project.serviceStart / serviceEnd，未核对日志日期是否落在监理服务期内')
    return
  }
  for (const entry of dated) {
    if (diffDays(period.start, entry.date) < 0 || diffDays(entry.date, period.end) < 0) {
      context.add(
        ruleId,
        locatorOfLog(entry),
        `日志日期 ${entry.date} 落在监理服务期 ${period.start} ~ ${period.end} 之外`,
        '监理日志日期应落在监理服务期内',
        '核对服务期取值与日志日期；跨期归档应说明',
      )
    }
  }
}

/** SL-002 — no calendar day inside the service period lacks a log. */
function checkCoverage(context: RuleContext): void {
  const ruleId = 'SL-002'
  const period = servicePeriod(context.input)
  if (period === undefined) {
    context.skip(ruleId, '材料未提供 project.serviceStart / serviceEnd，无法计算施工期内的缺日')
    return
  }
  const rule = ruleById(context.ruleset, ruleId)
  const minRatio = paramNumber(rule, 'minCoverageRatio', 0.9)
  const ignoreWeekends = rule.params.ignoreWeekends === true
  const present = new Set(context.input.logs.map((entry) => entry.date).filter((date) => date !== ''))
  const all = eachDay(period.start, period.end).filter((date) => !ignoreWeekends || (weekday(date) !== 0 && weekday(date) !== 6))
  if (all.length === 0) {
    context.skip(ruleId, '监理服务期区间为空，无法计算覆盖率')
    return
  }
  const missing = all.filter((date) => !present.has(date))
  const ratio = (all.length - missing.length) / all.length
  if (missing.length === 0) return
  if (ratio >= minRatio) {
    context.skip(
      ruleId,
      `监理服务期内缺 ${missing.length} 日（覆盖率 ${(ratio * 100).toFixed(1)}%，不低于配置的 ${(minRatio * 100).toFixed(0)}%），未逐日列出；缺日：${missing.join('、')}`,
    )
    return
  }
  for (const date of missing) {
    context.add(
      ruleId,
      { cell: date },
      `${date} 无监理日志记录`,
      `监理服务期 ${period.start} ~ ${period.end} 内应按日历日记录`,
      '核对是否因停工、节假日或日志未归档；确无施工活动的应有说明',
    )
  }
}

/** SL-003 ~ SL-006 — the four mandatory content items of 第7.2.2条. */
function checkLogFields(context: RuleContext): void {
  const specs: { ruleId: string; field: keyof SiteLogEntry; label: string; defaultField: string }[] = [
    { ruleId: 'SL-003', field: 'weather', label: '天气和施工环境情况', defaultField: 'weather' },
    { ruleId: 'SL-004', field: 'progress', label: '当日施工进展情况', defaultField: 'progress' },
    { ruleId: 'SL-005', field: 'supervision', label: '当日监理工作情况', defaultField: 'supervision' },
    { ruleId: 'SL-006', field: 'issues', label: '当日存在的问题及处理情况', defaultField: 'issues' },
  ]
  for (const spec of specs) {
    const dated = context.input.logs
    if (dated.length === 0) {
      context.skip(spec.ruleId, '材料中没有监理日志条目')
      continue
    }
    for (const entry of dated) {
      const value = entry[spec.field]
      if (typeof value === 'string' && value.trim() !== '') continue
      context.add(
        spec.ruleId,
        locatorOfLog(entry),
        `第 ${entry.date || '(日期缺失)'} 日日志未填写「${spec.label}」`,
        `监理日志应包括${spec.label}`,
        '补齐该栏目后可重新检查',
      )
    }
  }
}

/** SL-007 — the log names who compiled it. */
function checkRecorder(context: RuleContext): void {
  const ruleId = 'SL-007'
  if (context.input.logs.length === 0) {
    context.skip(ruleId, '材料中没有监理日志条目')
    return
  }
  for (const entry of context.input.logs) {
    const value = (entry.recorder ?? '').trim()
    if (value !== '') continue
    context.add(
      ruleId,
      locatorOfLog(entry),
      `第 ${entry.date || '(日期缺失)'} 日日志未留下记录人`,
      '监理日志应由专业监理工程师组织编写，并留下记录人',
      '补录组织编写人；本条不要求每日签字，仅要求可追溯到记录人',
    )
  }
}

/**
 * SL-008 — the material declares which key works require on-site supervision.
 *
 * GB/T 50319-2013 正文 does not list the key works, so a missing list is only a
 * difference when the material shows that on-site supervision was actually in
 * play: otherwise the check reports itself as skipped instead of inventing a
 * requirement the project may not be subject to.
 */
function checkKeyWorkDeclared(context: RuleContext): void {
  const ruleId = 'SL-008'
  const declared = context.input.keyWorks
  if (declared.length > 0) {
    for (const item of declared) {
      if (item.name.trim() !== '') continue
      const locator: Locator = { column: 'keyWorks' }
      if (item.row !== undefined) locator.row = item.row
      context.add(ruleId, locator, '旁站清单中存在名称为空的行', '清单每行应写明关键部位或关键工序', '补齐名称')
    }
    return
  }
  const logsMentionOnsite = context.input.logs.some((entry) => /旁站/.test(entry.supervision ?? ''))
  if (!logsMentionOnsite && context.input.onsite.length === 0) {
    context.skip(
      ruleId,
      '材料未声明旁站的关键部位、关键工序清单，也没有旁站记录或旁站提及，无法判断是否已确定清单',
    )
    return
  }
  context.add(
    ruleId,
    { column: 'keyWorks' },
    '材料中无旁站的关键部位、关键工序清单',
    '项目监理机构应根据工程特点和施工组织设计确定旁站的关键部位、关键工序',
    '补充本工程的旁站清单（可参照建市〔2002〕189号第二条的房屋建筑工程清单）',
  )
}

/** SL-009 — on-site records carry a start and an end time, in order. */
function checkOnsiteTimes(context: RuleContext): void {
  const ruleId = 'SL-009'
  if (context.input.onsite.length === 0) {
    context.skip(ruleId, '材料中没有旁站记录')
    return
  }
  const rule = ruleById(context.ruleset, ruleId)
  const requireEnd = rule.params.requireEndTime !== false
  for (const [index, record] of context.input.onsite.entries()) {
    const locator = locatorOfOnsite(record, index)
    if (record.startedAt === undefined) {
      context.add(ruleId, locator, '旁站记录未填写开始时间', '表 A.0.6 要求填写旁站开始时间（年月日时分）', '补录开始时间')
    }
    if (requireEnd && record.endedAt === undefined) {
      context.add(ruleId, locator, '旁站记录未填写结束时间', '表 A.0.6 要求填写旁站结束时间（年月日时分）', '补录结束时间')
    }
    const start = record.startedAt === undefined ? undefined : parseWallClock(record.startedAt)
    const end = record.endedAt === undefined ? undefined : parseWallClock(record.endedAt)
    if (start === undefined || end === undefined) continue
    const minutes = diffMinutes(start, end)
    if (minutes < 0) {
      context.add(
        ruleId,
        locator,
        `结束时间 ${record.endedAt} 早于开始时间 ${record.startedAt}`,
        '旁站结束时间不应早于开始时间',
        '核对时间取值',
      )
    } else if (minutes === 0) {
      context.add(
        ruleId,
        locator,
        `开始时间与结束时间相同（${record.startedAt}）`,
        '旁站记录应体现旁站的起止时段',
        '核对是否漏填时间',
      )
    }
  }
}

/** SL-010 — on-site records state what was found and how it was handled. */
function checkOnsiteIssues(context: RuleContext): void {
  const ruleId = 'SL-010'
  if (context.input.onsite.length === 0) {
    context.skip(ruleId, '材料中没有旁站记录')
    return
  }
  const rule = ruleById(context.ruleset, ruleId)
  const field = typeof rule.params.field === 'string' ? rule.params.field : 'issues'
  for (const [index, record] of context.input.onsite.entries()) {
    const value = field === 'issues' ? record.issues : undefined
    if (typeof value === 'string' && value.trim() !== '') continue
    context.add(
      ruleId,
      locatorOfOnsite(record, index),
      '旁站记录未填写「发现的问题及处理情况」',
      '表 A.0.6 要求填写发现的问题及处理情况',
      '无问题时也应写明「未发现问题」，而不是留空',
    )
  }
}

/** SL-011 — the on-site record is signed, and by whom. */
function checkOnsiteSignatures(context: RuleContext): void {
  const ruleId = 'SL-011'
  if (context.input.onsite.length === 0) {
    context.skip(ruleId, '材料中没有旁站记录')
    return
  }
  const rule = ruleById(context.ruleset, ruleId)
  const requireContractor = rule.params.requireContractorSignature === true
  for (const [index, record] of context.input.onsite.entries()) {
    const locator = locatorOfOnsite(record, index)
    if ((record.supervisorSignature ?? '').trim() === '') {
      context.add(ruleId, locator, '旁站记录无旁站监理人员签字', '旁站记录应有旁站监理人员签字', '补签；表 A.0.6 的签字栏为旁站监理人员')
    }
    if (requireContractor && (record.contractorSignature ?? '').trim() === '') {
      context.add(
        ruleId,
        locator,
        '旁站记录无施工企业现场质检人员签字',
        '需旁站的关键部位、关键工序，旁站监理人员和施工企业现场质检人员均应在旁站监理记录上签字',
        '补签；该要求的依据是建市〔2002〕189号第七条，不是 GB/T 50319-2013',
      )
    }
  }
}

/** SL-012 — every declared key work has at least one on-site record. */
function checkKeyWorkCoverage(context: RuleContext): void {
  const ruleId = 'SL-012'
  const rule = ruleById(context.ruleset, ruleId)
  const declared = context.input.keyWorks.map((item) => item.name).filter((name) => name.trim() !== '')
  const catalog = paramStrings(rule, 'keyWorks', [])
  const names = declared.length > 0 ? declared : catalog
  if (names.length === 0) {
    context.skip(ruleId, '规则库未配置 keyWorks 且材料未声明旁站清单，无法比对覆盖情况')
    return
  }
  if (context.input.onsite.length === 0) {
    context.skip(ruleId, `材料声明了 ${names.length} 项关键部位/关键工序，但没有任何旁站记录可供比对`)
    return
  }
  const recorded = context.input.onsite.map((record) => record.keyWork ?? '').filter((value) => value.trim() !== '')
  for (const name of names) {
    const hit = recorded.some((value) => value.includes(name) || name.includes(value))
    if (hit) continue
    context.add(
      ruleId,
      { column: 'keyWorks', cell: name },
      `关键部位/关键工序「${name}」在材料中无对应旁站记录`,
      '确定需要旁站的关键部位、关键工序，应安排监理人员进行旁站并记录',
      '核对该工序是否已施工；若已施工则应补充旁站记录或说明未旁站原因',
    )
  }
}

/** SL-013 — on-site supervision claimed in a log is matched by a record. */
function checkLogOnsiteConsistency(context: RuleContext): void {
  const ruleId = 'SL-013'
  const claimed = context.input.logs.filter((entry) => /旁站/.test(entry.supervision ?? ''))
  if (claimed.length === 0) {
    context.skip(ruleId, '材料中没有在监理日志里声明旁站情况的条目')
    return
  }
  if (context.input.onsite.length === 0) {
    context.add(
      ruleId,
      { column: 'onsite' },
      `有 ${claimed.length} 条日志声明了旁站情况，但材料中没有任何旁站记录`,
      '日志中的旁站情况应与旁站记录台账对应',
      '补充旁站记录台账后重新比对',
    )
    return
  }
  const recordDates = new Set(
    context.input.onsite
      .map((record) => record.startedAt)
      .filter((value): value is string => value !== undefined)
      .map((value) => parseWallClock(value)?.date)
      .filter((value): value is string => value !== undefined),
  )
  if (recordDates.size === 0) {
    context.skip(ruleId, '旁站记录均未填写开始时间，无法与日志日期对应')
    return
  }
  for (const entry of claimed) {
    if (entry.date === '') continue
    if (recordDates.has(entry.date)) continue
    context.add(
      ruleId,
      locatorOfLog(entry),
      `${entry.date} 的日志声明了旁站情况，但当日无旁站记录`,
      '日志中的旁站情况应与当日旁站记录台账对应',
      '核对旁站记录归档日期；本条不要求两者编号互链，只核对是否对得上',
    )
  }
}

/** SL-014 — an on-site record names the key work and the contractor. */
function checkOnsiteIdentity(context: RuleContext): void {
  const ruleId = 'SL-014'
  if (context.input.onsite.length === 0) {
    context.skip(ruleId, '材料中没有旁站记录')
    return
  }
  for (const [index, record] of context.input.onsite.entries()) {
    const locator = locatorOfOnsite(record, index)
    if ((record.keyWork ?? '').trim() === '') {
      context.add(ruleId, locator, '旁站记录未写明关键部位、关键工序', '表 A.0.6 要求填写旁站的关键部位、关键工序', '补录工序名称')
    }
    if ((record.contractor ?? '').trim() === '') {
      context.add(ruleId, locator, '旁站记录未写明施工单位', '表 A.0.6 要求填写施工单位', '补录施工单位')
    }
  }
}

const CHECKERS: readonly ((context: RuleContext) => void)[] = [
  checkOnePerDay,
  checkCoverage,
  checkLogFields,
  checkRecorder,
  checkKeyWorkDeclared,
  checkOnsiteTimes,
  checkOnsiteIssues,
  checkOnsiteSignatures,
  checkKeyWorkCoverage,
  checkLogOnsiteConsistency,
  checkOnsiteIdentity,
]

/**
 * Run the whole rule pack against one supervision archive.
 * @param input - normalized material.
 * @param ruleset - validated rule pack.
 * @param options - plugin identity, clock value and rule selection.
 * @returns the report, with `skipped` listing every check that did not run.
 */
export function runCheck(input: SiteLogInput, ruleset: Ruleset, options: CheckOptions): Report {
  const disabled = new Set([...ruleset.disabled, ...options.disabledRules])
  const only = new Set(options.onlyRules)
  const base = {
    input,
    ruleset,
    issues: [] as Issue[],
    skipped: [] as Skipped[],
    fired: new Set<string>(),
    skipReasons: new Map<string, string>(),
  }
  const context: RuleContext = {
    ...base,
    add: makeAdd(base),
    skip: (ruleId, reason) => {
      base.skipReasons.set(ruleId, reason)
    },
  }

  for (const checker of CHECKERS) checker(context)

  const withNote = (reason: string): string => (options.skipNotes === undefined ? reason : `${reason}；${options.skipNotes}`)
  const skipped: Skipped[] = disabledAsSkipped(ruleset, [...disabled], withNote('该规则在当前配置中被禁用'))
  const already = new Set(skipped.map((entry) => entry.rule))
  for (const [ruleId, reason] of base.skipReasons) {
    if (already.has(ruleId)) continue
    if (disabled.has(ruleId) || (options.onlyRules.length > 0 && !only.has(ruleId))) continue
    skipped.push({ rule: ruleId, reason: withNote(reason) })
    already.add(ruleId)
  }
  for (const rule of ruleset.rules) {
    if (disabled.has(rule.id) || base.fired.has(rule.id) || base.skipReasons.has(rule.id) || already.has(rule.id)) continue
    if (options.onlyRules.length > 0 && !only.has(rule.id)) continue
    skipped.push({ rule: rule.id, reason: withNote('材料满足该检查的前置条件且未发现差异条目') })
  }
  if (options.onlyRules.length > 0) {
    const notSelected = ruleset.rules.filter((rule) => !only.has(rule.id) && !disabled.has(rule.id))
    if (notSelected.length > 0) {
      skipped.push({
        rule: notSelected.map((rule) => rule.id).join(','),
        reason: withNote(`本次调用通过 only 参数把执行范围限制为 ${[...only].join(', ')}，上列规则未执行`),
      })
    }
  }

  return makeReport({
    plugin: options.plugin,
    target: input.target,
    rulesetVersion: ruleset.version,
    checkedAt: options.checkedAt,
    issues: context.issues,
    skipped,
  })
}
