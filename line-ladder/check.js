// Headless checks for Line Ladder (node check.js). Loads the app's own engine
// from index.html (the check-deck.js extraction pattern), then:
//  1. every progression x mode x fingering builds; every bar sums to 4 beats;
//     every note carries {string, fret, finger} consistent with its midi;
//     the 8-beat scale unit ends on the 3rd as a quarter on beat 4
//  2. major ii-V-I in C: D Dorian / G Mixolydian / C major, notes in the
//     parent scale, frets inside the placement window used
//  3. minor ii-V-i in C: ii and V labeled G Phrygian dominant (V of C minor),
//     i labeled C harmonic minor
//  4. rhythm changes: 2-beat chords are four eighths; Edim7 is an arpeggio
//     (chord tones E G Bb Db) even in Scale mode
//  5. blues in F: the split bars hit the 2-beat branch; D7(b9) is labeled
//     D Phrygian dominant
//  6. the .ly for the major ii-V-I cycle compiles under lilypond (if present)
const fs = require("fs"), path = require("path"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const js = src.split("<script>").find(c => c.includes("const SCALES")).split("/* ===== ui ===== */")[0];
const E = new Function(js + `; return { PROGRESSIONS, buildLine, chordScale, placeScale, placements,
  lyExport, engrave, SCALES, ARP1, QUAL, KEYS, PC, OPEN, MIDI_OPEN, pcOf, CH, M, N };`)();

let fails = 0, checks = 0;
const fail = m => { fails++; console.log("FAIL", m); };
const ok = (cond, m) => { checks++; if (!cond) fail(m); };

// 1. everything builds, every bar sums to 4 beats (approach and octave-cap
//    combinations); with the cap on, nothing sits above the 12th fret
for (const progId of Object.keys(E.PROGRESSIONS)) for (const mode of ["arp", "scale"]) for (let f = 1; f <= 6; f++)
for (const [app, oct, disp] of [[false, false, false], [true, false, false], [false, true, false], [true, true, false], [true, true, true], [false, false, true]]) {
  let line;
  try { line = E.buildLine(progId, mode, f, {approach:app, octDown:oct, displace:disp}); }
  catch (err) { fail(`${progId}/${mode}/${f}/${app}/${oct}/${disp}: ${err.message}`); continue; }
  line.bars.forEach(bar => {
    const s = bar.events.reduce((a, e) => a + e.dur, 0);
    ok(s === 8, `${progId}/${mode}/${f}/${app}/${oct} bar ${bar.n}: ${s} eighths`);
    if (oct) ok(bar.events.every(e => e.fret <= 12), `${progId}/${mode}/${f}/${app} bar ${bar.n}: above fret 12 with the cap on`);
    bar.events.forEach(e => {
      ok(e.string >= 1 && e.string <= 6 && e.fret >= 1 && e.fret <= 19, `${progId}/${mode}/${f}/${app}/${oct} bar ${bar.n}: bad position ${e.string}/${e.fret}`);
      ok(e.midi === E.MIDI_OPEN[e.string] + e.fret, `${progId}/${mode}/${f}/${app}/${oct} bar ${bar.n}: midi/fret mismatch`);
      ok(e.midi % 12 === E.pcOf(e.note), `${progId}/${mode}/${f}/${app}/${oct} bar ${bar.n}: spelling ${e.note} != pitch`);
    });
  });
}

// 1e. approach coverage: across every progression and fingering, every chord
// whose held note sits exactly three scale steps above the next chord's first
// note gets the approach whenever any fingering of its scale holds both
// passing tones — cycle-of-fourths motion must never be silently skipped
{
  let applied = 0;
  for (const progId of Object.keys(E.PROGRESSIONS)) for (let f = 1; f <= 6; f++) {
    const prog = E.PROGRESSIONS[progId];
    const line = E.buildLine(progId, "arp", f, {approach:true});
    const flat = line.bars.flatMap((b, bi) => b.events.map(e => ({ ...e, abs: bi * 8 + e.at }))).sort((a, b) => a.abs - b.abs);
    let at = 0; const spans = prog.chords.map(ch => { const s = { from: at, to: at + ch.beats * 2 }; at += ch.beats * 2; return s; });
    prog.chords.forEach((ch, i) => {
      if (i + 1 >= prog.chords.length) return;
      const evs = flat.filter(e => e.abs >= spans[i].from && e.abs < spans[i].to);
      if (evs.some(e => e.dur === 3)) { applied++; return; }
      const last = evs[evs.length - 1];
      if (last.dur !== 5) return;
      const cs = E.chordScale(ch);
      if (!cs.steps) return;
      const steps = cs.steps;
      let j = steps.indexOf(((last.midi - ch.pc) % 12 + 12) % 12);
      let m = last.midi; const pass = [];
      for (let k = 0; k < 3; k++) { const j2 = (j + 6) % 7; m -= (steps[j] - steps[j2] + 12) % 12; j = j2; pass.push(m); }
      if (pass[2] !== flat.find(e => e.abs >= spans[i + 1].from).midi) return;   // not a 3-step descent
      const src = cs.parent || cs.own;
      const placeable = src && E.placements(src.scaleId, src.key).some(pl =>
        pl.notes.some(n => n.midi === pass[0]) && pl.notes.some(n => n.midi === pass[1]));
      ok(!placeable, `${progId}/arp/${f} chord ${i + 1} (${ch.root}${ch.q}): eligible approach was skipped`);
    });
  }
  ok(applied > 600, "approach coverage: expected 600+ applications across the sweep, got " + applied);
}

// 1f. cycle motion: with the approach-aware octave lookahead, the whole-step
// ii-V-I cycles connect at 77%+ of their ii/V seams (the rest are structural
// register wraps — the position holds no octave pair that can connect, and
// 1e above proves every placeable approach is applied). Key-of-C ii-V-I and
// the A-7 -> D7 case from All The Things You Are are exact.
{
  let seams = 0, connected = 0;
  for (const progId of ["ii51maj", "ii51min"]) for (let f = 1; f <= 6; f++) {
    const line = E.buildLine(progId, "arp", f, {approach:true});
    line.bars.forEach(bar => {
      if (bar.n % 4 === 1 || bar.n % 4 === 2) { seams++; if (bar.events.some(e => e.dur === 3)) connected++; }
    });
  }
  ok(connected / seams > 0.75, `cycle seams connected: ${connected}/${seams}`);
  const line = E.buildLine("tune_attya", "arp", 1, {approach:true});
  const b17 = line.bars[16];
  ok(b17.events.length === 6 && b17.events[4].note === "F#" && b17.events[5].note === "E",
     "attya bar 17 (A-7): expected F# E into D7, got " + b17.events.map(e => e.note).join(" "));
  ok(line.bars[17].events[0].note === "D", "attya bar 18 should start on D");
}

// 1g. octave displacement: at a register break only the chord's FIRST note
// moves an octave toward the previous note, reshaping that arpeggio — the
// screenshot case: ii-V-I in Gb (bars 13-14), Ab-7 holds Gb4, Db7 starts on
// Db4 instead of Db3, which also unlocks the approach (F Eb into Db4).
// With displacement + approach, every ii/V seam of both whole-step cycles
// connects.
{
  const line = E.buildLine("ii51maj", "arp", 1, {approach:true, displace:true});
  const b13 = line.bars[12], b14 = line.bars[13];
  ok(b13.events[3].dur === 3 && b13.events[4].note === "F" && b13.events[5].note === "Eb",
     "bar 13 (Ab-7) should approach with F Eb, got " + b13.events.map(e => e.note).join(" "));
  ok(b14.events[0].midi === 61 && b14.labels[0].text.includes("R↑8"),
     "bar 14 (Db7) first note should be the displaced Db4: " + b14.events[0].midi + " / " + b14.labels[0].text);
  ok(b13.events[5].midi - 2 === b14.events[0].midi, "Eb should step into the displaced Db4");
  // only the first note moves; rhythm and the rest of the bar are untouched
  const d = E.buildLine("ii51maj", "arp", 1, {displace:true});
  const p = E.buildLine("ii51maj", "arp", 1, {});
  d.bars.forEach((bar, bi) => {
    ok(bar.events.length === p.bars[bi].events.length && bar.events.every((e, k) => e.dur === p.bars[bi].events[k].dur),
       "displacement alone must not change the rhythm (bar " + bar.n + ")");
    bar.events.forEach((e, k) => { const q = p.bars[bi].events[k];
      if (e.midi !== q.midi) ok(Math.abs(e.midi - q.midi) === 12 && e.at === q.at,
        "a displaced note must differ by exactly an octave (bar " + bar.n + ")"); });
  });
  let seams = 0, conn = 0;
  for (const progId of ["ii51maj", "ii51min"]) for (let f = 1; f <= 6; f++) {
    const l2 = E.buildLine(progId, "arp", f, {approach:true, displace:true});
    l2.bars.forEach(b => { if (b.n % 4 === 1 || b.n % 4 === 2) { seams++; if (b.events.some(e => e.dur === 3)) conn++; } });
  }
  ok(conn === seams, `with displacement, every cycle seam should connect: ${conn}/${seams}`);
}

// 1d. octave cap semantics: ↓8 bars sound exactly an octave lower than the
// uncapped line, ↓pos bars sound identical (only refingered), all others
// are untouched — All The Things You Are, Arp mode, the screenshot case
{
  const plain = E.buildLine("tune_attya", "arp", 3, {});
  const capped = E.buildLine("tune_attya", "arp", 3, {octDown:true});
  ok(plain.bars.some(b => b.events.some(e => e.fret > 12)), "attya/arp/3 should climb above fret 12 uncapped");
  let d8 = 0, dpos = 0;
  capped.bars.forEach((bar, bi) => {
    const before = plain.bars[bi];
    ok(bar.events.length === before.events.length, "cap must not change the rhythm");
    const drop8 = bar.labels.some(l => l.text.includes("↓8")), dropP = bar.labels.some(l => l.text.includes("↓pos"));
    if (drop8 && bar.labels.length === 1) {
      d8++; bar.events.forEach((e, k) => ok(e.midi === before.events[k].midi - 12, "↓8 bar should sound an octave lower"));
    } else if (dropP && bar.labels.length === 1) {
      dpos++; bar.events.forEach((e, k) => ok(e.midi === before.events[k].midi, "↓pos bar should sound the same pitches"));
    } else if (bar.labels.length && !drop8 && !dropP) {   // label-less bars continue the previous chord
      bar.events.forEach((e, k) => ok(e.fret === before.events[k].fret && e.string === before.events[k].string, "unmarked bar should be untouched"));
    }
  });
  ok(d8 > 0, "attya/arp/3 capped: expected some ↓8 bars");
}

// 1c. stepwise approach: ii-V-I in C, Arp mode — D-7 holds C through beat 3
// then walks B A into G7's G; G7 holds F then E D into C; the 8-beat I chord
// still holds to the barline (next root is the same pitch, no approach)
{
  const line = E.buildLine("ii51maj", "arp", 1, {approach:true});
  const b1 = line.bars[0].events, b2 = line.bars[1].events, b4 = line.bars[3].events;
  const held1 = b1[3];
  ok(held1.at === 3 && held1.dur === 3, "approach: D-7's 7th should be 8~4 (held to beat 3 only)");
  ok(b1.length === 6 && b1[4].at === 6 && b1[5].at === 7, "approach: beat 4 should carry two eighths");
  ok(b1[4].note === "B" && b1[5].note === "A", `approach: D-7 passing tones should be B A, got ${b1[4].note} ${b1[5].note}`);
  ok(b2[0].midi === b1[5].midi - 2, "approach: A should step into G7's G a whole step below");
  ok(b2[4].note === "E" && b2[5].note === "D", `approach: G7 passing tones should be E D, got ${b2[4].note} ${b2[5].note}`);
  ok(line.bars[2].events[0].midi === b2[5].midi - 2, "approach: D should step into the I chord's C");
  const last4 = b4[b4.length - 1];
  ok(last4.dur === 5, "approach: the I chord's held R should stay 8~2 (next root is the same C)");
  // without the toggle nothing changes
  const plain = E.buildLine("ii51maj", "arp", 1, {});
  ok(plain.bars[0].events.length === 4 && plain.bars[0].events[3].dur === 5, "approach off: bar 1 unchanged");
}

// 1b. the 8-beat scale unit ends on the 3rd, a quarter on beat 4
{
  const line = E.buildLine("ii51maj", "scale", 1);
  const bar4 = line.bars[3]; // C major held bars 3-4; bar 4 is the descent
  const last = bar4.events[bar4.events.length - 1];
  ok(last.at === 6 && last.dur === 2, "8-beat unit: last event not a quarter on beat 4");
  ok(last.note === "E", "8-beat unit in C: descent should end on the 3rd (E), got " + last.note);
  const bar3 = line.bars[2];
  ok(bar3.events.length === 8 && bar3.events.every(e => e.dur === 1), "8-beat unit bar 1 should be eight eighths");
}

// 2. major ii-V-I in C
{
  const line = E.buildLine("ii51maj", "scale", 1);
  const labels = [line.bars[0], line.bars[1], line.bars[2]].map(b => b.labels[0].text);
  ok(labels[0].startsWith("D Dorian"), "bar 1 label: " + labels[0]);
  ok(labels[1].startsWith("G Mixolydian"), "bar 2 label: " + labels[1]);
  ok(labels[2].startsWith("C major"), "bar 3 label: " + labels[2]);
  const cMajor = new Set([0, 2, 4, 5, 7, 9, 11]);
  line.bars.slice(0, 4).forEach(b => b.events.forEach(e =>
    ok(cMajor.has(e.midi % 12), "ii-V-I in C: non-diatonic note " + e.note)));
  // frets inside the placement window the bar's label names (± the VDA shift)
  line.bars.slice(0, 4).forEach((b, i) => {
    const id = b.labels.length ? b.labels[0].text.match(/[→ ]([PMI][56])/)[1] : null;
    if (!id) return;
    const pl = E.placeScale("major", id, "C");
    b.events.forEach(e => ok(e.fret >= pl.lo && e.fret <= pl.hi, `bar ${i + 1}: fret ${e.fret} outside ${id} window`));
  });
}

// 3. minor ii-V-i in C
{
  const line = E.buildLine("ii51min", "scale", 1);
  const l = i => line.bars[i].labels[0].text;
  ok(l(0).startsWith("G Phrygian dominant (V of C minor)"), "minor ii label: " + l(0));
  ok(l(1).startsWith("G Phrygian dominant (V of C minor)"), "minor V label: " + l(1));
  ok(l(2).startsWith("C harmonic minor"), "minor i label: " + l(2));
  const cHm = new Set([0, 2, 3, 5, 7, 8, 11]);
  line.bars.slice(0, 4).forEach(b => b.events.forEach(e =>
    ok(cHm.has(e.midi % 12), "minor ii-V-i in C: note outside C harmonic minor: " + e.note)));
}

// 4. rhythm changes
{
  const line = E.buildLine("rhythm", "scale", 1);
  const bar1 = line.bars[0];
  ok(bar1.events.length === 8 && bar1.events.every(e => e.dur === 1), "rhythm bar 1: two-beat chords should give 8 eighths");
  ok(bar1.chords.length === 2 && bar1.chords[1].at === 4, "rhythm bar 1: second chord should sit on beat 3");
  const bar6 = line.bars[5]; // Ebmaj7 Edim7
  const dimEvents = bar6.events.filter(e => e.at >= 4);
  ok(bar6.labels[1].text.startsWith("arp"), "Edim7 label should be arp: " + bar6.labels[1].text);
  const pcs = dimEvents.map(e => e.midi % 12);
  ok(JSON.stringify(pcs) === JSON.stringify([4, 7, 10, 1]), "Edim7 should run E G Bb Db, got " + dimEvents.map(e => e.note));
}

// 5. blues in F
{
  const line = E.buildLine("bluesF", "scale", 1);
  const bar11 = line.bars[10]; // F7 D7b9
  ok(bar11.chords.length === 2, "blues F bar 11 should split");
  ok(bar11.events.length === 8 && bar11.events.every(e => e.dur === 1), "blues F bar 11: 2-beat branch should give 8 eighths");
  ok(bar11.labels[1].text.startsWith("D Phrygian dominant"), "D7b9 label: " + bar11.labels[1].text);
  const dRun = bar11.events.filter(e => e.at >= 4).map(e => e.note).join(" ");
  ok(dRun === "D Eb F# A", "D7b9 digital pattern (1 2 3 5 of D Phrygian dominant) should be D Eb F# A, got " + dRun);
}

// 5b. D phrygian dominant really is 1 2 3 5 = D Eb F# A
{
  const cs = E.chordScale(E.CH("D", "7", 2, "sec", ["b9"]));
  const run = [1, 2, 3, 5].map(d => cs.names[d - 1]).join(" ");
  ok(run === "D Eb F# A", "D Phrygian dominant 1235 should be D Eb F# A, got " + run);
}

// 6. lilypond round-trip
{
  const scratch = process.env.LL_SCRATCH || require("os").tmpdir();
  for (const [mode, opts, tag] of [["arp", {}, ""], ["scale", {}, ""], ["arp", {approach:true, displace:true}, "-approach"]]) {
    const line = E.buildLine("ii51maj", mode, 1, opts);
    const ly = E.lyExport(line, "ii51maj", { bpm: 120, source: "check.js" });
    const f = path.join(scratch, "line-ladder-check-" + mode + tag + ".ly");
    fs.writeFileSync(f, ly);
    try {
      cp.execFileSync("lilypond", ["-dno-point-and-click", "-o", f.replace(/\.ly$/, ""), f], { stdio: "pipe", cwd: scratch });
      checks++; console.log("lilypond OK:", f);
    } catch (err) {
      if (err.code === "ENOENT") console.log("lilypond not installed — round-trip skipped");
      else fail("lilypond rejected " + f + ":\n" + (err.stderr || "").toString().slice(-2000));
    }
  }
}

console.log(fails ? `${fails} FAILED of ${checks} checks` : `all ${checks} checks passed`);
process.exit(fails ? 1 : 0);
