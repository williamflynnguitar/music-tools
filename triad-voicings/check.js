// Headless checks for Triad Voicings (node check.js). Loads the engine from
// index.html (check-deck.js extraction pattern), then verifies it against the
// book pages themselves — decoded from the PDF at pixel level during the
// build, root G (pp. 40-43 print G, not C as the build brief assumed):
//  1. closed G major/minor: the engine's lowest placement per set x inversion
//     equals the printed cell (except the all-open D-G-B the book skips —
//     its 12-12-12 cell is the engine's +8va)
//  2. closed G dim/aug: every confidently decoded cell appears in closedAll
//  3. open G major: printed defaults and "or" alternates all enumerate;
//     row defaults match the book except the documented G- middle 2nd inv
//  4. augmented open rows have alternates (symmetry), as p. 43 prints
//  5. Ex. 8 (p. 81): F major, set 2-3-4, "root of C" reproduces the TAB
//     exactly; romans V vi vii deg I ii iii IV V; harmonic-minor romans
//  6. structure: all roots x qualities x sets x inversions enumerate clean
//  7. the key-study .ly compiles under lilypond (if installed)
//  8. Over a bass note (Introduction to Jazz Guitar, 2014, pp. 25-27): the major table
//     against Ex. 21 cell by cell (read from the page at 400 dpi, Sep 2026), transposition,
//     bass order and spelling, View 2 as the exact inverse of View 1, unruled qualities,
//     every box on the selected set, Choose distractors, and no "card"/"deck" in any text
const fs = require("fs"), path = require("path"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const chunks = src.split("<script>").map(c => c.split("</script>")[0]);
const js = chunks.filter(c => c.includes("const OPEN =") || c.includes("function boxSVG")).join("\n");
const E = new Function(js + `; return { OPEN, ROOTS, KEYS, TRI, INV, CSETS, OROWS, MAXF, OPEN_SPAN,
  toneNames, closedAll, closedLowest, openPlacements, openRow, diatonicTriads, keySpell,
  entryNote, harmonizations, keyRun, lyDocument, boxSVG, chordStaffSVG, pcOf,
  TBN, TBN_IV, TBN_TEXT, tbnRuled, tbnCells, tbnTriad, tbnSymbols, tbnLookup, tbnRule, tbnAnswer,
  tbnShapes, tbnChoose, tbnBassMidi, tbnSystemSVG, tbnStaffBottom, tbnSymLines, pretty };`)();

let fails = 0, checks = 0;
const fail = m => { fails++; console.log("FAIL", m); };
const ok = (cond, m) => { checks++; if (!cond) fail(m); };
const sig = notes => notes.map(n => n.s + ":" + n.f).join(" ");

const G = 7;
// 1. closed G major and minor, every cell of p. 40 (bottom->top [string,fret])
const P40 = {
  maj: { '123': { 1: "3:4 2:3 1:3", 2: "3:7 2:8 1:7", 0: "3:12 2:12 1:10" },
         '234': { 0: "4:5 3:4 2:3", 1: "4:9 3:7 2:8", 2: "4:12 3:12 2:12" },
         '345': { 1: "5:2 4:0 3:0", 2: "5:5 4:5 3:4", 0: "5:10 4:9 3:7" },
         '456': { 0: "6:3 5:2 4:0", 1: "6:7 5:5 4:5", 2: "6:10 5:10 4:9" } },
  min: { '123': { 1: "3:3 2:3 1:3", 2: "3:7 2:8 1:6", 0: "3:12 2:11 1:10" },
         '234': { 0: "4:5 3:3 2:3", 1: "4:8 3:7 2:8", 2: "4:12 3:12 2:11" },
         '345': { 1: "5:1 4:0 3:0", 2: "5:5 4:5 3:3", 0: "5:10 4:8 3:7" },
         '456': { 0: "6:3 5:1 4:0", 1: "6:6 5:5 4:5", 2: "6:10 5:10 4:8" } },
};
for (const q of ['maj', 'min']) for (const set of Object.keys(P40[q])) for (const inv of [0, 1, 2]) {
  const want = P40[q][set][inv];
  const all = E.closedAll(G, q, set, inv);
  if (q === 'maj' && set === '234' && inv === 2) {
    ok(sig(all[0].notes) === "4:0 3:0 2:0", "G 2nd inv on 2-3-4: lowest should be the open D-G-B");
    ok(all.some(v => sig(v.notes) === want), "G 2nd inv on 2-3-4: the book's 12-12-12 must be the +8va");
    continue;
  }
  ok(sig(all[0].notes) === want, `closed ${q} ${set} inv${inv}: got ${sig(all[0].notes)}, book has ${want}`);
}
// 2. closed G dim/aug cells (p. 41), containment in closedAll (any octave)
const P41 = {
  dim: [ ['123',1,"3:3 2:2 1:3"], ['123',2,"3:6 2:8 1:6"], ['123',0,"3:12 2:11 1:9"],
         ['234',0,"4:5 3:3 2:2"], ['234',1,"4:8 3:6 2:8"], ['234',2,"4:11 3:12 2:11"],
         ['345',2,"5:4 4:5 3:3"], ['345',0,"5:10 4:8 3:6"], ['345',1,"5:13 4:11 3:12"],
         ['456',1,"6:6 5:4 4:5"], ['456',2,"6:9 5:10 4:8"], ['456',0,"6:15 5:13 4:11"] ],
  aug: [ ['123',1,"3:4 2:4 1:3"], ['123',2,"3:8 2:8 1:7"], ['123',0,"3:12 2:12 1:11"],
         ['234',0,"4:5 3:4 2:4"], ['234',1,"4:9 3:8 2:8"], ['234',2,"4:13 3:12 2:12"],
         ['345',1,"5:2 4:1 3:0"], ['345',2,"5:6 4:5 3:4"], ['345',0,"5:10 4:9 3:8"],
         ['456',0,"6:3 5:2 4:1"], ['456',1,"6:7 5:6 4:5"], ['456',2,"6:11 5:10 4:9"] ],
};
for (const q of ['dim', 'aug']) for (const [set, inv, want] of P41[q])
  ok(E.closedAll(G, q, set, inv).some(v => sig(v.notes) === want),
     `closed ${q} ${set} inv${inv}: book cell ${want} not produced`);
// 3. open G major (p. 42): defaults per row, and the printed alternates exist
const openDefault = (q, inv, row) => { const r = E.openRow(G, q, inv, row); return r && sig(r.def.notes); };
ok(openDefault('maj', 2, 1) === "4:0 2:0 1:3", "open maj top row 2nd inv default: " + openDefault('maj', 2, 1));
ok(openDefault('maj', 0, 1) === "4:5 3:7 1:7", "open maj top row root default: " + openDefault('maj', 0, 1));
ok(openDefault('maj', 1, 1) === "4:9 2:8 1:10", "open maj top row 1st inv default: " + openDefault('maj', 1, 1));
ok(openDefault('maj', 0, 2) === "5:10 4:12 2:12", "open maj middle row root default: " + openDefault('maj', 0, 2));
// documented difference: the engine's bottom-row root default uses the open D
// (6:3 4:0 3:4); the book's 6:3 5:5 3:4 must still be there as an alternate
ok(openDefault('maj', 0, 3) === "6:3 4:0 3:4", "open maj bottom row root default: " + openDefault('maj', 0, 3));
{ const r = E.openRow(G, 'maj', 0, 3);
  ok(r.alts.some(a => sig(a.notes) === "6:3 5:5 3:4"), "open maj bottom row root: book's shape should be an alt"); }
ok(openDefault('maj', 1, 3) === "6:7 4:5 3:7", "open maj bottom row 1st inv default: " + openDefault('maj', 1, 3));
ok(openDefault('maj', 2, 3) === "6:10 4:9 3:12", "open maj bottom row 2nd inv default: " + openDefault('maj', 2, 3));
const anyPlacement = (q, inv, want) => E.openPlacements(G, q, inv).some(p => sig(p.notes) === want);
ok(anyPlacement('maj', 1, "5:2 4:5 2:3"), "open maj middle 1st: book shape missing");
ok(anyPlacement('maj', 1, "5:2 3:0 2:3"), "open maj middle 1st: book 'or' missing");
// the book's 5:5 3:4 2:8 cell (span 4) was cut in the Sep 2026 numbered
// review (class #17) — asserted absent further down with the other cuts
ok(anyPlacement('maj', 2, "5:5 3:4 1:3"), "open maj middle 2nd: book 'or' (top on string 1) missing");
// G- middle 2nd inv — the book prints the span-5 5-3-8 shape (p. 42), but
// William ruled its class unplayable (Sep 2026): a span-4/5 stretch that is
// not a lone top-voice reach is eliminated. The printed cell must therefore
// NOT enumerate any more; the compact default stays.
ok(!anyPlacement('min', 2, "5:5 3:3 2:8"), "open min middle 2nd: the book's span-5 shape is ruled out (Sep 2026) and must not enumerate");
{ const r = E.openRow(G, 'min', 2, 2);
  ok(r && (sig(r.def.notes) === "5:5 4:8 2:8"), "open min middle 2nd: engine default: " + (r && sig(r.def.notes))); }
// William's Sep 2026 playability rulings, as classes (root C, sounding s:f):
// five-string spreads with span > 2, and span-4 stretches that are not a
// lone top-voice reach, must not enumerate.
const goneAt = (pc, q, inv, want) => ok(!E.openPlacements(pc, q, inv).some(p => sig(p.notes) === want),
  `ruled out (Sep 2026) but still enumerates: pc${pc} ${q} inv${inv} ${want}`);
const gone = (q, inv, want) => goneAt(0, q, inv, want);
goneAt(8, 'maj', 2, "4:1 3:5 1:4"); goneAt(8, 'maj', 0, "5:11 3:8 1:8"); goneAt(8, 'maj', 1, "5:15 3:13 1:11");
gone('maj', 0, "6:8 3:0 2:5");  gone('maj', 0, "6:8 5:10 2:5"); gone('maj', 1, "6:12 4:10 2:8");
gone('maj', 2, "5:10 4:14 2:13");
gone('min', 0, "6:8 3:0 2:4");  gone('min', 0, "5:3 4:5 3:8");  gone('min', 1, "5:6 2:1 1:3");
gone('min', 1, "6:11 5:15 3:12"); gone('min', 2, "5:10 4:13 1:8"); gone('min', 0, "5:15 3:12 1:11");
gone('dim', 1, "4:1 3:5 1:2");  gone('dim', 1, "5:6 3:5 1:2");  gone('dim', 1, "5:6 2:1 1:2");
gone('dim', 1, "5:6 4:10 3:11"); gone('dim', 1, "6:11 5:15 3:11");
gone('dim', 2, "4:4 3:8 1:8");  gone('dim', 2, "5:9 4:13 1:8"); gone('dim', 2, "5:9 2:4 1:8");
gone('dim', 2, "5:9 4:13 2:13"); gone('dim', 2, "5:9 3:8 2:13"); gone('dim', 2, "6:2 5:6 3:5");
gone('dim', 0, "5:3 4:4 3:8");  gone('dim', 0, "5:15 3:11 1:11");
gone('aug', 1, "5:7 3:5 1:4");
// still-playable classes the book prints stay in:
ok(anyPlacement('maj', 2, "5:5 3:4 1:3"), "book's compact five-string-spread 'or' (p. 42) must survive");
// Span-4 numbered review (Sep 2026): William kept only the two bottom-row
// 6-4-3 grips (#12 °, #22 minor) and cut the other 21 classes — including
// the book's printed G middle-row 2nd-inversion cell (p. 42, 5:5 3:4 2:8,
// class #17), a second printed-cell override after the G- 5-3-8.
const keptAt = (pc, q, inv, want) => ok(E.openPlacements(pc, q, inv).some(p => sig(p.notes) === want),
  `kept class must enumerate: pc${pc} ${q} inv${inv} ${want}`);
keptAt(0, 'dim', 2, "6:2 4:1 3:5");   // #12: ° bottom-row 6-4-3 grip
keptAt(0, 'min', 2, "6:3 4:1 3:5");   // #22: minor bottom-row 6-4-3 grip
goneAt(7, 'maj', 2, "5:5 3:4 2:8");   // #17's G exemplar — the printed p. 42 cell
goneAt(0, 'aug', 0, "5:3 3:1 2:5");  goneAt(2, 'aug', 0, "4:0 3:3 2:7");
goneAt(8, 'aug', 1, "5:3 3:1 2:5");  goneAt(10, 'aug', 1, "4:0 3:3 2:7");
goneAt(4, 'aug', 2, "5:3 3:1 2:5");  goneAt(6, 'aug', 2, "4:0 3:3 2:7");
goneAt(7, 'dim', 0, "3:0 2:2 1:6");  goneAt(9, 'dim', 0, "5:0 4:1 3:5");
goneAt(9, 'dim', 2, "4:1 2:1 1:5");  goneAt(1, 'dim', 2, "3:0 2:5 1:9");
goneAt(4, 'dim', 2, "5:1 3:0 2:5");  goneAt(3, 'dim', 2, "5:0 4:4 3:8");
goneAt(5, 'maj', 0, "4:3 2:1 1:5");  goneAt(7, 'maj', 0, "3:0 2:3 1:7");
goneAt(9, 'maj', 0, "5:0 4:2 3:6");  goneAt(4, 'maj', 2, "5:2 3:1 2:5");
goneAt(7, 'maj', 2, "4:0 3:4 2:8");
goneAt(2, 'min', 0, "4:0 3:2 2:6");  goneAt(0, 'min', 2, "3:0 2:4 1:8");
goneAt(9, 'min', 2, "4:2 2:1 1:5");  goneAt(2, 'min', 2, "5:0 4:3 3:7");
// 4. augmented symmetry: alternates on every open row that exists
for (const row of [1, 2, 3]) for (const inv of [0, 1, 2]) {
  const r = E.openRow(G, 'aug', inv, row);
  // inv0/inv2 middle row lost their only alternates to the Sep 2026 span-4
  // cuts (#1-#6) — the printed 'or' pairs there are overridden by the ruling
  const cutByRuling = row === 2 && (inv === 0 || inv === 2);
  if (r && !cutByRuling) ok(r.alts.length >= 1, `open aug inv${inv} row${row}: p. 43 prints 'or' pairs, engine found no alternate`);
}
// 5. Ex. 8, p. 81 — exact
{
  const hs = E.harmonizations('F', 'major', '234');
  ok(hs.map(h => h.as + " of " + h.sym).join(", ") === "root of C, 3rd of A-, 5th of F",
     "harmonize choices: " + hs.map(h => h.as + " of " + h.sym).join(", "));
  const run = E.keyRun('F', 'major', '234', 0);
  const tab = run.map(c => c.notes.map(n => n.f).join("-")).join(" ");
  ok(tab === "2-0-1 3-2-3 5-3-5 7-5-6 8-7-8 10-9-10 12-10-11 14-12-13", "Ex. 8 TAB: " + tab);
  ok(run.map(c => c.rn).join(" ") === "V vi vii° I ii iii IV V", "Ex. 8 romans: " + run.map(c => c.rn).join(" "));
  ok(run.map(c => c.rootName + E.TRI[c.q].sym).join(" ") === "C D- E° F G- A- Bb C", "Ex. 8 chords: " + run.map(c => c.rootName + E.TRI[c.q].sym).join(" "));
  ok(run.every(c => c.inv === 1), "Ex. 8: root-on-top fixes 1st inversion throughout");
}
ok(E.diatonicTriads(E.pcOf('C'), 'harm').map(t => t.rn).join(" ") === "i ii° III+ iv V VI vii°",
   "harmonic minor romans: " + E.diatonicTriads(E.pcOf('C'), 'harm').map(t => t.rn).join(" "));
ok(E.diatonicTriads(E.pcOf('F'), 'major').map(t => t.rn).join(" ") === "I ii iii IV V vi vii°",
   "major romans: " + E.diatonicTriads(E.pcOf('F'), 'major').map(t => t.rn).join(" "));
// brief's C sanity value, as pitches: C root position on 3-4-5 is A3-D2-G0
ok(sig(E.closedLowest(0, 'maj', '345', 0).notes) === "5:3 4:2 3:0", "closed C root 3-4-5 should be x-3-2-0-x-x");
// 5b. key study open rows (Sep 2026, assumption B confirmed by William):
// every playable choice yields 8 open voicings — top voice on the row's
// string walking the scale, all notes chord tones, ascending in pitch,
// every placement passing the Sep 2026 playability rule.
{
  let combos = 0, playableChoices = 0, emptyCombos = 0;
  for (const key of E.KEYS) for (const sk of ['major', 'harm'])
    for (const setId of ['open-top', 'open-middle', 'open-bottom']) {
      combos++;
      const hs = E.harmonizations(key, sk, setId);
      if (!hs.some(h => h.playable)) { emptyCombos++; continue; }
      hs.forEach((h, i) => {
        if (!h.playable) return;
        playableChoices++;
        const run = E.keyRun(key, sk, setId, i);
        ok(run.length === 8, `open run ${key} ${sk} ${setId} c${i}: 8 steps`);
        const topS = { 'open-top': 1, 'open-middle': 2, 'open-bottom': 3 }[setId];
        let prevTop = -1;
        for (const c of run) {
          ok(c.notes && c.notes.length === 3, `open run ${key} ${sk} ${setId} c${i} ${c.rootName}: 3 notes`);
          if (!c.notes) continue;
          const [b, m, t] = c.notes;
          ok(t.s === topS, `open run ${key} ${sk} ${setId}: top voice on string ${topS}, got ${t.s}`);
          ok(b.midi < m.midi && m.midi < t.midi, `open run ${key} ${sk} ${setId} ${c.rootName}: voices ascend`);
          ok(t.midi > prevTop, `open run ${key} ${sk} ${setId}: top line ascends`); prevTop = t.midi;
          const pcs = new Set(E.TRI[c.q].iv.map(v => (E.pcOf(c.rootName) + v) % 12));
          ok(c.notes.every(n => pcs.has(((n.midi % 12) + 12) % 12)), `open run ${key} ${sk} ${setId} ${c.rootName}: chord tones only`);
          const fr = c.notes.map(n => n.f), fretted = fr.filter(f => f > 0);
          const span = fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0;
          ok(span <= 4 && !(b.s - t.s > 3 && span > 2), `open run ${key} ${sk} ${setId} ${c.rootName}: playability rule`);
        }
      });
    }
  ok(playableChoices > 0, "open key study: some playable choices exist");
  console.log(`open key study: ${combos} combos, ${playableChoices} playable choices, ${emptyCombos} with none`);
}
// 6. structure
for (let pc = 0; pc < 12; pc++) for (const q of Object.keys(E.TRI)) {
  for (const set of Object.keys(E.CSETS)) for (const inv of [0, 1, 2]) {
    const all = E.closedAll(pc, q, set, inv);
    ok(all.length >= 1, `closed ${pc}/${q}/${set}/${inv}: no placement`);
    all.forEach(v => {
      ok(v.notes.every((n, i) => !i || n.midi > v.notes[i - 1].midi), "closed not ascending");
      ok(v.notes.every(n => n.f >= 0 && n.f <= E.MAXF), "closed fret out of range");
      ok(v.notes.every(n => n.midi === E.OPEN[n.s] + n.f), "closed midi/fret mismatch");
    });
    for (let i = 1; i < all.length; i++) ok(all[i].notes[0].f - all[i - 1].notes[0].f === 12, "closed not one per octave");
  }
  for (const inv of [0, 1, 2]) {
    const ps = E.openPlacements(pc, q, inv);
    ok(ps.length >= 1, `open ${pc}/${q}/${inv}: no placement`);
    ps.forEach(p => {
      const ss = p.notes.map(n => n.s);
      ok(ss[0] > ss[1] && ss[1] > ss[2], "open strings not descending");
      ok(p.notes.every((n, i) => !i || n.midi > p.notes[i - 1].midi), "open not ascending");
      const fr = p.notes.map(n => n.f).filter(f => f > 0);
      ok(!fr.length || Math.max(...fr) - Math.min(...fr) <= E.OPEN_SPAN, "open span exceeded");
    });
    ok([1, 2, 3].some(row => E.openRow(pc, q, inv, row)), `open ${pc}/${q}/${inv}: no row has a default`);
  }
  // tone spelling matches pitch
  const names = E.toneNames(E.ROOTS[pc], q);
  names.forEach((n, i) => ok(E.pcOf(n) === (pc + E.TRI[q].iv[i]) % 12, `spelling ${E.ROOTS[pc]}${q}: ${n}`));
}
// key study: every key x tonality x set builds 8 chords in range
for (const key of ["C","F","Bb","Eb","Ab","Db","F#","B","E","A","D","G"])
  for (const sk of ['major', 'harm']) for (const set of Object.keys(E.CSETS)) {
    const hs = E.harmonizations(key, sk, set);
    ok(hs.some(h => h.playable), `keyRun ${key}/${sk}/${set}: no playable harmonization`);
    ok(hs[2].playable, `keyRun ${key}/${sk}/${set}: 5th-on-top should always be playable`);
    hs.forEach((h, ch) => {
      if (!h.playable) return;
      const run = E.keyRun(key, sk, set, ch);
      ok(run.length === 8, `keyRun ${key}/${sk}/${set}/${ch}: ${run.length} chords`);
      run.forEach(c => c.notes.forEach(n => ok(n.f >= 0 && n.f <= 17, `keyRun ${key}/${sk}/${set}/${ch}: fret ${n.f}`)));
      ok(new Set(run.map(c => c.inv)).size === 1, `keyRun ${key}/${sk}/${set}/${ch}: inversion should be fixed`);
    });
  }
// 8. Over a bass note
{
  // 8.1 Ex. 21, p. 27, in printed order — the B-flat cell carries both readings
  const EX21 = [["E-7(♭6)"], ["E♭13(♭9)"], ["D9(sus4)"], ["D♭°Δ7"], ["CΔ7"], ["B7(♭9 ♭13 sus4)"],
    ["B♭Δ9(♯11)", "B♭9(♯11)"], ["A-7"], ["A♭Δ7(♯5)"], ["G13(sus4)"], ["G♭7alt."], ["FΔ9"]];
  const c21 = E.tbnCells(0, 'maj');
  ok(c21.length === 12, "Ex. 21: twelve cells");
  EX21.forEach((want, k) => ok(JSON.stringify(c21[k].labels) === JSON.stringify(want),
    `Ex. 21 cell ${k + 1}: got ${c21[k].labels.join(" / ")}, book prints ${want.join(" / ")}`));
  ok(c21.reduce((n, c) => n + c.labels.length, 0) === 13, "Ex. 21: thirteen applications");
  // Ex. 20's staff: C-E-G written at C5, basses E4 down to F3 (sounding an octave lower)
  ok(E.tbnTriad(0, 'maj').map(n => n.name + n.midi).join(" ") === "C60 E64 G67", "Ex. 20 triad register");
  ok(c21[0].midi === 52 && c21[11].midi === 41, "Ex. 20 bass register: E down to F");
  // 8.2 transposition
  const over = (triad, bass) => E.tbnCells(E.pcOf(triad), 'maj').find(c => c.bassPc === E.pcOf(bass)).labels.join(" / ");
  ok(over('F', 'G') === "G9(sus4)", "F major over G: " + over('F', 'G'));
  ok(over('D', 'C') === "CΔ9(♯11) / C9(♯11)", "D major over C: " + over('D', 'C'));
  ok(over('E', 'C') === "CΔ7(♯5)", "E major over C: " + over('E', 'C'));
  ok(over('E', 'F#') === "F♯9(sus4)", "E major over F sharp is the slash chord as written: " + over('E', 'F#'));
  // 8.3 bass order and spelling, every root and quality
  for (let pc = 0; pc < 12; pc++) for (const q of Object.keys(E.TRI)) {
    const cells = E.tbnCells(pc, q), names = E.toneNames(E.ROOTS[pc], q);
    ok(cells[0].bassPc === (pc + 4) % 12, `bass order ${pc}/${q}: starts a major third above the root`);
    cells.forEach((c, k) => {
      ok(c.bassPc === (pc + 4 - k + 120) % 12 && c.midi === cells[0].midi - k, `bass order ${pc}/${q}: cell ${k} descends by half step`);
      ok((pc - c.bassPc + 12) % 12 === c.iv, `interval ${pc}/${q}/${k}: triad root above the bass`);
      ok(E.pcOf(c.bassName) === c.bassPc && c.bassName.length <= 2, `bass spelling ${pc}/${q}/${k}: ${c.bassName}`);
      const tone = names.find(n => E.pcOf(n) === c.bassPc);
      if (tone && tone.length <= 2 && !/^(E#|B#|Cb|Fb)$/.test(tone)) ok(c.bassName === tone, `one pitch, one spelling ${pc}/${q}: bass ${c.bassName} under ${tone}`);
      c.labels.forEach(l => ok(!/♭♭|♯♯|bb|##|𝄫|𝄪/.test(l), `double accidental in ${l}`));
    });
    E.tbnTriad(pc, q).forEach(n => ok(n.name.length <= 2 && E.pcOf(n.name) === n.midi % 12, `triad spelling ${pc}/${q}: ${n.name}`));
    // the staff itself: render at phone and desktop widths, look for a doubled accidental
    for (const per of [12, 3]) for (let i = 0; i < 12; i += per) {
      const svg = E.tbnSystemSVG(E.tbnTriad(pc, q), cells.slice(i, i + per), { wU: per === 12 ? 84 : 29, sel: 0, bottom: E.tbnStaffBottom(cells), prev: i ? cells[i - 1].bassName : '' });
      ok(!/♭♭|♯♯|𝄫|𝄪/.test(svg), `staff ${pc}/${q}: double accidental drawn`);
      ok((svg.match(/data-tb=/g) || []).length === per, `staff ${pc}/${q}: ${per} clickable cells`);
    }
  }
  // 8.4 View 2 is the exact inverse of View 1
  const syms = E.tbnSymbols();
  ok(syms.length === 13, "View 2 offers the thirteen printed symbols: " + syms.length);
  let pairs = 0;
  for (let bass = 0; bass < 12; bass++) for (const sym of syms) for (const r of E.tbnLookup(bass, sym)) {
    pairs++;
    const cell = E.tbnCells(r.triadPc, r.q).find(c => c.bassPc === bass);
    ok(cell && cell.syms.includes(sym) && cell.iv === r.iv, `inverse: bass ${bass} ${sym} -> ${r.triadName} ${r.q}, but View 1 shows ${cell && cell.syms}`);
    ok(E.pcOf(r.triadName) === r.triadPc && E.toneNames(r.triadName, r.q).every(n => n.length <= 2), `View 2 triad spelling: ${r.triadName}`);
  }
  for (let pc = 0; pc < 12; pc++) for (const q of Object.keys(E.TRI)) for (const c of E.tbnCells(pc, q)) for (const sym of c.syms)
    ok(E.tbnLookup(c.bassPc, sym).some(r => r.triadPc === pc && r.q === q), `inverse: View 1 ${pc}/${q} over ${c.bassPc} ${sym} missing from View 2`);
  ok(pairs === 12 * 13, "View 2: every bass x symbol resolves to one major triad for now: " + pairs);
  ok(E.tbnAnswer(E.tbnLookup(7, '13(sus4)')[0].triadName, 'maj', 5) === "C major triad, built a 4th above the root.", "brief's G13(sus4) sentence");
  ok(E.tbnLookup(0, '7alt.')[0].triadName === 'Gb', "a flat 5 above C is G flat, by letter");
  ok(E.tbnLookup(9, 'Δ7(♯5)')[0].triadName === 'C#', "a 3rd above A is C sharp, by letter");
  // 8.5 unruled qualities: the not-yet-written state, and no drill prompt
  for (const q of ['min', 'aug', 'dim']) {
    ok(!E.tbnRuled(q), `${q} is not yet ruled`);
    const cells = E.tbnCells(0, q);
    ok(cells.every(c => !c.ruled && !c.labels.length), `${q}: no cell carries a symbol`);
    ok(/not yet written/.test(E.tbnRule(q, cells[0].iv, cells[0], 'C')), `${q}: rule sentence says so`);
    const svg = E.tbnSystemSVG(E.tbnTriad(0, q), cells, { wU: 84, sel: 0, bottom: E.tbnStaffBottom(cells) });
    ok((svg.match(/<text/g) || []).length === 1, `${q}: staff draws no chord symbol`);   // the clef's 8
  }
  ok(/not yet written/i.test(E.TBN_TEXT.unruled), "unruled notice text");
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < 600; n++) {
    const bass = Math.floor(rand() * 12), sym = syms[Math.floor(rand() * syms.length)];
    const ch = E.tbnChoose(bass, sym, rand);
    ok(ch && E.tbnRuled(ch.answer.q), "drill prompt from a ruled quality");
    // 8.7 distractors: same bass note, same quality, never another right answer
    ok(ch.distractors.length === 3, "three distractors");
    ch.distractors.forEach(d => {
      ok(d.q === ch.answer.q, "distractor shares the quality");
      ok((d.triadPc - bass + 12) % 12 === d.iv && d.iv !== ch.answer.iv, "distractor is another interval above the same bass note");
      ok(!E.TBN[d.q][d.iv].includes(sym), "distractor would also be right");
    });
    ok(new Set([ch.answer, ...ch.distractors].map(o => o.triadPc)).size === 4, "four different triads");
  }
  // 8.6 every box comes from closedAll / openRow for the selected set
  let boxes = 0;
  for (let pc = 0; pc < 12; pc++) for (const q of Object.keys(E.TRI)) {
    for (const set of Object.keys(E.CSETS)) for (const v of E.tbnShapes(pc, q, 'closed', set)) {
      boxes++;
      ok(v.notes.map(n => n.s).join() === E.CSETS[set].strings.join(), `tbn box off set ${set}`);
      ok(E.closedAll(pc, q, set, v.inv).some(c => sig(c.notes) === sig(v.notes)), "tbn closed box not from closedAll");
    }
    for (const row of Object.keys(E.OROWS)) for (const v of E.tbnShapes(pc, q, 'open', row)) {
      boxes++;
      ok(v.notes[2].s === E.OROWS[row].s, `tbn open box off row ${row}`);
      ok(sig(E.openRow(pc, q, v.inv, E.OROWS[row].s).def.notes) === sig(v.notes), "tbn open box not openRow's default");
    }
  }
  console.log(`over a bass note: ${pairs} lookups, ${boxes} boxes on their sets`);
  // the sounding bass sits an octave or two under the triad
  for (let low = 40; low <= 79; low++) for (let pc = 0; pc < 12; pc++) {
    const m = E.tbnBassMidi(pc, low);
    ok(m % 12 === pc && m >= 28 && m < low && low - m <= 23, `bass register: pc ${pc} under ${low} -> ${m}`);
  }
  // 8.9 no "card" or "deck" in anything a student reads
  const words = /\b(card|deck)s?\b/i;
  Object.entries(E.TBN_TEXT).forEach(([k, v]) => ok(!words.test(v), `TBN_TEXT.${k} says card/deck`));
  const page = src.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ");
  ok(!words.test(page), "page text says card/deck");
  const tbnJs = src.slice(src.indexOf("/* ---------- Over a bass note tab"), src.indexOf("/* ---------- wiring"));
  ok(tbnJs.length > 500, "tab code found for the text scan");
  (tbnJs.match(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g) || []).filter(s => / /.test(s) && !/[<=]/.test(s))
    .forEach(s => ok(!words.test(s), "tab string says card/deck: " + s));
}
// 7. lilypond round-trip
{
  const run = E.keyRun('F', 'major', '234', 0);
  const bars = []; for (let i = 0; i < 8; i += 4) bars.push(run.slice(i, i + 4).map(c => ({ ch: { rootName: c.rootName, quality: c.q }, v: { notes: c.notes } })));
  const ly = E.lyDocument(bars, { title: "Exploring Triads — check", part: "Guitar", source: "check.js", bpm: 80 });
  const scratch = process.env.TV_SCRATCH || require("os").tmpdir();
  const f = path.join(scratch, "triad-check.ly");
  fs.writeFileSync(f, ly);
  try {
    cp.execFileSync("lilypond", ["-dno-point-and-click", "-o", f.replace(/\.ly$/, ""), f], { stdio: "pipe", cwd: scratch });
    checks++; console.log("lilypond OK:", f);
  } catch (err) {
    if (err.code === "ENOENT") console.log("lilypond not installed — round-trip skipped");
    else fail("lilypond rejected " + f + ":\n" + (err.stderr || "").toString().slice(-1500));
  }
}
console.log(fails ? `${fails} FAILED of ${checks} checks` : `all ${checks} checks passed`);
process.exit(fails ? 1 : 0);
