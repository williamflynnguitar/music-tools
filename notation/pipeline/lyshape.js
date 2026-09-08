/* LilyPond source for one fingering shape. notes: [{string, fret, finger, note}] (note spelled: "Eb", "F#", "Cb").
   Ascending in pitch (or descending with opts.desc), eighth notes, fingerings above, TAB beneath, optional chord symbol.
   Beaming: eighths in groups of four (remainder as its own group), ending on a quarter note.
   opts.compact drops the page header (for the inline SVG cells); otherwise a letter-size page in the Argue layout. */
const LY_MIDI = {1:64,2:59,3:55,4:50,5:45,6:40};
function lyNote(n) {
  const letter = n.note[0].toLowerCase(), acc = n.note.slice(1);
  const accLy = {"":"", "#":"is", "##":"isis", "b":"es", "bb":"eses"}[acc] || "";
  const accSemi = {"":0, "#":1, "##":2, "b":-1, "bb":-2}[acc] || 0;
  const midi = LY_MIDI[n.string] + n.fret, natural = midi - accSemi, oct = Math.floor(natural / 12) - 1;
  return letter + accLy + (oct >= 4 ? "'".repeat(oct - 3) : ",".repeat(3 - oct));
}
function lyShape(notes, opts = {}) {
  const seq = notes.slice().sort((a, b) => (LY_MIDI[a.string] + a.fret) - (LY_MIDI[b.string] + b.fret));
  if (opts.desc) seq.reverse();
  // eighths beamed in fours (remainder as its own group), ending on a quarter note
  const last = seq.length - 1;
  const bracket = i => { if (i >= last) return ""; const size = Math.min(4, last - (i - i % 4)); if (size < 2) return ""; if (i % 4 === 0) return "["; if (i % 4 === 3 || i === last - 1) return "]"; return ""; };
  const body = seq.map((n, i) => lyNote(n) + (i === last ? "4" : "8") + "\\" + n.string + (n.finger ? "-" + n.finger : "") + bracket(i)).join(" ");
  const chord = opts.chord ? `\\new ChordNames \\with { majorSevenSymbol = \\markup { "Δ7" } minorChordModifier = \\markup { "-" } } { ${opts.chord} }` : "";
  const paper = opts.compact
    ? `\\paper { indent = 0 ragged-right = ##t } \\header { tagline = ##f } #(set-global-staff-size 17)`
    : `\\paper { #(set-paper-size "letter") top-margin = 12.5\\mm bottom-margin = 12.5\\mm left-margin = 12.5\\mm right-margin = 12.5\\mm indent = 0 ragged-right = ##t print-page-number = ##f
  bookTitleMarkup = \\markup \\column { \\fill-line { "${opts.part || "Guitar"}" \\column { ${(opts.source || "").split("\n").map(l => `\\line { "${l.replace(/"/g, '\\"')}" }`).join(" ")} } } \\vspace #2.2 \\fill-line { \\fontsize #6 \\bold "${(opts.title || "").replace(/"/g, '\\"')}" } \\vspace #0.5 } }
\\header { tagline = ##f } #(set-global-staff-size 20)`;
  return `\\version "2.24.0"
${paper}
\\layout { \\context { \\Score \\remove "Bar_number_engraver" \\override Fingering.direction = #UP } }
mus = { \\time ${last + 2}/8 \\omit Staff.TimeSignature \\omit TabStaff.TimeSignature \\autoBeamOff ${body} \\bar "" }
\\score { <<
  ${chord}
  \\new Staff \\with { \\override StringNumber.stencil = ##f \\remove "Time_signature_engraver" } { \\clef "treble_8" \\mus }
  \\new TabStaff \\with { \\override Fingering.stencil = ##f \\override TabNoteHead.whiteout = ##f \\remove "Time_signature_engraver" } { \\clef moderntab \\mus }
>> }
`;
}
if (typeof module !== "undefined") module.exports = { lyShape, lyNote };
