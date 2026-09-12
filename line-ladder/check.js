// Headless checks for Line Ladder (node check.js). Loads the app's own engine
// from index.html plus the concept packs from concepts/, then walks the
// acceptance list from the rebuild brief:
//  1. every preset x drill concept x rung combination builds; every bar's
//     notes + rests sum to 8 eighths
//  2. all rungs off: every segment starts on its own degree 1 (root pitch
//     class), no octave folding applied
//  3. the seed templates reproduce the old formulas' degree/rhythm shapes
//     (R-3-5-7 eighths-hold, the scale run's endpoints, digital 1235 on
//     2-beat chords, dim7 falling back to the arpeggio in scale drills)
//  4. toggling one rung on a ii-V-I changes only bars its mark claims
//  5. the Bb part reads a whole step up with the right key signature
//  6. a concept pushed into the registry appears and generates
//  7. approach and seam rungs connect a ii-V-I the way the brief says
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const blocks = src.split("<script>").slice(1).map(b => b.split("</script>")[0]);
const dataJs   = blocks.find(b => b.includes("const KEYS"));
const engineJs = blocks.find(b => b.includes("const REGISTRY"));
const drawJs   = blocks.find(b => b.includes("function engrave")).split("/* ===== ui ===== */")[0];
const concepts = ["core.js", "digital.js"].map(f => fs.readFileSync(path.join(__dirname, "concepts", f), "utf8")).join("\n");
const harness = `const window={LL_CONCEPTS:[]};\n` + concepts + `
window.LL_CONCEPTS.push({ id:"test-pack-concept", name:"Test 1-3-2-1", short:"t1321",
  group:"Digital patterns", source:"", tags:[],
  applies:{ qualities:["maj7","m7","7"], minBeats:2, maxBeats:2 },
  degrees:[1,3,2,1], against:"scale", rhythm:"eighths", endpoint:null });
` + dataJs + engineJs + drawJs + `
;return { PROGRESSIONS, REGISTRY, buildLine, toBars, transposeBars, writtenFifths,
  parseProg, chordScale, lyExport, engrave, pcOf, CH, M, N, PARTS, refRoot, KEYS };`;
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
for (const drillId of ["arp-r357", "scale-run", "digital-1235", "arp-3579", "arp-up-scale-down"])
for (const rungs of RUNGSETS) {
  let line, bars;
  try { line = build(E.PROGRESSIONS[progId].chords, { drillId, rungs }); bars = E.toBars(line); }
  catch (err) { fail(`${progId}/${drillId}/${JSON.stringify(rungs)}: ${err.message}`); continue; }
  bars.forEach(bar => {
    const s = bar.notes.reduce((a, n) => a + n.len, 0) + bar.rests.reduce((a, r) => a + r.len, 0);
    ok(s === 8, `${progId}/${drillId}/${JSON.stringify(rungs)} bar ${bar.n}: ${s} eighths`);
  });
}

// 2. raw output: every segment starts on its own degree 1 in the reference
//    octave; no folding
{
  for (const progId of Object.keys(E.PROGRESSIONS)) {
    const line = build(E.PROGRESSIONS[progId].chords, {});
    line.segs.forEach((seg, i) => {
      const evs = line.evs[i];
      if (!evs.length) return;
      ok(evs[0].midi % 12 === seg.ch.pc, `${progId} seg ${i}: raw start not the root`);
      ok(evs[0].midi === E.refRoot(seg, RANGE), `${progId} seg ${i}: raw start not in the reference octave`);
      ok(line.marks[i].size === 0, `${progId} seg ${i}: marks with all rungs off`);
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

console.log(checks + " checks, " + fails + " failures");
process.exit(fails ? 1 : 0);
