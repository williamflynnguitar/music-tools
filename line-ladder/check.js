// Headless checks for Line Ladder (node check.js). Loads the app's own engine
// from index.html plus the concept packs from concepts/, then walks the
// acceptance list from the rebuild brief:
//  1. every preset x drill concept x rung combination builds; every bar's
//     notes + rests sum to 8 eighths
//  2. all rungs off: every segment's first note is its concept's degrees[0]
//     relative to the chord root in the reference octave, nothing folded
//     (the old wording, "starts on degree 1", was already untrue for arp-3579)
//  3. the seed templates reproduce the old formulas' degree/rhythm shapes
//     (R-3-5-7 eighths-hold, the scale run's endpoints, digital 1235 on
//     2-beat chords, dim7 falling back to the arpeggio in scale drills)
//  4. toggling one rung on a ii-V-I changes only bars its mark claims
//  5. the Bb part reads a whole step up with the right key signature
//  6. a concept pushed into the registry appears and generates
//  7. approach and seam rungs connect a ii-V-I the way the brief says
//  12-19. concept pack 2 (briefs/line-ladder-concept-pack-2.md): the schema
//     features fixed / applies.rows / applies.next / lands, the p. 59
//     placements and permutations, the Ways, the routine components
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const blocks = src.split("<script>").slice(1).map(b => b.split("</script>")[0]);
const dataJs   = blocks.find(b => b.includes("const KEYS"));
const engineJs = blocks.find(b => b.includes("const REGISTRY"));
const drawJs   = blocks.find(b => b.includes("function engrave")).split("/* ===== ui ===== */")[0];
const PACKS = ["core.js", "digital.js", "cells.js", "ways.js", "routine.js"];   // the page's load order
const concepts = PACKS.map(f => fs.readFileSync(path.join(__dirname, "concepts", f), "utf8")).join("\n");
const harness = `const window={LL_CONCEPTS:[]};\n` + concepts + `
window.LL_CONCEPTS.push({ id:"test-pack-concept", name:"Test 1-3-2-1", short:"t1321",
  group:"Digital patterns", source:"", tags:[],
  applies:{ qualities:["maj7","m7","7"], minBeats:2, maxBeats:2 },
  degrees:[1,3,2,1], against:"scale", rhythm:"eighths", endpoint:null });
` + dataJs + engineJs + drawJs + `
;return { PROGRESSIONS, REGISTRY, buildLine, toBars, transposeBars, writtenFifths,
  parseProg, chordScale, lyExport, engrave, pcOf, CH, M, N, PARTS, refRoot, KEYS,
  degInfo, appliesTo, makeSegments };`;
const E = new Function(harness)();

let fails = 0, checks = 0;
const fail = m => { fails++; console.log("FAIL", m); };
const ok = (cond, m) => { checks++; if (!cond) fail(m); };

const RANGE = { lo: 57, hi: 83 };                 // the neutral default, A3-B5
const GUITAR = { lo: 52, hi: 83 };                // E3-B5 written
const build = (chords, o) => E.buildLine(Object.assign({
  chords, range: RANGE, rungs: {}, mode: "drill", drillId: "arp-r357",
  checked: new Set(E.REGISTRY.map(c => c.id)), seed: 1, locks: {} }, o));
const iiVI = E.parseProg("Dm7@ii/C G7@V/C | Cmaj7@I/C | Cmaj7@I/C");

// 1. everything builds; notes + rests fill every bar exactly
const RUNGSETS = [{}, {fold:1}, {near:1}, {app:1}, {seam:1}, {fold:1,app:1}, {fold:1,near:1,app:1,seam:1}];
for (const progId of Object.keys(E.PROGRESSIONS))
for (const drillId of E.REGISTRY.map(c => c.id))
for (const rungs of RUNGSETS) {
  let line, bars;
  try { line = build(E.PROGRESSIONS[progId].chords, { drillId, rungs }); bars = E.toBars(line); }
  catch (err) { fail(`${progId}/${drillId}/${JSON.stringify(rungs)}: ${err.message}`); continue; }
  bars.forEach(bar => {
    const s = bar.notes.reduce((a, n) => a + n.len, 0) + bar.rests.reduce((a, r) => a + r.len, 0);
    ok(s === 8, `${progId}/${drillId}/${JSON.stringify(rungs)} bar ${bar.n}: ${s} eighths`);
  });
}

// 2. raw output: every segment's first note is its concept's degrees[0]
//    relative to the chord root in the reference octave; no folding
{
  for (const progId of Object.keys(E.PROGRESSIONS))
  for (const drillId of E.REGISTRY.map(c => c.id)) {
    const line = build(E.PROGRESSIONS[progId].chords, { drillId });
    line.segs.forEach((seg, i) => {
      const evs = line.evs[i], c = line.concepts[i];
      if (!evs.length) return;
      const first = E.degInfo(seg, c, c.degrees[0]);
      ok(evs[0].midi === E.refRoot(seg, RANGE) + first.off,
        `${progId}/${drillId} seg ${i}: raw start is not degree ${c.degrees[0]} in the reference octave`);
      ok(line.marks[i].size === 0, `${progId}/${drillId} seg ${i}: marks with all rungs off`);
    });
  }
}

// 3. seed templates match the old formulas' shapes
{
  const line = build(E.PROGRESSIONS.ii51maj.chords, { drillId: "arp-r357" });
  const s0 = line.evs[0];                          // Dm7, 4 beats
  ok(s0.map(e => e.slot).join() === "0,1,2,3" && s0.map(e => e.dur).join() === "1,1,1,5",
    "arp 4-beat rhythm: " + s0.map(e => e.slot + ":" + e.dur).join(" "));
  ok(s0.map(e => (e.midi - s0[0].midi)).join() === "0,3,7,10", "Dm7 arp intervals: " + s0.map(e => e.midi - s0[0].midi).join());
  const s2 = line.evs[2];                          // Cmaj7, 8 beats
  ok(s2.map(e => e.slot).join() === "0,1,2,3,8,9,10,11" && s2.map(e => e.dur).join() === "1,1,1,5,1,1,1,5",
    "arp 8-beat mirror: " + s2.map(e => e.slot + ":" + e.dur).join(" "));
  ok(s2.map(e => e.midi - s2[0].midi).join() === "0,4,7,11,11,7,4,0", "maj7 8-beat up-down");

  const sc = build(E.PROGRESSIONS.ii51maj.chords, { drillId: "scale-run" });
  const r0 = sc.evs[0];                            // 4-beat run: 1..7, 7 a quarter
  ok(r0.length === 7 && r0[6].dur === 2 && r0.map(e => e.midi - r0[0].midi).join() === "0,2,3,5,7,9,10",
    "Dorian 4-beat run: " + r0.map(e => e.midi - r0[0].midi).join());
  const r2 = sc.evs[2];                            // 8-beat run: 1..9 up, back to 3
  ok(r2.length === 15 && r2[14].dur === 2, "8-beat run length: " + r2.length);
  ok(r2[8].midi - r2[0].midi === 14 && r2[14].midi - r2[0].midi === 4, "8-beat run peaks on 9, ends on 3");

  const tp = build(E.PROGRESSIONS.tonal.chords, { drillId: "scale-run" });
  const t0 = tp.evs[0];                            // 2-beat chord in a scale drill -> digital 1235
  ok(tp.concepts[0].id === "digital-1235", "2-beat fallback concept: " + tp.concepts[0].id);
  ok(t0.map(e => e.midi - t0[0].midi).join() === "0,2,3,7", "2-beat 1235 (Dorian): " + t0.map(e => e.midi - t0[0].midi).join());

  const rc = build(E.PROGRESSIONS.rhythm.chords, { drillId: "scale-run" });
  const eIdx = rc.segs.findIndex(s => s.ch.q === "dim7");
  ok(rc.concepts[eIdx].id === "arp-r357", "dim7 in a scale drill keeps the arpeggio");
  ok(rc.evs[eIdx].map(e => (e.midi - rc.evs[eIdx][0].midi)).join() === "0,3,6,9", "dim7 arp intervals");
}

// 3b. every progression is fully annotated: a wrong annotation (chord root
//     not matching the claimed degree) falls back by quality and raises the
//     † flag, so zero flags proves every annotation is consistent
for (const progId of Object.keys(E.PROGRESSIONS)) {
  const line = build(E.PROGRESSIONS[progId].chords, {});
  ok(!line.anyFlag, `${progId}: † flag — ` + line.segs.filter(s => s.cs.flag).map(s => s.sym).join(", "));
}

// 4. rung isolation on the ii-V-I: a toggled rung changes only bars whose
//    labels carry its mark
{
  const base = E.toBars(build(iiVI, {}));
  const key = bars => bars.map(b => b.notes.map(n => n.slot + "/" + n.len + "/" + n.midi).join(" "));
  for (const [rung, mark] of [["fold", "±8"], ["near", "inv"], ["app", "→"], ["seam", "7→3"]]) {
    const bars = E.toBars(build(iiVI, { rungs: { [rung]: true } }));
    const changed = key(bars).map((k, i) => k !== key(base)[i]);
    bars.forEach((bar, i) => {
      const marked = bar.labels.some(l => l.text.includes(mark));
      ok(!changed[i] || marked, `rung ${rung}: bar ${i + 1} changed without its mark`);
    });
  }
  // the same for every concept, in 2- and 4-beat harmonic rhythm; rung 4 has two marks
  const MARKS = { fold: ["±8"], near: ["inv"], app: ["→"], seam: ["7→3", "→5"] };
  for (const text of ["Gm7@ii/F C7@V/F | Fmaj7@I/F | Fmaj7@I/F", "Gm7@ii/F | C7@V/F | Fmaj7@I/F | Fmaj7@I/F"])
  for (const drillId of E.REGISTRY.map(c => c.id)) {
    // onsets only: a mark is stamped on the bar a changed note begins in, so the tied
    // remainder of a held note in the following bar carries none
    const key = bars => bars.map(b => b.notes.filter(n => !n.tieFrom).map(n => n.slot + "/" + n.midi).join(" "));
    const raw = key(E.toBars(build(E.parseProg(text), { drillId })));
    for (const rung of Object.keys(MARKS)) {
      const bars = E.toBars(build(E.parseProg(text), { drillId, rungs: { [rung]: true } }));
      key(bars).forEach((k, i) => ok(k === raw[i] || bars[i].labels.some(l => MARKS[rung].some(m => l.text.includes(m))),
        `${drillId} rung ${rung}: bar ${i + 1} changed without its mark`));
    }
  }
}

// 5. transposition: the Bb part reads a whole step up, key signature follows
{
  const bars = E.toBars(build(iiVI, {}));
  const bb = E.transposeBars(bars, "bb");
  bars.forEach((bar, i) => bar.notes.forEach((n, j) =>
    ok(bb[i].notes[j].midi === n.midi + 2, "Bb part note " + i + "/" + j)));
  ok(E.writtenFifths("C", "bb") === 2, "C concert -> D for Bb instruments (2 sharps)");
  ok(E.writtenFifths("C", "eb") === 3, "C concert -> A for Eb instruments (3 sharps)");
  ok(E.writtenFifths("B", "bb") === -5, "B concert -> Db for Bb instruments (flats past 5 sharps)");
  ok(E.writtenFifths("Eb", "c") === -3, "Eb concert stays 3 flats");
  const svg = E.engrave(bb, 4, { fifths: 2, clef: "treble" });
  ok(Array.isArray(svg) && svg.every(s => s.startsWith("<svg")), "engraver renders the Bb part");
  const ly = E.lyExport(build(iiVI, {}), bars, { part: "bb", key: "C", bpm: 120, name: "test" });
  // the part is transposed in JS, not with a \transpose wrapper: LilyPond preserves letters
  // when it transposes, so a concert A#/E#/B# would come out of \transpose c a as a double sharp
  ok(!ly.includes("\\transpose"), "LilyPond source carries no \\transpose wrapper");
  ok(ly.includes("\\key d \\major"), "LilyPond Bb part is written in D (C concert up a tone)");
  const lyC = E.lyExport(build(iiVI, {}), bars, { part: "c", key: "C", bpm: 120, name: "test" });
  ok(lyC.includes("\\key c \\major"), "LilyPond C part stays in C");
  ok(!/\b[a-g](eses|isis)[',]*\d/.test(ly) && !/\b[a-g](eses|isis)[',]*\d/.test(lyC),
     "LilyPond source never writes a double accidental");
  ok(!ly.includes("TabStaff") && !ly.includes("StringNumber"), "no TAB in the LilyPond source");
}

// 6. a concept object pushed into the registry generates with no other edits
{
  ok(E.REGISTRY.some(c => c.id === "test-pack-concept"), "pack concept registered");
  const line = build(E.parseProg("Dm7 G7 | Cmaj7"), { drillId: "test-pack-concept" });
  ok(line.concepts[0].id === "test-pack-concept", "pack concept drills");
  const evs = line.evs[0];
  ok(evs.map(e => e.midi - evs[0].midi).join() === "0,3,2,0", "pack concept degrees realize (Dorian 1-3-2-1)");
}

// 7. the approach and seam rungs do what the ladder says
{
  const line = build(E.parseProg("Dm7 | G7 | Cmaj7"), { rungs: { app: true } });
  const d = line.evs[0];
  ok(line.marks[0].has("app"), "Dm7 approaches G7");
  ok(d[d.length - 3].dur === 3, "held note shortens to beat 3");
  const g = line.evs[1][0].midi;
  ok(d[d.length - 1].midi - g === 2 && d[d.length - 2].midi - g === 4,
    "walk-down B A into the G: " + d.slice(-2).map(e => e.midi).join());

  const sline = build(E.parseProg("G7 | Cmaj7"), { rungs: { seam: true } });
  const gl = sline.evs[0], cl = sline.evs[1];
  ok(gl[gl.length - 1].midi % 12 === 5, "G7 ends on F (b7)");
  ok(cl[0].midi % 12 === 4, "Cmaj7 starts on E (3rd)");
  ok(Math.abs(cl[0].midi - gl[gl.length - 1].midi) === 1, "7->3 resolves by half step");
  ok(sline.marks[1].has("seam"), "seam mark on the resolution");
}

// 8. nearest-start rung: starts land on chord tones near the previous note
{
  const line = build(E.parseProg("Dm7 | G7 | Cmaj7"), { rungs: { near: true } });
  for (let i = 1; i < line.segs.length; i++) {
    const prev = line.evs[i - 1].slice(-1)[0].midi, start = line.evs[i][0].midi;
    ok(Math.abs(start - prev) <= 8, `near rung: seg ${i} starts ${Math.abs(start - prev)} semitones away`);
  }
}

// 9. guitar-range fold keeps everything inside E3-B5 written
{
  for (const progId of ["ii51maj", "ii51min", "bluesBb", "tune_attya"]) {
    const line = build(E.PROGRESSIONS[progId].chords, { rungs: { fold: 1, near: 1, app: 1 }, range: GUITAR });
    line.evs.flat().forEach(e =>
      ok(e.midi >= GUITAR.lo && e.midi <= GUITAR.hi, `${progId}: ${e.midi} out of range`));
  }
}

// 10. mixed mode: seeded draws are reproducible; locks stick through a reroll
{
  const opts = { mode: "mixed", seed: 7, drillId: null };
  const a = build(E.PROGRESSIONS.ii51maj.chords, opts);
  const b = build(E.PROGRESSIONS.ii51maj.chords, opts);
  ok(a.concepts.every((c, i) => c === b.concepts[i]), "same seed, same draw");
  const locked = build(E.PROGRESSIONS.ii51maj.chords, { mode: "mixed", seed: 8, locks: { 0: a.concepts[0].id } });
  ok(locked.concepts[0].id === a.concepts[0].id, "locked segment keeps its concept");
}

// 11. the -6 arpeggio is R-b3-5-6; its 6, outside harmonic minor, still
//     starts the scale fill and the approach walk
{
  const arp = build(E.parseProg("Gm6"), { drillId: "arp-r357" }).evs[0].map(e => e.name).join(" ");
  ok(arp === "G Bb D E", "Gm6 arpeggio: " + arp);
  const fill = build(E.parseProg("Gm6 | Gm6"), { drillId: "arp-up-scale-down" }).evs[0].map(e => e.name).join(" ");
  ok(fill === "G Bb D E Eb D C Bb A G F# Eb D C Bb A", "Gm6 arp up, scale down: " + fill);
  const app = build(E.parseProg("Cm6 | Fmaj7"), { drillId: "arp-r357", rungs: { app: 1 } });
  ok(app.marks[0].has("app") && app.evs[0].slice(-2).map(e => e.name).join(" ") === "Ab G",
    "Cm6 walks Ab G from its 6 into F: " + app.evs[0].map(e => e.name).join(" "));
}


// ---------- concept pack 2 ----------
const names = (line, i) => line.evs[i].map(e => e.name).join(" ");
const drillOne = (text, drillId, o) => build(E.parseProg(text), Object.assign({ drillId }, o));
const fires = (text, drillId) => { const l = drillOne(text, drillId); return l.concepts[0].id === drillId ? names(l, 0) : null; };

// 12. the registry: load order, counts, and the Drill fallback the new packs must not change
{
  const ids = E.REGISTRY.map(c => c.id).filter(id => id !== "test-pack-concept");
  ok(ids.slice(0, 8).join() === "digital-1235,arp-r357,scale-run,digital-12345321,digital-12345765,digital-15321235,arp-3579,arp-up-scale-down",
    "core.js and digital.js still lead the registry: " + ids.slice(0, 8).join());
  ok(ids.length === 8 + 27 + 7 + 4, "46 concepts in the five packs: " + ids.length);
  ok(new Set(ids).size === ids.length, "concept ids are unique");
  const shorts = E.REGISTRY.map(c => c.short);
  ok(new Set(shorts).size === shorts.length, "bar labels are unique");
  ok(!shorts.some(s => ["±8", "inv", "→", "7→3", "→5"].includes(s)), "no bar label reads as a rung mark");
  ok(E.REGISTRY.every(c => !/card|deck/i.test(c.name + c.group + (c.subgroup || ""))), 'no "card" or "deck" in concept text');
  // fallback: a concept that applies nowhere leaves the line exactly as the arpeggio drill has it
  for (const progId of Object.keys(E.PROGRESSIONS)) {
    const a = build(E.PROGRESSIONS[progId].chords, { drillId: "no-such-concept" });
    ok(a.concepts.every(c => !c || ["digital-1235", "arp-r357"].includes(c.id)), `${progId}: Drill fallback is still 1235 / R357`);
  }
}

// 13. A1 — degrees at or below zero; A2 — fixed concepts never rotate
{
  const l = drillOne("Gm7@ii/F C7@V/F | Fmaj7@I/F", "way-in-2");
  ok(names(l, 0) === "D Bb G F" && l.evs[0].map(e => e.midi - l.evs[0][0].midi).join() === "0,-4,-7,-9",
    "degree 0 is the 7th below degree 1: " + names(l, 0));
  for (const c of E.REGISTRY.filter(c => c.fixed))
  for (const text of ["Dm7@ii/C G7@V/C | Cmaj7@I/C | Dm7@ii/C | G7@V/C | Cmaj7@I/C | Cmaj7@I/C", "Gm7@ii/F C7@V/F | Fmaj7@I/F"])
  for (const rungs of [{ near: 1 }, { seam: 1 }, { near: 1, seam: 1 }]) {
    const raw = drillOne(text, c.id), sm = drillOne(text, c.id, { rungs });
    raw.concepts.forEach((cc, i) => {
      if (!cc || cc.id !== c.id) return;
      const shift = sm.evs[i][0].midi - raw.evs[i][0].midi;
      ok(shift % 12 === 0 && sm.evs[i].length === raw.evs[i].length &&
         sm.evs[i].every((e, j) => e.midi - raw.evs[i][j].midi === shift && e.name === raw.evs[i][j].name),
        `${c.id} ${JSON.stringify(rungs)} seg ${i}: a fixed concept moved by something other than octaves`);
    });
  }
}

// 14. placement rows (p. 59), all rungs off — D1: a placement fires only where
//     the chord-scale ruling already holds its four notes
{
  const T = [
    ["Cmaj7@I/C", "cell-from-5", "G A B D"], ["Cmaj7@I/C", "cell-from-9", null],
    ["Cmaj7@I/C", "cell-from-3", null],      ["Cmaj7@I/C", "cell-from-6", "A B C E"],
    ["Fmaj7@IV/C", "cell-from-9", "G A B D"], ["Fmaj7@IV/C", "cell-from-3", "A B C E"],
    ["Dm7@ii/C", "cell-from-5", "A B C E"],  ["Dm7@ii/C", "cell-from-3", "F G A C"],
    ["Em7@iii/C", "cell-from-5", null],
    ["G7@V/C", "cell-from-5", "D E F A"],    ["G7@V/C", "cell-from-9", null],
    ["F7@iv/Cmel", "cell-from-9", "G A B D"],
    ["G7#5@vii/Abmel", "cell-from-5", "Db Eb F Ab"], ["G7#5@vii/Abmel", "cell-from-9", "Ab Bb Cb Eb"],
    ["Cmmaj7@i/Cmel", "cell-from-5", "G A B D"], ["Cm6@i/Cm", "cell-from-5", null],
    ["Bm7b5@vii/C", "cell-from-5", "F G A C"], ["Bm7b5@vii/C", "cell-from-3", "D E F A"],
    ["Dm7b5@ii/Cm", "cell-from-5", null],    ["Dm7b5@ii/Cm", "cell-from-3", "F G Ab C"],
  ];
  T.forEach(([text, id, want]) => ok(fires(text, id) === want, `${id} on ${text}: ${fires(text, id)} (want ${want})`));
  // the matched row is reported, so the info line can say how the entry reads here
  ok(drillOne("Dm7@ii/C", "cell-from-5").rows[0].label === "5-6-♭7-9", "Dm7 from the 5th reads 5-6-♭7-9");
  ok(drillOne("Bm7b5@vii/C", "cell-from-5").rows[0].label === "♭5-♯5-♭7-♭9", "Bø from the ♭5 reads ♭5-♯5-♭7-♭9");
  ok(drillOne("Dm7@ii/C", "arp-r357").rows[0] === null, "a concept without rows reports none");
  // every row of every placement is reachable from some annotation the app can express,
  // and its label says what the offsets are
  const DEGNAME = ["R", "♭9", "9", "♭3", "3", "4", "♭5", "5", "♯5", "6", "♭7", "7"];
  const ALT = { 3: ["♭3", "♯9"], 5: ["4", "11"], 6: ["♭5", "♯11"], 9: ["6", "13"], 8: ["♯5", "♭13"] };
  E.REGISTRY.filter(c => c.applies.rows).forEach(c => c.applies.rows.forEach(r => {
    const parts = r.label.split("-");
    ok(parts.length === 4 && parts.every((pt, j) => (ALT[r.offsets[j]] || [DEGNAME[r.offsets[j]]]).includes(pt)),
      `${c.id} row label ${r.label} does not describe offsets ${r.offsets.join(" ")}`);
  }));
  // placements are not fixed: rung 2 may rotate them, as it does digital-1235
  ok(E.REGISTRY.filter(c => c.applies.rows).every(c => !c.fixed), "placements rotate");
}

// 15. permutations: all 23, realized in order, octave-only under rung 2
{
  const perms = E.REGISTRY.filter(c => c.id.startsWith("perm-"));
  ok(perms.length === 23, "23 permutations: " + perms.length);
  const all = []; const go = (a, rest) => rest.length ? rest.forEach((x, i) => go(a.concat(x), rest.filter((_, j) => j !== i))) : all.push(a.join(""));
  go([], [1, 2, 3, 5]);
  ok(perms.map(c => c.short).slice().sort().join() === all.filter(x => x !== "1235").sort().join(), "exactly the permutations of 1 2 3 5, less 1-2-3-5 itself");
  ok(perms.map(c => c.name).join(" ") === "1-2-5-3 1-3-2-5 1-3-5-2 1-5-2-3 1-5-3-2 2-1-5-3 2-1-3-5 2-3-1-5 2-3-5-1 2-5-1-3 2-5-3-1 3-1-2-5 3-1-5-2 3-2-1-5 3-2-5-1 3-5-1-2 3-5-2-1 5-1-2-3 5-1-3-2 5-2-1-3 5-2-3-1 5-3-1-2 5-3-2-1",
    "permutations in the book's order");
  const DOR = { 1: "D", 2: "E", 3: "F", 5: "A" }, MAJ = { 1: "C", 2: "D", 3: "E", 5: "G" };
  perms.forEach(c => {
    const d = [...c.short].map(Number);
    ok(fires("Dm7@ii/C", c.id) === d.map(x => DOR[x]).join(" "), `${c.id} on Dm7: ${fires("Dm7@ii/C", c.id)}`);
    ok(fires("Cmaj7@I/C", c.id) === d.map(x => MAJ[x]).join(" "), `${c.id} on Cmaj7: ${fires("Cmaj7@I/C", c.id)}`);
    const l = drillOne("Dm7@ii/C", c.id), span = l.evs[0].map(e => e.midi);
    ok(Math.max(...span) - Math.min(...span) === 7, `${c.id} stays inside one octave (5 above 1)`);
    ok(drillOne("Dm7@ii/C Dm7@ii/C | Dm7@ii/C", c.id).concepts.every(cc => cc.id === c.id), `${c.id} runs 2 and 4 beats`);
    ok(drillOne("Cmaj7@I/C | Cmaj7@I/C", c.id).concepts[0].id !== c.id, `${c.id} stops at 4 beats`);
  });
  // on a 2-beat chord eighths-hold and eighths are the same four eighths
  const two = drillOne("Dm7@ii/C G7@V/C | Cmaj7@I/C", "perm-2513").evs[0];
  ok(two.map(e => e.slot + ":" + e.dur).join(" ") === "0:1 1:1 2:1 3:1", "a 2-beat permutation is four eighths");
  const four = drillOne("Dm7@ii/C | Cmaj7@I/C", "perm-2513").evs[0];
  ok(four.map(e => e.slot + ":" + e.dur).join(" ") === "0:1 1:1 2:1 3:5", "a 4-beat permutation holds its fourth note");
}

// 16. the Ways (Appendix E), on the printed ii-V-I in F
{
  const P = "Gm7@ii/F C7@V/F | Fmaj7@I/F | Fmaj7@I/F";
  const IN = { "way-in-1": "G Bb D F", "way-in-2": "D Bb G F", "way-in-3": "Bb A G F", "way-in-1-8va": "G Bb D F" };
  for (const [id, want] of Object.entries(IN)) {
    const l = drillOne(P, id, { rungs: { seam: 1 } });
    ok(l.concepts[0].id === id && names(l, 0) === want, `${id}: ${names(l, 0)}`);
    ok(l.evs[1][0].name === "E", `${id}: C7 starts on ${l.evs[1][0].name}, not its 3rd`);
    ok(Math.abs(l.evs[1][0].midi - l.evs[0][3].midi) === 1, `${id}: F resolves to E by half step`);
    ok(E.toBars(l)[0].labels.some(x => x.text.includes("7→3")), `${id}: the landing is marked 7→3`);
  }
  // note names cannot tell F below from F above: the printed contours, in semitones from the first note
  const CONTOUR = { "way-in-1": "0,3,7,10", "way-in-2": "0,-4,-7,-9", "way-in-3": "0,-1,-3,-5", "way-out-1": "0,-2,-4,-6",
    "way-out-2": "0,3,6,10", "way-in-1-8va": "0,-9,-5,-2", "way-out-2-8va": "0,-9,-6,-2" };
  ok(E.REGISTRY.filter(c => c.group === "Ways in and out").map(c => c.id).join() === Object.keys(CONTOUR).sort((a, b) =>
    E.REGISTRY.findIndex(c => c.id === a) - E.REGISTRY.findIndex(c => c.id === b)).join(), "seven Ways, each with a printed contour");
  for (const [id, want] of Object.entries(CONTOUR)) {
    const l = drillOne(P, id), i = l.concepts.findIndex(c => c.id === id), got = l.evs[i].map(e => e.midi - l.evs[i][0].midi).join();
    ok(got === want, `${id} contour: ${got}`);
  }
  const d1 = drillOne(P, "way-in-1-8va").evs[0].map(e => e.midi);
  ok(d1[0] - d1[1] === 9 && d1[0] - d1[3] === 2, "displaced Way in 1: the first G is the octave above");
  const o1 = drillOne(P, "way-out-1", { rungs: { seam: 1 } });
  ok(names(o1, 1) === "E D C Bb" && o1.evs[2][0].name === "A" && o1.evs[1][3].midi - o1.evs[2][0].midi === 1,
    "way-out-1 ends on Bb and Fmaj7 starts a half step below on A: " + names(o1, 1) + " → " + o1.evs[2][0].name);
  for (const id of ["way-out-2", "way-out-2-8va"]) {
    const o2 = drillOne(P, id, { rungs: { seam: 1 } });
    ok(names(o2, 1) === "E G Bb D" && o2.evs[2][0].name === "C" && o2.evs[1][3].midi - o2.evs[2][0].midi === 2,
      `${id} ends on D and Fmaj7 starts a step below on C: ` + names(o2, 1) + " → " + o2.evs[2][0].name);
    ok(o2.marks[2].has("seam5") && !o2.marks[2].has("seam"), `${id}: the landing carries the →5 mark, not 7→3`);
    ok(E.toBars(o2)[1].labels.some(x => x.text.includes("→5")), `${id}: →5 on the bar label`);
  }
  const d2 = drillOne(P, "way-out-2-8va").evs[1].map(e => e.midi);
  ok(d2[0] - d2[1] === 9 && d2[0] - d2[3] === 2, "displaced Way out 2: the first E is the octave above");
  // practice suggestion 4 needs no entry: degree 2 of a 7b9 chord is its b9
  ok(fires("C7b9@v/Fm | Fm6@i/Fm", "way-out-1") === "E Db C Bb", "way-out-1 on C7b9: " + fires("C7b9@v/Fm | Fm6@i/Fm", "way-out-1"));
  ok(fires("C7b9@v/Fm | Fm6@i/Fm", "way-out-2") === "E G Bb Db", "way-out-2 on C7b9: " + fires("C7b9@v/Fm | Fm6@i/Fm", "way-out-2"));
  // D2: on a 4-beat chord the fourth note holds
  ok(drillOne("Gm7@ii/F | C7@V/F | Fmaj7@I/F | Fmaj7@I/F", "way-in-3").evs[0].map(e => e.slot + ":" + e.dur).join(" ") === "0:1 1:1 2:1 3:5",
    "a 4-beat Way holds its fourth note");
  // rung 2 having already found the 3rd, the next seam must not rotate it away again
  const all4 = drillOne("Gm7@ii/F | C7@V/F | Fmaj7@I/F | Fmaj7@I/F", "way-in-2", { rungs: { fold: 1, near: 1, app: 1, seam: 1 } });
  ok(all4.evs[1][0].name === "E", "all rungs on: C7 still starts on E after a Way in (" + names(all4, 1) + ")");
  // practice suggestion 2: Mixed with the five base Ways checked writes Way in + Way out lines
  const five = new Set(["way-in-1", "way-in-2", "way-in-3", "way-out-1", "way-out-2"]);
  for (let seed = 1; seed <= 12; seed++) {
    const l = build(E.parseProg("Gm7@ii/F | C7@V/F | Fmaj7@I/F | Fmaj7@I/F"), { mode: "mixed", checked: five, seed, rungs: { seam: 1 } });
    ok(/^way-in-[123]$/.test(l.concepts[0].id) && /^way-out-[12]$/.test(l.concepts[1].id), `seed ${seed}: ${l.concepts[0].id} + ${l.concepts[1].id}`);
    ok(l.evs[1][0].name === "E" && l.evs[2][0].name === (l.concepts[1].lands === 5 ? "C" : "A"), `seed ${seed}: the line lands where its Ways say`);
  }
}

// 17. applies.next: where a Way does not apply (D3)
{
  const at = (text, id, i) => drillOne(text, id).concepts[i].id === id;
  ok(!at("Dm7@ii/C | Gm7@ii/F", "way-in-1", 1), "a Way in does not apply to the last chord");
  ok(!at("Gm7@ii/F | G7@V/C | Cmaj7@I/C", "way-in-1", 0), "nor to a m7 whose next root is not a fourth up");
  ok(!at("Gm7@ii/F | Cmaj7@I/C", "way-in-1", 0), "nor to a m7 followed by a non-dominant a fourth up");
  ok(!at("Gm7@ii/F | Cm7@ii/Bb", "way-in-1", 0), "nor to a m7 followed by another m7");
  ok(at("Gm7@ii/F | C7sus4@V/F | Fmaj7@I/F", "way-in-1", 0), "a sus dominant a fourth up is a dominant");
  ok(at("C7@V/F | Fm7@ii/Eb", "way-out-1", 0) && at("C7@V/F | F7@sec", "way-out-1", 0), "a Way out takes any quality a fourth up");
  ok(!at("C7@V/F | Gm7@ii/F", "way-out-1", 0) && !at("Gm7@ii/F | C7@V/F", "way-out-1", 1), "but not another motion, and not the last chord");
  ok(!at("Dm7@ii/C | Dm7@ii/C | G7@V/C | Cmaj7@I/C", "way-in-1", 0), "an 8-beat ii is past a Way's 4 beats");
  // a lock that no longer applies falls through, as any lock does
  const lk = build(E.parseProg("Gm7@ii/F | Cmaj7@I/C"), { mode: "mixed", seed: 3, locks: { 0: "way-in-1" } });
  ok(lk.concepts[0].id !== "way-in-1", "a locked Way does not survive a change that breaks its next-chord rule");
}

// 18. lands is rung 4's business only
{
  const P = "Gm7@ii/F C7@V/F | Fmaj7@I/F | Fmaj7@I/F";
  for (const id of E.REGISTRY.filter(c => c.lands).map(c => c.id))
  for (const rungs of [{}, { fold: 1 }, { app: 1 }]) {
    const a = drillOne(P, id, { rungs }), b = drillOne(P, "no-such-concept", { rungs });
    a.concepts.forEach((c, i) => { if (i > 0 && a.concepts[i - 1].id === id && c.id === b.concepts[i].id)
      ok(JSON.stringify(a.evs[i]) === JSON.stringify(b.evs[i]), `${id} ${JSON.stringify(rungs)}: rung 4 off, yet the next segment moved`); });
  }
  // a fixed next concept that starts elsewhere: the seam is left alone, no mark
  const l = build(E.parseProg("Gm7@ii/F C7@V/F | Fmaj7@I/F"), { mode: "mixed", seed: 1, rungs: { seam: 1 },
    locks: { 0: "way-in-1", 1: "perm-2513", 2: "arp-r357" } });
  const raw = build(E.parseProg("Gm7@ii/F C7@V/F | Fmaj7@I/F"), { mode: "mixed", seed: 1, locks: { 0: "way-in-1", 1: "perm-2513", 2: "arp-r357" } });
  ok(l.concepts[1].id === "perm-2513" && JSON.stringify(l.evs[1]) === JSON.stringify(raw.evs[1]) && l.marks[1].size === 0,
    "Way in → a fixed 2-5-1-3: left alone, unmarked");
  ok(JSON.stringify(l.evs[2]) === JSON.stringify(raw.evs[2]) && l.marks[2].size === 0,
    "a fixed dominant that does not end on its b7 offers no 7→3");
  // a fixed next concept that already starts on the landing degree re-anchors by octave
  const io = build(E.parseProg("Gm7@ii/F C7@V/F | Fmaj7@I/F"), { mode: "mixed", seed: 1, rungs: { seam: 1 }, range: GUITAR,
    locks: { 0: "way-in-2", 1: "way-out-2", 2: "arp-r357" } });
  ok(names(io, 0) + " | " + names(io, 1) + " | " + io.evs[2][0].name === "D Bb G F | E G Bb D | C", "Way in 2 + Way out 2: " + names(io, 0) + " | " + names(io, 1) + " | " + io.evs[2][0].name);
  ok(io.evs[0][3].midi - io.evs[1][0].midi === 1 && io.evs[1][3].midi - io.evs[2][0].midi === 2, "both landings are the nearest octave");
  // a run takes the landing as a start-degree override
  const run = build(E.parseProg("Gm7@ii/F | C7@V/F | Fmaj7@I/F | Fmaj7@I/F"), { mode: "mixed", seed: 1, rungs: { seam: 1 },
    locks: { 0: "arp-r357", 1: "way-out-2", 2: "scale-run" } });
  ok(run.evs[2][0].name === "C" && run.marks[2].has("seam5"), "a scale run after Way out 2 starts on the 5th: " + names(run, 2));
}

// 19. routine components (Appendix F): exact beat lengths, no fill
{
  const R = { "routine-1": [4, "C D E F G F E D"], "routine-2": [8, "C D E F G A B C D C B A G F E D"],
    "routine-3": [4, "C E G E C E G E"], "routine-4": [4, "C E G B D B G E"] };
  const TEXT = { 2: "Cmaj7@I/C Cmaj7@I/C", 4: "Cmaj7@I/C | Dm7@ii/C", 8: "Cmaj7@I/C | Cmaj7@I/C", 12: "Cmaj7@I/C | Cmaj7@I/C | Cmaj7@I/C", 16: "Cmaj7@I/C | % | % | %" };
  for (const [id, [beats, want]] of Object.entries(R))
  for (const b of [2, 4, 8, 12, 16]) {
    const l = drillOne(TEXT[b], id);
    ok(l.segs[0].beats === b, `test text for ${b} beats parses to ${l.segs[0].beats}`);
    ok((l.concepts[0].id === id) === (b === beats), `${id} on a ${b}-beat chord: ${l.concepts[0].id}`);
    if (b === beats) ok(names(l, 0) === want && l.evs[0].every((e, j) => e.dur === 1 && e.slot === j) && l.evs[0].length === b * 2,
      `${id}: ${names(l, 0)}`);
  }
  ok(fires("Bm7b5@vii/C | Em7@iii/C", "routine-3") === "B D F D B D F D", "the triad follows the chord: " + fires("Bm7b5@vii/C | Em7@iii/C", "routine-3"));
  ok(drillOne("Bdim7 | Cmaj7@I/C", "routine-4").concepts[0].id === "arp-r357", "no routine component on a º7");
  // on the ii-V-I cycle (4, 4, 8 beats) a Mixed draw from the four puts the scale to the 9th on every I
  const four = new Set(Object.keys(R));
  for (const seed of [1, 2, 3]) {
    const l = build(E.PROGRESSIONS.ii51maj.chords, { mode: "mixed", checked: four, seed });
    ok(l.segs.every((s, i) => s.beats === 8 ? l.concepts[i].id === "routine-2" : four.has(l.concepts[i].id) && l.concepts[i].id !== "routine-2"),
      `seed ${seed}: routine draw on the ii-V-I cycle`);
  }
}

// 20. no double accidentals anywhere: every concept, every preset, every part, all rungs
{
  let bad = 0;
  for (const progId of Object.keys(E.PROGRESSIONS))
  for (const drillId of E.REGISTRY.map(c => c.id))
  for (const rungs of [{}, { fold: 1, near: 1, app: 1, seam: 1 }]) {
    const bars = E.toBars(build(E.PROGRESSIONS[progId].chords, { drillId, rungs }));
    for (const part of ["c", "bb", "eb"])
      E.transposeBars(bars, part).forEach(bar => bar.notes.forEach(n => { if (n.name.length > 2) bad++; }));
  }
  ok(bad === 0, bad + " double accidentals written");
  for (const text of ["G7#5@vii/Abmel | Cmaj7@I/C", "Db7@iv/Abmel | Gbmaj7@I/Gb", "Bbm7b5@vii/B | Emaj7@IV/B", "Ebm7@ii/Db Ab7b9@v/Dbm | Dbm6@i/Dbm"])
  for (const c of E.REGISTRY) {
    const bars = E.toBars(drillOne(text, c.id));
    for (const part of ["c", "bb", "eb"])
      E.transposeBars(bars, part).forEach(bar => bar.notes.forEach(n => ok(n.name.length <= 2, `${c.id} on ${text} (${part}): ${n.name}`)));
  }
}

console.log(checks + " checks, " + fails + " failures");
process.exit(fails ? 1 : 0);
