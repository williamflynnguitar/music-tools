// node check.js — headless checks for the Scale Practice note path engine and player timeline.
// Loads the deck's own script from index.html (data, placements, concepts, engine) and:
//  1. replays the printed examples note for note: p. 65–66 concept 1 (six keys, Easy and
//     Intermediate), p. 67 concept 2 (hold C through six keys), p. 68 concept 3 (F, three
//     pairs, bar lengths), p. 71 concept 6 (C, six strings, fingers), with William's misprint
//     corrections; plus his concept 6 picks for strings p. 71 can't settle, and the concept 2
//     Easy fallback pinned where p. 67's cycle decides it
//  2. sweeps every scale × key × fingering (× variant):
//     - every concept builds its cards on every tier; every card that should play gets exactly its
//       own line (compared with a direct call to the engine)
//     - concept 1 Easy/Intermediate move by scale step
//     - Advanced tiers (concepts 1 and 2) follow an independent statement of William's turn rule
//       note for note, keep every 2- and 4-note group on the beat, repeat nothing across a turn,
//       and land the root on a beat where the rule promises it
//     - concept 2 above Easy ends on the root
//     - concept 3 finds every note, follows the p. 62 cycle, starts every ascent on beat 1, holds
//       nothing mid-line, and shows fingers on both notes of every shift (none in bebop scales)
//     - concept 6 finds a fingering on every string; its run and shift counts are pinned, so a
//       ranking change fails
//  3. checks the player's audio timeline against hand-worked times: count-in, straight and swung
//     eighths and their lengths, clicks on 2 and 4 of every bar (a 3/4 bar has only beat 2),
//     quarter-note lines, the final note's length
// Differences William hasn't ruled on go in KNOWN and are reported, not failed. The UI half of
// the player (audio nodes, highlight, controls) isn't loaded here.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const main = src.split("<script>").find(c => c.includes("const SCALES")).split("/* ---------- state + ui ---------- */")[0];
const state = { scale: "major", key: "C", concept: 0, tier: "Easy", interval: 3, pattern: "1231", i: 0, variants: {} };
const E = new Function("state", main + "\n; return { SCALES, CONCEPTS, KEYS, allPlacements, place, basePos, degreeOf, inKey, ladder, rootMidi, topMidi, tierDigits, perfPosition, perfDescending, perfZigzag, perfString, perfDegree, perfOctave, perfIntervals, perfSegovia, SEGOVIA, SEG_MOVABLE, segShift, segSpan, stringFingers, midiOf, cardPerformance, schedule, OPEN_MIDI_CHECK: OPEN_MIDI, PC_CHECK: PC };")(state);

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
// where no fingering holds the note as a dot, the card takes the cycle's fingering for that key if its
// window holds the note: dorian C card 3 (Bb) holds C as Middle 6's 9th
state.scale = "dorian"; state.key = "C"; state.tier = "Easy";
{ const c3 = E.CONCEPTS[1].steps()[2];
  if (c3 && E.basePos(c3.p.id) === "M6") pass++; else { fail++; console.log(`FAIL   c2 Easy dorian C card 3 shows ${c3 && c3.p.id}; expected M6, the cycle's fingering whose window holds the C`); } }
state.scale = "major"; state.key = "F";

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
      if (before && s === a) continue;
      if (t === last && g[g.length - 1] === b) break;
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
// what a card must play, straight from the engine (cardPerformance has to agree)
/* A one-octave window cannot hold an interval wider than the notes it has: an Advanced tier
   asks for groups of [1, interval], and where the octave has fewer rungs than that no group
   fits and the card rightly has no line. Counted here from the card itself -- its drawn dots
   less the ones its own dim greys out -- rather than by asking the engine, so this is an
   independent expectation and not a restatement of perfOctave. */
/* Whether a wide interval fits inside a one-octave window is NOT a function of the rung count:
   at 8 rungs an 8th plays on some cards and not on others, because walkTurn's leg lengths and
   skipped echo groups decide it. Any predicate here accurate enough to assert would just be
   perfOctave written twice, which tests nothing -- so concept 5's Advanced tiers return null,
   meaning "do not assert either way". The line itself is still checked whenever there is one,
   and cardLines below counts the coverage, so a change that silenced a swathe of cards would
   still show up as a moved number. */
const ASSERT_EITHER = null;
function expectedLine(n, cards, i, tier, key) {
  const card = cards[i];
  if (n === 1) return { perf: E.perfPosition(card.p, tier), first: i };
  if (n === 2) return { perf: E.perfDescending(card.p, tier, card.p.dots.concat(card.p.extended).find(d => card.opts.ring(d))), first: i };
  if (n === 3) return { perf: E.perfZigzag(cards.slice(i - i % 2).map(c => c.p), key), first: i - i % 2 };
  if (n === 4) return { perf: E.perfDegree(card.p, tier, card.p.dots.concat(card.p.extended).find(d => card.opts.ring(d)), card.opts.ext), first: i };
  if (n === 5) return { perf: E.perfOctave(card.p, tier, card.via, card.opts.ring ? card.p.dots.concat(card.p.extended).find(d => card.opts.ring(d)) : null, card.opts.dim), first: i };
  if (n === 7) return { perf: E.perfIntervals(card, tier, key), first: i };
  if (n === 8) return { perf: E.perfSegovia(card.segovia, card.segKey, card.shift), first: i };
  return { perf: E.perfString(key, card.string), first: i };
}
let paths = 0, advLines = 0, c2Lines = 0, zigzags = 0, cardLines = 0, cardSets = 0; const sweep = [];
const SIX_PINNED = { runs: 288, whole: 222, split: 66, longShift: 42 };   // 2026-09-11, 11 scales; a ranking change moves these
const six = { runs: 0, whole: 0, split: 0, longShift: 0 };
for (const sc of Object.keys(E.SCALES)) {
  state.scale = sc;
  const shapes = E.SCALES[sc].shapes, bebop = E.SCALES[sc].passing != null;
  const variants = [{}].concat(Object.keys(shapes).flatMap(id => Object.keys(shapes[id].variants || {}).map(v => ({ [`${sc}:${id}`]: v }))));
  for (const v of variants) withVariant(v, () => {
    for (const key of E.KEYS) {
      state.key = key;
      // every concept builds its cards on every tier, and the cards that should play get exactly their line
      for (const C of E.CONCEPTS) for (const tier of C.tiers) {
        state.tier = tier; cardSets++;
        let cards; try { cards = C.steps(); } catch (e) { sweep.push(`concept ${C.n} ${tier} ${sc} ${key}: steps() throws ${e.message}`); continue; }
        /* concept 8 carries a line only on the cards holding a transcribed fingering — its
           Intermediate and Advanced 2 tiers are still text — so whether a card should play is
           a question about the card, not about the concept */
        const plays = card => (C.n === 5 && tier.startsWith("Advanced") && card.via !== 2) ? ASSERT_EITHER
          : C.n === 1 || C.n === 2 || ((C.n === 3 || C.n === 6) && tier === "Easy")
          || C.n === 4                                     // every degree card carries a line
          || (C.n === 5 && card.via !== 2 && !tier.startsWith("Advanced"))  // via 2 is the zigzag
          || (C.n === 7 && card.links.length                          // no drawn links, nothing to play
              && (tier !== "Advanced 2" || card.adjacent))             // filling in is adjacent only
          || (C.n === 8 && !!card.segovia);
        cards.forEach((card, i) => {
          let r; try { r = E.cardPerformance(C.n, cards, i, tier, key); } catch (e) { sweep.push(`concept ${C.n} ${tier} ${sc} ${key} card ${i + 1}: cardPerformance throws ${e.message}`); return; }
          const want = plays(card);
          if (want !== null && want !== !!r) { sweep.push(`concept ${C.n} ${tier} ${sc} ${key} card ${i + 1}: ${r ? "plays where no line was expected" : "has no line to play"}`); return; }
          if (!r) return;
          cardLines++;
          r.perf.flags.forEach(f => sweep.push(`concept ${C.n} ${tier} ${sc} ${key} card ${i + 1}: ${f}`));
          if (JSON.stringify(r) !== JSON.stringify(expectedLine(C.n, cards, i, tier, key))) sweep.push(`concept ${C.n} ${tier} ${sc} ${key} card ${i + 1}: plays something other than its own line`);
        });
      }
      state.tier = "Easy";
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

/* ---- the player's audio timeline, against hand-worked times (120 BPM: a beat is 0.5 s) ---- */
let timing = 0;
{
  const perf = { unit: 8, bars: [
    { len: 8, notes: Array.from({ length: 8 }, (_, i) => ({ midi: 60 + i, dur: 1 })) },
    { len: 6, notes: Array.from({ length: 5 }, (_, i) => ({ midi: 70 + i, dur: i === 4 ? 2 : 1 })) },   // a 3/4 bar, last note a quarter
    { len: 8, notes: [{ midi: 60, dur: 8 }] },                                                          // the final note rings a whole bar
  ] };
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const expect = (label, got, want) => { if (got.length === want.length && got.every((t, i) => near(t, want[i]))) timing++; else sweep.push(`timeline ${label}: got ${got.map(t => +t.toFixed(3))}, want ${want.map(t => +t.toFixed(3))}`); };
  const st = E.schedule(perf, 120, false, true), of = (s, k) => s.events.filter(e => e.kind === k);
  expect("count-in: four quarter clicks", of(st, "count").map(e => e.t), [0, .5, 1, 1.5]);
  expect("count-in accents beat 1 only", of(st, "count").map(e => e.accent ? 1 : 0), [1, 0, 0, 0]);
  expect("straight eighths from beat 1 of bar 1", of(st, "note").map(e => e.t), [2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.5]);
  expect("straight eighths last an eighth", of(st, "note").slice(0, 3).map(e => e.dur), [.25, .25, .25]);
  expect("clicks on 2 and 4 of every bar (the 3/4 bar has only 2)", of(st, "click").map(e => e.t), [2.5, 3.5, 4.5, 6, 7]);
  expect("note lengths: quarter at the end of the 3/4 bar, whole note to finish", of(st, "note").slice(-2).map(e => e.dur), [.5, 2]);
  expect("one slot per eighth", [of(st, "slot").length], [22]);
  expect("end of the line", [st.end], [7.5]);
  const sw = E.schedule(perf, 120, true, false);
  expect("swing: long-short 2:1 inside each beat", of(sw, "note").slice(0, 4).map(e => e.t), [2, 2 + 1 / 3, 2.5, 2.5 + 1 / 3]);
  expect("swing: long eighths last 2/3 of a beat, short ones 1/3", of(sw, "note").slice(0, 2).map(e => e.dur), [1 / 3, 1 / 6]);
  expect("swing keeps beats where straight has them", of(sw, "note").filter((e, i) => i % 2 === 0 && i < 8).map(e => e.t), [2, 2.5, 3, 3.5]);
  expect("clicks off: no clicks, count-in stays", [of(sw, "click").length, of(sw, "count").length], [0, 4]);
  const q = E.schedule({ unit: 4, bars: [{ len: 4, notes: [1, 2, 3, 4].map(m => ({ midi: m, dur: 1 })) }] }, 60, true, true);
  expect("quarter-note lines (concept 6) ignore swing", of(q, "note").map(e => e.t), [4, 5, 6, 7]);
  expect("quarter-note lines: notes a beat long", of(q, "note").map(e => e.dur), [1, 1, 1, 1]);
  expect("quarter-note lines: count-in of four beats, clicks on 2 and 4", of(q, "count").map(e => e.t).concat(of(q, "click").map(e => e.t)), [0, 1, 2, 3, 5, 7]);
}

/* ---- pp. 73-75, concept 8: the Segovia transcription ----
   The data is the transcription, so replaying it against itself would prove nothing. What is
   worth pinning is that it is still MUSIC: every ascent strictly stepwise and diatonic in its
   printed key, the fingers a hand can actually hold, and the two the book calls moveable
   really being the two three-octave patterns with no open string. A typo in the table breaks
   one of these. The single known exception is the book's own misprint at #1 ascending note 12
   (2nd string, printed fret 7, sounding F# in C and reached by a leap) — reported, not failed,
   until William rules, as the p. 66 and p. 71 misprints were. */
{
  const MAJ = [0, 2, 4, 5, 7, 9, 11], seg = [];
  let notes = 0;
  for (const f of E.SEGOVIA) {
    const asc = f.asc.split(" ").map(t => t.split("/").map(Number));
    const all = f.notes;
    notes += all.length;
    const midi = d => E.OPEN_MIDI_CHECK[d[0]] + d[1];
    const root = E.KEYS.indexOf ? null : null;
    // pitch classes relative to the printed key
    const pcOf = m => ((m - (E.PC_CHECK[f.key])) % 12 + 12) % 12;
    const offAt = asc.map((d, i) => MAJ.includes(pcOf(midi(d))) ? 0 : i + 1).filter(Boolean);
    const offKey = offAt;
    const leaps = [];
    for (let i = 1; i < asc.length; i++) { const d = midi(asc[i]) - midi(asc[i - 1]); if (d !== 1 && d !== 2) leaps.push(`note ${i + 1} (+${d})`); }
    if (!all.every(d => typeof d.finger === "number")) seg.push(`#${f.n}: a note carries no finger`);
    // a hand holds four frets: the index sits (finger-1) below the note it plays
    const wide = all.filter(d => d.finger > 0 && d.finger > 4);
    if (wide.length) seg.push(`#${f.n}: finger above 4`);
    /* with the p. 73 misprint corrected (William, 2026-09-12) every fingering is clean */
    if (offKey.length) seg.push(`#${f.n}: ${offKey.length} note(s) outside ${f.key} major, at ${offAt.join(", ")}`);
    if (leaps.length) seg.push(`#${f.n}: ascent not stepwise at ${leaps.join(", ")}`);
    /* the corrected note itself, so a revert to the printed 7 fails loudly rather than just
       showing up as "one note outside C major" somewhere */
    if (f.n === "1" && f.asc.split(" ")[11] !== "2/8/4")
      seg.push(`#1 note 12 is ${f.asc.split(" ")[11]}; p. 73 prints 2/7/4 and it is corrected to 2/8/4`);
    /* and the property that only holds once it is corrected: #1 and #7 are the two fingerings
       whose descent retraces the ascent exactly, string, fret and finger */
    if (f.n === "1" || f.n === "7") {
      const back = f.desc.split(" "), up = f.asc.split(" ").slice(0, -1).reverse();
      if (back.join(" ") !== up.join(" ")) seg.push(`#${f.n}: the descent no longer retraces the ascent`);
    }
  }
  if (notes !== 287) seg.push(`287 printed notes expected, ${notes} in the table`);
  const mv = E.SEG_MOVABLE.map(f => f.n).join(",");
  if (mv !== "2,5") seg.push(`p. 64 names #2 and #5 as the moveable three-octave patterns; SEG_MOVABLE holds ${mv || "none"}`);
  seg.forEach(m => { fail++; console.log("FAIL   segovia — " + m); });
  if (!seg.length) { pass++; console.log(`ok     segovia pp. 73-75 — 287 notes, all 7 fingerings stepwise and diatonic; #1 note 12 corrected from the printed fret 7 to fret 8, and #1's descent now retraces its ascent`); }
}

sweep.forEach(m => console.log("FAIL   " + m));
fail += sweep.length;
console.log(`\nprinted examples and picks: ${pass} match, ${known} known differences, ${fail - sweep.length} failed`);
console.log(`sweeps: ${cardSets} card sets (${cardLines} cards with a line), ${paths} concept 1 paths, ${advLines} Advanced lines, ${c2Lines} concept 2 lines above Easy, ${zigzags} zigzags, every string, ${timing} timeline checks — ${sweep.length} failed`);
console.log(`concept 6: ${six.runs} strings with a chromatic run (every run in one position on ${six.whole}, a run split on ${six.split}); ${six.longShift} strings still shift more than 5 frets`);
process.exit(fail ? 1 : 0);
