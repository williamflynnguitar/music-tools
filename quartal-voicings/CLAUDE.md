# Quartal Voicings

The missing JGTH chapter on fourths, as an app: concept text, the diatonic
quartal catalogue, the functional re-labeling method (workbook Ex. 5/10/11),
inversions, tritone voicings, ii–V–I sets with half-step planing, "Solar" and
"Stella by Starlight", and drills. Sources and every settled decision
(D1–D17) live in `briefs/quartal-voicings-spec.md` +
`briefs/quartal-voicings-build-brief.md`; the reference implementation is
`briefs/engine.py` / `briefs/symbols.py`. Single self-contained `index.html`,
no dependencies, no browser storage. On the spine after Voice-Leading Trainer,
before Triad Voicings (D3: third voicing family after shells and drops).

## Engine

Direct port of engine.py/symbols.py between `===== quartal engine =====`
markers — headless (no DOM), extracted and executed by `check.js` and
`notation/pipeline/gen-quartal.js`. Pitch-class based; **no hand-entered
fingerings anywhere** (the two tunes store the workbook's frets as data, never
re-placed).

- Families: `q3` [3,3] on 5-4-3 / 4-3-2 (default) / 3-2-1, inversions 0–2;
  `q4` [3,3,3] on 5-4-3-2 / 4-3-2-1; `sw4` [3,3,2] on 4-3-2-1; `sw5` [3,3,3,2]
  on 5-4-3-2-1 — root position only for the non-q3 families (D7).
- `place()`: both octave positions in frets 0–15 (D10), span ≤ 4, ascending by
  lowest fret; octave duplicates are kept and tagged 8va.
- Inversion names are the **workbook's** (D1): root · 1st (4th–2nd) ·
  2nd (2nd–4th). The handout's reversed numbering is never used; the spec's
  §7.1 note "(2nd inv" on the C–F–G ii of Ex. 8a/8b is that handout numbering
  leaking — the app derives 1st inversion from the data, matching Appendix A.
- `label(bass, pcs)`: the §6.2 rules 1–6 in order, port of symbols.py — do not
  reorder. Stella bar 8 is A♭13 (D17).
- Guideposts are derived from `label()` per construction (§6.3 is the P4/P4
  case and a fixture); two §6.3 cells list their two options in the opposite
  order from the derivation (spec "♭9 or ♭5" vs derived "♭5 or ♭9") — cells
  are compared as sets.
- Spelling: parent-key `SPELL` table; transposed/custom chords spell by degree
  against the symbol root with the workbook's practical ♯9 (D7alt. = B♭ E♭ F,
  not E♯).

## Fixtures

`node check.js`, or `?test=1` in the browser (logs to console). 1,339
assertions: Appendix A fret-for-fret (C and B♭, every family/set/inversion —
the B♭ 4-3-2 block *is* the F Mixolydian handout), the 36 Ex. 5/10/11
symbols, §6.3 guideposts, §7.1 presets (labels, fret↔pitch, 8b/8h planing
landings, 12-key transposition inside 0–15), §8 tunes (labels, basses,
3-2-1 rows, D17). Run it after touching anything in the engine block.

## Notation cells

Pre-rendered per key by `notation/pipeline/gen-quartal.js` →
`./render.sh quartal` into **`quartal-voicings/notation/`** (per-app store,
per the build brief — not `notation/svg/`). ~1,443 cells: every card ×
12 keys, the 11 presets × 12 keys (bar numbers under every bar, double bar,
parenthesized bass, planing annotation on 8b/8h), one cell per tune row
(tied rows span two bars). `hydrateNotation()` fetches on demand; offline or
missing cells fall back to the live `chordStaffSVG` (LilyPond glyph outlines,
TAB digits anchored under the notehead). Re-run the pipeline after changing
the engine or tune/preset data — it only renders missing cells, so delete the
affected SVGs first.

## Audio

Shared lookahead scheduler (25 ms interval / 130 ms lookahead). Chord strums
low→high at ~15 ms per voice; optional bass voice. Count-in: one bar of four
straight quarter-note clicks, accent on 1 (William's literal count-in
preference); backbeat clicks on 2 and 4 while playing. Progressions play
ii 2 beats · V 2 beats · I 4; tied tune bars hold. Visuals follow the audio
clock via `atTime()`; never the reverse.

## Tabs

Shapes (cards ascending by lowest fret + optional full-neck view, top notes
brass) · Modes (mode/tonic pickers, top-note degree labels, pentatonic/blues
filter per D14 — dim to 35%, blue-note planing hint, half-step neighbors
outlined) · Function (one shape, twelve chromatic basses as Ex. 5/10/11,
'—' columns grayed with the both-7ths/both-9ths tooltip, derived guidepost
panel) · Progressions (Ex. 6a–6c, 8a–8h presets in their written keys,
nearest-position transposition, planing control, custom function-target
search reusing the Voice-Leading Trainer cost) · Tunes (workbook data,
generated reading lines, reveal mode) · Practice (six drills in the §9
order; scores in memory only).

## Deferred (from spec §11 / brief §9)

- Inversions of q4 / sw4 / sw5 (D7).
- 6-5-4 and 6-5-4-3 string sets (D4/D5).
- Modal vamp charts ("So What", "Little Sunflower", "Impressions"); modal
  practice loop (D13).
- Function→voicing mapping for the handbook progressions and minor ii–V–i
  (m11 / 7alt. / 6/9 / Δ13 / ø11), reusing Inversion Drill's Through Changes.
- General chromatic/parallel planing tool (any voicing, any interval).
- Handout generator: regenerate the F Mixolydian handout (any key/mode) in
  the Box Buddy handout format — closes the loop with the student request
  that started this.
- Post-drill results charts (shared deferred item with Two-and-Four).

## Spelling

`spellDeg` gives a chord tone the letter its degree asks for. In the flat keys
the alt. dominants run off the end of the alphabet — A♭7alt.'s ♭9 and ♭5 are
strictly B♭♭ and E♭♭ — and **no note is written with a double accidental**
(William, 2026-09-12), so a degree needing two gives way to the plain name of
the same pitch, on the side it was heading: A♭7alt. is C♭ F♭ A. That touched
15 (preset, key) pairs, all in D♭ and A♭, and their notation cells were
re-rendered.
