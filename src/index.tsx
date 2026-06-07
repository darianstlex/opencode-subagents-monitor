/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginModule, TuiSlotContext, TuiHostSlotMap } from "@opencode-ai/plugin/tui"
import { SidebarFooter } from "./components/Footer"
import { SubagentList } from "./components/SubagentList"

const id = "opencode-subagents-monitor"

const tui: TuiPlugin = async (api, options) => {
  const showSubagentList = options?.showSubagentList === true
  const maxItems = (options?.maxItems as number | undefined) ?? 5

  api.slots.register({
    order: 50,
    slots: {
      sidebar_footer(_ctx: TuiSlotContext, props: TuiHostSlotMap["sidebar_footer"]) {
        return <SidebarFooter api={api} sessionId={props.session_id} />
      },
    },
  })

  if (showSubagentList) {
    api.slots.register({
      order: 51,
      slots: {
        sidebar_content(_ctx: TuiSlotContext, props: TuiHostSlotMap["sidebar_content"]) {
          return <SubagentList api={api} sessionId={props.session_id} maxItems={maxItems} />
        },
      },
    })
  }
}

const plugin: TuiPluginModule & { id: string } = { id, tui }
export default plugin
