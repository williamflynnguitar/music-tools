# Line Ladder — Concept Pack 2 Build Brief

Drafted Sept 19, 2026. For Claude Code, working in `line-ladder/`.

## Purpose

Line Ladder's registry holds nine concepts, and eight of them start on the root. This pack adds vocabulary from William's 2014 text, *Introduction to Jazz Guitar*: the 1-2-3-5 placements and permutations (p. 59), Mike Steinel's "Three Ways In, Two Ways Out" (Appendix E, pp. 84–85), and the four components of Stan Smith's Scale/Arpeggio Routine (Appendix F, p. 86).

The registry rule stands: a concept is a data entry. Four of the things this pack needs cannot be expressed in the current schema, so the brief adds four small schema features to the engine first. Each one is generic. None of them names a concept.

## Source files

Hand these along with the brief:

- **FlynnIntroToJazzGuitar.pdf**, PDF pages 67–68 (book pp. 58–59), 93–94 (pp. 84–85), 95 (p. 86). Rasterize and read the notation directly. Every degree string below was transcribed from these pages and should be re-verified against them before it ships.
- `line-ladder/CLAUDE.md`, `concepts/core.js`, `concepts/digital.js`, `check.js`.

## Decisions already made (change any of these before building)

**D1. Placements obey the chord-scale rulings.** "1-2-3-5 on the 9th of maj7" needs a ♯11, so it fires on a maj7 annotated `@IV` and stays silent on one annotated `@I`. The alternative is letting a placement override the ruled chord scale, which would need new spelling logic and would put notes on the page that contradict `annotations-worksheet.md`. Strict is the v1 behavior. Consequences William should know about:

- "5th of tonic minor" fires only where the tonic is annotated melodic (`@i/Cmel`, as in Solar). The cycle presets rule m6 as harmonic minor, so it stays silent there.
- "♭5 of half-diminished" fires only on a Locrian ø (vii of a major key). A ii of minor draws harmonic minor from its 2nd degree and fails the check.
- "9th of dominant" and both altered-dominant rows fire only on melodic-minor annotations (`@iv/…mel`, `@vii/…mel`).

An "imposed" mode that ignores the rulings is logged under Deferred.

**D2. Ways use the `eighths-hold` template.** On a 2-beat chord a Way is four eighths, exactly as printed. On a 4-beat chord the fourth note holds through beats 3–4 and then resolves. No new rhythm template is needed. Placing the Way in the last two beats of a 4-beat chord would need a new template and is deferred.

**D3. Ways Out fire on any dominant whose next chord is a fourth up,** whatever that chord's quality. Rung 4 already treats those seams as 7→3 sites. Ways In are narrower: a m7 whose next chord is a dominant a fourth up, which is the only case the appendix shows.

**D4. Permutations and placements run 2–4 beats.** `digital-1235` in `core.js` stays at `maxBeats: 2` with the `eighths` template, because the Drill fallback order depends on it. The new entries use `eighths-hold` with `minBeats: 2, maxBeats: 4`, so they fire on the 4-beat chords of the ii–V–I cycles. On a 2-beat chord the two templates produce the same four eighths.

**D5. The assembled Stan Smith routine is not in this pack.** The four components ship as separate concepts. See Part D.

## Part A — Engine changes

Make these first, run `node check.js`, and confirm the existing suite still passes before adding any data.

### A1. Degrees at or below zero

`degBase` uses `%`, which goes negative in JavaScript. Replace it with a floor-mod so that degree 0 is the 7th below degree 1, −1 the 6th below, and so on:

```js
const degBase = d => ((((d-1) % 7) + 7) % 7) + 1;
```

`degOctv` already floors correctly. Descending shapes such as 5-3-1-7 are written `[5,3,1,0]`.

### A2. `fixed: true`

A concept marked `fixed` is never rotated. Rung 2 and rung 4 re-anchor its octave only, down the same path endpoint concepts already take. The order of notes is the identity of a permutation and of a Way, so rotation would turn one concept into another.

### A3. `applies.rows` (realized-tones guard)

Optional array. Each row is `{ qualities: [...], offsets: [...], label: "5-6-7-9" }`. `appliesTo` realizes the concept's unrotated degrees against the segment, reduces the semitone offsets from the chord root mod 12, and requires one row to match both the segment's quality and that offset list in order. When `rows` is present it replaces `applies.qualities`.

This is what lets one data entry cover several rows of the p. 59 table while refusing every case the table does not list.

### A4. `lands` and `applies.next`

- `applies.next: { motion: 5, qualities?: [...] }` — the concept applies only when a following segment exists, its root is `motion` semitones above this one, and (if given) its quality is listed. `appliesTo` gains the next segment as a third argument. Every caller passes it.
- `lands: 3 | 5` — with rung 4 on, `seamPass` treats the seam after this segment the way it treats a dominant seam: the next segment starts on degree `lands`, in the octave nearest this segment's last sounding note. It uses the existing mechanisms to get there (rotation, `startDeg` for runs, or nothing if the next concept already starts there). If the next concept is `fixed` and starts elsewhere, the seam is left alone and no mark is stamped.
- The step that re-rotates a dominant to end on its ♭7 is skipped for `fixed` concepts.
- Marks: `7→3` when `lands` is 3, `→5` when it is 5.
- With rung 4 off, `lands` does nothing. All rungs off still means raw output.

## Part B — 1-2-3-5 placements and permutations

New file `concepts/cells.js`, loaded after `digital.js`. Group name: **1-2-3-5 cells**.

### B1. Placements (four entries)

All four: `against: "scale"`, `rhythm: "eighths-hold"`, `minBeats: 2, maxBeats: 4`, not `fixed` (rung 2 may rotate them, as it does `digital-1235`). Source string: `Introduction to Jazz Guitar (2014), p. 59`.

| id | name | short | degrees |
|---|---|---|---|
| `cell-from-5` | 1-2-3-5 from the 5th | `1235/5` | `[5,6,7,9]` |
| `cell-from-9` | 1-2-3-5 from the 9th | `1235/9` | `[2,3,4,6]` |
| `cell-from-3` | 1-2-3-5 from the 3rd | `1235/3` | `[3,4,5,7]` |
| `cell-from-6` | 1-2-3-5 from the 6th | `1235/6` | `[6,7,8,10]` |

Rows, one per line of the book's table:

| entry | qualities | offsets | label | book row |
|---|---|---|---|---|
| from-5 | maj7, 6, mMaj7, m6 | 7 9 11 2 | 5-6-7-9 | 5th of maj7 · 5th of tonic minor |
| from-5 | m7, 7 | 7 9 10 2 | 5-6-♭7-9 | 5th of min7 · 5th of dominant 7 |
| from-5 | m7b5, 7 | 6 8 10 1 | ♭5-♯5-♭7-♭9 | ♭5 of half-diminished · ♭5 of altered dominant |
| from-9 | maj7, 6, 7 | 2 4 6 9 | 9-3-♯11-13 | 9th of maj7 · 9th of dominant 7 |
| from-9 | 7 | 1 3 4 8 | ♭9-♯9-3-♯5 | ♭9 of altered dominant |
| from-3 | m7 | 3 5 7 10 | ♭3-4-5-♭7 | ♭3 of min7 |
| from-3 | maj7, 6 | 4 6 7 11 | 3-♯11-5-7 | 3rd of maj7 |
| from-3 | m7b5 | 3 5 6 10 | ♭3-4-♭5-♭7 | ♭3 of half-diminished |
| from-6 | maj7, 6 | 9 11 0 4 | 6-7-R-3 | 6th of maj7 |

The table's "root of" rows are already covered by `digital-1235`.

**For William:** the book's major column prints "♭5 of half-diminished (♭3-4-♭5-♭7)". A major cell on the ♭5 of Bø is F-G-A-C, which is ♭5-♭6-♭7-♭9. The parenthetical repeats the minor column's label. This brief uses the corrected tones.

The matched row's `label` should appear in the concept's info line when it fires, since the same entry reads differently over different chords.

### B2. Permutations (23 entries, generated)

Generate them in `cells.js` with a loop over the permutations of `[1,2,3,5]`, skipping 1-2-3-5 itself. The loop produces plain objects pushed into `LL_CONCEPTS`, so the pack is still data.

- `id: "perm-" + digits` (e.g. `perm-2513`), `name: "2-5-1-3"`, `short: "2513"`
- `against: "scale"`, `rhythm: "eighths-hold"`, `fixed: true`
- `applies: { qualities: [same nine as digital-1235], minBeats: 2, maxBeats: 4 }`
- Order them as the book lists them: 1-2-5-3, 1-3-2-5, 1-3-5-2, 1-5-2-3, 1-5-3-2, 2-1-5-3, 2-1-3-5, 2-3-1-5, 2-3-5-1, 2-5-1-3, 2-5-3-1, 3-1-2-5, 3-1-5-2, 3-2-1-5, 3-2-5-1, 3-5-1-2, 3-5-2-1, 5-1-2-3, 5-1-3-2, 5-2-1-3, 5-2-3-1, 5-3-1-2, 5-3-2-1.

Degrees stay inside one octave (5 above 1), so 5-1-2-3 opens with a falling fifth.

## Part C — Three Ways In, Two Ways Out

New file `concepts/ways.js`. Group name: **Ways in and out**. Source string: `Mike Steinel, "Three Ways In, Two Ways Out" — Introduction to Jazz Guitar (2014), pp. 84–85`.

All entries: `against: "chord"`, `rhythm: "eighths-hold"`, `fixed: true`, `minBeats: 2, maxBeats: 4`.

Transcribed from Appendix E (G-7 → C7 → FΔ7):

| id | name | short | degrees | printed | applies | lands |
|---|---|---|---|---|---|---|
| `way-in-1` | Way in 1 | `in1` | `[1,3,5,7]` | G B♭ D F → E | m7, next 7/sus7 a 4th up | 3 |
| `way-in-2` | Way in 2 | `in2` | `[5,3,1,0]` | D B♭ G F → E | same | 3 |
| `way-in-3` | Way in 3 | `in3` | `[3,2,1,0]` | B♭ A G F → E | same | 3 |
| `way-out-1` | Way out 1 | `out1` | `[3,2,1,0]` | E D C B♭ → A | 7, next any a 4th up | 3 |
| `way-out-2` | Way out 2 | `out2` | `[3,5,7,9]` | E G B♭ D → C | same | 5 |
| `way-in-1-8va` | Way in 1, displaced | `in1↕` | `[8,3,5,7]` | G(8va) B♭ D F → E | as way-in-1 | 3 |
| `way-out-2-8va` | Way out 2, displaced | `out2↕` | `[10,5,7,9]` | E(8va) G B♭ D → C | as way-out-2 | 5 |

Practice suggestion 4 (♭9 on the Ways Out) needs no entries. Degree 2 indexes the collection, so on a `7b9` chord `way-out-1` reads 3-♭9-R-♭7 and `way-out-2` reads 3-5-♭7-♭9, which is what p. 85 prints.

In Drill mode a Way In fires on the ii chords and the rest of the progression falls back in registry order, which is the existing behavior. Mixed mode with all five base Ways checked produces the combinations shown under practice suggestion 2.

## Part D — Scale/Arpeggio Routine components

Same file as Part C or its own `concepts/routine.js`; Claude Code's call. Group name: **Scale/arpeggio routine**. Source string: `Stan Smith's Scale/Arpeggio Routine — Introduction to Jazz Guitar (2014), p. 86`.

All entries: `rhythm: "eighths"`, `fixed: true`, qualities = every quality except `dim7`. The degree strings fill their segments exactly, so the `eighths` template's descending fill never runs.

| id | name | short | against | beats (min = max) | degrees |
|---|---|---|---|---|---|
| `routine-1` | Scale to the 5th | `→5` | scale | 4 | `[1,2,3,4,5,4,3,2]` |
| `routine-2` | Scale to the 9th | `→9` | scale | 8 | `[1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2]` |
| `routine-3` | Triad arpeggio | `tri` | chord | 4 | `[1,3,5,3,1,3,5,3]` |
| `routine-4` | Arpeggio to the 9th | `arp9` | chord | 4 | `[1,3,5,7,9,7,5,3]` |

On the ii–V–I cycle presets (4, 4, 8 beats) a Mixed draw from these four puts the scale to the 9th on every I chord.

**For William:** the text on p. 86 says components 1 and 2 are repeated and 3 and 4 played once. The notation underneath repeats 1 and 3 and plays 2 and 4 once, and it runs seven bars with the landing note against the text's "6-bar phrase." The assembled routine should follow whichever is right, so it waits for a ruling.

The assembled routine is deferred for a second reason. A static tonality of seven bars is one 28-beat segment, and the engine has no way to assign different concepts to the bars inside a segment.

## Part E — UI

The checklist grows from 9 entries to about 47.

- Each group becomes collapsible. "1-2-3-5 cells" opens with the four placements visible and the 23 permutations folded under a sub-heading.
- Each group heading gets all / none.
- The Drill concept picker groups the same way.
- No user-facing text uses "card" or "deck."
- The small `source` info line stays the only place a citation appears.

## Acceptance checklist

Add to `check.js`. Load the new packs in the harness alongside `core.js` and `digital.js`.

1. The existing suite passes unchanged after Part A, before any new data loads.
2. Check #1 (every preset × drill concept × rung set builds, every bar sums to 8 eighths) runs over every new concept id.
3. Check #2 is restated: with all rungs off, each segment's first note is its concept's `degrees[0]` relative to the chord root in the reference octave. (The old wording, "starts on degree 1," was already untrue for `arp-3579`.)
4. Placement rows, all rungs off, typed progressions:
   - `Cmaj7@I/C` from-5 → G A B D. from-9 does not apply. from-3 does not apply. from-6 → A B C E.
   - `Fmaj7@IV/C` from-9 → G A B D. from-3 → A B C E.
   - `Dm7@ii/C` from-5 → A B C E. from-3 → F G A C.
   - `Em7@iii/C` from-5 does not apply.
   - `G7@V/C` from-5 → D E F A. from-9 does not apply.
   - `F7@iv/Cmel` from-9 → G A B D.
   - `G7#5@vii/Abmel` from-5 → D♭ E♭ F A♭. from-9 → A♭ B♭ C♭ E♭ (spelled per the app's rules, no doubles).
   - `Cmmaj7@i/Cmel` from-5 → G A B D. `Cm6@i/Cm` from-5 does not apply.
   - `Bm7b5@vii/C` from-5 → F G A C. from-3 → D E F A. `Dm7b5@ii/Cm` from-5 does not apply; from-3 → F G A♭ C.
5. All 23 permutations exist, each realizes its digits in order on `Dm7@ii/C` and `Cmaj7@I/C`, and turning rung 2 on changes octave only.
6. Ways, on `Gm7@ii/F C7@V/F | Fmaj7@I/F | Fmaj7@I/F` with rung 4 on: each Way In produces its printed four notes and C7 starts on E; `way-out-1` ends on B♭ and Fmaj7 starts on A; `way-out-2` ends on D and Fmaj7 starts on C with the `→5` mark.
7. `way-out-1` on `C7b9@v/Fm` reads E D♭ C B♭.
8. A Way In does not apply to the last chord of a progression, to a m7 whose next root is not a fourth up, or to a m7 followed by a non-dominant.
9. With rung 4 off, a Way leaves the next segment untouched.
10. Routine components apply only at their exact beat lengths and realize their degree strings with no fill.
11. No double accidentals anywhere, as the existing check asserts.

## CLAUDE.md updates

- Schema block: add `fixed`, `applies.rows`, `applies.next`, `lands`, and the note that degrees may be zero or negative.
- Rung 2 and rung 4 descriptions: `fixed` concepts re-anchor only; `lands` generalizes the seam; the `→5` mark.
- Files line: list the new packs and their load order. Registry order still decides Drill fallback, and the new packs load last so the fallback does not change.
- Record D1–D5 and the two questions for William.

## Deferred

- Imposed placements that override the chord-scale ruling (D1).
- A late-placement rhythm template that puts a Way in the last two beats of a 4-beat chord (D2).
- Two 1-2-3-5 cells paired across a 4-beat chord, which p. 58 describes.
- The assembled seven-bar routine, pending William's ruling and a way to split a long static segment.
- Student-authored Ways (practice suggestion 5). This belongs with the lick journal.
