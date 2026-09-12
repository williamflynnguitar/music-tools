#!/usr/bin/env node
/*
 * spine-sync — keep the duplicated spine-menu block byte-identical.
 *
 *   node scripts/spine-sync.js            copy the block from the canonical
 *                                         page into every other tool page
 *   node scripts/spine-sync.js --check    report drift; exit 1 if any
 *
 * The block is duplicated on purpose: every tool is one self-contained file
 * with no build step (root CLAUDE.md). Hand-editing 14 copies is what drifts,
 * so edit the canonical page and run this. --check also verifies that the
 * spine and the landing page list the same tools, which is the other half of
 * the convention: the spine mirrors index.html.
 */
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const CANON = "fretboard/index.html";           // any carrier can be canonical; this is it
const OPEN = "<!-- ===== spine menu";
const CLOSE = "<!-- ===== end spine menu ===== -->";
const check = process.argv.includes("--check");

const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const carriers = fs.readdirSync(ROOT)
  .filter(d => fs.existsSync(path.join(ROOT, d, "index.html")) && fs.statSync(path.join(ROOT, d)).isDirectory())
  .map(d => d + "/index.html")
  .filter(f => read(f).includes(OPEN));

function slice(src, file){
  const a = src.indexOf(OPEN), b = src.indexOf(CLOSE);
  if (a < 0 || b < 0) throw new Error("no spine markers in " + file);
  return { a, b: b + CLOSE.length, text: src.slice(a, b + CLOSE.length) };
}

const canon = slice(read(CANON), CANON).text;
let bad = 0;

for (const f of carriers){
  if (f === CANON) continue;
  const src = read(f), cur = slice(src, f);
  if (cur.text === canon) continue;
  if (check){ console.log("DRIFT  " + f); bad++; continue; }
  fs.writeFileSync(path.join(ROOT, f), src.slice(0, cur.a) + canon + src.slice(cur.b));
  console.log("synced " + f);
}

// the spine and the landing page must list the same tools
const spineTools = [...canon.matchAll(/<a class="sp-item" data-sp="([^"]+)"/g)].map(m => m[1]);
const indexTools = [...read("index.html").matchAll(/<a href="([a-z0-9-]+)\/">/g)].map(m => m[1]);
const missingFromSpine = indexTools.filter(t => !spineTools.includes(t));
const missingFromIndex = spineTools.filter(t => !indexTools.includes(t));
const notCarrying = spineTools.filter(t => !carriers.includes(t + "/index.html"));
for (const t of missingFromSpine){ console.log("ON INDEX, NOT IN SPINE  " + t); bad++; }
for (const t of missingFromIndex){ console.log("IN SPINE, NOT ON INDEX  " + t); bad++; }
for (const t of notCarrying){ console.log("IN SPINE, PAGE HAS NO SPINE BLOCK  " + t); bad++; }

console.log((check ? "checked " : "canonical " + CANON + " → ") + carriers.length + " pages" + (bad ? ", " + bad + " problem(s)" : ", all consistent"));
process.exit(bad && check ? 1 : 0);
