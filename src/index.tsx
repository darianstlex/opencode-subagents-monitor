/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginModule, TuiSlotContext, TuiHostSlotMap } from "@opencode-ai/plugin/tui"
import { SidebarFooter } from "./components/Footer"

const id = "opencode-subagents-monitor"

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 50,
    slots: {
      sidebar_footer(_ctx: TuiSlotContext, props: TuiHostSlotMap["sidebar_footer"]) {
        return <SidebarFooter api={api} sessionId={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = { id, tui }
export default plugin
