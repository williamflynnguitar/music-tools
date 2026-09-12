#!/usr/bin/env node
/*
 * stretch-sync — keep the duplicated stretch-measurement block byte-identical.
 *
 *   node scripts/stretch-sync.js            copy the block from the canonical
 *                                           page into every other carrier
 *   node scripts/stretch-sync.js --check    report drift; exit 1 if any
 *
 * Same bargain as spine-sync and progressions-sync: every tool is one
 * self-contained file with no build step (root CLAUDE.md), so the measurement
 * is copied rather than imported. The threshold is a teaching decision, not a
 * per-tool preference — a student who meets "stretch" in the Inversion Drill
 * and not in Shell Builder learns that the mark is arbitrary — so the number
 * and the wording live in one place and are copied.
 *
 * The block depends on nothing from the host page, which is why there is no
 * missing-global check here. What each carrier still owns is the drawing: the
 * mark is an SVG tag on tools that render a fret box and a chip beside the
 * chord symbol on Voice Leading, which renders staff and TAB instead.
 *
 * Carriers are discovered by the marker, so a tool joins simply by pasting the
 * block in. A tool that renders voicings but carries no block is reported, so
 * that a new voicing tool cannot quietly ship without the mark.
 */
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const CANON = "shell-builder/index.html";
const OPEN = "/* ===== stretch";
const CLOSE = "/* ===== end stretch ===== */";
const check = process.argv.includes("--check");

/* tools that draw chord voicings and therefore owe the reader the mark */
const VOICING_TOOLS = ["shell-builder", "inversion-drill", "voice-leading",
                       "triad-voicings", "quartal-voicings", "box-buddy"];

const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const carriers = fs.readdirSync(ROOT)
  .filter(d => fs.existsSync(path.join(ROOT, d, "index.html")) && fs.statSync(path.join(ROOT, d)).isDirectory())
  .map(d => d + "/index.html")
  .filter(f => read(f).includes(OPEN));

function slice(src, file){
  const a = src.indexOf(OPEN), b = src.indexOf(CLOSE);
  if (a < 0 || b < 0) throw new Error("no stretch markers in " + file);
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

/* a voicing tool without the block would show a student an unmarked stretch */
for (const t of VOICING_TOOLS){
  if (!carriers.includes(t + "/index.html")){
    console.log("VOICING TOOL WITHOUT THE BLOCK  " + t); bad++;
  }
}

/* carrying the measurement but never drawing it is the other way to fail */
for (const f of carriers){
  if (!/stretchNote\s*\(/.test(read(f).replace(/\/\* ===== stretch[\s\S]*?===== end stretch ===== \*\//, ""))){
    console.log("CARRIER NEVER CALLS stretchNote  " + f); bad++;
  }
}

console.log((check ? "checked " : "canonical " + CANON + " → ") + carriers.length + " page(s)" + (bad ? ", " + bad + " problem(s)" : ", all consistent"));
process.exit(bad && check ? 1 : 0);
