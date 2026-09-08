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

// 1. everything builds, every bar sums to 4 beats
for (const progId of Object.keys(E.PROGRESSIONS)) for (const mode of ["arp", "scale"]) for (let f = 1; f <= 6; f++) {
  let line;
  try { line = E.buildLine(progId, mode, f); }
  catch (err) { fail(`${progId}/${mode}/${f}: ${err.message}`); continue; }
  line.bars.forEach(bar => {
    const s = bar.events.reduce((a, e) => a + e.dur, 0);
    ok(s === 8, `${progId}/${mode}/${f} bar ${bar.n}: ${s} eighths`);
    bar.events.forEach(e => {
      ok(e.string >= 1 && e.string <= 6 && e.fret >= 1 && e.fret <= 19, `${progId}/${mode}/${f} bar ${bar.n}: bad position ${e.string}/${e.fret}`);
      ok(e.midi === E.MIDI_OPEN[e.string] + e.fret, `${progId}/${mode}/${f} bar ${bar.n}: midi/fret mismatch`);
      ok(e.midi % 12 === E.pcOf(e.note), `${progId}/${mode}/${f} bar ${bar.n}: spelling ${e.note} != pitch`);
    });
  });
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
  for (const mode of ["arp", "scale"]) {
    const line = E.buildLine("ii51maj", mode, 1);
    const ly = E.lyExport(line, "ii51maj", { bpm: 120, source: "check.js" });
    const f = path.join(scratch, "line-ladder-check-" + mode + ".ly");
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
