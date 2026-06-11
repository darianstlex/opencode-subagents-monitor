/** @jsxImportSource @opentui/solid */
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createSignal, createMemo, onCleanup, For } from "solid-js"
import type { RunningTask } from "../filters"

function formatRuntime(startTime: number): string {
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  if (elapsed < 60) return `${elapsed}s`
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  return `${mins}m ${secs}s`
}

export function SubagentModal(props: { api: TuiPluginApi; tasks: () => RunningTask[] }) {
  const theme = () => props.api.theme.current

  // Tick every second to update runtimes
  const [tick, setTick] = createSignal(0)
  const timer = setInterval(() => setTick((t) => t + 1), 1000)
  onCleanup(() => clearInterval(timer))

  const rows = createMemo(() => {
    tick() // subscribe to tick for reactivity
    return props.tasks().map((t) => ({
      ...t,
      runtime: formatRuntime(t.startTime),
    }))
  })

  return (
    <box gap={1} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text>
          <span style={{ fg: theme().text }}>
            <b>Running Subagents</b>
          </span>
        </text>
        <text fg={theme().textMuted}>esc to close</text>
      </box>
      <box gap={0}>
        <box flexDirection="row" gap={2}>
          <text width={14} fg={theme().textMuted}>
            <b>Agent</b>
          </text>
          <text flexGrow={1} fg={theme().textMuted}>
            <b>Task</b>
          </text>
          <text width={8} fg={theme().textMuted}>
            <b>Time</b>
          </text>
        </box>
        <For each={rows()}>
          {(row) => (
            <box flexDirection="row" gap={2}>
              <text width={14} fg={theme().success}>
                {row.name}
              </text>
              <text flexGrow={1} fg={theme().text}>
                {row.title.length > 50 ? row.title.slice(0, 47) + "..." : row.title}
              </text>
              <text width={8} fg={theme().textMuted}>
                {row.runtime}
              </text>
            </box>
          )}
        </For>
      </box>
      <text fg={theme().textMuted}>
        {rows().length} active {rows().length === 1 ? "task" : "tasks"}
      </text>
    </box>
  )
}
