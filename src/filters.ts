export interface TaskPart {
  type: "tool"
  tool: "task"
  id: string
  state: {
    status: "running" | "completed" | "error"
    input: { background?: boolean }
    metadata?: { sessionId?: string }
  }
}

export interface SessionStatus {
  type: "busy" | "idle" | "retry"
}

export function selectDirectChildren(
  messages: Array<{ id: string; role: string }>,
  getParts: (msgId: string) => Array<TaskPart>,
  getSessionStatus: (sessionId: string) => SessionStatus | undefined,
): string[] {
  const ids: string[] = []

  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const part of getParts(msg.id)) {
      if (part.type !== "tool" || part.tool !== "task") continue
      if (part.state.input.background === true) continue

      const { status, metadata } = part.state
      if (status === "running") {
        ids.push(part.id)
      } else if (status === "completed" && metadata?.sessionId) {
        const child = getSessionStatus(metadata.sessionId)
        if (child?.type === "busy" || child?.type === "retry") ids.push(part.id)
      }
    }
  }

  return ids
}

export interface BackgroundJob {
  id: string
  type: string
  status: "running" | "completed" | "error" | "cancelled"
}

export function selectBackgroundJobs(jobs: BackgroundJob[]): string[] {
  const ids: string[] = []

  for (const job of jobs) {
    if (job.type !== "task") continue
    if (job.status === "running") ids.push(job.id)
  }

  return ids
}

export interface SubagentInfo {
  id: string
  name: string
  startedAt: number
  title?: string
  type: "direct" | "background"
}

export function formatRunningTime(startMs: number): string {
  const now = Date.now()
  const diff = now - startMs
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export function selectSubagentsWithDetails(
  messages: Array<{ id: string; role: string }>,
  getParts: (msgId: string) => Array<TaskPart>,
  getSessionStatus: (sessionId: string) => SessionStatus | undefined,
  bgJobs: BackgroundJob[],
): SubagentInfo[] {
  const subagents: SubagentInfo[] = []

  // Direct children
  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const part of getParts(msg.id)) {
      if (part.type !== "tool" || part.tool !== "task") continue
      if (part.state.input.background === true) continue

      const { status, metadata } = part.state
      if (status === "running") {
        subagents.push({
          id: part.id,
          name: `Task ${part.id.slice(0, 8)}`,
          startedAt: Date.now(),
          title: undefined,
          type: "direct",
        })
      } else if (status === "completed" && metadata?.sessionId) {
        const child = getSessionStatus(metadata.sessionId)
        if (child?.type === "busy" || child?.type === "retry") {
          subagents.push({
            id: metadata.sessionId,
            name: `Session ${metadata.sessionId.slice(0, 8)}`,
            startedAt: Date.now(),
            title: undefined,
            type: "direct",
          })
        }
      }
    }
  }

  // Background jobs
  for (const job of bgJobs) {
    if (job.type !== "task") continue
    if (job.status === "running") {
      subagents.push({
        id: job.id,
        name: `BG ${job.id.slice(0, 8)}`,
        startedAt: Date.now(),
        title: undefined,
        type: "background",
      })
    }
  }

  return subagents
}
