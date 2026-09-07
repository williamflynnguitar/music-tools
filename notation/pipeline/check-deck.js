// Headless checks for the arpeggios deck (node check-deck.js). Loads the deck's
// own engine from index.html (same extraction as gen-arpeggios.js), then:
//  A. every shape: anchor root at [rs,0], finger 1-4, all notes chord tones
//  B. Shapes tab: every placement (quality x octaves x finger x key) keeps all
//     notes in frets 1..19 and on chord tones
//  C. Root tab: for every root-capable string, the shapes shown = exactly the
//     ARP shapes with that rs, none dropped, none from another string
//  D. per-finger split partitions each list; the All view shows the same set
// The placement/filter rules are duplicated from index.html (shapePlacements,
// renderRoot) — keep in sync.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "../../arpeggios-deck/index.html"), "utf8");
const js = src.split("<script>")[1].split("/* ---------- notation:")[0];
global.document = { getElementById: () => ({}) };
const E = new Function(js + "; buildTriads(); return { ARP, QUAL, SIZE, KEYS, PC, OPEN, chordDots, rootFinger, rsOptions, placeArp };")();
const { ARP, QUAL, SIZE, KEYS, PC, OPEN, chordDots, rootFinger, rsOptions, placeArp } = E;

const NECK_MAX = 19;
let fails = 0, shapes = 0, placements = 0;
const fail = m => { fails++; console.log("FAIL", m); };

for (const oct of [1, 2]) for (const q of Object.keys(QUAL)) {
  const list = ARP[oct][q] || [];
  const byFinger = { 1: [], 2: [], 3: [], 4: [] };
  list.forEach((sh, i) => {
    shapes++;
    const id = `${oct}-${q}-${i}`;
    const anchor = sh.n.find(d => d[1] === 0 && d[0] === sh.rs);
    if (!anchor) return fail(`${id}: no anchor root at [rs,0]`);
    const rf = anchor[2];
    if (rf < 1 || rf > 4) return fail(`${id}: root finger ${rf}`);
    byFinger[rf].push(sh);
    // A: chord tones (anchor at fret 12 keeps everything positive)
    const key = KEYS.find(k => PC[k] === (OPEN[sh.rs] + 12) % 12);
    for (const d of chordDots(key, key, PC[key], q, sh, 12)) if (!d.ok) fail(`${id}: non-chord tone on string ${d.string}`);
    // B: every Shapes-tab placement in every key
    for (const k2 of KEYS) {
      const base = ((PC[k2] - OPEN[sh.rs]) % 12 + 12) % 12;
      for (let r = base; r <= NECK_MAX; r += 12) {
        if (r < 1 || !sh.n.every(d => r + d[1] >= 1 && r + d[1] <= NECK_MAX)) continue;
        placements++;
        for (const d of chordDots(k2, k2, PC[k2], q, sh, r).filter(d => !d.alt)) {
          if (d.fret < 1 || d.fret > NECK_MAX) fail(`${id} ${k2}@${r}: fret ${d.fret} off the board`);
          if (!d.ok) fail(`${id} ${k2}@${r}: non-chord tone`);
        }
      }
    }
  });
  // C: Root-tab set equality per capable string (any fret: the rs filter is fret-independent)
  for (const s of rsOptions(oct)) {
    const shown = list.filter(sh => sh.rs === s);            // fits + misfits, as renderRoot shows them
    const expect = list.filter(sh => sh.rs === s);
    if (shown.length !== expect.length || shown.some((sh, i) => sh !== expect[i])) fail(`${oct}-${q} rs${s}: root-tab set mismatch`);
    if (shown.some(sh => sh.rs !== s)) fail(`${oct}-${q} rs${s}: foreign shape`);
  }
  // D: per-finger partition covers the list exactly once; All = same set
  const total = byFinger[1].length + byFinger[2].length + byFinger[3].length + byFinger[4].length;
  if (total !== list.length) fail(`${oct}-${q}: per-finger split covers ${total}/${list.length}`);
  const allView = list.filter(sh => [1, 2, 3, 4].includes(rootFinger(sh)));
  if (allView.length !== list.length) fail(`${oct}-${q}: All view drops shapes`);
  // E: Shapes cards and the Parallel · one key walk — same shapes, same order,
  // for every key and finger (both sort ascending by placeArp root fret, stable)
  for (const key of KEYS) for (let f = 1; f <= 4; f++) {
    const cards = byFinger[f].map(sh => ({ sh, rf: placeArp(oct, q, sh, key, key, PC[key]).rootFret }))
      .sort((a, b) => a.rf - b.rf).map(x => x.sh);                          // Shapes tab walkOrder
    const walk = list.filter(sh => rootFinger(sh) === f)
      .map(sh => placeArp(oct, q, sh, key, key, PC[key])).sort((a, b) => a.rootFret - b.rootFret)
      .map(p => p.sh);                                                      // Parallel · one key steps
    if (cards.length !== walk.length || cards.some((sh, i) => sh !== walk[i]))
      fail(`${oct}-${q} ${key} finger ${f}: Shapes cards and Parallel walk disagree`);
  }
}

// F: middle-root coverage, as the book actually gives it (1-octave, 7th chords).
// ø7/°7 have no middle-root shapes at all; the others have middle on strings
// 6/5/4, and on string 3 only the major-third qualities (m7 and mMaj7 use ring
// there, like ø7/°7 do everywhere). Triads are excluded: their middle slots are
// curated overrides, not book shapes. Fail loudly if any of this drifts.
const MIDDLE_1OCT = { maj7: [6, 5, 4, 3], m7: [6, 5, 4], dom7: [6, 5, 4, 3], m7b5: [], dim7: [], mMaj7: [6, 5, 4], maj7s5: [6, 5, 4, 3] };
for (const q of SIZE.seventh.quals) {
  const have = [...new Set(ARP[1][q].filter(sh => rootFinger(sh) === 2).map(sh => sh.rs))].sort((a, b) => b - a);
  const want = MIDDLE_1OCT[q];
  if (have.join() !== want.join()) fail(`middle-root coverage for ${q}: strings [${have}] — expected [${want}]`);
}
console.log(`${shapes} shapes, ${placements} neck placements checked — ${fails ? fails + " FAILURES" : "all clean"}`);
process.exit(fails ? 1 : 0);
