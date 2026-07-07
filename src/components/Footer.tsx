/** @jsxImportSource @opentui/solid */
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createMemo, createSignal, createEffect, onCleanup } from "solid-js"
import { homedir } from "node:os"
import { selectDirectChildren, selectDirectChildrenRich, selectBackgroundFromParts, selectBackgroundFromPartsRich } from "../filters"
import type { TaskPart, SessionStatus, RunningTask } from "../filters"
import { SubagentModal } from "./Modal"

export function SidebarFooter(props: { api: TuiPluginApi; sessionId: string }) {
  const theme = props.api.theme.current

  const [tick, setTick] = createSignal(0)
  const bump = () => setTick((t) => t + 1)

  const unsub1 = props.api.event.on("session.status", bump)
  const unsub2 = props.api.event.on("message.part.updated", bump)
  onCleanup(() => {
    unsub1()
    unsub2()
  })

  const messages = createMemo(
    () => [...(props.api.state.session.messages(props.sessionId) ?? [])] as Array<{ id: string; role: string }>,
  )
  const partsFor = (msgId: string) => [...props.api.state.part(msgId)] as Array<TaskPart>
  const childStatus = (id: string) => props.api.state.session.status(id) as SessionStatus | undefined

  const [modalOpen, setModalOpen] = createSignal(false)

  const runningCount = createMemo(() => {
    tick()
    const ids = new Set([
      ...selectDirectChildren(messages(), partsFor, childStatus),
      ...selectBackgroundFromParts(messages(), partsFor),
    ])
    return ids.size
  })

  const runningTasks = createMemo((): RunningTask[] => {
    tick()
    const direct = selectDirectChildrenRich(messages(), partsFor, childStatus)
    const bg = selectBackgroundFromPartsRich(messages(), partsFor)
    const seen = new Set<string>()
    const all: RunningTask[] = []
    for (const t of [...direct, ...bg]) {
      if (!seen.has(t.id)) {
        seen.add(t.id)
        all.push(t)
      }
    }
    return all
  })

  createEffect(() => {
    if (runningCount() === 0 && modalOpen()) {
      setModalOpen(false)
      props.api.ui.dialog.clear()
    }
  })

  const openModal = () => {
    if (runningCount() === 0) return
    setModalOpen(true)
    props.api.ui.dialog.replace(
      () => <SubagentModal api={props.api} tasks={runningTasks} />,
      () => setModalOpen(false),
    )
    props.api.ui.dialog.setSize("large")
  }

  const path = createMemo(() => {
    const session = props.api.state.session.get(props.sessionId)
    const dir = session?.directory || props.api.state.path.directory || process.cwd()
    const home = homedir()
    const out = home && dir.startsWith(home) ? "~" + dir.slice(home.length) : dir
    const branch = session?.directory === props.api.state.path.directory ? props.api.state.vcs?.branch : undefined
    const full = branch ? out + ":" + branch : out
    const list = full.split("/")
    return { parent: list.slice(0, -1).join("/"), name: list.at(-1) ?? "" }
  })

  return (
    <box gap={1}>
      <text>
        <span style={{ fg: theme.textMuted }}>{path().parent}/</span>
        <span style={{ fg: theme.text }}>{path().name}</span>
      </text>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.success }}>•</span> <b>Open</b>
          <span style={{ fg: theme.text }}>
            <b>Code</b>
          </span>{" "}
          <span>{props.api.app.version}</span>
        </text>
        <box onMouseUp={openModal}>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.text }}>
              {runningCount() || ''}
            </span>{" "}
            <span style={{ fg: theme.success }}><b>{runningCount() ? '[••]' : '[··]'}</b></span>
          </text>
        </box>
      </box>
    </box>
  )
}
