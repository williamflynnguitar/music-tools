// node check.js — headless fixture run for the Quartal Voicings engine.
// Extracts the engine block from index.html (same extraction as
// notation/pipeline/gen-quartal.js) and runs runFixtures(): spec Appendix A
// fret-for-fret, Ex. 5/10/11 symbols, §6.3 guideposts, §7.1 presets (labels,
// planing, all-keys transposition), §8 tunes (labels, basses, D17).
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const js = src.split("/* ===== quartal engine ===== */")[1].split("/* ===== end quartal engine ===== */")[0];
const E = new Function(js + "; return { runFixtures };")();
const r = E.runFixtures();
console.log(`${r.pass} passed, ${r.fail} failed`);
r.msgs.forEach(m => console.log(m));
process.exit(r.fail ? 1 : 0);
