/**
 * Turn a `Report` into a workbook.
 *
 * Three sheets, in the order a reader needs them:
 *
 *   汇总     what was checked, what was found, what did not run
 *   差异清单  one row per finding, with the clause it cites
 *   未执行    the rules the run could not apply, and why
 *
 * The third sheet is the point. A workbook that carries only findings reads as a
 * clean bill of health; the rules that could not run are exactly what a reader
 * cannot infer from an empty diff column.
 */

import { writeWorkbook, type Cell, type Sheet } from './xlsx-write.ts'
import type { Report } from './report.ts'

/** Column headers of the findings sheet, in order. */
export const FINDING_COLUMNS = [
  '序号',
  '严重程度',
  '规则',
  '定位',
  '问题',
  '期望',
  '建议处理',
  '依据',
  '处理状态',
] as const

/** Chinese label for a severity. */
const SEVERITY_LABEL: Record<string, string> = { error: '错误', warn: '提示', info: '参考' }

/**
 * Render the locator as one readable string.
 *
 * @param issue - the finding.
 * @returns e.g. `第 3 行数据 · 字段金额`, or a dash when nothing is locatable.
 */
export function locatorText(issue: Report['issues'][number]): string {
  const parts: string[] = []
  const locator = issue.locator as Record<string, string | number | undefined>
  if (locator['page'] !== undefined) parts.push(`第 ${locator['page']} 页`)
  if (locator['para'] !== undefined) parts.push(`第 ${locator['para']} 段`)
  if (locator['line'] !== undefined) parts.push(`第 ${locator['line']} 行`)
  if (locator['row'] !== undefined) parts.push(`第 ${locator['row']} 行数据`)
  if (locator['cell'] !== undefined) parts.push(`单元格 ${locator['cell']}`)
  if (locator['column'] !== undefined) parts.push(`字段 ${locator['column']}`)
  return parts.length === 0 ? '—' : parts.join(' · ')
}

/**
 * Build the workbook for a report.
 *
 * @param report - the check result.
 * @param title - a human title for the summary sheet, e.g. the material's name.
 * @returns the xlsx bytes.
 */
export function reportWorkbook(report: Report, title: string): Buffer {
  const summary: Sheet = {
    name: '汇总',
    header: ['项', '值'],
    rows: [
      ['检查对象', title],
      ['规则库', `${report.plugin} v${report.rulesetVersion}`],
      ['核对时间', report.checkedAt],
      ['错误', report.summary.error],
      ['提示', report.summary.warn],
      ['参考', report.summary.info],
      ['已执行规则', report.issues.length > 0 ? '见差异清单' : '见未执行'],
      ['未执行规则', report.skipped.length],
    ] as Cell[][],
    widths: [18, 60],
  }

  const findings: Sheet = {
    name: '差异清单',
    header: [...FINDING_COLUMNS],
    rows: report.issues.map((issue, index) => [
      index + 1,
      SEVERITY_LABEL[issue.severity] ?? issue.severity,
      issue.ruleId,
      locatorText(issue),
      issue.found,
      issue.expected,
      issue.fix ?? '',
      issue.basis ?? '',
      '',
    ]) as Cell[][],
    widths: [6, 10, 12, 26, 46, 30, 34, 52, 10],
    freezeAfterColumn: 4,
  }

  const skipped: Sheet = {
    name: '未执行',
    header: ['规则', '原因'],
    rows: report.skipped.map((entry) => [entry.rule, entry.reason]) as Cell[][],
    widths: [14, 70],
  }

  return writeWorkbook([summary, findings, skipped])
}
