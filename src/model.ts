/**
 * Input contract for the site-supervision-log checker.
 *
 * The material is what a supervision office can export: the project's supervision
 * service period, the daily supervision logs, the declared list of key works that
 * require on-site supervision, and the on-site supervision records themselves.
 * Anything the contract cannot express is reported as `skipped`.
 */

/** One daily supervision log entry (监理日志). */
export interface SiteLogEntry {
  /** Stable identifier used in locators. */
  id?: string
  /** 1-based source row, when the material was tabular. */
  row?: number
  /** Calendar date of the entry, `YYYY-MM-DD`. */
  date: string
  /** 天气和施工环境情况. */
  weather?: string
  /** 当日施工进展情况. */
  progress?: string
  /** 当日监理工作情况（含旁站、巡视、见证取样、平行检验）. */
  supervision?: string
  /** 当日存在的问题及处理情况. */
  issues?: string
  /** 其他有关事项. */
  others?: string
  /** 记录人（组织编写人为专业监理工程师）. */
  recorder?: string
}

/** One key work item that requires on-site supervision (旁站的关键部位、关键工序). */
export interface KeyWorkItem {
  name: string
  /** 施工单位 responsible for the work, when known. */
  contractor?: string
  row?: number
}

/** One on-site supervision record (旁站记录, 表 A.0.6). */
export interface OnsiteRecord {
  id?: string
  row?: number
  /** 旁站的关键部位、关键工序. */
  keyWork?: string
  /** 施工单位. */
  contractor?: string
  /** 旁站开始时间. */
  startedAt?: string
  /** 旁站结束时间. */
  endedAt?: string
  /** 发现的问题及处理情况. */
  issues?: string
  /** 旁站监理人员（签字）. */
  supervisorSignature?: string
  /** 施工企业现场质检人员签字（建市〔2002〕189号第七条）. */
  contractorSignature?: string
}

/** The whole normalized input. */
export interface SiteLogInput {
  target: string
  project: {
    /** 单位工程名称, for report headers only. */
    name?: string
    /** Start of the supervision service period. */
    serviceStart?: string
    /** End of the supervision service period. */
    serviceEnd?: string
  }
  logs: SiteLogEntry[]
  keyWorks: KeyWorkItem[]
  onsite: OnsiteRecord[]
  warnings: string[]
}
