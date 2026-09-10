# Composition Assignments

Stand-alone app (not handbook-tied): a page of composition assignments for
William's composition students. Six sections of prompt cards; most cards are
prompt-only, four carry an inline seed-material tool (Row Builder, Pentatonic
Lab, Alphabet Mapper, Motif Displacer) and the Groove card embeds a Spotify
playlist. No melody/chord/score entry in this version — the writing happens
on paper. Build brief: `BRIEF.md` in this folder.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage APIs (all state in memory). Root `CLAUDE.md` conventions apply,
including the lookahead scheduler (25 ms / 130 ms) for everything that keeps
time and `ctx.resume()` + a silent-buffer unlock on the first tap.

## Structure

- Header: sharps/flats toggle (applies to pitch-class spelling everywhere),
  shared tempo, master play/stop. Master play runs the open tool's primary
  playback; Space toggles it. One tool open at a time — tool panels are
  singletons moved under whichever card opened them, and opening one stops
  playback and collapses the rest.
- Assignment prompts are William's copy, verbatim, in the section order of the
  brief. The `(tool: …)` markers from the brief are rendered as the expand
  control's label, not as prompt text.
- Engine is pure functions in the first `<script>` block (spelling, mappings,
  matrix, pentatonics, motif rhythm). It was developed against a headless
  test harness; if it changes, re-run the simulation (extract the block
  between `/* ===== engine:` and `</script>`, concat a test body, `node`).
- Engraving reuses the Line Ladder glyph outlines (`NOTE_DEFS`) and units
  (1 staff space = 1): `pitchStaff` (stemless noteheads, treble, per-note
  accidentals, optional labels under notes), `rootChart` (12-bar slash
  chart), `rhythmLine` (one-bar single-line percussion staff: beams, flags,
  dots, ties, 16th secondary beams with stubs, hanging wrap tie).

## Decisions taken where the brief left room (flag to William)

- **Digit spelling comes from the key, not the toggle.** Degrees of the
  chosen key spell diatonically (degree 3 of E is G♯ even in flats mode;
  degree 4 of G♭ is C♭). The header toggle governs pitch-class spelling
  (rows, pentatonics, edited letter mappings). The brief's "applies
  everywhere" read literally would misspell scale degrees.
- **Digits 8/9 escape the C4–B4 octave.** "Degree 1/2 up an octave" places
  them C5–B5; the one-octave rule holds for letters and plain degrees.
- **Accidental rule on the unmeasured pitch staffs**: altered notes always
  carry their accidental; a natural sign appears only when the same
  letter+octave was altered earlier in the line.
- **Pentatonic staffs show six noteheads** (home … home an octave up) so the
  five-interval pattern including the wrap is visible on the staff.
- **Pattern-name collisions print both names**: blues major and ritusen share
  `2 3 2 2 3`, so that rotation reads "blues major / ritusen". `PENTA_LIB`
  is the data table to edit.
- **Motif rotation labels**: `+n♪` on the eighth grid per the brief; the
  sixteenth grid uses `+n/16` because the Unicode sixteenth-note glyph is
  unreliable on phones.
- **Notation rules beyond the brief's 4/4 line** (beam from 1 and 3, nothing
  crossing beat 3, rests to the beat, no dotted rests):
  - 4/4 allows offbeat quarters and offbeat dotted quarters within each half
    of the bar; a whole-bar attack is a whole note.
  - 3/4 is conservative: no offbeat quarters (they render as tied eighths
    across the beat), dotted quarters only at 0 and the and-of-2 (the
    hemiola positions), halves on beats 1–2, no half rests, eighths beamed
    in pairs per beat.
  - 5/4 is 3+2: nothing crosses the seam after beat 3; the 3-group follows
    the 3/4 rules, the 2-group the 4/4 half-bar rules and beams its eighths
    as a four. A whole-bar attack is 𝅗𝅥. tied to 𝅗𝅥.
  - Sixteenth grids scale the same rules down one level (beat ≈ half-bar,
    beam per beat with secondary beams, dotted eighths allowed on the first
    two sixteenths of a beat).
  - Rotation staffs carry no time signature — the meter selector and entry
    grid establish it.
- **Playback registers**: rows and pentatonics play within one octave from
  their first note (matching the staff); pentatonic drone is the home note
  an octave below; motif attacks are a band-passed noise burst.
- Matrix labels: standard four-sided layout (P left, R right, I top, RI
  bottom), P0 = the row as entered, main diagonal is constant and tinted.
  Clicking any label selects and plays that form; the root-chart view and
  "Copy form" follow the selection.
- **Tool cards are whole-card tap targets** (William's 2026-09-09 report:
  the first cut's only control was the small chevron, and prompt cards wear
  the family's clickable-card look — "none of this is clickable"). Tool
  cards carry a brass left rule, hover, and pointer; prompt-only cards stay
  plain and static per the brief. Clicks inside an open tool never collapse
  it — the card listener checks `composedPath()`, not `closest()`, because
  tool controls re-render their own subtree and detach the click target
  before the bubbling listener runs.

## Open items

- **Playlist track list is a placeholder.** Playlist
  `4DdYDtOf8CMNhsM46R8nwg` is not publicly readable (embed and oEmbed both
  404 anonymously), so the thirteen tunes could not be pulled. The card
  ships the embed (src set only when the card opens, so offline loads stay
  quiet) plus a visible pending note; paste the artist – title list into
  `#trackList` and delete the note. If the playlist is private, making it
  public is also what the students' embed needs.
- Open decisions 1–3 in the brief (alphabet default, digit default, sharps
  default) are implemented as written; William to confirm or correct. Pat
  Martino's actual mapping, if he supplies it, is a `LETTER_DEFAULT` edit.

## Deferred (from the brief — do not build until asked)

- Melody and chord entry in the app, with per-assignment lint (strict/flag)
  and per-note chord-tone readout
- Reharm ladder tool with the four melodies notated and a chord-tone lookup
- Form builder (32-bar modulations, odd phrases, harmonic-rhythm ruler)
- Submission export (seed material as PDF alongside the student's score)
- Groove capture-and-mutate tool
- Pat Martino's exact alphabet mapping if William supplies it
