#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { join, relative, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const { transformSolidSource } = await import(
  join(__dirname, "../node_modules/@opentui/solid/scripts/solid-transform.js")
)

const SRC = "src"
const OUT = "src/tui-compiled"

const RUNTIME_REWRITES = {
  "@opentui/solid": "opentui:runtime-module:%40opentui%2Fsolid",
  "solid-js": "opentui:runtime-module:solid-js",
  "solid-js/store": "opentui:runtime-module:solid-js%2Fstore",
}

function collectFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "tui-compiled" || entry === "entry.mjs") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      collectFiles(full, acc)
    } else if (/\.[cm]?[jt]sx?$/.test(entry)) {
      acc.push(full)
    }
  }
  return acc
}

async function main() {
  const files = collectFiles(SRC)
  mkdirSync(OUT, { recursive: true })

  for (const file of files) {
    const rel = relative(SRC, file)
    const outPath = join(OUT, rel)
    mkdirSync(dirname(outPath), { recursive: true })

    const code = readFileSync(file, "utf8")

    const result = await transformSolidSource(code, {
      filename: file,
      moduleName: "@opentui/solid",
      resolvePath(specifier) {
        return RUNTIME_REWRITES[specifier] ?? specifier
      },
    })

    writeFileSync(outPath, `// @ts-nocheck\n${result}`)
  }

  console.log(`build-tui: compiled ${files.length} files → ${OUT}/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
