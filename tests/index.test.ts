import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadRuleset } from '../src/shared/ruleset.ts'
import { parseMaterial } from '../src/parse.ts'
import { runCheck } from '../src/check.ts'
import { buildView } from '../src/view.ts'
import { findForbiddenWording } from '../src/shared/wording.ts'
import { addDays, diffDays, eachDay, parseWallClock, weekday } from '../src/shared/datetime.ts'
import { parseYaml } from '../src/shared/yaml.ts'
import { Config as ConfigSchema } from '../src/config.ts'
import { inject, name as pluginName, resolvePackageFile, TOOL_NAME } from '../src/index.ts'
import type { Report } from '../src/shared/report.ts'
import type { CheckOptions } from '../src/check.ts'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const rulesPath = join(packageRoot, 'rules', 'site-log-check.yaml')
const fixturesRoot = join(here, 'fixtures')
const CHECKED_AT = '2026-10-06T00:00:00.000Z'

interface CaseFile {
  ruleId: string
  configure?: Record<string, Record<string, unknown>>
  pairs: { name: string; material: string; expect: { ruleId: string; count: number } }[]
}

async function loadPack() {
  return loadRuleset(await readFile(rulesPath, 'utf8'))
}

function runOptions(overrides: Partial<CheckOptions> = {}): CheckOptions {
  return { plugin: pluginName, checkedAt: CHECKED_AT, disabledRules: [], onlyRules: [], ...overrides }
}

function withConfiguration(ruleset: Awaited<ReturnType<typeof loadPack>>, configure: CaseFile['configure']) {
  if (configure === undefined) return ruleset
  return {
    ...ruleset,
    rules: ruleset.rules.map((rule) =>
      configure[rule.id] === undefined ? rule : { ...rule, params: { ...rule.params, ...configure[rule.id] } },
    ),
  }
}

async function runFixture(materialText: string, target: string, configure?: CaseFile['configure']): Promise<Report> {
  const ruleset = withConfiguration(await loadPack(), configure)
  return runCheck(parseMaterial(materialText, target), ruleset, runOptions())
}

function issuesOf(report: Report, ruleId: string) {
  return report.issues.filter((issue) => issue.ruleId === ruleId)
}

async function ruleDirectories(): Promise<string[]> {
  const entries = await readdir(fixturesRoot, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
}

async function readCases(directory: string): Promise<CaseFile> {
  return JSON.parse(await readFile(join(fixturesRoot, directory, 'cases.json'), 'utf8')) as CaseFile
}

const PERIOD = ['project:', '  serviceStart: "2026-03-01"', '  serviceEnd: "2026-03-05"']

/** A fully filled log block; returns lines, so callers must spread it into an array. */
function goodLog(date: string): string[] {
  return [
    `  - date: "${date}"`,
    '    weather: 晴',
    '    progress: x',
    '    supervision: y',
    '    issues: z',
    '    recorder: 张监理',
  ]
}

describe('rule pack', () => {
  it('declares a citable basis for every rule', async () => {
    const ruleset = await loadPack()
    expect(ruleset.plugin).toBe(pluginName)
    expect(ruleset.rules.length).toBeGreaterThanOrEqual(14)
    for (const rule of ruleset.rules) {
      expect(rule.basis.document, `${rule.id} document`).not.toBe('')
      expect(rule.basis.clause, `${rule.id} clause`).not.toBe('')
      expect(rule.basis.excerpt.length, `${rule.id} excerpt`).toBeGreaterThanOrEqual(8)
      expect(rule.basis.source, `${rule.id} source`).toMatch(/^https?:\/\//)
      expect(['direct', 'derived-from-principle', 'institutional-configuration']).toContain(rule.basis.kind)
      for (const extra of rule.alsoBasis ?? []) {
        expect(extra.clause, `${rule.id} alsoBasis clause`).not.toBe('')
        expect(extra.excerpt.length, `${rule.id} alsoBasis excerpt`).toBeGreaterThanOrEqual(8)
      }
    }
  })

  it('never lets a principle-derived or locally configured check be an error', async () => {
    const ruleset = await loadPack()
    for (const rule of ruleset.rules) {
      if (rule.basis.kind === 'derived-from-principle') expect(rule.severity, rule.id).not.toBe('error')
      if (rule.basis.kind === 'institutional-configuration') expect(rule.severity, rule.id).toBe('info')
    }
  })

  it('keeps the daily-continuity check out of the error tier, because GB/T 50319-2013 says only 每日', async () => {
    const ruleset = await loadPack()
    const continuity = ruleset.rules.find((rule) => rule.id === 'SL-002')
    expect(continuity?.basis.kind).toBe('derived-from-principle')
    expect(continuity?.severity).toBe('info')
    expect(continuity?.basis.clause).toBe('第2.0.21条')
    expect(continuity?.alsoBasis?.[0]?.number).toBe('DBJT 13-144-2019')
  })

  it('attributes the two-party signature to 建市〔2002〕189号 rather than to the national standard', async () => {
    const ruleset = await loadPack()
    const signatures = ruleset.rules.find((rule) => rule.id === 'SL-011')
    expect(signatures?.basis.clause).toBe('表A.0.6')
    const extra = signatures?.alsoBasis?.find((basis) => basis.document.includes('旁站监理管理办法'))
    expect(extra?.clause).toBe('第七条')
    expect(signatures?.note).toContain('189号第七条')
    expect(signatures?.note).toContain('不得把施工企业质检人员签字归给')
  })

  it('states clause numbers in the standard own numbering (第x.x.x条, never 款)', async () => {
    const ruleset = await loadPack()
    for (const rule of ruleset.rules) {
      expect(rule.basis.clause, rule.id).not.toMatch(/\d+\.\d+\.\d+款/)
    }
  })

  it('refuses a rule pack that overstates a principle-derived check', () => {
    const overstated = [
      'plugin: probe',
      'version: "0"',
      'rules:',
      '  - id: X-001',
      '    title: probe',
      '    severity: error',
      '    basis:',
      '      document: 《X》',
      '      number: X〔2020〕1号',
      '      clause: 第一条',
      '      excerpt: 这是一个足够长的逐字摘录示例。',
      '      kind: derived-from-principle',
      '      source: https://example.invalid/x',
    ].join('\n')
    expect(() => loadRuleset(overstated)).toThrow(/strongest permitted severity/)
  })
})

describe('paired fixtures', () => {
  it('has both a compliant and a violating sample for every rule', async () => {
    const ruleset = await loadPack()
    const covered = new Set<string>()
    for (const directory of await ruleDirectories()) {
      const cases = await readCases(directory)
      expect(cases.pairs.filter((pair) => pair.expect.count === 0).length, `${directory} compliant sample`).toBeGreaterThanOrEqual(1)
      expect(cases.pairs.filter((pair) => pair.expect.count > 0).length, `${directory} violating sample`).toBeGreaterThanOrEqual(1)
      for (const pair of cases.pairs) {
        const material = await readFile(join(fixturesRoot, directory, pair.material), 'utf8')
        const report = await runFixture(material, pair.material, cases.configure)
        const matched = issuesOf(report, cases.ruleId)
        expect(
          matched.length,
          `${directory}/${pair.name} expected ${pair.expect.count} × ${cases.ruleId}, got ${matched.map((issue) => issue.found).join(' | ')}`,
        ).toBe(pair.expect.count)
        covered.add(cases.ruleId)
      }
    }
    for (const rule of ruleset.rules) expect(covered.has(rule.id), `covered ${rule.id}`).toBe(true)
  })

  it('gives every issue a citable basis, a stable id and a locator', async () => {
    for (const directory of await ruleDirectories()) {
      const cases = await readCases(directory)
      for (const pair of cases.pairs) {
        const material = await readFile(join(fixturesRoot, directory, pair.material), 'utf8')
        const report = await runFixture(material, pair.material, cases.configure)
        for (const issue of report.issues) {
          expect(issue.basis).toContain('「')
          expect(issue.id).toMatch(/^dsh-site-log-check\.SL-\d{3}\.[0-9a-f]{8}$/)
          expect(issue.found).not.toBe('')
          expect(issue.expected).not.toBe('')
          expect(Object.keys(issue.locator).length).toBeGreaterThan(0)
        }
        expect(Array.isArray(report.skipped)).toBe(true)
      }
    }
  })
})

describe('skipped reporting', () => {
  it('admits when the service period is missing instead of guessing coverage', async () => {
    const report = await runFixture(['logs:', ...goodLog('2026-03-01')].join('\n'), 'inline')
    const entry = report.skipped.find((item) => item.rule === 'SL-002')
    expect(entry?.reason).toContain('serviceStart')
  })

  it('does not report a violation for a coverage ratio the deployment accepts', async () => {
    const text = [
      ...PERIOD,
      'logs:',
      ...goodLog('2026-03-01'),
      ...goodLog('2026-03-02'),
      ...goodLog('2026-03-03'),
      ...goodLog('2026-03-05'),
    ].join('\n')
    const report = await runFixture(text, 'inline', { 'SL-002': { minCoverageRatio: 0.75 } })
    expect(issuesOf(report, 'SL-002').length).toBe(0)
    const entry = report.skipped.find((item) => item.rule === 'SL-002')
    expect(entry?.reason).toContain('2026-03-04')
  })

  it('admits when no key-work list is declared and no on-site records exist', async () => {
    const report = await runFixture([...PERIOD, 'logs:', ...goodLog('2026-03-01'), 'onsite: []'].join('\n'), 'inline')
    const entry = report.skipped.find((item) => item.rule === 'SL-008')
    expect(entry?.reason).toContain('未声明')
  })

  it('names disabled rules exactly once and admits a restricted run', async () => {
    const ruleset = await loadPack()
    const input = parseMaterial([...PERIOD, 'logs:', ...goodLog('2026-03-01')].join('\n'), 'inline')
    const report = runCheck(input, ruleset, runOptions({ disabledRules: ['SL-003'], skipNotes: '本机构实施细则' }))
    const entries = report.skipped.filter((item) => item.rule === 'SL-003')
    expect(entries).toHaveLength(1)
    expect(entries[0]?.reason).toContain('禁用')
    expect(entries[0]?.reason).toContain('本机构实施细则')
  })
})

describe('report rendering', () => {
  it('never uses adjudicating wording and always carries the disclaimer', async () => {
    const material = await readFile(join(fixturesRoot, 'SL-002', 'SL-002-unsafe.yaml'), 'utf8')
    const report = await runFixture(material, 'SL-002-unsafe.yaml')
    const view = buildView(report)
    expect(findForbiddenWording(view.markdown)).toEqual([])
    expect(view.markdown).toContain('免责声明')
    expect(view.markdown).toContain('未执行的检查')
    expect(JSON.parse(view.reportJson)).toMatchObject({ plugin: pluginName, summary: report.summary })
    expect(view.issueCount).toBe(report.issues.length)
  })
})

describe('plugin contract', () => {
  it('declares a static inject array covering every service apply touches', () => {
    expect(Array.isArray(inject)).toBe(true)
    expect(inject).toContain('tools')
  })

  it('exposes a Schemastery Config with serializable defaults', () => {
    const resolved = ConfigSchema(null)
    expect(resolved.rulesFile).toBe('rules/site-log-check.yaml')
    expect(resolved.disabledRules).toEqual([])
    expect(resolved.timeoutMs).toBeGreaterThan(0)
  })

  it('resolves the packaged rule pack and rejects a missing one', () => {
    expect(resolvePackageFile('rules/site-log-check.yaml')).toBe(rulesPath)
    expect(() => resolvePackageFile('rules/does-not-exist.yaml')).toThrow(/未找到/)
  })

  it('names the tool after the package family convention', () => {
    expect(TOOL_NAME).toBe('site_log_check')
  })
})

describe('material reader', () => {
  it('rejects empty material instead of reporting an empty result', () => {
    expect(() => parseMaterial('   ', 'inline')).toThrow(/材料为空/)
  })

  it('rejects material with neither logs nor on-site records', () => {
    expect(() => parseMaterial('project:\n  name: x', 'inline')).toThrow(/无法执行检查/)
  })

  it('records an unreadable log date as a reader warning', () => {
    const input = parseMaterial(['logs:', '  - date: "三月一日"'].join('\n'), 'inline')
    expect(input.warnings.join(' ')).toContain('三月一日')
  })
})

describe('shared kit', () => {
  it('parses wall-clock timestamps and rejects impossible dates', () => {
    expect(parseWallClock('2026-03-15 08:30')).toEqual({ date: '2026-03-15', time: '08:30', hasTime: true, minutes: 510 })
    expect(parseWallClock('2026-02-30')).toBeUndefined()
  })

  it('does calendar arithmetic and weekday lookup', () => {
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01')
    expect(diffDays('2026-03-01', '2026-03-31')).toBe(30)
    expect(eachDay('2026-03-30', '2026-04-02')).toHaveLength(4)
    expect(weekday('2026-03-15')).toBe(0)
  })

  it('reads the supported YAML subset and rejects the rest', () => {
    expect(parseYaml('logs:\n  - date: "2026-03-01"\n    weather: 晴\n')).toEqual({
      logs: [{ date: '2026-03-01', weather: '晴' }],
    })
    expect(() => parseYaml('a: 1\na: 2\n')).toThrow(/duplicate/)
  })
})
