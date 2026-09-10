# Quartal Voicings — content & design spec (draft v0.1, 2026-09-09)

**Status:** content spec, all decisions settled 2026-09-09 (D1–D17 as recommended, D17 = A♭13). Companion to `quartal-voicings-build-brief.md`. Everything below is derived from three sources and cross-checked by a small reference engine (attached as `engine.py` / `symbols.py`):

1. *F Mixolydian Quartal Voicings* handout (student handout, 2026) — all seven TAB blocks reproduce exactly from the engine.
2. *Intro to Quartal Voicings* (docx, "How to Use Quartal Harmony in Non-Functional & Functional Settings") — concept text and practice suggestions.
3. *workbook.pdf* (Sibelius, 2015) — Ex. 1–14: C-major voicing sets, chord-symbol tables (Ex. 5, 10, 11), inversions (Ex. 7, 12, 13), ii–V–I sets (Ex. 6, 8), "Solar" (Ex. 9), "Stella by Starlight" (Ex. 14). Every voicing in Ex. 5–14 was read from the TAB and re-derived; the 36 chord symbols in Ex. 5/10/11 and all ~40 symbols in Ex. 7–14 are reproduced by the labeling rules in §6 with zero mismatches.

The intent is that this app becomes the missing JGTH chapter on fourths: concept text, the full voicing catalogue, the functional re-labeling method, inversions, tritone voicings, and applied examples.

---

## 1. Decisions to settle before the build brief

All settled 2026-09-09: the recommendation column is the decision.

| # | Decision | Recommendation |
|---|---|---|
| D1 | **Inversion numbering.** The handout labels *Inversion 1 = 2nd–4th* and *Inversion 2 = 4th–2nd*. The workbook (Ex. 7, 12, 13) and the docx guideposts ("first inversion → min11 with the 11th on top", "second inversion → maj7♯11 with the 7th on top") both use the conventional order: **1st = 4th–2nd** (bottom note moved up), **2nd = 2nd–4th**. | **Settled 2026-09-09:** workbook convention (1st = 4th–2nd, 2nd = 2nd–4th). The handout gets corrected when it's regenerated from the app. |
| D2 | **App name / nav entry.** | "Quartal Voicings" (parallels "Triad Voicings"), handbook-tied section, brass accent. |
| D3 | **Placement in the spine.** | After Voice-Leading Trainer (the drop-2/drop-3 sequence), before Triad Voicings. It's the third voicing family after shells and drop voicings. |
| D4 | **String sets, 3-note.** Sources use 4-3-2 almost exclusively; Stella uses 3-2-1 twice. | Ship 5-4-3, 4-3-2, 3-2-1; default 4-3-2. 6-5-4 deferred (muddy, rarely used). |
| D5 | **String sets, 4-note.** | 5-4-3-2 and 4-3-2-1 (as in the sources). 6-5-4-3 deferred. |
| D6 | **"So What" family.** The docx treats it as an add-on (4th–4th–3rd, not quartal "per se"). | Include as its own family on 4-3-2-1, plus the classic five-note version on 5-4-3-2-1 (4th–4th–4th–3rd) as a single extra family. |
| D7 | **Inversions of 4-note voicings.** Not in any source. | Out of scope for v1; log as deferred. 3-note inversions are fully in. |
| D8 | **Chord-symbol tables: hand-authored vs engine-derived.** The rule set in §6 reproduces all of your existing labels. | Engine-derived, with your 36 root-position labels as the test fixture. You review the generated inversion / 4-note / So What tables (Appendix B) once; the rules get patched to match, and thereafter every key is consistent for free. |
| D9 | **Chord-symbol style.** JGTH: CΔ7, D♭°7. Workbook: Dm11, G7alt., C6/9, Eø11, Bm7(♭6). | Keep workbook forms, with Δ / ø / ° as in Shell Voicing Builder; "alt." with the period as in the workbook; minor = "m". Confirm you don't want "–" for minor. |
| D10 | **Fret ceiling.** Handout reaches fret 14. | 0–15, so every 12-fret shape also shows its octave-up neighbour; open-string voicings included (0–0–1 etc.). |
| D11 | **Bass notes in examples.** Docx: practice with and without bass notes. | Toggle "show bass note" on all functional/progression/tune views; bass on 6th or 5th string exactly as the workbook places it. |
| D12 | **Tunes.** "Solar" and "Stella" are transcribed voicing-for-voicing in §8. | Ship both as static curated examples (chord symbols + voicings only, no melody). Consider a third modal example for the Modes tab (see D13). |
| D13 | **Modal repertoire.** Docx names "So What" and "Little Sunflower". | v1: name them in the prose only; no chart. A modal vamp (e.g. 8 bars D Dorian / 8 bars E♭ Dorian) as a practice loop is a possible v1.1 item. |
| D14 | **Pentatonic filter.** Handout: harmonize C minor pentatonic and C blues over F Mixolydian. | Include as a highlight filter on the Modes tab (§5.3), generalized to any mode. The blue note is handled by chromatic planing, not a diatonic voicing. |
| D15 | **Rendering.** | Chord grids (Box Buddy engine) as the primary catalogue view + fretboard-walk view (Fretboard app style) + LilyPond staff/TAB for the example pages, pre-rendered per key as in Arpeggios Deck. |
| D16 | **Ex. 5 label oddities to confirm.** "D7sus" and "A7sus" over 1–4–5 / 1–4–♭7; "GΔ9" over 1–5–9 (no 7th); "FΔ7(♯11)" over 1–5–♯11 (no 7th); "G♭Δ7(♭5sus4)"; "E♭Δ7(♯5)" over 9–13–♯5. The rules reproduce them as written. | Keep as written (they're how you already teach it), unless you want "sus4" / "(add9)" / "Δ(♯11)" forms — one line each in §6 to change. |
| D17 | **Stella bar 8.** Symbol reads A♭7(♯11) but both voicings (G♭–C–F and C–F–G♭ over A♭ / E♭) are A♭13 sounds — no D anywhere. | **Settled 2026-09-09:** A♭13 (matching bars 21–22). |

---

## 2. Place in the book and concept text

Retroactive chapter position (D3). The prose below is condensed from your *Intro to Quartal Voicings*; it's the reading text for the app's intro panel and per-tab callouts. Voice is yours; I only cut and reordered.

**What quartal harmony is.** Western harmony is predominantly tertian — stacked in thirds. Quartal harmony stacks fourths. Because the voicings contain no major or minor thirds, they carry weak functional implications: they sound "open" and "ambiguous," and it's hard to look at one and say what it "is." That ambiguity is the feature: one shape serves many chords.

**Two ways jazz musicians use them.** *Non-functionally (modally)*: the voicings describe a key or mode linearly, the way diatonic triads or 7th chords do — stack fourths on each scale degree and you get the seven diatonic quartal voicings of the key. Tension and release happen on the micro level, not against a tonic. *Functionally*: attach chord symbols to the shapes so they can fulfil ii, V, I roles in a progression. Attaching symbols is how you get functional command of them.

**The three shapes.** A three-note quartal voicing contains two fourths, each perfect (P4) or augmented (TT), so there are three usable constructions: **P4/P4** (five of the seven diatonic voicings), **TT/P4** (built on the 4th degree of the parent major scale: F–B–E in C) and **P4/TT** (built on the 1st degree: C–F–B). TT/TT would put an octave in the outer voices and isn't studied. The tritone voicings have a different colour and yield melodic-minor harmonies (m6/9, ø, Δ7♯5) that the P4/P4 voicings don't.

**Inversions.** Quartal voicings invert like triads. Because the root-position voicing serves several functions, so do its inversions — but the melody note changes, so each inversion gets its own guideposts. The tritone-voicing inversions contain a minor 2nd and are trickier to finger.

**Guideposts (root-position P4/P4).** For the voicing to behave as a **min11**, the ♭3 must be on top. As an **altered dominant**, the ♭5 or ♭9 must be on top. As a **maj6/9**, the 5th or 9th must be on top. First inversion → min11 with the natural 11th on top; second inversion → Δ7♯11 with the major 7th on top. (The app derives the full guidepost set for every family from §6.)

**With and without bass notes.** Play every functional example both ways: without the bass to stay out of a bassist's register; with the bass for guitar/horn, guitar/voice and guitar-duo settings.

**Practice suggestions (from the docx and handout), mapped to app features:**

- Play the 3-note voicings up the neck in all 12 major keys, visualizing the top note as a scale degree → Modes tab, degree labels on.
- Repeat in common modal keys (D Dorian, G Mixolydian…), reading the top note as a mode degree → Modes tab, mode selector.
- Apply to modal repertoire ("So What", "Little Sunflower") → prose only in v1 (D13).
- Create melodies while comping; start inside one voicing family, then mix families; harmonize the pentatonic / blues scale → Modes tab pentatonic filter (D14) + family selector.
- Chromatic planing: approach a voicing from a half step above or below → Progressions tab planing control.
- Attach chord symbols; study which note must be on top for each function → Function tab.
- Put voicings and inversions into ii–V–I progressions, with and without bass → Progressions tab.
- Find the inversions of the tritone voicings → Shapes tab, family = P4/TT or TT/P4.

---

## 3. Voicing engine (data model)

Same architectural stance as Box Buddy / Triad Voicings: pitch-based generation from a parent scale, no hand-entered fingerings. The Python reference implementation is attached; the JS port is a direct translation.

### 3.1 Inputs

- `parent`: major-scale tonic (0–11). Every mode is expressed as a parent major + degree offset (D Dorian → parent C, offset 1). Spelling follows the parent key signature (B♭ major spells E♭/A♭, not D♯/G♯).
- `family`: one of `q3` (3-note, 4th–4th), `q4` (4-note, 4th–4th–4th), `sw4` (So What, 4th–4th–3rd), `sw5` (five-note, 4th–4th–4th–3rd — D6).
- `stringSet`: adjacent strings, low → high. `q3`: [5,4,3] [4,3,2] [3,2,1]; `q4`: [5,4,3,2] [4,3,2,1]; `sw4`: [4,3,2,1]; `sw5`: [5,4,3,2,1].
- `inversion`: 0 | 1 | 2 for `q3` (rotate bottom note up); 0 only for the others in v1 (D7).
- `fretCeiling`: 15 (D10).

### 3.2 Construction

For each scale degree *i* (0–6), stack diatonic steps: a "4th" = +3 scale steps, a "3rd" = +2. So `q3` on degree *i* = [s(i), s(i+3), s(i+6)]; `q4` adds s(i+9); `sw4` = [s(i), s(i+3), s(i+6), s(i+8)]; `sw5` = [s(i), s(i+3), s(i+6), s(i+9), s(i+11)]. Inversion *k* rotates the lowest *k* notes to the top (pitch-class rotation; the string set fixes the octave).

### 3.3 Placement

For each note, take the fret on its assigned string (0–15, both octave positions). Keep combinations whose fret span ≤ 4; sort by lowest fret. On adjacent string sets this yields exactly one placement per position (two when a shape fits at both *n* and *n+12*). Open-string placements are kept (0–0–1, 2–2–0, 3–0–1, etc.) — they're in the workbook.

### 3.4 Interval type

Label each voicing by its adjacent intervals: P4/P4, P4/TT, TT/P4 for `q3` root position; inversions become P4/M2, M2/P4, TT/m2, m2/TT, P4/m2, m2/P4 etc. Display the type on the card (the docx makes a point of it) and colour the two tritone voicings differently from the five P4/P4 voicings.

### 3.5 Catalogue size

Per parent key: `q3` 7 voicings × 3 inversions × 3 string sets = 63 shapes (plus octave duplicates); `q4` 7 × 2 = 14; `sw4` 7; `sw5` 7. × 12 keys ≈ 1,100 cells — comparable to the Arpeggios pipeline, so pre-rendering per key is fine.

### 3.6 Fixtures (Appendix A)

C major and B♭ major, every family and string set, generated from the rules above and matched against the handout and workbook Ex. 1. These are the regression tests for the JS port.

---

## 4. App structure

Mirrors Arpeggios Deck's tab pattern.

1. **Shapes** — the catalogue. Family / string set / inversion / key selectors; chord-grid cards ascending by position with interval type and note names; a fretboard-walk view showing the whole set on one neck. Card order = ascending root fret (same rule as the arpeggio parallel walk).
2. **Modes** — same shapes, relabeled: pick a mode and tonic; the top note of each card shows its mode degree; pentatonic/blues filter (§5).
3. **Function** — one shape, twelve bass notes: the Ex. 5/10/11 experience, generated for any shape (§6). Guidepost summary per family and inversion.
4. **Progressions** — ii–V–I in all keys using the six workbook voicing sets, inversion mixing, half-step planing (§7).
5. **Tunes** — "Solar" and "Stella by Starlight" as curated voicing sequences with the chord-symbol reading of each (§8).
6. **Practice** — drills (§9).

Intro panel (concept text, §2) reachable from every tab, as in Scale Practice.

---

## 5. Modes tab

### 5.1 Mode list

Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian — each as parent major + offset, so the shapes are identical to the parent key's and only the labels change (this is the pedagogical point: "now visualize the top notes as degrees of the mode").

Suggested "modal key" presets in the picker: D Dorian, E♭ Dorian, G Mixolydian, F Mixolydian (the handout), F Lydian, E Phrygian. Free choice of any tonic × mode remains available.

### 5.2 Labels

Top-note degree of the mode (1, ♭3, 4, 5, ♭7… for Dorian). Optional second line: the note name. The parent-key spelling holds (D Dorian shows F, not E♯).

### 5.3 Pentatonic / blues filter (D14)

Generalizing the handout: for a chosen mode and tonic, offer

- **Minor pentatonic** on the mode's tonic (Dorian, Aeolian, Phrygian) or on the 5th of the tonic for Mixolydian (F7 → C minor pentatonic, as on the handout — i.e. the ii of the parent key) or on the 6th for Ionian/Lydian (relative minor).
- **Blues scale** = the same pentatonic + its ♭5.

Cards whose top note is in the chosen scale stay full-strength; the others dim. The blue note isn't diatonic, so no card carries it; the filter surfaces a hint: "♭5 of the pentatonic — approach it by planing the neighbouring voicing a half step" and highlights the two cards whose top notes sit a half step either side of it. That is exactly the handout's fourth practice direction.

### 5.4 Practice directions panel (from the handout)

1. Harmonize the notes of the pentatonic and blues scale.
2. Create melodies with the voicings; stay in one voicing family first.
3. Combine voicing families as curiosity guides you.
4. For colour, plane chromatically between voicings — approach from a half step above or below.

---

## 6. Function tab — attaching chord symbols

### 6.1 Interaction

Pick any shape (family, inversion, position). The tab shows the shape held fixed while a bass note descends chromatically through all twelve pitches, exactly as Ex. 5/10/11: one column per bass note with the chord symbol, the bass-note position on string 6 or 5, and the top note's degree relative to that bass. "—" marks bass notes that yield no usable symbol (both 7ths, or both 9ths, present). Audio: play the shape over each bass note.

### 6.2 Labeling rules (reproduce every symbol in the workbook)

Compute degrees of the voicing's pitch classes relative to the bass. Let *alts* = {♭9, ♯9, ♭5, ♭13} present, *nats* = {9, 11, 5, 13} present.

1. **No symbol** if ♭7 and Δ7 are both present, or ♭9 and 9 both present, or (minor family) a ♭9 is present.
2. **Dominant (3 and ♭7 present):** 11 with no alterations → `7sus` (G7sus in Ex. 10). Alterations and no naturals → `7alt.` if ≥ 2 alterations, else `7(♭9)` / `7(♯9)`. Alterations with naturals → base `13` / `9` / `7` + parenthesized alterations, writing ♯11 (not ♭5) when a natural 5 is present (B♭7(♭9♯11)). Otherwise `13`, `9`, `7`.
3. **All notes altered, no 3rd, no 7th, ≥ 3 alterations** → `7alt.` (D♭7alt., G♭7alt. in Ex. 5; A♭7alt. in Solar).
4. **Major (3, no ♭7):** with Δ7: ♭9+♭5 → `Δ7(♭9♭5)`; 13 → `Δ13`; ♭5 → `Δ7(♯11)`; 11 → `Δ7(sus4)`; 9 → `Δ9`; else `Δ7`. Without Δ7: 6+9 → `6/9`; ♯5 with 13 or 9 → `Δ7(♯5)`; ♯11 → `Δ7(♯11)`; 3+♯9+13 → `Δ13(♯9)`.
5. **Minor (♭3, no 3):** ♭5 → `ø11` (11 present) / `ø7` (♭7) / `°7(♭13)` (6+♭13) / `°7` (6); ♭7 → `m13` / `m7(♭6)` / `m11` / `m9` / `m7` by highest present; Δ7 → `m(Δ11)` / `m(Δ7)`; 6+9 → `m6/9`; 6 → `m6`; ♭6+9 → `m9(♭6)`; ♭6 → `m(♭6)`.
6. **No 3rd, none of the above:** Δ7+♭9+♭5 → `Δ7(♭9♭5)`; ♭13+9+13 → `Δ7(♯5)`; ♭13+9 → `m9(♭6)`; ♭5+11 → `ø11`; ♭7 with 11 or 5 → `7sus` / `9sus`; Δ7+♭5+11 → `Δ7(♭5sus4)`; Δ7+11 → `m(Δ11)`; 11+5 → `7sus`; ♭9+5 → `7(♭9♭13)` / `7(♭9♯11)` / `7(♭9)`; ♭9+♭5 → `7(♭9♭5)`; 9+5 → `Δ9`; ♯11 → `Δ7(♯11)`.

Rules 1–6 in that order. Test fixture: the 36 symbols of Ex. 5/10/11 plus every symbol in Ex. 6–9 and 14 (all listed in §7–8) — currently 0 mismatches. Anything you change in D16 is a one-line edit to the corresponding rule.

### 6.3 Guideposts (derived)

For each family × inversion the app can state "to sound like X, the top note must be Y" by reading the table. For the P4/P4 shape this yields exactly the docx guideposts:

| Function | root position, top = | 1st inversion, top = | 2nd inversion, top = |
|---|---|---|---|
| m11 | ♭3 | 11 | ♭7 |
| 7alt. | ♭9 or ♭5 | ♭13 or ♯9 | ♭9 or ♭13 |
| 6/9 | 5 or 9 | 3 or 6 | 9 or 6 |
| Δ13 | 13 | Δ7 | 3 |
| Δ7(♯11) | 3 | ♯11 | Δ7 |
| 7sus | 11 or ♭7 | 5 or 1 | 1 or 11 |

(Full tables, every family: Appendix B.)

---

## 7. Progressions tab

### 7.1 The six workbook ii–V–I sets (transcribed; frets D–G–B on strings 4-3-2, bass in parentheses)

| Set | ii | V | I | Notes |
|---|---|---|---|---|
| Ex. 6a | Dm11 G–C–F 5–5–6 (D: A5) | G7alt. E♭–A♭–D♭ 1–1–2 (G: E3) | C6/9 E–A–D 2–2–3 (C: A3) | all root position, ♭3 / ♭5 / 9 on top |
| Ex. 6b | Dm11 5–5–6 | G7alt. B♭–E♭–A♭ 8–8–9 (G: A10) | C6/9 A–D–G 7–7–8 (C: E8) | ♭9 on top of the V, 5 on top of the I |
| Ex. 6c | Dm11 5–5–6 | G7alt. 8–8–9 | CΔ13 B–E–A 9–9–10 (C: E8) | 13 on top of the I |
| Ex. 8a | Dm11 C–F–G 10–10–8 (2nd inv, D: E10) | G7alt. D♭–E♭–A♭ 11–8–9 (2nd inv, G: A10) | C6/9 A–D–G 7–7–8 | |
| Ex. 8b | Dm11 10–10–8 | G7alt. B♭–E♭–A♭ 8–8–9 → *half-step plane up* | CΔ13 B–E–A 9–9–10 | planing example 1 |
| Ex. 8c | Dm11 G–C–F 5–5–6 | G7alt. A♭–B♭–E♭ 6–3–4 (2nd inv) | C6/9 A–D–E 7–7–5 (1st inv) | |
| Ex. 8d | Am11 C–D–G 10–7–8 (2nd inv, A: A0) | D7alt. B♭–E♭–F 8–8–6 (1st inv, D: E10) | GΔ7(♯11) B–C♯–F♯ 9–6–7 (2nd inv, G: A10) | |
| Ex. 8e | Dm11 5–5–6 | G7alt. E♭–A♭–D♭ 1–1–2 | CΔ13 E–A–B 2–2–0 (1st inv, C: A3) | |
| Ex. 8f | Em11 G–A–D 5–2–3 (2nd inv, E: E0) | A7alt. B♭–E♭–F 8–8–6 (1st inv, A: A0) | DΔ13 B–C♯–F♯ 9–6–7 (2nd inv, D: A5) | |
| Ex. 8g | Dm11 F–G–C (strings 3-2-1: 10–8–8, D: E10) | G7alt. E♭–A♭–B♭ 13–13–11 (1st inv, G: A10) | CΔ13 B–E–A 9–9–10 | 3-2-1 set used for the ii |
| Ex. 8h | Em11 5–2–3 | A7alt. F–B♭–C 3–3–1 (1st inv) → *half-step plane up* | DΔ13 F♯–B–C♯ 4–4–2 (1st inv) | planing example 2 |

### 7.2 Generation

For any key and any assignment of (voicing type, inversion) to ii / V / I, the engine finds the shapes and their nearest positions; the workbook sets above become named presets ("Ex. 6a" …). The Voice-Leading Trainer's nearest-inversion logic is reusable for the "auto" option. Bass-note toggle per D11.

### 7.3 Planing

Rule: the V-chord shape moves to the I-chord shape by parallel half-step (up in both examples). Control: "plane into the I" on/off, direction up/down; the app labels the arrow as the workbook does. A second use — the handout's chromatic approach into any voicing — belongs to the Practice tab.

### 7.4 Other progressions

The Inversion Drill "Through Changes" handbook progressions can be reused once the engine assigns a voicing type per chord function (m11 for ii/vi, 7alt. or 13 for V, 6/9 or Δ13 for I, ø11 for iiø, 7alt. for V of minor). That mapping table is a v1.1 item; v1 ships ii–V–I major only, all keys.

---

## 8. Tunes tab (transcribed from Ex. 9 and 14)

Chord symbols and voicings only — no melody. Frets D–G–B on strings 4-3-2 unless marked 3-2-1; bass string/fret in parentheses.

### 8.1 "Solar" (12 bars)

| Bar | Symbol | Voicing (low→high) | Frets | Position | Bass |
|---|---|---|---|---|---|
| 1 | Cm11 | F B♭ E♭ | 3–3–4 | root | C (A3) |
| 2 | Cm11 | B♭ E♭ F | 8–8–6 | 1st | C (E8) |
| 3 | Gm11 | F B♭ C | 3–3–1 | 1st | G (E3) |
| 4 | C7alt. | E♭ A♭ D♭ | 1–1–2 | root | G (E3) — 5th in bass |
| 5 | FΔ13 | E A D | 2–2–3 | root | F (E1) |
| 6 | FΔ13 | D E A | 12–9–10 | 2nd | C (E8) — 5th in bass |
| 7 | Fm11 | B♭ E♭ A♭ | 8–8–9 | root | F (A8) |
| 8 | B♭7alt. | C♭ D♭ G♭ | 9–6–7 | 2nd | B♭ (E6) |
| 9 | E♭6/9 | G C F | 5–5–6 | root | E♭ (A6) |
| 10 | E♭m11 · A♭7alt. | A♭ D♭ G♭ · E A D | 6–6–7 · 2–2–3 | root · root | E♭ (A6) · A♭ (E4) |
| 11 | D♭Δ7(♯11) | G C F | 5–5–6 | root | D♭ (A4) |
| 12 | G7alt. | B♭ E♭ A♭ | 8–8–9 | root | G (A10) |

### 8.2 "Stella by Starlight" (32 bars)

| Bar | Symbol | Voicing | Frets | Position / type | Bass |
|---|---|---|---|---|---|
| 1 | Eø11 | A B♭ E | 7–3–5 | 2nd inv of E–A–B♭ (P4/TT) | E (E0) |
| 2 | A7alt. | F B♭ E♭ | 3–3–4 | root | A (E5) |
| 3 | Cm11 | B♭ E♭ F | 8–8–6 | 1st | C (E8) |
| 4 | F13 | D E♭ A | 12–8–10 | 2nd inv of E♭–A–D (TT/P4) | F (A8) |
| 5 | Fm11 | B♭ E♭ A♭ | 8–8–9 | root | F (A8) |
| 6 | B♭7alt. | B E G♭ | 9–9–7 | 1st inv of G♭–B–E | B♭ (E6) |
| 7 | E♭Δ7(♯11) · E♭6/9 | A D G · G C F | 7–7–8 · 5–5–6 | root · root | E♭ (A6) both |
| 8 | A♭13 | G♭ C F · C F G♭ | 4–5–6 · 10–10–7 | root TT/P4 · 1st inv | A♭ (E4) · E♭ (E11) |
| 9 | B♭6/9 | G C F | 5–5–6 | root | B♭ (E6) |
| 10 | Eø11 · A7alt. | A B♭ E · F B♭ E♭ | 7–3–5 · 3–3–4 | as bars 1–2 | E (A7) · A (E5) |
| 11 | Dm11 | G C F · F G C | 5–5–6 · 3–0–1 | root · 2nd | D (A5) both |
| 12 | B♭m11 · E♭13 | E♭ A♭ D♭ · D♭ G C | 1–1–2 · **3-2-1: 6–8–8** | root · root TT/P4 | B♭ (A1) · E♭ (A6) |
| 13 | FΔ13 | D E A | 12–9–10 | 2nd | F (A8) |
| 14 | Eø11 · A7alt. | B♭ E A · C F B♭ | 8–9–10 · 10–10–11 | 2nd inv (TT/P4 form) · root | E (A7) · E (E12) — 5th in bass |
| 15 | Aø11 | D E♭ A | 12–8–10 | 2nd inv of E♭–A–D | A (A12) |
| 16 | D7alt. | B♭ E♭ F | 8–8–6 | 1st | D (E10) |
| 17 | G7alt. | B♭ E♭ A♭ | 8–8–9 | root | G (A10) |
| 18 | G7alt. | E♭ A♭ B♭ | 13–13–11 | 1st | G (A10) |
| 19–20 | Cm11 (tied) | E♭ F B♭ | **3-2-1: 8–6–6** | 2nd | C (E8) |
| 21 | A♭13 | C F G♭ | 10–10–7 | 1st inv | E♭ (E11) — 5th in bass |
| 22 | A♭13 | G♭ C F | 4–5–6 | root TT/P4 | A♭ (E4) |
| 23–24 | B♭6/9 (tied) | G C D | 5–5–3 | 1st | B♭ (E6) |
| 25 | Eø11 | B♭ E A | 8–9–10 | as bar 14 | E (A7) |
| 26 | A7alt. | E♭ F B♭ | 13–10–11 | 2nd | A (A12) |
| 27 | Dø11 | A♭ D G | 6–7–8 | root TT/P4 | D (A5) |
| 28 | G7alt. | D♭ E♭ A♭ | 11–8–9 | 2nd | G (A10) |
| 29 | Cø11 | C F G♭ | 10–10–7 | 1st inv of G♭–C–F | C (E8) |
| 30 | F7alt. | A♭ D♭ G♭ | 6–6–7 | root | F (A8) |
| 31–32 | B♭6/9 (tied) | G C F | 5–5–6 | root | B♭ (E6) |

Display: chord symbol above each bar, grid + TAB, "why it works" line under each (e.g. bar 4: "E♭–A–D 2nd inversion; over F the top A is the 3rd, E♭ the ♭7, D the 13"). Optional metronome loop as in Voice-Leading Trainer.

---

## 9. Practice tab — drills

1. **Linear walk** (Fretboard-app style): play the family up and down the neck in a key or mode; metronome; top-note degrees shown or hidden.
2. **Name that voicing** (Shell Voicing Builder style): shape + random bass note → student names the chord (multiple choice from the family's table, "—" is a valid answer).
3. **Which note on top?**: given a function ("make it a min11"), student picks the inversion/top note; checks against §6.3.
4. **Harmonize the pentatonic**: Modes tab filter as a timed drill — random pentatonic tone, student plays the voicing with that top note; blue note prompts a plane.
5. **ii–V–I in all keys**: cycle of 4ths through the six presets or a random mix of inversions; planing on/off.
6. **Tune loop**: Solar / Stella, bar-by-bar reveal.

---

## 10. Rendering and conventions

- Chord grids from the Box Buddy engine; fretboard-walk from the Fretboard app; notation via the LilyPond pipeline (`gen-quartal.js` alongside `gen-arpeggios.js`), pre-rendered per key. Staff + TAB for Function, Progressions and Tunes pages; grids for Shapes/Modes.
- Argue conventions apply to the example pages: measure numbers under every bar, double bars between examples, metronome mark before style word where a tempo is shown. Chord symbols per D9.
- TAB digit placement: notehead anchor rule from the Fretboard work applies.
- Audio: Web Audio synthesized voices; shape + optional bass; metronome from Two-and-Four's scheduler.
- Constraints unchanged: single HTML file, no build step, no dependencies, no browser storage.

---

## 11. Deferred (for the app's CLAUDE.md)

- Inversions of 4-note and So What voicings (D7).
- 6-5-4 and 6-5-4-3 string sets (D4/D5).
- Modal vamp charts ("So What", "Little Sunflower", "Impressions") (D13).
- Function-to-voicing mapping for the handbook progressions and minor ii–V–i (§7.4).
- Chromatic/parallel planing as a general tool (any voicing, any interval), beyond the V→I half-step case.
- Handout generator: regenerate the F Mixolydian handout (and any key/mode) from the app, in the Box Buddy handout format — closes the loop with the student request that started this.

---

## Appendix A — fingering fixtures (engine output)

Frets are listed low string → high string, ascending by position, ceiling fret 15. Verified against the F Mixolydian handout (all seven blocks match) and workbook Ex. 1.

#### C major (workbook key), 3-note on strings 4-3-2 (D–G–B)

- Root position: D G C 0–0–1 · E A D 2–2–3 · F B E 3–4–5 · G C F 5–5–6 · A D G 7–7–8 · B E A 9–9–10 · C F B 10–10–12 · D G C 12–12–13 · E A D 14–14–15
- 1st inversion (4th–2nd): E A B 2–2–0 · F B C 3–4–1 · G C D 5–5–3 · A D E 7–7–5 · B E F 9–9–6 · C F G 10–10–8 · D G A 12–12–10 · E A B 14–14–12
- 2nd inversion (2nd–4th): F G C 3–0–1 · G A D 5–2–3 · A B E 7–4–5 · B C F 9–5–6 · C D G 10–7–8 · D E A 12–9–10 · E F B 14–10–12 · F G C 15–12–13

#### C major (workbook key), 3-note on 5-4-3 (A–D–G)

A D G 0–0–0 · B E A 2–2–2 · C F B 3–3–4 · D G C 5–5–5 · E A D 7–7–7 · F B E 8–9–9 · G C F 10–10–10 · A D G 12–12–12 · B E A 14–14–14

#### C major (workbook key), 3-note on 3-2-1 (G–B–e)

G C F 0–1–1 · A D G 2–3–3 · B E A 4–5–5 · C F B 5–6–7 · D G C 7–8–8 · E A D 9–10–10 · F B E 10–12–12 · G C F 12–13–13 · A D G 14–15–15

#### C major (workbook key), 4-note on 5-4-3-2 (A–D–G–B)

A D G C 0–0–0–1 · B E A D 2–2–2–3 · C F B E 3–3–4–5 · D G C F 5–5–5–6 · E A D G 7–7–7–8 · F B E A 8–9–9–10 · G C F B 10–10–10–12 · A D G C 12–12–12–13 · B E A D 14–14–14–15

#### C major (workbook key), 4-note on 4-3-2-1 (D–G–B–e)

D G C F 0–0–1–1 · E A D G 2–2–3–3 · F B E A 3–4–5–5 · G C F B 5–5–6–7 · A D G C 7–7–8–8 · B E A D 9–9–10–10 · C F B E 10–10–12–12 · D G C F 12–12–13–13 · E A D G 14–14–15–15

#### C major (workbook key), “So What” on 4-3-2-1 (D–G–B–e)

D G C E 0–0–1–0 · E A D F 2–2–3–1 · F B E G 3–4–5–3 · G C F A 5–5–6–5 · A D G B 7–7–8–7 · B E A C 9–9–10–8 · C F B D 10–10–12–10 · D G C E 12–12–13–12 · E A D F 14–14–15–13

#### B♭ major = F Mixolydian (handout key), 3-note on strings 4-3-2 (D–G–B)

- Root position: D G C 0–0–1 · Eb A D 1–2–3 · F Bb Eb 3–3–4 · G C F 5–5–6 · A D G 7–7–8 · Bb Eb A 8–8–10 · C F Bb 10–10–11 · D G C 12–12–13 · Eb A D 13–14–15
- 1st inversion (4th–2nd): F Bb C 3–3–1 · G C D 5–5–3 · A D Eb 7–7–4 · Bb Eb F 8–8–6 · C F G 10–10–8 · D G A 12–12–10 · Eb A Bb 13–14–11 · F Bb C 15–15–13
- 2nd inversion (2nd–4th): F G C 3–0–1 · G A D 5–2–3 · A Bb Eb 7–3–4 · Bb C F 8–5–6 · C D G 10–7–8 · D Eb A 12–8–10 · Eb F Bb 13–10–11 · F G C 15–12–13

#### B♭ major = F Mixolydian (handout key), 3-note on 5-4-3 (A–D–G)

A D G 0–0–0 · Bb Eb A 1–1–2 · C F Bb 3–3–3 · D G C 5–5–5 · Eb A D 6–7–7 · F Bb Eb 8–8–8 · G C F 10–10–10 · A D G 12–12–12 · Bb Eb A 13–13–14 · C F Bb 15–15–15

#### B♭ major = F Mixolydian (handout key), 3-note on 3-2-1 (G–B–e)

G C F 0–1–1 · A D G 2–3–3 · Bb Eb A 3–4–5 · C F Bb 5–6–6 · D G C 7–8–8 · Eb A D 8–10–10 · F Bb Eb 10–11–11 · G C F 12–13–13 · A D G 14–15–15

#### B♭ major = F Mixolydian (handout key), 4-note on 5-4-3-2 (A–D–G–B)

A D G C 0–0–0–1 · Bb Eb A D 1–1–2–3 · C F Bb Eb 3–3–3–4 · D G C F 5–5–5–6 · Eb A D G 6–7–7–8 · F Bb Eb A 8–8–8–10 · G C F Bb 10–10–10–11 · A D G C 12–12–12–13 · Bb Eb A D 13–13–14–15

#### B♭ major = F Mixolydian (handout key), 4-note on 4-3-2-1 (D–G–B–e)

D G C F 0–0–1–1 · Eb A D G 1–2–3–3 · F Bb Eb A 3–3–4–5 · G C F Bb 5–5–6–6 · A D G C 7–7–8–8 · Bb Eb A D 8–8–10–10 · C F Bb Eb 10–10–11–11 · D G C F 12–12–13–13 · Eb A D G 13–14–15–15

#### B♭ major = F Mixolydian (handout key), “So What” on 4-3-2-1 (D–G–B–e)

Eb A D F 1–2–3–1 · F Bb Eb G 3–3–4–3 · G C F A 5–5–6–5 · A D G Bb 7–7–8–6 · Bb Eb A C 8–8–10–8 · C F Bb D 10–10–11–10 · D G C Eb 12–12–13–11 · Eb A D F 13–14–15–13

## Appendix B — chord-symbol tables (engine output; root-position 3-note rows are the workbook's own)

### A. Three-note voicings

Symbols are shared by a voicing and its inversions (same pitch classes); what changes is which note is on top. Root-position rows match workbook Ex. 5, 10, 11 exactly; the inversion columns are the guideposts the engine derives from them.

#### P4/P4 — A D G (P4/P4)

| Bass | Symbol | top note, root pos. | top note, 1st inv. | top note, 2nd inv. |
|---|---|---|---|---|
| E | Em11 | G = ♭3/♯9 | A = 11 | D = ♭7 |
| Eb | EbΔ7(♯11) | G = 3 | A = ♭5/♯11 | D = Δ7 |
| D | D7sus | G = 11 | A = 5 | D = 1 |
| Db | Db7alt. | G = ♭5/♯11 | A = ♭13 | D = ♭9 |
| C | C6/9 | G = 5 | A = 13/6 | D = 9 |
| B | Bm7(♭6) | G = ♭13 | A = ♭7 | D = ♭3/♯9 |
| Bb | BbΔ13 | G = 13/6 | A = Δ7 | D = 3 |
| A | A7sus | G = ♭7 | A = 1 | D = 11 |
| Ab | AbΔ7(♭9♭5) | G = Δ7 | A = ♭9 | D = ♭5/♯11 |
| G | GΔ9 | G = 1 | A = 9 | D = 5 |
| Gb | Gb7alt. | G = ♭9 | A = ♭3/♯9 | D = ♭13 |
| F | F6/9 | G = 9 | A = 3 | D = 13/6 |

#### P4/TT — C F B (P4/TT)

| Bass | Symbol | top note, root pos. | top note, 1st inv. | top note, 2nd inv. |
|---|---|---|---|---|
| E | E7(♭9♭13) | B = 5 | C = ♭13 | F = ♭9 |
| Eb | EbΔ7(♯5) | B = ♭13 | C = 13/6 | F = 9 |
| D | Dm13 | B = 13/6 | C = ♭7 | F = ♭3/♯9 |
| Db | — (no usable symbol) | B = ♭7 | C = Δ7 | F = 3 |
| C | Cm(Δ11) | B = Δ7 | C = 1 | F = 11 |
| B | B7(♭9♭5) | B = 1 | C = ♭9 | F = ♭5/♯11 |
| Bb | — (no usable symbol) | B = ♭9 | C = 9 | F = 5 |
| A | Am9(♭6) | B = 9 | C = ♭3/♯9 | F = ♭13 |
| Ab | AbΔ13(♯9) | B = ♭3/♯9 | C = 3 | F = 13/6 |
| G | G7sus | B = 3 | C = 11 | F = ♭7 |
| Gb | GbΔ7(♭5sus4) | B = 11 | C = ♭5/♯11 | F = Δ7 |
| F | FΔ7(♯11) | B = ♭5/♯11 | C = 5 | F = 1 |

#### TT/P4 — F B E (TT/P4)

| Bass | Symbol | top note, root pos. | top note, 1st inv. | top note, 2nd inv. |
|---|---|---|---|---|
| E | E7(♭9) | E = 1 | F = ♭9 | B = 5 |
| Eb | — (no usable symbol) | E = ♭9 | F = 9 | B = ♭13 |
| D | Dm6/9 | E = 9 | F = ♭3/♯9 | B = 13/6 |
| Db | Db7(♯9) | E = ♭3/♯9 | F = 3 | B = ♭7 |
| C | CΔ7(sus4) | E = 3 | F = 11 | B = Δ7 |
| B | Bø11 | E = 11 | F = ♭5/♯11 | B = 1 |
| Bb | Bb7(♭9♯11) | E = ♭5/♯11 | F = 5 | B = ♭9 |
| A | Am9(♭6) | E = 5 | F = ♭13 | B = 9 |
| Ab | Ab°7(♭13) | E = ♭13 | F = 13/6 | B = ♭3/♯9 |
| G | G13 | E = 13/6 | F = ♭7 | B = 3 |
| Gb | — (no usable symbol) | E = ♭7 | F = Δ7 | B = 11 |
| F | FΔ7(♯11) | E = Δ7 | F = 1 | B = ♭5/♯11 |

### B. Four-note quartal voicings (engine-generated drafts — please review)

One row per bass note; inversions of four-note voicings are out of scope for v1 (see decisions), so only the root-position top note is shown.

#### P4/P4/P4 — D G C F (P4/P4/P4)

| Bass | Symbol | top note, root pos. |
|---|---|---|
| E | — (no usable symbol) | F = ♭9 |
| Eb | EbΔ13 | F = 9 |
| D | Dm11 | F = ♭3/♯9 |
| Db | DbΔ7(♭9♭5) | F = 3 |
| C | C7sus | F = 11 |
| B | B7alt. | F = ♭5/♯11 |
| Bb | Bb6/9 | F = 5 |
| A | Am7(♭6) | F = ♭13 |
| Ab | AbΔ13 | F = 13/6 |
| G | G7sus | F = ♭7 |
| Gb | GbΔ7(♭9♭5) | F = Δ7 |
| F | F6/9 | F = 1 |

#### P4/TT/P4 — C F B E (P4/TT/P4)

| Bass | Symbol | top note, root pos. |
|---|---|---|
| E | E7(♭9♭13) | E = 1 |
| Eb | — (no usable symbol) | E = ♭9 |
| D | Dm13 | E = 9 |
| Db | — (no usable symbol) | E = ♭3/♯9 |
| C | CΔ7(sus4) | E = 3 |
| B | Bø11 | E = 11 |
| Bb | — (no usable symbol) | E = ♭5/♯11 |
| A | Am9(♭6) | E = 5 |
| Ab | AbΔ13(♯9) | E = ♭13 |
| G | G13 | E = 13/6 |
| Gb | — (no usable symbol) | E = ♭7 |
| F | FΔ7(♯11) | E = Δ7 |

#### TT/P4/P4 — F B E A (TT/P4/P4)

| Bass | Symbol | top note, root pos. |
|---|---|---|
| E | E7sus | A = 11 |
| Eb | — (no usable symbol) | A = ♭5/♯11 |
| D | Dm6/9 | A = 5 |
| Db | Db7alt. | A = ♭13 |
| C | CΔ13 | A = 13/6 |
| B | Bø11 | A = ♭7 |
| Bb | BbΔ7(♭9♭5) | A = Δ7 |
| A | Am9(♭6) | A = 1 |
| Ab | — (no usable symbol) | A = ♭9 |
| G | G13 | A = 9 |
| Gb | — (no usable symbol) | A = ♭3/♯9 |
| F | FΔ7(♯11) | A = 3 |

#### P4/P4/TT — G C F B (P4/P4/TT)

| Bass | Symbol | top note, root pos. |
|---|---|---|
| E | — (no usable symbol) | B = 5 |
| Eb | Eb6/9 | B = ♭13 |
| D | Dm13 | B = 13/6 |
| Db | — (no usable symbol) | B = ♭7 |
| C | Cm(Δ11) | B = Δ7 |
| B | B7alt. | B = 1 |
| Bb | — (no usable symbol) | B = ♭9 |
| A | Am7(♭6) | B = 9 |
| Ab | AbΔ13(♯9) | B = ♭3/♯9 |
| G | G7sus | B = 3 |
| Gb | GbΔ7(♭9♭5) | B = 11 |
| F | FΔ9 | B = ♭5/♯11 |

### C. “So What” voicings, 4th–4th–3rd (engine-generated drafts — please review)

#### P4/P4/M3 — D G C E (P4/P4/M3)

| Bass | Symbol | top note, root pos. |
|---|---|---|
| E | Em7(♭6) | E = 1 |
| Eb | — (no usable symbol) | E = ♭9 |
| D | D9sus | E = 9 |
| Db | — (no usable symbol) | E = ♭3/♯9 |
| C | CΔ9 | E = 3 |
| B | — (no usable symbol) | E = 11 |
| Bb | Bb6/9 | E = ♭5/♯11 |
| A | Am11 | E = 5 |
| Ab | AbΔ7(♯11) | E = ♭13 |
| G | G7sus | E = 13/6 |
| Gb | Gbm7(♭6) | E = ♭7 |
| F | FΔ13 | E = Δ7 |

#### P4/P4/m3 — E A D F (P4/P4/m3)

| Bass | Symbol | top note, root pos. |
|---|---|---|
| E | E7sus | F = ♭9 |
| Eb | — (no usable symbol) | F = 9 |
| D | — (no usable symbol) | F = ♭3/♯9 |
| Db | — (no usable symbol) | F = 3 |
| C | C6/9 | F = 11 |
| B | Bø11 | F = ♭5/♯11 |
| Bb | BbΔ7(♯11) | F = 5 |
| A | A7sus | F = ♭13 |
| Ab | Ab7(♭9♭5) | F = 13/6 |
| G | G9sus | F = ♭7 |
| Gb | — (no usable symbol) | F = Δ7 |
| F | FΔ13 | F = 1 |

#### P4/TT/m3 — C F B D (P4/TT/m3)

| Bass | Symbol | top note, root pos. |
|---|---|---|
| E | Em7(♭6) | D = ♭7 |
| Eb | EbΔ7(♯5) | D = Δ7 |
| D | Dm13 | D = 1 |
| Db | — (no usable symbol) | D = ♭9 |
| C | Cm(Δ11) | D = 9 |
| B | B7alt. | D = ♭3/♯9 |
| Bb | — (no usable symbol) | D = 3 |
| A | Am9(♭6) | D = 11 |
| Ab | AbΔ13(♯9) | D = ♭5/♯11 |
| G | G7sus | D = 5 |
| Gb | GbΔ7(♭5sus4) | D = ♭13 |
| F | FΔ7(♯11) | D = 13/6 |

#### TT/P4/m3 — F B E G (TT/P4/m3)

| Bass | Symbol | top note, root pos. |
|---|---|---|
| E | — (no usable symbol) | G = ♭3/♯9 |
| Eb | — (no usable symbol) | G = 3 |
| D | Dm6/9 | G = 11 |
| Db | Db7alt. | G = ♭5/♯11 |
| C | CΔ7(sus4) | G = 5 |
| B | Bø11 | G = ♭13 |
| Bb | Bb7(♭9♯11) | G = 13/6 |
| A | Am7(♭6) | G = ♭7 |
| Ab | Abm(Δ7) | G = Δ7 |
| G | G13 | G = 1 |
| Gb | — (no usable symbol) | G = ♭9 |
| F | FΔ7(♯11) | G = 9 |
## Appendix C — reference implementation

`engine.py` (scale stacking, placement, inversion) and `symbols.py` (labeling rules + the 36-symbol test) are attached alongside this file. `python3 symbols.py` prints the mismatch count against Ex. 5/10/11; the JS port should carry the same fixture.
