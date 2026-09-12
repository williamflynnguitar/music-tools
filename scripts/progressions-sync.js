#!/usr/bin/env node
/*
 * progressions-sync — keep the duplicated PROGS/TUNES block byte-identical.
 *
 *   node scripts/progressions-sync.js            copy the block from the
 *                                                canonical page into every
 *                                                other carrier
 *   node scripts/progressions-sync.js --check    report drift; exit 1 if any
 *
 * Same bargain as spine-sync: every tool is one self-contained file with no
 * build step (root CLAUDE.md), so the progression and tune library is copied
 * rather than imported. Hand-editing three copies is what drifts — before
 * Sep 2026 shell-builder and voice-leading were already a tune library behind
 * inversion-drill — so edit the canonical page and run this.
 *
 * The block depends only on NOTE_PC and NAMES from the host page; everything
 * else it needs it defines itself. line-ladder is deliberately NOT a carrier:
 * its charts annotate every chord with a parent scale, so its TUNES is a
 * different thing that happens to share the titles.
 */
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const CANON = "inversion-drill/index.html";
const OPEN = "/* ===== shared progressions";
const CLOSE = "/* ===== end shared progressions ===== */";
const check = process.argv.includes("--check");

const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const carriers = fs.readdirSync(ROOT)
  .filter(d => fs.existsSync(path.join(ROOT, d, "index.html")) && fs.statSync(path.join(ROOT, d)).isDirectory())
  .map(d => d + "/index.html")
  .filter(f => read(f).includes(OPEN));

function slice(src, file){
  const a = src.indexOf(OPEN), b = src.indexOf(CLOSE);
  if (a < 0 || b < 0) throw new Error("no progression markers in " + file);
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

// the host page has to supply what the block leaves out
for (const f of carriers){
  const src = read(f);
  for (const g of ["NOTE_PC", "NAMES"]){
    if (!new RegExp("\\b(const|let|var)\\s+" + g + "\\b").test(src)){
      console.log("CARRIER MISSING " + g + "  " + f); bad++;
    }
  }
}

console.log((check ? "checked " : "canonical " + CANON + " → ") + carriers.length + " page(s)" + (bad ? ", " + bad + " problem(s)" : ", all consistent"));
process.exit(bad && check ? 1 : 0);
