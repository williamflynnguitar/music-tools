// node gen-arpeggios.js [keysCSV]  → ly/arpeggios/<oct>-<q>-<i>-<key>.ly for every shape (book + generated triads) in every key
const fs = require("fs"), path = require("path");
const { lyShape } = require("./lyshape.js");
const src = fs.readFileSync(path.join(__dirname, "../../arpeggios-deck/index.html"), "utf8");
const js = src.split("<script>").find(c => c.includes("const ARP")).split("/* ---------- notation:")[0];
global.document = { getElementById: () => ({}) };
const E = new Function(js + "; buildTriads(); return { QUAL, ARP, KEYS, PC, placeArp };")();
const { QUAL, ARP, KEYS, PC, placeArp } = E;
const MODE = { maj7:":maj7", "6":":6", dom7:":7", m7:":m7", m7b5:":m7.5-", dim7:":dim7", mMaj7:":m7+", maj7s5:":maj7.5+", maj:"", min:":m", dim:":dim", aug:":aug" };
const lyRoot = k => k[0].toLowerCase() + (k[1] === "b" ? "es" : k[1] === "#" ? "is" : "");
const safe = k => k.replace("#", "s");
const keys = process.argv[2] ? process.argv[2].split(",") : KEYS;
const out = path.join(__dirname, "ly/arpeggios"); fs.mkdirSync(out, { recursive: true });
let n = 0;
for (const oct of [1, 2]) for (const q of Object.keys(QUAL)) (ARP[oct][q] || []).forEach((sh, i) => {
  for (const key of keys) {
    const p = placeArp(oct, q, sh, key, key, PC[key]);
    const notes = p.dots.filter(d => !d.alt);
    const chord = `\\chordmode { ${lyRoot(key)}1${MODE[q]} }`;
    fs.writeFileSync(path.join(out, `${oct}-${q}-${i}-${safe(key)}.ly`), lyShape(notes, { compact: true, chord })); n++;
  }
});
console.log(n, "arpeggio cells");
