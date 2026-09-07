/* ---------- live notation with LilyPond's glyphs (shared; keep in sync with fretboard) ----------
   notate(notes, opts) → SVG string. notes: [{string, fret, finger, note}], note spelled ("Eb",
   "F#", "Cb"). Draws a treble_8 staff with eighth notes beamed in `opts.beam` (default 4),
   accidentals as LilyPond would print them in one measure (no key signature), fingerings above,
   TAB beneath, an optional chord symbol. Glyph outlines are LilyPond's Feta font, pulled from a
   real LilyPond render; positions copy LilyPond's (clef on the G line, accidental 1.45 left of
   the head, fingerings 0.55 above the staff, TAB digits 0.63 below the line). Units: one staff
   space = 1. NOTE_DEFS must be in the document once. */
const NOTE_MIDI = {1:64,2:59,3:55,4:50,5:45,6:40};
function notate(notes, opts = {}) {
  const order = notes.slice().sort((a, b) => (NOTE_MIDI[a.string] + a.fret) - (NOTE_MIDI[b.string] + b.fret));
  if (opts.desc) order.reverse();
  // beam groups: fours, remainder absorbed as threes (9 → 3+3+3, 13 → 4+3+3+3), as the LilyPond pipeline does
  const groups = []; let left = order.length;
  while (left > 0) { if (left % 4 === 0 || (left > 6 && left % 4 !== 1 && left % 4 !== 2)) { groups.push(4); left -= 4; } else if (left >= 3) { groups.push(3); left -= 3; } else { groups.push(left); left = 0; } }
  const ACC = { "": 0, "#": 1, "##": 2, "b": -1, "bb": -2 };
  // written pitch = sounding + 12 (treble_8); staff position from letter and octave
  const cols = order.map(n => {
    const letter = n.note[0].toUpperCase(), acc = n.note.slice(1), midi = NOTE_MIDI[n.string] + n.fret + 12;
    const natural = midi - (ACC[acc] || 0), oct = Math.floor(natural / 12) - 1;
    const idx = oct * 7 + "CDEFGAB".indexOf(letter);           // E4 (bottom line) = 30
    return { n, letter, acc, oct, y: 4 - (idx - 30) * 0.5 };
  });
  // accidentals: show when the letter/octave's state differs (LilyPond's one-measure rule)
  const state = {};
  cols.forEach(c => { const k = c.letter + c.oct, cur = state[k] || ""; c.showAcc = c.acc !== cur ? (c.acc || "n") : ""; state[k] = c.acc; });
  // horizontal layout
  let x = 6.3; const STEP = 2.9;
  cols.forEach(c => { if (c.showAcc) x += (c.showAcc === "b" || c.showAcc === "bb" ? 1.3 : 1.4); c.x = x; x += STEP; });
  const W = x + 1.2;
  let o = "";
  const use = (id, x, y, s) => `<use href="#${id}" transform="translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${s || 0.004},${-(s || 0.004)})"/>`;
  // staff and tab lines
  for (let i = 0; i < 5; i++) o += `<line x1="0" y1="${i}" x2="${W}" y2="${i}" stroke="currentColor" stroke-width="0.11"/>`;
  const T0 = 7.6, TS = 1.5;
  for (let i = 0; i < 6; i++) o += `<line x1="0" y1="${T0 + i * TS}" x2="${W}" y2="${T0 + i * TS}" stroke="currentColor" stroke-width="0.11"/>`;
  o += `<line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" stroke-width="0.11"/><line x1="0" y1="${T0}" x2="0" y2="${T0 + 5 * TS}" stroke="currentColor" stroke-width="0.11"/>`;
  // clefs
  o += use("clef", 0.8, 3) + `<text x="1.15" y="6.05" font-family="serif" font-style="italic" font-size="1.15" text-anchor="middle" fill="currentColor">8</text>`;
  ["T", "A", "B"].forEach((L, i) => o += `<text x="1.3" y="${(T0 + 2.05 + i * 2.05).toFixed(2)}" font-family="sans-serif" font-weight="700" font-size="2.3" text-anchor="middle" fill="currentColor">${L}</text>`);
  // groups: stems, beams, flags
  const tops = [];
  for (let s = 0, gi = 0; s < cols.length; s += groups[gi++]) {
    const grp = cols.slice(s, s + groups[gi]);
    const up = grp.reduce((a, c) => a + c.y, 0) / grp.length > 2;
    const dir = up ? -1 : 1, sx = c => c.x + (up ? 1.23 : 0.07);   // LilyPond: head is 1.23 wide, anchored at its left edge
    if (grp.length === 1) {
      const c = grp[0], tip = c.y + dir * 3.5;
      o += `<line x1="${sx(c)}" y1="${c.y}" x2="${sx(c)}" y2="${tip}" stroke="currentColor" stroke-width="0.13"/>` + use(up ? "flagUp" : "flagDown", sx(c), tip);
      tops.push({ x: c.x, top: up ? tip - 0.6 : c.y });
    } else {
      const f = grp[0], l = grp[grp.length - 1];
      let slope = (l.y - f.y) / (l.x - f.x); slope = Math.max(-0.22, Math.min(0.22, slope));
      let base = f.y + dir * 3.5;                                   // beam y at first stem
      grp.forEach(c => { const by = base + slope * (c.x - f.x); const len = (by - c.y) * dir; if (len < 2.8) base += dir * (2.8 - len); });
      const beamY = c => base + slope * (c.x - f.x);
      grp.forEach(c => { o += `<line x1="${sx(c)}" y1="${c.y}" x2="${sx(c)}" y2="${beamY(c)}" stroke="currentColor" stroke-width="0.13"/>`; tops.push({ x: c.x, top: up ? beamY(c) - 0.5 : c.y }); });
      o += `<line x1="${sx(f)}" y1="${beamY(f)}" x2="${sx(l)}" y2="${beamY(l)}" stroke="currentColor" stroke-width="0.5"/>`;
    }
  }
  // ledger lines, accidentals, heads, fingerings, tab
  const fingerRow = Math.min(-0.55, ...tops.map(t => t.top - 1.0), ...cols.filter(c => c.showAcc).map(c => c.y - 1.9));
  cols.forEach((c, i) => {
    for (let ly = 5; ly <= c.y; ly++) o += `<line x1="${(c.x - 0.33).toFixed(2)}" y1="${ly}" x2="${(c.x + 1.63).toFixed(2)}" y2="${ly}" stroke="currentColor" stroke-width="0.21"/>`;
    for (let ly = -1; ly >= c.y; ly--) o += `<line x1="${(c.x - 0.33).toFixed(2)}" y1="${ly}" x2="${(c.x + 1.63).toFixed(2)}" y2="${ly}" stroke="currentColor" stroke-width="0.21"/>`;
    if (c.showAcc) {
      if (c.showAcc === "#") o += use("sharp", c.x - 1.45, c.y);
      else if (c.showAcc === "##") o += `<text x="${c.x - 1.0}" y="${c.y + 0.5}" font-family="serif" font-weight="700" font-size="1.5" text-anchor="middle" fill="currentColor">𝄪</text>`;
      else if (c.showAcc === "b") o += use("flat", c.x - 1.35, c.y);
      else if (c.showAcc === "bb") o += use("flat", c.x - 2.2, c.y) + use("flat", c.x - 1.25, c.y);
      else o += use("natural", c.x - 1.35, c.y);
    }
    o += use("nh", c.x, c.y);
    const f = c.n.finger; if (f >= 1 && f <= 4) o += use("f" + f, c.x + 0.25, fingerRow, 0.0022);
    o += `<text x="${(c.x + 0.62).toFixed(2)}" y="${(T0 + (c.n.string - 1) * TS + 0.63).toFixed(2)}" font-family="serif" font-weight="700" font-size="1.75" text-anchor="middle" fill="currentColor">${c.n.fret}</text>`;
  });
  let top = fingerRow - 1.4;
  if (opts.chord) {
    const m = opts.chord.match(/^([A-G][#b]?)(.*)$/), root = m ? m[1].replace("#", "♯").replace("b", "♭") : opts.chord, suf = m ? m[2] : "";
    const cy = fingerRow - 1.5;
    o += `<text x="6.1" y="${cy.toFixed(2)}" font-family="sans-serif" font-size="2.1" fill="currentColor">${root}<tspan font-size="1.4" dy="-0.9">${suf}</tspan></text>`;
    top = cy - 3.2;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.4 ${top.toFixed(1)} ${(W + 0.8).toFixed(1)} ${(T0 + 5 * TS + 1.6 - top).toFixed(1)}" preserveAspectRatio="xMidYMid meet">${o}</svg>`;
}
