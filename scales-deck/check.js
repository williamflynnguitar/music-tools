// node check.js — headless checks for the Scale Practice note path engine.
// Loads the deck's own script from index.html (data, placements, concepts, engine) and:
//  1. replays the printed examples note for note: p. 65–66 concept 1 (six keys, Easy and
//     Intermediate), p. 67 concept 2 (hold C through six keys), p. 68 concept 3 (F, three
//     pairs, bar lengths), p. 71 concept 6 (C, six strings, fingers), with William's misprint
//     corrections; plus his concept 6 picks for strings p. 71 can't settle
//  2. sweeps every scale × key × fingering (× variant):
//     - concept 1 Easy/Intermediate move by scale step
//     - Advanced tiers (concepts 1 and 2) follow an independent statement of William's turn rule
//       note for note, keep every 2- and 4-note group on the beat, repeat nothing across a turn,
//       and land the root on a beat where the rule promises it
//     - concept 2 above Easy ends on the root
//     - concept 3 finds every note, follows the p. 62 cycle, starts every ascent on beat 1, holds
//       nothing mid-line, and shows fingers on both notes of every shift (none in bebop scales)
//     - concept 6 finds a fingering on every string; its run and shift counts are pinned, so a
//       ranking change fails
// Differences William hasn't ruled on go in KNOWN and are reported, not failed.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const main = src.split("<script>").find(c => c.includes("const SCALES")).split("/* ---------- state + ui ---------- */")[0];
const state = { scale: "major", key: "C", concept: 0, tier: "Easy", interval: 3, pattern: "1231", i: 0, variants: {} };
const E = new Function("state", main + "\n; return { SCALES, CONCEPTS, KEYS, allPlacements, place, basePos, degreeOf, inKey, ladder, rootMidi, topMidi, tierDigits, perfPosition, perfDescending, perfZigzag, perfString, stringFingers, midiOf };")(state);

const tok = n => `${n.string}:${n.fret}`;
const flat = perf => perf.bars.flatMap(b => b.notes);
const withVariant = (v, f) => { const s = state.variants; state.variants = v; try { return f(); } finally { state.variants = s; } };
const P6_3RD = { "major:P6": "B on 3rd string" };   // every printed P6 example uses this variant

const KNOWN = {};
const WHY = {};

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
  // p. 66 prints bar 4's E on the 5th string, 7fr; William confirmed it's a misprint for 6th string, 12fr (2026-09-11)
  ["C", "I6", "6:8 6:10 6:12 5:8 5:10 5:12 4:9 4:10 | 4:12 3:9 3:10 3:12 2:10 2:12 2:13 1:10 | 1:12 1:10 2:13 2:12 2:10 3:12 3:10 3:9 | 4:12 4:10 4:9 5:12 5:10 5:8 6:12 6:10 | 6:8"],
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

/* ---- William's concept 6 picks where p. 71 can't decide (listening proof, 2026-09-11) ---- */
const PICKS = [
  ["major", "Eb", 1, "[1@1 3@3] [4@1 6@3] [8@1 10@3 11@4] [13@1 15@3]", "clean case"],
  ["major", "Ab", 1, "[1@1 3@3] [4@1 6@3] [8@1 9@2 11@4] [13@1 15@3]", "question 2: first position kept to two notes"],
  ["harmonic", "G", 1, "[2@1 3@2 5@4] [6@1 8@3] [10@1 11@2] [14@1 15@2]", "question 3: no 6-fret shift, three notes in the first position"],
  ["mixoBebop", "C", 1, "[1@1 3@3] [5@1 6@2 7@3 8@4] [10@1 12@3] [13@1 15@3]", "question 4: the chromatic run in one position"],
  // "All else, go with what's in the app": where neither pick applies (the run 9–12 can't stay whole here),
  // the fingering stays what it was before round 3 (also Bb s2, Eb s6, Ab s5, Db s4, Gb s3)
  ["phrygdomBebop", "Eb", 1, "[3@1 4@2] [6@1 7@2 9@4] [10@1 11@2] [12@1 15@4]", "unchanged: no ruling applies"],
];
const plan = gs => gs.map(g => `[${g.map(f => `${f}@${f - g[0] + 1}`).join(" ")}]`).join(" ");
for (const [sc, key, s, want, why] of PICKS) {
  state.scale = sc; state.key = key;
  const frets = [...new Set(flat(E.perfString(key, s)).map(n => n.fret))].filter(f => f > 0).sort((a, b) => a - b);
  const got = plan(E.stringFingers(frets).groups);
  if (got === want) pass++; else { fail++; console.log(`FAIL   c6 pick ${sc} ${key} string ${s} (${why})\n       engine ${got}\n       picked ${want}`); }
}
state.scale = "major"; state.key = "C";

/* ---- sweeps ---- */
const stepOK = (key, a, b) => { if (a === b) return false; for (let m = Math.min(a, b) + 1; m < Math.max(a, b); m++) if (E.degreeOf(key, m % 12) >= 0) return false; return true; };
const UP = ["P6", "M6", "I6", "P5", "M5", "I5"];   // p. 62: each fingering one position higher than the last
const ADV = [["Advanced 1", 3], ["Advanced 1", 4], ["Advanced 1", 5], ["Advanced 1", 6], ["Advanced 1", 7], ["Advanced 1", 8], ["Advanced 1", 10],
  ["Advanced 2", "1231"], ["Advanced 2", "123"], ["Advanced 2", "1234"], ["Advanced 2", "1243"], ["Advanced 2", "1221"], ["Advanced 2", "21"]];
const setTier = ([tier, v]) => { state.tier = tier; if (tier === "Advanced 1") state.interval = v; else if (v) state.pattern = v; };

// William's 2a turn rule ("skip the echo group", 2026-09-11), stated on its own so every Advanced
// path can be compared with it: groups start on every step while the whole group fits the leg; at a
// turn the group starting on the note just played is skipped; on the last leg the group landing on
// the root is left out; a group that would still repeat the note before it at a turn is skipped too
function ruleWalk(turns, digits) {
  const span = Math.max(...digits) - 1, out = [];
  const moving = turns.slice(1).map((b, t) => b !== turns[t]), last = moving.lastIndexOf(true);
  let before = false;
  for (let t = 0; t + 1 < turns.length; t++) {
    const a = turns[t], b = turns[t + 1]; if (a === b) continue;
    const dir = a < b ? 1 : -1; let played = false;
    for (let s = a; dir > 0 ? s + span <= b : s - span >= b; s += dir) {
      const g = digits.map(d => s + dir * (d - 1));
      if ((before && s === a) || (t === last && g[g.length - 1] === b)) { if (t === last && g[g.length - 1] === b) break; continue; }
      if (!played && out.length && out[out.length - 1] === g[0]) continue;
      out.push(...g); played = true;
    }
    before = played;
  }
  if (out[out.length - 1] !== turns[turns.length - 1]) out.push(turns[turns.length - 1]);
  return out;
}
// "" when the line is whole pattern groups (up or down), each starting on a beat, plus at most a lone final root
function onBeat(ns, digits, key) {
  const steps = []; for (let m = 20; m <= 112; m++) if (E.inKey(key, m)) steps.push(m);
  const si = m => steps.indexOf(m), k = digits.length, slot = []; let at = 0;
  ns.forEach(n => { slot.push(at); at += n.dur; });
  for (let i = 0; i < ns.length;) {
    const fits = dir => { const s0 = si(ns[i].midi) - dir * (digits[0] - 1); return i + k <= ns.length && digits.every((d, j) => si(ns[i + j].midi) === s0 + dir * (d - 1)); };
    if (fits(1) || fits(-1)) { if (slot[i] % 2) return `group at note ${i + 1} (${tok(ns[i])}) starts off the beat`; i += k; }
    else if (i === ns.length - 1) i++;
    else return `note ${i + 1} (${tok(ns[i])}) is not in a whole group`;
  }
  return "";
}
function advancedChecks(label, ns, L, turns, digits, key) {
  const want = ruleWalk(turns, digits).map(i => L[i].midi), got = ns.map(n => n.midi);
  if (want.join() !== got.join()) { const at = want.findIndex((m, i) => m !== got[i]); return [`${label}: differs from the turn rule at note ${at + 1}`]; }
  const out = [];
  if (digits.length % 2 === 0) { const bad = onBeat(ns, digits, key); if (bad) out.push(`${label}: ${bad}`); }
  if (!digits.some((d, j) => j && d === digits[j - 1])) { const rep = ns.findIndex((n, i) => i && n.midi === ns[i - 1].midi); if (rep > 0) out.push(`${label}: ${tok(ns[rep])} repeats back to back`); }
  if (digits[0] === 1 && digits[digits.length - 1] === Math.max(...digits) && digits.length !== 3) {
    const before = ns.slice(0, -1).reduce((a, n) => a + n.dur, 0); if (before % 2) out.push(`${label}: the root lands off the beat`);
  }
  return out;
}
let paths = 0, advLines = 0, c2Lines = 0, zigzags = 0; const sweep = [];
const SIX_PINNED = { runs: 288, whole: 222, split: 66, longShift: 42 };   // 2026-09-11, 11 scales; a ranking change moves these
const six = { runs: 0, whole: 0, split: 0, longShift: 0 };
for (const sc of Object.keys(E.SCALES)) {
  state.scale = sc;
  const shapes = E.SCALES[sc].shapes, bebop = E.SCALES[sc].passing != null;
  const variants = [{}].concat(Object.keys(shapes).flatMap(id => Object.keys(shapes[id].variants || {}).map(v => ({ [`${sc}:${id}`]: v }))));
  for (const v of variants) withVariant(v, () => {
    for (const key of E.KEYS) {
      state.key = key;
      for (const id of E.SCALES[sc].cycle) {
        for (const tier of ["Easy", "Intermediate"]) {
          const ns = flat(E.perfPosition(E.place(id, key), tier)); paths++;
          const bad = ns.findIndex((n, i) => i && !stepOK(key, ns[i - 1].midi, n.midi));
          if (bad > 0) sweep.push(`c1 ${tier} ${key} ${sc} ${id}: leap ${tok(ns[bad - 1])}→${tok(ns[bad])}`);
        }
        const p = E.place(id, key), L = E.ladder(p, true), at = m => L.findIndex(r => r.midi === m);
        const turns = [E.rootMidi(p), E.topMidi(p), L[0].midi, E.rootMidi(p)].map(at);
        for (const t of ADV) {
          setTier(t); advLines++;
          sweep.push(...advancedChecks(`c1 ${t.join(" ")} ${sc} ${key} ${id}`, flat(E.perfPosition(p, state.tier)), L, turns, E.tierDigits(state.tier), key));
        }
        state.tier = "Easy";
      }
      for (const t of [["Intermediate"], ...ADV]) {
        setTier(t);
        let cards; try { cards = E.CONCEPTS[1].steps(); } catch (e) { sweep.push(`c2 ${state.tier} ${sc} ${key}: steps() throws ${e.message}`); continue; }
        for (const c of cards) {
          const ring = c.p.dots.concat(c.p.extended).find(d => c.opts.ring(d)); if (!ring) continue;
          const ns = flat(E.perfDescending(c.p, state.tier, ring)), label = `c2 ${t.join(" ")} ${sc} ${key} ${c.p.id} (card in ${c.key})`; c2Lines++;
          if (ns[ns.length - 1].midi !== E.rootMidi(c.p)) sweep.push(`${label}: ends on ${tok(ns[ns.length - 1])}, not the root`);
          if (t.length > 1) {                                  // each card is its own key around the cycle
            const L = E.ladder(c.p, true), at = m => L.findIndex(r => r.midi === m);
            sweep.push(...advancedChecks(label, ns, L, [at(E.midiOf(ring)), 0, at(E.rootMidi(c.p))], E.tierDigits(state.tier), c.key));
          } else { const rep = ns.findIndex((n, i) => i && n.midi === ns[i - 1].midi); if (rep > 0) sweep.push(`${label}: ${tok(ns[rep])} repeats back to back`); }
        }
      }
      state.tier = "Easy";
      const ps = E.CONCEPTS[2].steps().map(c => c.p), zz = E.perfZigzag(ps, key), zn = flat(zz); zigzags++;
      zz.flags.forEach(f => sweep.push(`c3 ${sc} ${key}: ${f}`));
      if (E.SCALES[sc].cycle.join() === "P6,P5,M6,M5,I6,I5" && !ps.every((p, i) => !i || UP[(UP.indexOf(E.basePos(ps[i - 1].id)) + 1) % 6] === E.basePos(p.id)))
        sweep.push(`c3 ${sc} ${key}: placements out of p. 62 order`);
      const barStart = new Set(); let at = 0; zz.bars.forEach(b => { barStart.add(at); at += b.notes.length; });
      zn.forEach((n, i) => { if (i && n.pos !== zn[i - 1].pos && n.pos % 2 === 0 && !barStart.has(i)) sweep.push(`c3 ${sc} ${key}: ascent into ${ps[n.pos].id} not on beat 1`); });
      if (zn.slice(0, -1).some(n => n.dur > 1)) sweep.push(`c3 ${sc} ${key}: a note is held mid-line`);
      const fingerBad = zn.findIndex((n, i) => {
        const shift = (i > 0 && n.pos !== zn[i - 1].pos) || (i + 1 < zn.length && zn[i + 1].pos !== n.pos);
        return bebop ? n.finger != null : shift !== (n.finger != null);
      });
      if (fingerBad >= 0) sweep.push(`c3 ${sc} ${key}: finger ${bebop ? "shown in a bebop scale" : "missing or misplaced"} at note ${fingerBad + 1}`);
      for (const s of [1, 2, 3, 4, 5, 6]) {
        const r = E.perfString(key, s);
        r.flags.forEach(f => sweep.push(`c6 ${sc} ${key} string ${s}: ${f}`));
        const frets = [...new Set(flat(r).map(n => n.fret))].filter(f => f > 0).sort((a, b) => a - b), gs = E.stringFingers(frets).groups;
        const runs = []; for (let i = 0; i < frets.length;) { let j = i; while (j + 1 < frets.length && frets[j + 1] === frets[j] + 1) j++; if (j - i >= 2) runs.push([frets[i], frets[j]]); i = j + 1; }
        if (runs.length) { six.runs++; if (runs.every(([a, b]) => gs.some(g => g.includes(a) && g.includes(b)))) six.whole++; else six.split++; }
        if (gs.slice(1).some((g, k) => g[0] - gs[k][0] > 5)) six.longShift++;
      }
    }
  });
}
Object.keys(SIX_PINNED).forEach(k => { if (six[k] !== SIX_PINNED[k]) sweep.push(`c6 count "${k}" is ${six[k]}, pinned at ${SIX_PINNED[k]}: the fingering ranking changed`); });
sweep.forEach(m => console.log("FAIL   " + m));
fail += sweep.length;
console.log(`\nprinted examples and picks: ${pass} match, ${known} known differences, ${fail - sweep.length} failed`);
console.log(`sweeps: ${paths} concept 1 paths, ${advLines} Advanced lines, ${c2Lines} concept 2 lines above Easy, ${zigzags} zigzags, every string — ${sweep.length} failed`);
console.log(`concept 6: ${six.runs} strings with a chromatic run (every run in one position on ${six.whole}, a run split on ${six.split}); ${six.longShift} strings still shift more than 5 frets`);
process.exit(fail ? 1 : 0);
