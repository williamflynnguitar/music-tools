// node gen-fretboard.js [keysCSV]  → ly/fretboard/<scale>-<shape>[-<variant>]-<key>.ly for every fingering in every key
const fs = require("fs"), path = require("path");
const { lyShape } = require("./lyshape.js");
const src = fs.readFileSync(path.join(__dirname, "../../fretboard/index.html"), "utf8");
const js = src.split("<script>")[1].split("/* ---------- renderer ---------- */")[0] + src.split("/* ---------- whole-neck view ---------- */")[1].split("function render()")[0];
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
        const notes = p.dots.map(d => ({ string: d.string, fret: d.fret, finger: d.finger, note: d.note }));
        fs.writeFileSync(path.join(out, `${id}-${safe(key)}.ly`), lyShape(notes, { compact: true, desc: sh.dir === "desc" })); n++;
      } } } }
console.log(n, "fretboard cells");
