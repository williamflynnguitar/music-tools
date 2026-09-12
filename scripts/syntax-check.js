#!/usr/bin/env node
/*
 * syntax-check — parse the inline JavaScript of every tool.
 *
 *   node scripts/syntax-check.js
 *
 * There is no build step (root CLAUDE.md), so nothing between writing a tool
 * and a student opening it will tell us the script does not parse. On
 * 2026-09-12 a copy edit put "Freddie Green's style" inside a single-quoted
 * string literal in box-buddy; the apostrophe closed the string, the whole
 * script failed to parse, and the tool shipped completely dead — the style
 * picker never populated and Build chart did nothing. Nothing caught it,
 * because the per-tool check scripts test musical data rather than the page.
 *
 * This parses each page's <script> blocks together, the way the browser does.
 * It is a parse, not a run: it catches unterminated strings, stray brackets and
 * duplicate declarations in the same scope, not logic errors.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");

const ROOT = path.join(__dirname, "..");
const pages = fs.readdirSync(ROOT)
  .filter(d => fs.statSync(path.join(ROOT, d)).isDirectory() && !d.startsWith("."))
  .map(d => path.join(d, "index.html"))
  .filter(f => fs.existsSync(path.join(ROOT, f)))
  .concat(["index.html"]);

let bad = 0;
for (const page of pages){
  const src = fs.readFileSync(path.join(ROOT, page), "utf8");
  const blocks = [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(m => !/\bsrc=/.test(m[1]))
    .map(m => m[2]);
  if (!blocks.length) continue;
  try {
    new vm.Script(blocks.join("\n;\n"), { filename: page });
    console.log("ok      " + page + "  (" + blocks.length + " block" + (blocks.length > 1 ? "s" : "") + ")");
  } catch (e) {
    console.log("BROKEN  " + page + "  " + e.message);
    bad++;
  }
}
console.log(bad ? bad + " page(s) do not parse" : "all " + pages.length + " pages parse");
process.exit(bad ? 1 : 0);
