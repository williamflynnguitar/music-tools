// node gen-quartal.js [keysCSV]  → ly/quartal/*.ly for every Quartal Voicings cell.
// Loads the app's own engine from quartal-voicings/index.html (so the cells can't
// drift from it) and emits:
//   <family>-<set>-i<inv>-d<degree>-p<pos>-<key>.ly   one stacked chord, staff + TAB (Shapes/Modes cards)
//   prog-<preset>-<key>.ly                            ii(2) V(2) | I(4) with symbols, parenthesized bass,
//                                                     bar numbers under every bar, double bar at the end,
//                                                     planing annotation on 8b/8h
//   tune-<tune>-<bar>.ly                              one bar (tied bars span two), symbol + parenthesized bass
// render.sh writes the SVGs to quartal-voicings/notation/ (not notation/svg/ — the
// one per-app cell store, per the build brief).
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "../../quartal-voicings/index.html"), "utf8");
const js = src.split("/* ===== quartal engine ===== */")[1].split("/* ===== end quartal engine ===== */")[0];
const E = new Function(js + "; return { OPEN, KEYS, FAMILIES, PRESETS, TUNES, walkCards, transposePreset, notePc };")();
const { OPEN, KEYS, FAMILIES, PRESETS, TUNES, walkCards, transposePreset } = E;

const out = path.join(__dirname, "ly/quartal"); fs.mkdirSync(out, { recursive: true });
const keys = process.argv[2] ? process.argv[2].split(",") : KEYS;
let n = 0;
const safe = k => k.replace("#", "s");          // cell files use s for sharp (F# → Fs)
const write = (name, text) => { fs.writeFileSync(path.join(out, name + ".ly"), text); n++; };

const LYA = { "": "", "#": "is", "##": "isis", b: "es", bb: "eses" };
const ACCS = { "": 0, "#": 1, "##": 2, b: -1, bb: -2 };
function lyP(name, midi) {
  const acc = name.slice(1), natural = midi - (ACCS[acc] || 0), oct = Math.floor(natural / 12) - 1;
  return name[0].toLowerCase() + LYA[acc] + (oct >= 4 ? "'".repeat(oct - 3) : ",".repeat(3 - oct));
}
function symText(s) {          // ♭/♯ inside a suffix become feta glyphs, kerned tight
  const parts = []; let buf = "";
  for (const ch of s) {
    if (ch === "♭" || ch === "♯") { if (buf) { parts.push(`"${buf}"`); buf = ""; } parts.push(ch === "♭" ? "\\flat" : "\\sharp"); }
    else buf += ch;
  }
  if (buf) parts.push(`"${buf}"`);
  return parts.join(" ");
}
function lySym(sym) {
  const m = sym.match(/^([A-G][b#]?)(.*)$/); if (!m) return `\\markup "${sym}"`;
  const root = `"${m[1][0]}"` + (m[1][1] === "b" ? " \\flat" : m[1][1] === "#" ? " \\sharp" : "");
  const suf = m[2];
  if (!suf) return `\\markup \\concat { ${root} }`;
  if (suf.includes("6/9")) {
    const rest = suf.replace("6/9", "");
    return `\\markup \\concat { ${root} \\hspace #0.15 \\raise #0.4 \\fontsize #-3 \\fraction 6 9${rest ? ` \\raise #0.6 \\fontsize #-2 \\concat { ${symText(rest)} }` : ""} }`;
  }
  return `\\markup \\concat { ${root} \\raise #0.6 \\fontsize #-2 \\concat { ${symText(suf)} } }`;
}
function lyChord(ch, dur, opts = {}) {
  const parts = ch.strings.map((s, i) => lyP(ch.notes[i], OPEN[s] + ch.frets[i]) + "\\" + s);
  if (opts.bass) parts.unshift("\\parenthesize " + lyP(opts.bass.name, OPEN[opts.bass.s] + opts.bass.f) + "\\" + opts.bass.s);
  let c = "<" + parts.join(" ") + ">" + dur + (opts.tie ? "~" : "");
  if (opts.sym) c += "^" + lySym(opts.sym);
  if (opts.below) c += `_\\markup \\fontsize #-3 \\italic "${opts.below}"`;
  return c;
}
const HEAD = `\\version "2.24.0"
\\paper { indent = 0 ragged-right = ##t } \\header { tagline = ##f } #(set-global-staff-size 17)`;
const BARNUMS = `\\layout { \\context { \\Score
  \\override BarNumber.direction = #DOWN \\override BarNumber.self-alignment-X = #LEFT
  \\override BarNumber.font-size = #-2 \\override BarNumber.break-visibility = ##(#f #t #t)
  barNumberVisibility = #all-bar-numbers-visible } }`;
function cell(mus, opts = {}) {
  return `${HEAD}
${opts.barnums ? BARNUMS : `\\layout { \\context { \\Score \\remove "Bar_number_engraver" } }`}
mus = { ${opts.textlen ? "\\textLengthOn " : ""}${opts.time ? "\\time 4/4 " : "\\omit Staff.TimeSignature \\omit TabStaff.TimeSignature "}${opts.omitTime ? "\\omit Staff.TimeSignature \\omit TabStaff.TimeSignature " : ""}${mus} }
\\score { <<
  \\new Staff \\with { \\override StringNumber.stencil = ##f } { \\clef "treble_8" \\mus }
  \\new TabStaff \\with { \\override TabNoteHead.whiteout = ##f } { \\clef moderntab \\mus }
>> }
`;
}

// (a) Shapes / Modes cards: one stacked whole-note chord per placement, per key
for (const key of keys) for (const fam of Object.keys(FAMILIES)) {
  for (const strings of FAMILIES[fam].sets) for (const inv of FAMILIES[fam].invs) {
    const seen = {};
    for (const card of walkCards(key, fam, strings, inv)) {
      const pos = seen[card.d] = (seen[card.d] || 0);
      seen[card.d]++;
      write(`${fam}-${strings.join("")}-i${inv}-d${card.d}-p${pos}-${safe(key)}`,
        cell(lyChord({ strings: card.strings, frets: card.frets, notes: card.names }, 1) + ' \\bar ""'));
    }
  }
}

// (b) the eleven workbook ii–V–I sets, per key: ii 2 beats · V 2 beats · I the full bar
for (const p of PRESETS) for (const key of keys) {
  const t = transposePreset(p, key);
  const [ii, v, i] = t.chords;
  const mus = `\\set Score.currentBarNumber = #1 ` +
    lyChord(ii, 2, { bass: ii.bass, sym: ii.sym }) + " " +
    lyChord(v, 2, { bass: v.bass, sym: v.sym }) + " | " +
    lyChord(i, 1, { bass: i.bass, sym: i.sym, below: p.plane ? `→ half-step planing (${p.plane})` : null }) +
    ' \\bar "||"';
  write(`prog-${p.id}-${safe(key)}`, cell(mus, { time: true, barnums: true, textlen: true }));
}

// (c) the tunes, one cell per row (tied rows span two bars)
for (const tid of Object.keys(TUNES)) {
  const tune = TUNES[tid];
  const last = tune.rows[tune.rows.length - 1];
  for (const row of tune.rows) {
    const end = row === last ? '\\bar "|."' : '\\bar "|"';
    let body;
    if (row.span) {
      const ch = row.chords[0];
      body = lyChord(ch, 1, { bass: ch.bass, sym: ch.sym, tie: true }) + " | " + lyChord(ch, 1, { bass: ch.bass }) + " " + end;
    } else if (row.chords.length === 2) {
      body = lyChord(row.chords[0], 2, { bass: row.chords[0].bass, sym: row.chords[0].sym }) + " " +
             lyChord(row.chords[1], 2, { bass: row.chords[1].bass, sym: row.chords[1].sym }) + " " + end;
    } else {
      body = lyChord(row.chords[0], 1, { bass: row.chords[0].bass, sym: row.chords[0].sym }) + " " + end;
    }
    write(`tune-${tid}-${row.bar}`,
      cell(`\\set Score.currentBarNumber = #${row.bar} ` + body, { time: true, omitTime: true, barnums: true, textlen: row.chords.length === 2 }));
  }
}
console.log(n, "quartal cells");
