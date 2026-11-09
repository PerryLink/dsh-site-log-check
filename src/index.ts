import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { Config } from './config.ts'
import type { Config as ConfigShape } from './config.ts'
import { runCheck } from './check.ts'
import { MaterialError, parseMaterial } from './parse.ts'
import { buildView } from './view.ts'
import { loadRulesetFile } from './shared/memo.ts'

export const name = 'dsh-site-log-check'
export const inject = ['tools']
export { Config }

/** Tool id exposed to the model, and the row id in `cordis.patch.yml`. */
export const TOOL_NAME = 'site_log_check'

/**
 * Locate a package-owned file such as the rule pack.
 *
 * Resolution order: absolute path, then every ancestor of the module directory,
 * then the process working directory. A wrong silent fallback would build a
 * report from the wrong rule pack, so a miss throws with the paths tried.
 *
 * @param relative - configured path, relative to the plugin package root.
 * @returns the resolved absolute path.
 * @throws Error naming every location tried, when the file is absent.
 */
export function resolvePackageFile(relative: string): string {
  if (isAbsolute(relative)) {
    if (existsSync(relative)) return relative
    throw new Error(`规则库文件不存在：${relative}`)
  }
  const tried: string[] = []
  let current = import.meta.dirname ?? process.cwd()
  for (;;) {
    const candidate = resolve(current, relative)
    tried.push(candidate)
    if (existsSync(candidate)) return candidate
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  const fromCwd = resolve(process.cwd(), relative)
  if (!tried.includes(fromCwd)) {
    tried.push(fromCwd)
    if (existsSync(fromCwd)) return fromCwd
  }
  throw new Error(`规则库文件未找到：${relative}；已尝试 ${tried.length} 个位置，最近一处为 ${tried[0] ?? ''}`)
}

/** Read material from a file path or use the inline text as-is. */
/** Map a few common export spellings onto the canonical log keys. */
function documentRows(rows: Record<string, string>[]): Record<string, string>[] {
  const aliases: Record<string, string[]> = {
    date: ['date', '日期', '记录日期'],
    weather: ['weather', '天气'],
    progress: ['progress', '施工进度', '进度'],
    supervision: ['supervision', '监理情况', '巡视情况'],
    issues: ['issues', '问题', '发现问题'],
    recorder: ['recorder', '记录人', '监理人员'],
  }
  return rows.map((row) => {
    const out: Record<string, string> = {}
    for (const [key, names] of Object.entries(aliases)) {
      const found = names.map((name) => row[name]).find((value) => typeof value === 'string' && value !== '')
      if (found !== undefined) out[key] = found
    }
    return out
  })
}

async function readMaterial(
  file: string | undefined,
  material: string | undefined,
  signal: AbortSignal,
  project: { name?: string; serviceStart?: string; serviceEnd?: string } = {},
): Promise<{ text: string; target: string }> {
  if (file !== undefined && file.trim() !== '') {
    const path = resolve(file)
    signal.throwIfAborted()
    const extension = extname(path).toLowerCase()
    if (['.docx', '.xlsx', '.xlsm', '.csv', '.tsv'].includes(extension)) {
      let ingestToTable: (source: Buffer, filename: string, options: Record<string, unknown>) => { ok: boolean; table?: { rows: Record<string, string>[] }; error?: string }
      try {
        const api = (await import('dsh-table-ingest/api')) as {
          ingestToTable: (source: Buffer, filename: string, options: Record<string, unknown>) => { ok: boolean; table?: { rows: Record<string, string>[] }; error?: string }
        }
        ingestToTable = api.ingestToTable
      } catch {
        throw new MaterialError('要直接读 Word/Excel/CSV，请先安装 dsh-table-ingest（dsh plugin --profile <name> add dsh-table-ingest），或先把材料转成 JSON/YAML。')
      }
      const buffer = await readFile(path, { signal })
      const table = ingestToTable(buffer, path, {})
      if (!table.ok || table.table === undefined) throw new MaterialError(`无法从 ${path} 抽出表格：${table.error ?? '未知原因'}`)
      const document = {
        target: path,
        project: {
          ...(project.name === undefined ? { name: basename(path).replace(/\.[^.]+$/u, '') } : { name: project.name }),
          ...(project.serviceStart === undefined ? {} : { serviceStart: project.serviceStart }),
          ...(project.serviceEnd === undefined ? {} : { serviceEnd: project.serviceEnd }),
        },
        logs: documentRows(table.table.rows),
      }
      return { text: JSON.stringify(document), target: path }
    }
    const text = await readFile(path, { encoding: 'utf8', signal })
    return { text, target: path }
  }
  if (material !== undefined && material.trim() !== '') return { text: material, target: '(内联材料)' }
  throw new MaterialError('必须提供 file 或 material 之一')
}

/**
 * Register the checker tool.
 *
 * Registration is an effect: `ctx.tools.register` returns the disposer that
 * removes the tool when this plugin unloads, which is what keeps the plugin
 * hot-reloadable.
 *
 * @param ctx - plugin context, with `tools` already available.
 * @param config - validated configuration.
 */
export function apply(ctx: Context, config: ConfigShape): () => void {
  return ctx.tools.register(
    defineTool({
      name: TOOL_NAME,
      description:
        '监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论）本工具只列出材料与所引条款之间的字面差异，供人工复核，不作出任何定性结论。' +
        '材料为 JSON 或 YAML；无法执行的检查会列在 skipped 中。',
      parameters: {
        file: { type: 'string', description: '材料文件绝对路径（JSON/YAML，或 .docx/.xlsx/.xlsm/.csv/.tsv；文档格式需安装 dsh-table-ingest）。与 material 二选一。' },
        material: { type: 'string', description: '内联材料文本（JSON 或 YAML）。与 file 二选一。' },
        projectName: { type: 'string', description: '文档输入时的工程名称；默认用文件名。' },
        serviceStart: { type: 'string', description: '文档输入时的监理服务开始日（YYYY-MM-DD）。' },
        serviceEnd: { type: 'string', description: '文档输入时的监理服务结束日（YYYY-MM-DD）。' },
        rulesFile: { type: 'string', description: '覆盖配置中的规则库路径（相对插件包根或绝对路径）。' },
        only: {
          type: 'array',
          items: { type: 'string' },
          description: '只执行这些规则 id；留空表示执行全部规则。',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            plugin: { type: 'string' },
            target: { type: 'string' },
            checkedAt: { type: 'string' },
            rulesetVersion: { type: 'string' },
            summary: {
              type: 'object',
              additionalProperties: false,
              properties: {
                error: { type: 'integer' },
                warn: { type: 'integer' },
                info: { type: 'integer' },
              },
            },
            issueCount: { type: 'integer' },
            skippedCount: { type: 'integer' },
            execution: {
              type: 'object',
              additionalProperties: false,
              properties: {
                total: { type: 'integer' },
                executed: { type: 'integer' },
                skipped: { type: 'integer' },
                manual: { type: 'integer' },
                unsupported: { type: 'integer' },
              },
            },
            markdown: { type: 'string' },
            reportJson: { type: 'string' },
            workbookBase64: { type: 'string', description: '同一份报告的 xlsx 工作簿（base64）。' },
          },
        },
        render: (_args, value) => [{ type: 'text', text: (value as { markdown: string }).markdown }],
      },
      timeoutMs: config.timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const relative = args.rulesFile !== undefined && args.rulesFile.trim() !== '' ? args.rulesFile : config.rulesFile
        const [material, ruleset] = await Promise.all([
          readMaterial(args.file, args.material, exec.signal, { name: args.projectName, serviceStart: args.serviceStart, serviceEnd: args.serviceEnd }),
          loadRulesetFile(resolvePackageFile(relative)),
        ])
        exec.signal.throwIfAborted()
        const input = parseMaterial(material.text, material.target)
        const only = (args.only ?? []).length > 0 ? (args.only as string[]) : config.onlyRules
        const report = runCheck(input, ruleset, {
          plugin: name,
          checkedAt: new Date().toISOString(),
          disabledRules: config.disabledRules,
          onlyRules: only,
          skipNotes: config.skipNotes === '' ? undefined : config.skipNotes,
        })
        return buildView(report)
      },
    }),
  )
}
