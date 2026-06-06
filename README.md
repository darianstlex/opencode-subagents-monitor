# opencode-subagents-monitor

[![npm version](https://img.shields.io/npm/v/opencode-subagents-monitor.svg)](https://www.npmjs.com/package/opencode-subagents-monitor)
[![npm downloads](https://img.shields.io/npm/dm/opencode-subagents-monitor.svg)](https://www.npmjs.com/package/opencode-subagents-monitor)
[![license](https://img.shields.io/npm/l/opencode-subagents-monitor.svg)](./LICENSE)

OpenCode TUI plugin that shows the number of running subagents in the sidebar footer.

## Install

Quickest — run the installer, which adds the plugin to your global `tui.json`:

```bash
npx opencode-subagents-monitor
```

Then restart OpenCode.

> `npx` here runs a small installer that edits your config; it does **not** "run" the plugin (a TUI plugin only renders inside OpenCode). If your `tui.json` contains comments, the installer leaves it untouched and prints the line to add manually.

### Manual

This is a **TUI plugin**, so it goes in `tui.json` (not `opencode.json`).

Add to your project `tui.json`, or your global `~/.config/opencode/tui.json` to enable it everywhere:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["opencode-subagents-monitor"]
}
```

Restart OpenCode after editing the file.

> Installing via the `plugin` array in `opencode.json` will fail to load — that list is for server plugins, which loads the bundled entry and cannot resolve the TUI JSX runtime. TUI plugins must be registered through `tui.json`.

## What it shows

The plugin replaces the sidebar footer, appending a running-subagent count on the right of the `• OpenCode {version}` line:

```
~/projects/my-project:main
• OpenCode 1.16.2                 3 [••]
```

The number counts active subagents, covering both direct child sessions and background-mode tasks (`task` tool with `background: true`). With none running it shows `[··]`.

## Development

```bash
bun install
bun test          # unit tests
bun run typecheck # tsc --noEmit
```

The plugin ships as raw TypeScript source — OpenCode loads `src/index.tsx`
directly via the `./tui` export and applies the SolidJS/JSX transform at
load time. There is no build step.

## License

MIT
