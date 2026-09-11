// node check.js — headless checks for the Scale Practice note path engine.
// Loads the deck's own script from index.html (data, placements, concepts, engine) and:
//  1. replays the printed examples note for note: p. 65–66 concept 1 (six keys, Easy and
//     Intermediate), p. 67 concept 2 (hold C through six keys), p. 68 concept 3 (F, three
//     pairs, bar lengths), p. 71 concept 6 (C, six strings, fingers). Differences William
//     hasn't ruled on are listed in KNOWN and reported, not failed.
//  2. sweeps every scale × key × fingering (× variant): concept 1 paths move by scale step,
//     concept 3 zigzags find every note and follow the p. 62 cycle up the neck, concept 6
//     finds a fingering plan on every string.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const main = src.split("<script>").find(c => c.includes("const SCALES")).split("/* ---------- state + ui ---------- */")[0];
const state = { scale: "major", key: "C", concept: 0, tier: "Easy", interval: 3, pattern: "1231", i: 0, variants: {} };
const E = new Function("state", main + "\n; return { SCALES, CONCEPTS, KEYS, allPlacements, place, basePos, degreeOf, ladder, perfPosition, perfDescending, perfZigzag, perfString, midiOf };")(state);

const tok = n => `${n.string}:${n.fret}`;
const flat = perf => perf.bars.flatMap(b => b.notes);
const withVariant = (v, f) => { const s = state.variants; state.variants = v; try { return f(); } finally { state.variants = s; } };
const P6_3RD = { "major:P6": "B on 3rd string" };   // every printed P6 example uses this variant

const KNOWN = {
  "c1 Easy C I6": ["note 31: book has 5:7 (engine skips)", "note 31: engine has 6:12 (book skips)"],
  "c3 Easy F": ["note 30: engine has 5:8 (book skips)", "bar lengths: engine 8,8,8,8,8,8,8,6,8,8,8,8, book 8,8,8,6,8,8,8,6,8,8,8,8"],
};
const WHY = {
  "c1 Easy C I6": "book descends through E on the 5th string, 7fr, outside I6 (asked 2026-09-11, no ruling yet)",
  "c3 Easy F": "p. 68 bar 4 drops F to keep continuous eighths in 3/4; the engine's join rule is under review",
};

function diff(a, b) {
  const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
    if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) out.push(`note ${j + 1}: book has ${b[j++]} (engine skips)`);
    else out.push(`note ${i + 1}: engine has ${a[i++]} (book skips)`);
  }
  return out;
}
let pass = 0, known = 0, fail = 0;
function compare(id, perf, book, opts = {}) {
  const bars = book.replace(/[()]/g, "").split("|").map(b => b.trim().split(/\s+/).filter(Boolean));
  const bt = bars.flat().map(t => t.split("@")[0]), msgs = diff(flat(perf).map(tok), bt);
  const bl = perf.bars.map(b => b.len).join(",");
  if (opts.bars && opts.bars !== bl) msgs.push(`bar lengths: engine ${bl}, book ${opts.bars}`);
  if (opts.fingers) bars.flat().forEach((t, i) => { const f = +t.split("@")[1], e = flat(perf)[i] && flat(perf)[i].finger; if (e !== f) msgs.push(`finger on note ${i + 1} (${bt[i]}): engine ${e}, book ${f}`); });
  if (!msgs.length) { pass++; return; }
  const k = KNOWN[id] || [], extra = msgs.filter(m => !k.includes(m)), gone = k.filter(m => !msgs.includes(m));
  if (!extra.length && !gone.length) { known++; console.log(`known  ${id} — ${WHY[id]}`); return; }
  fail++; console.log(`FAIL   ${id}\n       ` + extra.concat(gone.map(g => `(known difference no longer seen: ${g})`)).join("\n       "));
}

/* ---- p. 65–66, concept 1: E A D G C F around the cycle; ( ) = the Intermediate notes ---- */
const C1 = [
  ["E", "P6", "6:12 5:9 5:11 5:12 4:9 4:11 3:8 3:9 | 3:11 2:9 2:10 2:12 1:9 1:11 1:12 1:11 | 1:9 2:12 2:10 2:9 3:11 3:9 3:8 4:11 | 4:9 5:12 5:11 5:9 6:12 (6:11 6:9 6:11 | 6:12)"],
  ["A", "P5", "5:12 4:9 4:11 4:12 3:9 3:11 2:9 2:10 | 2:12 1:9 1:10 1:12 1:10 1:9 2:12 2:10 | 2:9 3:11 3:9 4:12 4:11 4:9 5:12 (5:11 | 5:9 6:12 6:10 6:9 6:10 6:12 5:9 5:11 | 5:12)"],
  ["D", "M6", "6:10 6:12 5:9 5:10 5:12 4:9 4:11 4:12 | 3:9 3:11 3:12 2:10 2:12 1:9 1:10 1:12 | 1:10 1:9 2:12 2:10 3:12 3:11 3:9 4:12 | 4:11 4:9 5:12 5:10 5:9 6:12 6:10 (6:9 | 6:10)"],
  ["G", "M5", "5:10 5:12 4:9 4:10 4:12 3:9 3:11 3:12 | 2:10 2:12 2:13 1:10 1:12 1:10 2:13 2:12 | 2:10 3:12 3:11 3:9 4:12 4:10 4:9 5:12 | 5:10 (5:9 6:12 6:10 6:8 6:10 6:12 5:9 | 5:10)"],
  ["C", "I6", "6:8 6:10 6:12 5:8 5:10 5:12 4:9 4:10 | 4:12 3:9 3:10 3:12 2:10 2:12 2:13 1:10 | 1:12 1:10 2:13 2:12 2:10 3:12 3:10 3:9 | 4:12 4:10 4:9 5:12 5:10 5:8 5:7 6:10 | 6:8"],
  ["F", "I5", "5:8 5:10 5:12 4:8 4:10 4:12 3:9 3:10 | 3:12 2:10 2:11 2:13 1:10 1:12 1:13 1:12 | 1:10 2:13 2:11 2:10 3:12 3:10 3:9 4:12 | 4:10 4:8 5:12 5:10 5:8 (6:12 6:10 6:8 | 6:10 6:12 5:8)"],
];
state.scale = "major"; state.key = "E";
withVariant(P6_3RD, () => {
  const cards = E.CONCEPTS[0].steps();
  C1.forEach(([k, sh, book], i) => {
    const p = cards[i].p;
    compare(`c1 Easy ${k} ${sh}`, E.perfPosition(p, "Easy"), book.split("(")[0].replace(/\|\s*$/, ""));
    if (book.includes("(")) compare(`c1 Intermediate ${k} ${sh}`, E.perfPosition(p, "Intermediate"), book, { bars: "8,8,8,8,8" });
  });
});

/* ---- p. 67, concept 2: hold C (1st string, 8fr) through C F Bb Eb Ab Db ---- */
const C2 = [
  ["C", "P6", "1:8 1:7 1:5 2:8 2:6 2:5 3:7 3:5 | 3:4 4:7 4:5 5:8 5:7 5:5 6:8", "8,8"],
  ["F", "P5", "1:8 1:6 1:5 2:8 2:6 2:5 3:7 3:5 | 4:8 4:7 4:5 5:8", "8,8"],
  ["Bb", "M6", "1:8 1:6 1:5 2:8 2:6 3:8 3:7 3:5 | 4:8 4:7 4:5 5:8 5:6 5:5 6:8 6:6", "8,8"],
  ["Eb", "M5", "1:8 1:6 2:9 2:8 2:6 3:8 3:7 3:5 | 4:8 4:6 4:5 5:8 5:6", "8,8"],
  ["Ab", "I6", "1:8 1:6 2:9 2:8 2:6 3:8 3:6 3:5 | 4:8 4:6 4:5 5:8 5:6 5:4 6:8 6:6 | 6:4", "8,8,8"],
  ["Db", "I5", "1:8 1:6 2:9 2:7 2:6 3:8 3:6 3:5 | 4:8 4:6 4:4 5:8 5:6 5:4", "8,8"],
];
withVariant(P6_3RD, () => {
  state.key = "C"; state.tier = "Easy";
  const cards = E.CONCEPTS[1].steps();
  C2.forEach(([k, sh, book, bars], i) => {
    if (E.basePos(cards[i].p.id) !== sh) console.log(`note   deck's concept 2 card ${i + 1} shows ${k} ${cards[i].p.id}; p. 67 uses ${sh}`);
    const p = E.allPlacements(k).find(x => x.id === sh && x.minFret <= 8 && x.maxFret >= 8);
    const ring = p.dots.concat(p.extended).find(d => d.string === 1 && d.fret === 8);
    compare(`c2 Easy C→${k} ${sh}`, E.perfDescending(p, "Easy", ring), book, { bars });
  });
});

/* ---- p. 68, concept 3: F major, the three printed up/down pairs ---- */
const C3 = "6:1 6:3 6:5 5:1 5:3 5:5 4:2 4:3 | 4:5 3:2 3:3 3:5 2:3 2:5 2:6 1:3 | 1:5 1:6 1:8 1:6 1:5 2:8 2:6 2:5 | 3:7 3:5 4:8 4:7 4:5 5:7 | " +
  "5:8 5:10 4:7 4:8 4:10 3:7 3:9 3:10 | 2:8 2:10 2:11 1:8 1:10 1:12 1:13 1:12 | 1:10 2:13 2:11 2:10 3:12 3:10 3:9 4:12 | 4:10 4:8 5:12 5:10 5:8 6:12 | " +
  "6:13 5:10 5:12 5:13 4:10 4:12 3:9 3:10 | 3:12 2:10 2:11 2:13 1:10 1:12 1:13 1:15 | 1:13 1:12 2:15 2:13 3:15 3:14 3:12 4:15 | 4:14 4:12 5:15 5:13 5:12 6:15 6:13";
withVariant(P6_3RD, () => {
  state.key = "F";
  compare("c3 Easy F", E.perfZigzag(E.CONCEPTS[2].steps().slice(0, 6).map(c => c.p), "F"), C3, { bars: "8,8,8,6,8,8,8,6,8,8,8,8" });
});

/* ---- p. 71, concept 6: C major, quarter notes, fingers. String 4's ascending F is printed
   with finger 1; William confirmed it's a misprint for 2 (2026-09-11), so the fixture reads 2 ---- */
const C6 = {
  1: "0@0 1@1 3@3 5@1 | 7@3 8@4 10@1 12@3 | 13@1 15@3 13@1 12@3 | 10@1 8@4 7@3 5@1 | 3@3 1@1 0@0",
  2: "0@0 1@1 3@3 5@1 | 6@2 8@4 10@1 12@3 | 13@1 15@3 13@1 12@3 | 10@1 8@4 6@2 5@1 | 3@3 1@1 0@0",
  3: "0@0 2@1 4@3 5@1 | 7@3 9@1 10@2 12@1 | 14@3 12@1 10@2 9@1 | 7@3 5@1 4@3 2@1 | 0@0",
  4: "0@0 2@1 3@2 5@1 | 7@3 9@1 10@2 12@1 | 14@3 15@4 14@3 12@1 | 10@2 9@1 7@3 5@1 | 3@2 2@1 0@0",
  5: "0@0 2@1 3@2 5@1 | 7@3 8@1 10@3 12@1 | 14@3 15@4 14@3 12@1 | 10@3 8@1 7@3 5@1 | 3@2 2@1 0@0",
  6: "0@0 1@1 3@3 5@1 | 7@3 8@4 10@1 12@3 | 13@1 15@3 13@1 12@3 | 10@1 8@4 7@3 5@1 | 3@3 1@1 0@0",
};
state.key = "C";
for (const s of [1, 2, 3, 4, 5, 6])
  compare(`c6 Easy C string ${s}`, E.perfString("C", s), C6[s].split("|").map(b => b.trim().split(/\s+/).map(t => `${s}:${t}`).join(" ")).join(" | "), { fingers: true, bars: "4,4,4,4,4" });

/* ---- sweeps ---- */
const stepOK = (key, a, b) => { if (a === b) return false; for (let m = Math.min(a, b) + 1; m < Math.max(a, b); m++) if (E.degreeOf(key, m % 12) >= 0) return false; return true; };
const UP = ["P6", "M6", "I6", "P5", "M5", "I5"];   // p. 62: each fingering one position higher than the last
let paths = 0; const sweep = [];
for (const sc of Object.keys(E.SCALES)) {
  state.scale = sc;
  const shapes = E.SCALES[sc].shapes;
  const variants = [{}].concat(Object.keys(shapes).flatMap(id => Object.keys(shapes[id].variants || {}).map(v => ({ [`${sc}:${id}`]: v }))));
  for (const v of variants) withVariant(v, () => {
    for (const key of E.KEYS) {
      state.key = key;
      for (const id of E.SCALES[sc].cycle) for (const tier of ["Easy", "Intermediate"]) {
        const ns = flat(E.perfPosition(E.place(id, key), tier)); paths++;
        const bad = ns.findIndex((n, i) => i && !stepOK(key, ns[i - 1].midi, n.midi));
        if (bad > 0) sweep.push(`c1 ${tier} ${key} ${sc} ${id}: leap ${tok(ns[bad - 1])}→${tok(ns[bad])}`);
      }
      const ps = E.CONCEPTS[2].steps().map(c => c.p), zz = E.perfZigzag(ps, key);
      zz.flags.forEach(f => sweep.push(`c3 ${sc} ${key}: ${f}`));
      if (E.SCALES[sc].cycle.join() === "P6,P5,M6,M5,I6,I5" && !ps.every((p, i) => !i || UP[(UP.indexOf(E.basePos(ps[i - 1].id)) + 1) % 6] === E.basePos(p.id)))
        sweep.push(`c3 ${sc} ${key}: placements out of p. 62 order`);
      for (const s of [1, 2, 3, 4, 5, 6]) E.perfString(key, s).flags.forEach(f => sweep.push(`c6 ${sc} ${key} string ${s}: ${f}`));
    }
  });
}
sweep.forEach(m => console.log("FAIL   " + m));
fail += sweep.length;
console.log(`\nprinted examples: ${pass} match, ${known} known differences, ${fail - sweep.length} failed · sweeps: ${paths} concept 1 paths + every zigzag and string, ${sweep.length} failed`);
process.exit(fail ? 1 : 0);
