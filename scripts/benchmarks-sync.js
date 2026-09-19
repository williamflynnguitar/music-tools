#!/usr/bin/env node
/*
 * benchmarks-sync — write each tool's Benchmarks list from briefs/benchmarks.md.
 *
 *   node scripts/benchmarks-sync.js            regenerate the list script in every page
 *   node scripts/benchmarks-sync.js --check    report pages out of step; exit 1 if any
 *
 * William writes the benchmarks; the markdown file is the one place he edits.
 * The generated block sits just above the practice strip (which reads
 * window.PF_BENCHMARKS) and is separate from it, because the strip is
 * byte-identical across pages and the lists are not. Text goes through
 * JSON.stringify, so an apostrophe or quote in a benchmark cannot break the
 * page (see root CLAUDE.md, "No build step means nothing checks the page").
 */
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = "briefs/benchmarks.md";
const PAGES = {                       // "## heading" (up to two spaces / a bracket) → folder; null = a note, not a tool
  "Arpeggio practice": "arpeggios-deck", "Scale practice": "scales-deck", "Fretboard": "fretboard",
  "Shell Voicing Builder": "shell-builder", "Inversion Drill": "inversion-drill",
  "Voice-Leading Trainer": "voice-leading", "Triad Voicings": "triad-voicings",
  "Quartal Voicings": "quartal-voicings", "Charleston": "comping-rhythms", "Enclosures": "enclosures",
  "Line Ladder": "line-ladder", "Two-and-Four": "two-and-four", "Proposed to carry no list": null,
};
// which named list matches the page's current state (marked with the brass bar); page-side expressions
const ON = { "arpeggios-deck": { "Triads": 'state.size === "triad"', "7th chords": 'state.size === "seventh"' } };
const OPEN = "<!-- ===== benchmarks";
const OPEN_FULL = OPEN + " — generated from briefs/benchmarks.md by scripts/benchmarks-sync.js; edit the list there, not here ===== -->";
const CLOSE = "<!-- ===== end benchmarks ===== -->";
const STRIP = "<!-- ===== practice strip";
const check = process.argv.includes("--check");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

/* ---- parse ---- */
const pages = {};                     // folder → [{name, items:[{t, hint}]}]
let bad = 0, folder, list, item, bullet;
for (const raw of read(SRC).split("\n")){
  const line = raw.replace(/\s+$/, "");
  let m;
  if ((m = line.match(/^## (.+)$/))){
    const name = m[1].split(/ {2,}|\s*\(/)[0].trim();
    if (!(name in PAGES)){ console.log("NO PAGE FOR HEADING  " + name); bad++; folder = null; }
    else folder = PAGES[name];
    if (folder) pages[folder] = pages[folder] || [];
    list = item = bullet = null; continue;
  }
  if (!folder) continue;
  if ((m = line.match(/^### (.+)$/))){ list = { name: m[1].trim(), items: [] }; pages[folder].push(list); item = bullet = null; continue; }
  if ((m = line.match(/^(\d+)\. (.+)$/))){
    if (!list){ list = { name: "", items: [] }; pages[folder].push(list); }
    item = { t: m[2].trim() }; bullet = null; list.items.push(item); continue;
  }
  if (item && (m = line.match(/^\s+- (\w+):\s*(.*)$/))){ bullet = m[1]; if (bullet === "hint") item.hint = m[2].trim(); continue; }
  if (item && /^\s+\S/.test(line)){
    if (!bullet) item.t += " " + line.trim(); else if (bullet === "hint") item.hint += " " + line.trim();
    continue;
  }
  if (line.trim() !== "") item = bullet = null;       // a note paragraph ends the item; blank lines do not
}

/* ---- write ---- */
const js = v => JSON.stringify(v).replace(/</g, "\\u003c");
function block(folder){
  const lists = (pages[folder] || []).filter(l => l.items.length);
  if (!lists.length) return "";
  const body = lists.map(l => {
    const on = ON[folder] && ON[folder][l.name];
    return "  { name: " + js(l.name) + (on ? ", on: () => " + on : "") + ", items: [\n"
      + l.items.map(it => "    { t: " + js(it.t) + (it.hint ? ", hint: " + js(it.hint) : "") + " }").join(",\n") + "\n  ] }";
  }).join(",\n");
  return OPEN_FULL + "\n<script>\nwindow.PF_BENCHMARKS = { lists: [\n" + body + "\n] };\n</script>\n" + CLOSE + "\n";
}

const folders = [...new Set(Object.values(PAGES).filter(Boolean))];
let total = 0;
for (const folder of folders){
  const f = folder + "/index.html", src = read(f), want = block(folder);
  const a = src.indexOf(OPEN), b = src.indexOf(CLOSE), s = src.indexOf(STRIP);
  if (s < 0){ console.log("NO PRACTICE STRIP  " + f); bad++; continue; }
  const cur = a >= 0 && b > a ? src.slice(a, b + CLOSE.length + 1) : "";
  total += (pages[folder] || []).reduce((n, l) => n + l.items.length, 0);
  if (cur === want) continue;
  if (check){ console.log("OUT OF STEP WITH " + SRC + "  " + f); bad++; continue; }
  const out = cur ? src.slice(0, a) + want + src.slice(b + CLOSE.length + 1) : src.slice(0, s) + want + src.slice(s);
  fs.writeFileSync(path.join(ROOT, f), out);
  console.log("wrote  " + f + "  (" + (pages[folder] || []).map(l => (l.name ? l.name + " " : "") + l.items.length).join(", ") + ")");
}
console.log((check ? "checked " : "generated ") + folders.length + " pages, " + total + " benchmarks" + (bad ? ", " + bad + " problem(s)" : check ? ", all in step" : ""));
process.exit(bad && check ? 1 : 0);
