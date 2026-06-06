import { describe, it, expect } from "bun:test"
import { selectDirectChildren, selectBackgroundJobs } from "../src/filters"
import type { TaskPart, SessionStatus, BackgroundJob } from "../src/filters"

describe("selectDirectChildren", () => {
  const noopStatus = (_id: string): SessionStatus | undefined => undefined

  const part = (id: string, state: TaskPart["state"]): TaskPart => ({ type: "tool", tool: "task", id, state })

  it("returns [] for empty messages", () => {
    expect(selectDirectChildren([], () => [], noopStatus)).toEqual([])
  })

  it("emits id for running task part", () => {
    const rows = selectDirectChildren(
      [{ id: "m1", role: "assistant" }],
      () => [part("p1", { status: "running", input: {} })],
      noopStatus,
    )
    expect(rows).toEqual(["p1"])
  })

  it("emits id for completed task with busy child session", () => {
    const rows = selectDirectChildren(
      [{ id: "m1", role: "assistant" }],
      () => [part("p2", { status: "completed", input: {}, metadata: { sessionId: "ses_1" } })],
      (id) => (id === "ses_1" ? { type: "busy" } : undefined),
    )
    expect(rows).toEqual(["p2"])
  })

  it("skips completed task with idle child session", () => {
    const rows = selectDirectChildren(
      [{ id: "m1", role: "assistant" }],
      () => [part("p3", { status: "completed", input: {}, metadata: { sessionId: "ses_2" } })],
      (id) => (id === "ses_2" ? { type: "idle" } : undefined),
    )
    expect(rows).toEqual([])
  })

  it("emits id for completed task with retry child session", () => {
    const rows = selectDirectChildren(
      [{ id: "m1", role: "assistant" }],
      () => [part("p_retry", { status: "completed", input: {}, metadata: { sessionId: "ses_3" } })],
      (id) => (id === "ses_3" ? { type: "retry" } : undefined),
    )
    expect(rows).toEqual(["p_retry"])
  })

  it("skips errored task parts", () => {
    const rows = selectDirectChildren(
      [{ id: "m1", role: "assistant" }],
      () => [part("p4", { status: "error", input: {} })],
      noopStatus,
    )
    expect(rows).toEqual([])
  })

  it("skips parts where input.background === true", () => {
    const rows = selectDirectChildren(
      [{ id: "m1", role: "assistant" }],
      () => [part("p5", { status: "running", input: { background: true } })],
      noopStatus,
    )
    expect(rows).toEqual([])
  })

  it("skips user messages", () => {
    const rows = selectDirectChildren(
      [{ id: "m1", role: "user" }],
      () => [part("p6", { status: "running", input: {} })],
      noopStatus,
    )
    expect(rows).toEqual([])
  })
})

describe("selectBackgroundJobs", () => {
  it("returns [] for empty jobs", () => {
    expect(selectBackgroundJobs([])).toEqual([])
  })

  it("emits id for running task-typed job", () => {
    const jobs: BackgroundJob[] = [{ id: "j1", type: "task", status: "running" }]
    expect(selectBackgroundJobs(jobs)).toEqual(["j1"])
  })

  it("skips completed, cancelled and errored jobs", () => {
    const jobs: BackgroundJob[] = [
      { id: "j2", type: "task", status: "completed" },
      { id: "j3", type: "task", status: "cancelled" },
      { id: "j4", type: "task", status: "error" },
    ]
    expect(selectBackgroundJobs(jobs)).toEqual([])
  })

  it("skips non-task-typed jobs", () => {
    const jobs: BackgroundJob[] = [{ id: "j5", type: "other", status: "running" }]
    expect(selectBackgroundJobs(jobs)).toEqual([])
  })
})
