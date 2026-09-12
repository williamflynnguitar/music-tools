# Music practice tools

Small, self-contained browser tools for jazz practice and teaching. Built by
William, a jazz guitarist and educator. Primary users are me and my students.

## Apps

- `two-and-four/` — metronome (beats 2 and 4, dropout modes; Training Wheels
  rung ladder for students who phase-flip)
- `fretboard/` — renderer + major-scale fingering data (JGTH p. 7)
- `scales-deck/` — Scale Practice 101 walkthrough (pp. 61–64)
- `arpeggios-deck/` — Arpeggio Practice walkthrough (pp. 76–78, shapes pp. 25–36)
- `line-ladder/` — stand-alone improvisation line generator, instrument-neutral
  (concept registry + smoothing ladder; handbook cited per concept only)
- `enclosures/` — **built** (Sep 2026). Enclosure vocabulary, from William's
  own Enclosures 101 / Access Points / workbook PDFs rather than the handbook.
  Rule-driven: a pattern catalogue over the approach tones `S S2 L l U u T2`,
  keyed by goal-note type, generates every enclosure in any key. The catalogue
  was derived from the source notation and round-trips against all 85 printed
  enclosures; the two scale exercises regenerate their sources note for note.
  Sections 7–9 are William's composed lines, transcribed from the vector PDFs,
  with a Concert/B♭/E♭ part selector — transposition is computed, so the three
  engraved parts are not needed. No key signature in those sections, matching
  the workbook, which writes everything with accidentals.
  Live SVG engraver adapted from line-ladder — no pre-rendered notation
- `shell-builder/` — Shell Voicings 101 (pp. 45–51): build and mobilize shells,
  name the result, comp through changes
- `inversion-drill/` — drop-2/drop-3 inversions (pp. 52–59, key study p. 82),
  drilled up the neck and through changes
- `voice-leading/` — nearest-inversion trainer (p. 79): show / reveal / choose
  through the practice progressions
- `quartal-voicings/` — **built** (Sep 2026). Quartal Harmony retroactive
  chapter: catalogue, modes, the Ex. 5–14 chord-symbol method, ii–V–I planing,
  Solar and Stella. Brief + spec in `briefs/`; pre-rendered cells in its own
  `notation/`
- `triad-voicings/` — closed/open triads and the Ex. 8 key study (pp. 39–43, 81)
- `comping-rhythms/` — Charleston swing comping rhythms (pp. 83–84), five families
- `box-buddy/` — chord-box handout generator for band directors (teacher tool,
  deliberately unlinked from the spine)
- `composition-assignments/` — prompt cards + inline seed-material tools for
  composition students (stand-alone)
- `stageplot/` — **built** (Sep 2026, v2). Stage plots for any act loading into
  Somewhere Works: venue config, an instrument library, instrumentation
  templates, an auto-layout engine, monitors, derived input list, changeover
  sheets. Positions are primary and names optional; the fall 2026 WSU rosters
  live in gitignored files on William's machine, not in the code or the repo.
  Briefs in `briefs/`. Deliberately unlisted from the landing page and the
  spine, like Box Buddy. Not a practice tool — the deliverable is a printed
  page for the sound tech, so print is the primary surface
- `chartwright/` — chord-chart editor (lyrics with chords over syllables).
  Predates the no-storage rule: it keeps charts in try/catch-wrapped
  localStorage, and carries dormant Claude-artifact save code from its
  original home. Both are deliberate exceptions until it gets a rework.

## Who these are for

Students opening a link on a phone in a practice room, often with no wifi,
often mid-session with an instrument in hand. Design for that: large targets,
readable at arm's length, no sign-up, no loading spinner, works on first tap.

## Hard constraints

- **One self-contained HTML file per tool.** All CSS and JS inline. No build
  step, no bundler, no npm dependencies, no framework. A tool must work when
  opened as a local file with no server.
- **No browser storage APIs** (`localStorage`, `sessionStorage`, IndexedDB).
  They fail in some embedded preview contexts. Keep state in memory.
- **External libraries only from a CDN**, and only when there is no reasonable
  alternative. Default to writing it by hand.
- Each tool lives in its own lowercase-hyphenated folder with `index.html` as
  the entry point.

## Shared data

The `SCALES` registry (per-scale steps, degree labels, applications, fingering
shapes; major, dorian, mixolydian, harmonic minor, phrygian dominant, melodic
minor, the four bebop scales and half-whole diminished so far) is duplicated in fretboard,
scales-deck and arpeggios-deck between `===== shared scale data =====` markers.
(line-ladder no longer carries it — the rebuilt engine is pitch-only and keeps
just the spelling recipes.)
Keep the copies byte-identical — `SHAPES` and `MAJOR` are aliases into
`SCALES.major` for older code.

Pitch class 6 is **F#, never Gb**, in every root or key ring a student picks from
(Sep 2026), and in the engraved cell names (`…-Fs.svg`). The flat spelling tables
still hold Gb, because it is still the 4th of Db and the b3 of Eb minor: where a
tool derives a parent key from a pitch class, a flat key borrows Gb's spelling and
F# borrows its own sharps. Factoring the renderer and data into a shared
file is the next structural change; the "no build step" rule can be kept with
a concatenation script or by inlining at commit time.

## Stretch warning

Any tool that draws a chord voicing marks the ones that ask for a wide hand.
The measurement is shared between `===== stretch =====` markers in
shell-builder, inversion-drill, voice-leading, triad-voicings,
quartal-voicings and box-buddy — keep the copies byte-identical and run
`node scripts/stretch-sync.js` (canonical page: shell-builder), with
`--check` reporting drift, a voicing tool that carries no block, and a
carrier that never draws the mark.

The unit is **millimetres, not frets**. Fret spacing shrinks going up the
neck, so counting frets measures the wrong thing: a six-fret grip at the 12th
fret is an 81mm reach while a four-fret grip at the nut is 97mm, which makes
the "narrower" shape the harder one. Threshold 100mm, William's ruling on
2026-09-12. Open strings need no finger and are not part of the reach; nor is
Shell Builder's ghost root, which shows where the root would be.

It warns only — nothing a tool already refused became reachable. Each tool
draws it in its own idiom but with the same word, so a student meets the same
signal everywhere: a bracket in the right-hand gutter spanning the actual
reach on tools that draw a fret box, plus the word "stretch" when the diagram
is large enough to carry it, and a chip beside the chord tag in Voice Leading,
which draws staff and TAB instead. Box Buddy's is drawn rather than coloured
and labelled S, because its deliverable is a photocopied handout.

## No build step means nothing checks the page

`node scripts/syntax-check.js` parses every page's inline scripts. It exists
because a copy edit put an apostrophe inside a single-quoted string literal
and shipped Box Buddy completely dead; the per-tool check scripts all passed,
because they test musical data rather than whether the page parses. Run it
after any edit to prose that lives inside a JS string.

## Spine menu

Every tool page opens with a slim right-aligned "☰ tools" chip — in normal flow at the top of the page, never fixed, so it cannot cover app headers — opening a menu of
the landing page's spine: a home header row, then the handbook group
(Scales / Arpeggios / Chord voicings sub-sections, page refs mirroring the
index cards' source labels) and the stand-alone group, current page marked
with a brass bar and brass text. It is one self-contained block (own `sp-` classes, hardcoded family
palette, explicit `index.html` hrefs so file:// works) duplicated between
`===== spine menu =====` markers at the top of each tool's body —
keep the copies byte-identical, like the `SCALES` block. The landing page
itself doesn't carry it; authoring pages (`edit.html`) stay unlinked.

Don't hand-edit the copies: edit the canonical page (`fretboard/index.html`)
and run `node scripts/spine-sync.js`, which copies the block into every other
carrier. `node scripts/spine-sync.js --check` reports drift and also catches a
tool that is on the landing page but not in the spine, or the reverse. The
block hides itself in print — tools whose deliverable is paper (Box Buddy,
Chartwright, Stage Plot) were printing the chip before Sep 2026.

## Audio

Anything that keeps time uses the **Web Audio lookahead scheduler** pattern: a
coarse `setInterval` (~25ms) that schedules the next ~120ms of events onto
`AudioContext.currentTime`. Never drive audio timing from `setInterval`,
`setTimeout`, or `requestAnimationFrame` directly — it drifts, and drift is
disqualifying in a practice tool.

Visual updates read from the audio clock, never the reverse. The display can
stutter; the click cannot move.

Audio requires a user gesture to start. Always `ctx.resume()` on the first tap.

## Musical correctness

These are teaching tools, so the musical model has to be right, not just
plausible. Bar and phrase structure should be explicit in the code. When a
design choice affects what a student learns, say so rather than picking
silently — e.g. distributing silent bars evenly through a phrase trains
something different from one long silent block.

Inversions are named by the note actually in the bass — root position has the
root lowest, 1st inversion the 3rd, and so on — never by the close voicing a
drop voicing was derived from. Drop-2 moves the 2nd-from-top voice down an
octave and drop-3 the 3rd-from-top, so the rotation has to be shifted back
before the name is applied (inversion-drill shipped the unshifted name until
Sep 2026, calling a 5-in-the-bass drop-2 "root position"). Where an extension
has taken the bass voice (9 for R, #11 for 5) there is no inversion to name:
say what is in the bass instead.

Assume jazz defaults unless told otherwise: swing feel, backbeat on 2 and 4,
8-bar phrases with 12 available for blues.

Vocabulary in UI and code: bar (not measure), phrase, chorus, head, changes,
tempo in BPM.

## Visual language

Shared across tools so they read as a family:

- Deep petrol/ink ground, bone text, brass accent. Not pure black or white.
- Monospace for data, labels, and anything numeric. Tabular figures for
  numbers that change in place.
- Notation-derived visuals where they fit — rhythm slashes, bar lines,
  chart-like layouts. Prefer these over generic progress bars.
- Restrained motion. Any moving element is a visual time cue, which can
  undermine a tool whose purpose is removing time cues. Make motion optional
  and default it off where that risk exists.

## Fretboard conventions

Strings horizontal, 1st string on top, frets left to right, label centred over
the first fret space. Roots brass, notes bone, computed/extended notes hollow,
alternates dashed. Shape data is always `[string, offset-from-root, finger]`.

## Working style

- Prefer editing an existing tool over rewriting it.
- Verify musical and timing logic by simulating it before shipping — print the
  actual bar-by-bar pattern and read it.
- Flag changes I did not ask for explicitly so I can veto them.
- Commit after each version worth returning to.
