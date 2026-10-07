/**
 * Reader for the canonical site-supervision-log material.
 *
 * The material is JSON or YAML. Every field is optional at the reader level and
 * validated by the check engine, so a partial export produces findings about the
 * missing parts instead of a reader crash.
 */

import { YamlSubsetError, parseYaml } from './shared/yaml.ts'
import { parseWallClock } from './shared/datetime.ts'
import type { KeyWorkItem, OnsiteRecord, SiteLogEntry, SiteLogInput } from './model.ts'

/** Raised when the material cannot be read at all. */
export class MaterialError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MaterialError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asArray(value: unknown, where: string): Record<string, unknown>[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new MaterialError(`${where} 必须是列表`)
  return value.map((entry, index) => {
    if (!isRecord(entry)) throw new MaterialError(`${where}[${index}] 必须是映射`)
    return entry
  })
}

function text(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') return value.trim() === '' ? undefined : value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return String(value)
  return undefined
}

function optionalRow(value: unknown): number | undefined {
  const raw = text(value)
  if (raw === undefined || !/^\d+$/.test(raw)) return undefined
  return Number.parseInt(raw, 10)
}

/** Normalize a date-ish string to `YYYY-MM-DD`, warning when it is unreadable. */
function stampDate(value: unknown, where: string, warnings: string[]): string | undefined {
  const raw = text(value)
  if (raw === undefined) return undefined
  const wall = parseWallClock(raw)
  if (wall === undefined) {
    warnings.push(`${where} 的日期「${raw}」不是可识别的 YYYY-MM-DD 形式，相关连续性检查将被跳过`)
    return undefined
  }
  return wall.date
}

/** Normalize a timestamp, warning when it is unreadable. */
function stampTime(value: unknown, where: string, warnings: string[]): string | undefined {
  const raw = text(value)
  if (raw === undefined) return undefined
  if (parseWallClock(raw) === undefined) {
    warnings.push(`${where} 的时间「${raw}」不是可识别的日期时间形式`)
    return undefined
  }
  return raw
}

function parseLog(raw: Record<string, unknown>, index: number, warnings: string[]): SiteLogEntry {
  const where = `logs[${index}]`
  const entry: SiteLogEntry = { date: stampDate(raw.date ?? raw.logDate, where, warnings) ?? '' }
  const id = text(raw.id)
  if (id !== undefined) entry.id = id
  const row = optionalRow(raw.row)
  if (row !== undefined) entry.row = row
  for (const key of ['weather', 'progress', 'supervision', 'issues', 'others', 'recorder'] as const) {
    const value = text(raw[key])
    if (value !== undefined) entry[key] = value
  }
  return entry
}

function parseKeyWork(raw: Record<string, unknown>, index: number): KeyWorkItem {
  const name = text(raw.name ?? raw.keyWork)
  if (name === undefined) throw new MaterialError(`keyWorks[${index}] 缺少必填字段 name`)
  const item: KeyWorkItem = { name }
  const contractor = text(raw.contractor)
  if (contractor !== undefined) item.contractor = contractor
  const row = optionalRow(raw.row)
  if (row !== undefined) item.row = row
  return item
}

function parseOnsite(raw: Record<string, unknown>, index: number, warnings: string[]): OnsiteRecord {
  const where = `onsite[${index}]`
  const record: OnsiteRecord = {}
  const id = text(raw.id)
  if (id !== undefined) record.id = id
  const row = optionalRow(raw.row)
  if (row !== undefined) record.row = row
  const keyWork = text(raw.keyWork ?? raw.work)
  if (keyWork !== undefined) record.keyWork = keyWork
  const contractor = text(raw.contractor)
  if (contractor !== undefined) record.contractor = contractor
  const startedAt = stampTime(raw.startedAt, `${where}.startedAt`, warnings)
  if (startedAt !== undefined) record.startedAt = startedAt
  const endedAt = stampTime(raw.endedAt, `${where}.endedAt`, warnings)
  if (endedAt !== undefined) record.endedAt = endedAt
  const issues = text(raw.issues)
  if (issues !== undefined) record.issues = issues
  const supervisorSignature = text(raw.supervisorSignature ?? raw.supervisor)
  if (supervisorSignature !== undefined) record.supervisorSignature = supervisorSignature
  const contractorSignature = text(raw.contractorSignature)
  if (contractorSignature !== undefined) record.contractorSignature = contractorSignature
  return record
}

/**
 * Parse material into the normalized input contract.
 * @param source - JSON or YAML text.
 * @param target - description of where the material came from.
 * @returns normalized input plus reader diagnostics.
 */
export function parseMaterial(source: string, target: string): SiteLogInput {
  const trimmed = source.trim()
  if (trimmed === '') throw new MaterialError('材料为空')
  let document: unknown
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      document = JSON.parse(trimmed)
    } catch (error) {
      throw new MaterialError(`JSON 无法解析：${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    try {
      document = parseYaml(trimmed)
    } catch (error) {
      if (error instanceof YamlSubsetError) throw new MaterialError(`YAML 无法解析：${error.message}`)
      throw error
    }
  }
  if (!isRecord(document)) throw new MaterialError('材料根节点必须是映射')

  const warnings: string[] = []
  const rawProject = isRecord(document.project) ? document.project : {}
  const project: SiteLogInput['project'] = {}
  const name = text(rawProject.name)
  if (name !== undefined) project.name = name
  const serviceStart = stampDate(rawProject.serviceStart, 'project.serviceStart', warnings)
  if (serviceStart !== undefined) project.serviceStart = serviceStart
  const serviceEnd = stampDate(rawProject.serviceEnd, 'project.serviceEnd', warnings)
  if (serviceEnd !== undefined) project.serviceEnd = serviceEnd

  const input: SiteLogInput = {
    target,
    project,
    logs: asArray(document.logs, 'logs').map((entry, index) => parseLog(entry, index, warnings)),
    keyWorks: asArray(document.keyWorks, 'keyWorks').map((entry, index) => parseKeyWork(entry, index)),
    onsite: asArray(document.onsite, 'onsite').map((entry, index) => parseOnsite(entry, index, warnings)),
    warnings,
  }

  if (input.logs.length === 0 && input.onsite.length === 0) {
    throw new MaterialError('材料中没有 logs 或 onsite 任何一项，无法执行检查')
  }
  const unusable = input.logs.filter((entry) => entry.date === '')
  if (unusable.length > 0) warnings.push(`有 ${unusable.length} 条日志的日期无法识别，不参与连续性比对`)

  return input
}
