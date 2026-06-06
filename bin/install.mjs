#!/usr/bin/env node
// One-command installer: adds this plugin to opencode's global tui.json.
// Plain ESM (no build step) so `npx opencode-subagents-monitor` runs on stock node.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const PLUGIN = "opencode-subagents-monitor"

// Mirror opencode's global config dir resolution (config/paths.ts + global):
//   $OPENCODE_CONFIG_DIR  >  $XDG_CONFIG_HOME/opencode  >  ~/.config/opencode
function configDir() {
  if (process.env.OPENCODE_CONFIG_DIR) return process.env.OPENCODE_CONFIG_DIR
  const xdg = process.env.XDG_CONFIG_HOME
  return xdg ? join(xdg, "opencode") : join(homedir(), ".config", "opencode")
}

function hasPlugin(plugins) {
  return plugins.some((p) => p === PLUGIN || (typeof p === "string" && p.startsWith(`${PLUGIN}@`)))
}

function manualHint(file) {
  console.log(`\nAdd this entry manually to ${file}:\n`)
  console.log(`  { "plugin": ["${PLUGIN}"] }\n`)
  console.log("Then restart opencode.")
}

function main() {
  const dir = configDir()
  // opencode reads tui.json or tui.jsonc; prefer an existing one, else create tui.json.
  const jsonc = join(dir, "tui.jsonc")
  const json = join(dir, "tui.json")
  const file = existsSync(jsonc) ? jsonc : json

  if (!existsSync(file)) {
    mkdirSync(dir, { recursive: true })
    const content = { $schema: "https://opencode.ai/tui.json", plugin: [PLUGIN] }
    writeFileSync(file, `${JSON.stringify(content, null, 2)}\n`)
    console.log(`Created ${file} with ${PLUGIN}.`)
    console.log("Restart opencode to load the plugin.")
    return
  }

  const raw = readFileSync(file, "utf8")
  let config
  try {
    config = JSON.parse(raw)
  } catch {
    // Likely JSONC with comments — don't risk corrupting it.
    console.log(`Could not parse ${file} as plain JSON (it may contain comments).`)
    manualHint(file)
    return
  }

  const plugins = Array.isArray(config.plugin) ? config.plugin : []
  if (Array.isArray(config.plugin) && hasPlugin(plugins)) {
    console.log(`${PLUGIN} is already installed in ${file}.`)
    return
  }
  if (!Array.isArray(config.plugin) && config.plugin !== undefined) {
    console.log(`"plugin" in ${file} is not an array — leaving it untouched.`)
    manualHint(file)
    return
  }

  config.plugin = [...plugins, PLUGIN]
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`)
  console.log(`Added ${PLUGIN} to ${file}.`)
  console.log("Restart opencode to load the plugin.")
}

main()
