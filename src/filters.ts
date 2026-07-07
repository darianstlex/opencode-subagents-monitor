export interface TaskPart {
  type: "tool"
  tool: "task"
  id: string
  state: {
    status: "running" | "completed" | "error"
    input: { background?: boolean; description?: string; subagent_type?: string; category?: string }
    title?: string
    metadata?: { sessionId?: string; background?: boolean }
    time?: { start: number }
  }
}

export interface SessionStatus {
  type: "busy" | "idle" | "retry"
}

export interface RunningTask {
  id: string
  name: string
  title: string
  startTime: number
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
      if (part.state.input.background === true || part.state.metadata?.background === true) continue

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

export function selectDirectChildrenRich(
  messages: Array<{ id: string; role: string }>,
  getParts: (msgId: string) => Array<TaskPart>,
  getSessionStatus: (sessionId: string) => SessionStatus | undefined,
): RunningTask[] {
  const tasks: RunningTask[] = []

  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const part of getParts(msg.id)) {
      if (part.type !== "tool" || part.tool !== "task") continue
      if (part.state.input.background === true || part.state.metadata?.background === true) continue

      const { status, metadata, input, title, time } = part.state
      let active = false
      if (status === "running") {
        active = true
      } else if (status === "completed" && metadata?.sessionId) {
        const child = getSessionStatus(metadata.sessionId)
        if (child?.type === "busy" || child?.type === "retry") active = true
      }

      if (active) {
        tasks.push({
          id: part.id,
          name: input.subagent_type || input.category || "task",
          title: title || input.description || "Running...",
          startTime: time?.start || Date.now(),
        })
      }
    }
  }

  return tasks
}

export interface BackgroundJob {
  id: string
  type: string
  status: "running" | "completed" | "error" | "cancelled"
  description?: string
  startTime?: number
  input?: { description?: string; subagent_type?: string; category?: string }
}

export function selectBackgroundJobs(jobs: BackgroundJob[]): string[] {
  const ids: string[] = []

  for (const job of jobs) {
    if (job.type !== "task") continue
    if (job.status === "running") ids.push(job.id)
  }

  return ids
}

export function selectBackgroundJobsRich(jobs: BackgroundJob[]): RunningTask[] {
  const tasks: RunningTask[] = []

  for (const job of jobs) {
    if (job.type !== "task") continue
    if (job.status !== "running") continue
    tasks.push({
      id: job.id,
      name: job.input?.subagent_type || job.input?.category || "background",
      title: job.description || job.input?.description || "Running...",
      startTime: job.startTime || Date.now(),
    })
  }

  return tasks
}

export function selectBackgroundFromParts(
  messages: Array<{ id: string; role: string }>,
  getParts: (msgId: string) => Array<TaskPart>,
): string[] {
  const ids: string[] = []

  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const part of getParts(msg.id)) {
      if (part.type !== "tool" || part.tool !== "task") continue
      if (part.state.input.background !== true && part.state.metadata?.background !== true) continue
      if (part.state.status === "running") ids.push(part.id)
    }
  }

  return ids
}

export function selectBackgroundFromPartsRich(
  messages: Array<{ id: string; role: string }>,
  getParts: (msgId: string) => Array<TaskPart>,
): RunningTask[] {
  const tasks: RunningTask[] = []

  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const part of getParts(msg.id)) {
      if (part.type !== "tool" || part.tool !== "task") continue
      if (part.state.input.background !== true && part.state.metadata?.background !== true) continue
      if (part.state.status !== "running") continue

      const { input, title, time } = part.state
      tasks.push({
        id: part.id,
        name: input.subagent_type || input.category || "background",
        title: title || input.description || "Running...",
        startTime: time?.start || Date.now(),
      })
    }
  }

  return tasks
}
