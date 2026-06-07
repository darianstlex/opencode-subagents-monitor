/** @jsxImportSource @opentui/solid */
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createMemo, createSignal, onCleanup, For } from "solid-js"
import { selectSubagentsWithDetails, formatRunningTime } from "../filters"
import type { TaskPart, SessionStatus, BackgroundJob, SubagentInfo } from "../filters"

export interface SubagentListProps {
  api: TuiPluginApi
  sessionId: string
  maxItems?: number
}

export function SubagentList(props: SubagentListProps) {
  const theme = () => props.api.theme.current
  const maxItems = props.maxItems ?? 5

  const messages = createMemo(
    () => [...(props.api.state.session.messages(props.sessionId) ?? [])] as Array<{ id: string; role: string }>,
  )
  const partsFor = (msgId: string) => [...props.api.state.part(msgId)] as Array<TaskPart>
  const childStatus = (id: string) => props.api.state.session.status(id) as SessionStatus | undefined

  const [bgJobs, setBgJobs] = createSignal<BackgroundJob[]>([])

  const refresh = () => {
    const client = props.api.client as unknown as Record<string, unknown>
    const bg = client.background as Record<string, unknown> | undefined
    const listFn = bg?.list ?? (client.session as Record<string, unknown> | undefined)?.background
    if (typeof listFn === "function") {
      Promise.resolve(listFn({ path: { sessionID: props.sessionId } }))
        .then((res: unknown) => {
          const jobs = (res as Record<string, unknown>)?.data ?? res
          setBgJobs(Array.isArray(jobs) ? (jobs as BackgroundJob[]) : [])
        })
        .catch(() => setBgJobs([]))
    }
  }
  refresh()

  const unsub1 = props.api.event.on("session.status", refresh)
  const unsub2 = props.api.event.on("message.part.updated", refresh)
  onCleanup(() => {
    unsub1()
    unsub2()
  })

  const subagents = createMemo(() => {
    return selectSubagentsWithDetails(messages(), partsFor, childStatus, bgJobs())
  })

  const displayItems = createMemo((): SubagentInfo[] => {
    const items = subagents()
    if (items.length <= maxItems) {
      return items
    }
    return items.slice(0, maxItems)
  })

  const hasMore = createMemo(() => subagents().length > maxItems)

  // Empty state: don't render anything
  if (subagents().length === 0) {
    return null
  }

  return (
    <box flexDirection="column">
      <box>
        <text style={{ fg: theme().text }}><b>Subagents</b></text>
      </box>
      <box>
        <text style={{ fg: theme().textMuted }}>──────────</text>
      </box>
      <For each={displayItems()}>
        {(agent) => (
          <box flexDirection="row" justifyContent="space-between">
            <text style={{ fg: theme().text }}>
              {agent.type === "background" && <span style={{ fg: theme().textMuted }}>BG </span>}
              {agent.name}
            </text>
            <text style={{ fg: theme().textMuted }}>{formatRunningTime(agent.startedAt)}</text>
            {agent.title && (
              <text style={{ fg: theme().textMuted }}>
                {agent.title.length > 25 ? agent.title.slice(0, 25) + "..." : agent.title}
              </text>
            )}
          </box>
        )}
      </For>
      {hasMore() && (
        <box>
          <text style={{ fg: theme().textMuted }}>...</text>
        </box>
      )}
    </box>
  )
}
