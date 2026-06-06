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
