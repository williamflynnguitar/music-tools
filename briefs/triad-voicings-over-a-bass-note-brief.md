# Triad Voicings — "Over a Bass Note" Build Brief

Drafted Sept 19, 2026. For Claude Code, working in `triad-voicings/`.

## Purpose

Triad Voicings teaches the shapes and the Ex. 8 key study. It has no answer to the question a student asks next, which is what a triad is for on a jazz gig. William's 2014 text, *Introduction to Jazz Guitar*, answers it on pp. 25–27: a 7th chord is a triad over a bass note (TBN), the bassist supplies the bass note, and so a triad placed at the right interval above the root sounds a 7th-chord color. Ex. 20–21 put all twelve bass notes under a C major triad and name each result.

This brief adds that material to the existing app as a fourth tab. JGTH 3rd ed. has no equivalent passage (checked against the project PDF), so the 2014 book is the source, and the tab cites it.

## Source files

- **FlynnIntroToJazzGuitar.pdf**, PDF pages 34–36 (book pp. 25–27): Ex. 19, 20, 21 and the four practice suggestions. Rasterize p. 27 at 220 dpi or better and re-read Ex. 21 before building; the transcription below came from a raster and must be confirmed cell by cell.
- `triad-voicings/CLAUDE.md`, `index.html`, `check.js`.

## Do not port the quartal labeler

`briefs/symbols.py` names a pitch set over a bass, and the quartal app's Function tab is built on it, so reusing it looks like the obvious move. It was run against Ex. 21 while drafting this brief and agreed with the book on 3 of 12 cells. It returns "—" for the C/G cell the book calls G13(sus4), and "6" for the cell the book calls E♭13(♭9). Its rules were fitted to William's quartal tables and encode his judgment about fourth stacks.

The TBN data is a **lookup table of William's rulings**: 4 triad qualities × 12 intervals. Nothing is computed except transposition.

## The table

Indexed by the interval of the **triad's root above the bass note**, which is how p. 27 tells the student to think ("a major triad built a ♭6 above a given bass note results in X-7(♭6)").

### Major triad — from Ex. 21, authoritative

| triad root is… above the bass | printed (C triad) | symbol, X = bass |
|---|---|---|
| R | CΔ7 | XΔ7 — see question 1 |
| ♭2 | B7(♭13 ♭9 sus4) | X7(♭9 ♭13 sus4) |
| 2 | B♭Δ9(♯11) and B♭9(♯11) | XΔ9(♯11) · X9(♯11) — two readings, show both |
| ♭3 | A-7 | X-7 |
| 3 | A♭Δ7(♯5) | XΔ7(♯5) |
| 4 | G13(sus4) | X13(sus4) |
| ♭5 | G♭7alt. | X7alt. |
| 5 | FΔ9 | XΔ9 |
| ♭6 | E-7(♭6) | X-7(♭6) |
| 6 | E♭13(♭9) | X13(♭9) |
| ♭7 | D9(sus4) | X9(sus4) |
| 7 | D♭°Δ7 | X°Δ7 |

The book counts "thirteen applications" because the B♭ cell carries two.

### Minor, augmented, diminished — not in the book, William rules them

Practice suggestion 1 on p. 27 tells the student to repeat the process for the other three qualities, and the book prints no tables for them. Content in these apps traces to William's materials, so these 36 cells ship only after he fills them in.

Create `triad-voicings/tbn-worksheet.md` with the grid of Claude's proposals, worked out by naming each triad tone against the bass, as a starting point for William to correct. (The grid itself lives in that worksheet; the brief's draft wrote the diminished 7th as a double flat, which the worksheet writes °7 under the 2026-09-12 rule.)

Build against the major table now. The quality picker shows all four qualities, and the three unruled ones read "not yet written" until their worksheet columns come back. When they do, entering them is a data edit.

### Questions for William

1. Ex. 21 labels the C triad over C as **CΔ7**. A C triad over its own root has no 7th. Keep the printed label, or show plain **X**?
2. The ♭2 cell is printed as a stacked alteration, B7 with ♭13 over ♭9 and then sus4. The app will set it inline. Is `X7(♭9 ♭13 sus4)` the order you want?
3. The three worksheet columns above.

## The tab

Name: **Over a bass note**. It sits after Key study and before Drill. Sub text under the heading cites *Introduction to Jazz Guitar* (2014), pp. 25–27, in the same small style the other tabs use for page references.

### View 1 — One triad, twelve basses

This reproduces Ex. 20–21.

- Pickers: triad root, quality.
- A staff shows the triad as stacked whole notes in the treble, and twelve bass notes below it in the book's order: starting a major third above the triad root and descending by half step (for C: E E♭ D D♭ C B B♭ A A♭ G G♭ F). Above each bass note sits its chord symbol. Use the app's existing live staff renderer (`NOTE_DEFS`); the bass notes need ledger lines down to F3.
- Clicking a cell selects it. The panel below the staff then shows the rule sentence for that cell in William's phrasing ("A major triad built a ♭6 above the bass note gives X-7(♭6)"), and the triad's three closed inversions on the currently selected string set, drawn with the existing `closedAll` and chord-box renderer. The bass note is named next to the boxes and is not fretted.
- An open-rows toggle swaps in the open voicings through `openRow`, which covers practice suggestion 3.

### View 2 — One chord, which triads

The reverse lookup, and the one a student will use at the stand.

- Pickers: chord root (the bass note), then a symbol chosen from the distinct symbols present in the ruled tables.
- Result: every triad that yields that symbol, stated both ways. For G13(sus4): "C major triad, built a 4th above the root."
- The same shape panel as View 1 follows, on the selected set.

### Playback

Reuse the shared lookahead scheduler already in the app. The bass note sounds first and sustains an octave or two below the triad; the triad enters on the next beat. The book asks the student to hear these over a pedal, and hearing the color is the point of the tab. No visual highlight of any kind while audio plays, per the family rule.

### Spelling

- Bass notes in View 1 descend with flats, as printed.
- Triads and symbols transpose by pitch class, and spelling picks whichever side avoids a double accidental. No double sharp or double flat is ever written, matching the suite-wide rule from Line Ladder (Sept 12, 2026).
- Chord symbols use the family's existing formatter: a minus sign for minor, Δ for major 7th, alterations in parentheses.

## Drill

The existing Drill tiers trace to the skills checklist on JGTH pp. 164–167, and TBN material is not on that checklist. The tiers stay untouched. The new tab carries its own small drill with the same two modes the app already has:

- **Reveal** — prompt is a chord symbol with its root ("G13(sus4)"). The student plays a triad, then reveals the answer: triad name, interval rule, box.
- **Choose** — four chord boxes on one string set. Distractors are same-quality triads at other intervals above the same bass, never other bass notes.

Streak in memory only. No storage APIs.

## Phase 2 — Triad with its bass note under the hand

Practice suggestion 4 asks the student to devise grips that include the bass note, for playing without a bassist. Build this after View 1 and View 2 are accepted.

- Closed triads on sets 1-2-3 and 2-3-4 only, with the bass note added on any lower string.
- Enumerate by pitch as `openPlacements` does. Fretted span of 4 or less, open strings free, the bass note below the triad's lowest voice.
- William reviewed the open-triad placements by hand in September and cut 21 of 23 span-4 classes. Expect the same here: generate a numbered review sheet of every grip class before any of them show in the app, and ship only what he keeps.

## Acceptance checklist

Add to `triad-voicings/check.js`.

1. All 12 major cells for a C triad match the Ex. 21 strings above, compared cell by cell against the rasterized page, with the B♭ cell returning both readings.
2. Transposition: F major over G returns G9(sus4). D major over C returns CΔ9(♯11) and C9(♯11). E major over C returns CΔ7(♯5).
3. View 1's bass order for every triad root starts a major third above the root and descends twelve half steps. No cell anywhere spells a double accidental.
4. View 2 is the exact inverse of View 1: for every (bass, symbol) pair it lists, View 1 shows that symbol in that cell. Walk all 12 basses × every symbol.
5. Unruled qualities render the "not yet written" state and appear in no drill prompt.
6. Every box shown in the tab comes from `closedAll` or `openRow` for the selected set. Zero off-set voicings, the same assertion the September audit ran.
7. Choose-mode distractors share the prompt's bass note and triad quality.
8. The existing check suite passes unchanged. Shapes, Key study and Drill are untouched.
9. No user-facing string contains "card" or "deck."

## Housekeeping

- `triad-voicings/CLAUDE.md`: document the tab, the table's indexing convention, the decision not to port `symbols.py` and why, the three questions for William, and Phase 2 under "Next (unbuilt)."
- Root `CLAUDE.md` and `README.md`: extend the triad-voicings line to mention triads over a bass note.
- Landing page and the spine menu: the page reference currently reads "pp. 39–43 · Exploring Triads p. 81." Add the second source in the same line, and add one sentence to the description. Draft for William to edit: "A fourth tab puts any triad over all twelve bass notes and names the chord each one makes."

## Deferred

- The same table treatment for the intervallic voicing on p. 33 (minor 2nd plus perfect 5th over twelve basses, Ex. 29). The quartal versions already exist in the quartal app.
- A Through-changes mode that comps a progression using TBN substitutions. It depends on the Through-changes tab that is already listed as unbuilt.
- Open triads with a fretted bass note.

## Build notes (added by Claude Code, 2026-09-19)

- Ex. 20 is on p. 26 and Ex. 21 at the top of p. 27. All twelve cells (thirteen readings) matched the transcription above at 400 dpi.
- The worksheet grid was moved out of this file into `triad-voicings/tbn-worksheet.md`, the one place William fills it in.
