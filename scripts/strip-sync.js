#!/usr/bin/env node
/*
 * strip-sync — keep the duplicated practice-strip block byte-identical.
 *
 *   node scripts/strip-sync.js            copy the block from the canonical page
 *                                         into every other tool page, adding it
 *                                         before </body> where a page has none
 *   node scripts/strip-sync.js --check    report drift; exit 1 if any
 *
 * The strip is the bottom bar with Metronome (Two-and-Four's mini view in an
 * iframe) and Benchmarks. Like the spine menu it is duplicated on purpose:
 * every tool is one self-contained file with no build step (root CLAUDE.md).
 * Edit the canonical page and run this.
 *
 * A page's benchmark wording is NOT part of the block: it lives in a
 * window.PF_BENCHMARKS script just above it, and William writes it. --check
 * fails on any page still carrying `draft: true`, so unapproved wording
 * cannot ride along to the live site.
 */
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const CANON = "arpeggios-deck/index.html";
const SKIP = ["box-buddy", "stageplot", "chartwright"];   // they make paper, not practice (William, 2026-09-19)
const OPEN = "<!-- ===== practice strip";
const CLOSE = "<!-- ===== end practice strip ===== -->";
const check = process.argv.includes("--check");

const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const tools = fs.readdirSync(ROOT)
  .filter(d => fs.statSync(path.join(ROOT, d)).isDirectory() && fs.existsSync(path.join(ROOT, d, "index.html")))
  .filter(d => read(d + "/index.html").includes("<!-- ===== spine menu"));   // a tool page, not notation/ or briefs/
const carriers = tools.filter(d => !SKIP.includes(d)).map(d => d + "/index.html");

function slice(src, file){
  const a = src.indexOf(OPEN), b = src.indexOf(CLOSE);
  if (a < 0 && b < 0) return null;
  if (a < 0 || b < 0 || b < a) throw new Error("broken strip markers in " + file);
  return { a, b: b + CLOSE.length, text: src.slice(a, b + CLOSE.length) };
}

const canonSlice = slice(read(CANON), CANON);
if (!canonSlice) throw new Error("no strip block in the canonical page " + CANON);
const canon = canonSlice.text;
let bad = 0;

for (const f of carriers){
  const src = read(f), cur = slice(src, f);
  if (f !== CANON && (!cur || cur.text !== canon)){
    if (check){ console.log((cur ? "DRIFT  " : "NO STRIP BLOCK  ") + f); bad++; }
    else if (cur){ fs.writeFileSync(path.join(ROOT, f), src.slice(0, cur.a) + canon + src.slice(cur.b)); console.log("synced " + f); }
    else {
      const at = src.lastIndexOf("</body>");
      if (at < 0) throw new Error("no </body> in " + f);
      fs.writeFileSync(path.join(ROOT, f), src.slice(0, at) + canon + "\n" + src.slice(at));
      console.log("added  " + f);
    }
  }
  if (/PF_BENCHMARKS\s*=\s*\{\s*draft:\s*true/.test(read(f))){ console.log("DRAFT BENCHMARKS — not for the live site  " + f); bad++; }
}
for (const d of SKIP){
  const f = d + "/index.html";
  if (fs.existsSync(path.join(ROOT, f)) && read(f).includes(OPEN)){ console.log("SKIPPED PAGE CARRIES A STRIP  " + f); bad++; }
}

console.log((check ? "checked " : "canonical " + CANON + " → ") + carriers.length + " pages" + (bad ? ", " + bad + " problem(s)" : ", all consistent"));
process.exit(bad && check ? 1 : 0);
