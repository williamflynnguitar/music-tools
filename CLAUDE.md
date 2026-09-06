# Music practice tools

Small, self-contained browser tools for jazz practice and teaching. Built by
William, a jazz guitarist and educator. Primary users are me and my students.

## Apps

- `two-and-four/` — metronome (beats 2 and 4, dropout modes)
- `fretboard/` — renderer + major-scale fingering data (JGTH p. 7)
- `scales-deck/` — Scale Practice 101 walkthrough (pp. 61–64)
- `arpeggios-deck/` — Arpeggio Practice walkthrough (pp. 76–78, shapes pp. 25–36)
- `chartwright/` — chord diagram generator (planned)

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
shapes; major, dorian and mixolydian so far) is duplicated in fretboard,
scales-deck and arpeggios-deck between `===== shared scale data =====` markers.
Keep the three copies byte-identical — `SHAPES` and `MAJOR` are aliases into
`SCALES.major` for older code. Factoring the renderer and data into a shared
file is the next structural change; the "no build step" rule can be kept with
a concatenation script or by inlining at commit time.

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
