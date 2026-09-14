// node gen-fretboard.js [keysCSV]  → ly/fretboard/<scale>-<shape>[-<variant>]-<key>.ly for every fingering in every key
const fs = require("fs"), path = require("path");
const { lyShape } = require("./lyshape.js");
const src = fs.readFileSync(path.join(__dirname, "../../fretboard/index.html"), "utf8");
const js = src.split("<script>").find(c => c.includes("const SCALES")).split("/* ---------- renderer ---------- */")[0] + src.split("/* ---------- whole-neck view ---------- */")[1].split("function render()")[0];
global.document = { getElementById: () => ({}) };
const E = new Function(js + "; return { SCALES, KEYS, state, place };")();
const { SCALES, KEYS, state, place } = E;
const safe = k => k.replace("#", "s");
const keys = process.argv[2] ? process.argv[2].split(",") : KEYS;
const out = path.join(__dirname, "ly/fretboard"); fs.mkdirSync(out, { recursive: true });
let n = 0;
for (const scId of Object.keys(SCALES)) { const sc = SCALES[scId];
  for (const shId of Object.keys(sc.shapes)) { const sh = sc.shapes[shId];
    for (const v of [""].concat(Object.keys(sh.variants || {}))) {
      state.scale = scId; state.variants = {}; if (v) state.variants[scId + ":" + shId] = v;
      for (const key of keys) {
        const p = place(scId, shId, key);
        const id = (scId + "-" + shId + (v ? "-" + v : "")).replace(/[^A-Za-z0-9-]/g, "_");
        // the default octave, plus the octave above or below wherever it fits the board whole:
        // Next in cycle draws those to stay near the diagram before (fretboard notationPanel)
        const centre = (p.minFret + p.maxFret) / 2;
        const cells = [[p, ""], [place(scId, shId, key, centre + 12), "-8va"], [place(scId, shId, key, centre - 12), "-8vb"]]
          .filter(([q, sfx]) => sfx === "" || (sfx === "-8va" ? q.shift > 0 : q.shift < 0));
        for (const [q, sfx] of cells) {
          const notes = q.dots.map(d => ({ string: d.string, fret: d.fret, finger: d.finger, note: d.note }));
          fs.writeFileSync(path.join(out, `${id}-${safe(key)}${sfx}.ly`), lyShape(notes, { compact: true, desc: sh.dir === "desc" })); n++;
        }
      } } } }
console.log(n, "fretboard cells");
