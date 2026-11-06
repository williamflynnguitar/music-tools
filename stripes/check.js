// node check.js — headless run of the Stripes acceptance checklist (items 1–4, 7).
// Extracts the engine block from index.html and runs runFixtures(); the full
// conversion table, the dark-fret lists and the parser fixture are printed.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const js = src.split("/* ===== stripes engine ===== */")[1].split("/* ===== end stripes engine ===== */")[0];
const E = new Function(js + "; return { runFixtures };")();
const r = E.runFixtures();
console.log(r.out.join("\n"));
console.log(`${r.pass} passed, ${r.fail} failed`);
r.msgs.forEach(m => console.log(m));
process.exit(r.fail ? 1 : 0);
