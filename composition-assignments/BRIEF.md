# Build brief: Composition Assignments

New stand-alone app in `music-tools/`. Not handbook-tied: goes in the plainer stand-alone section of the TOOLS dropdown. Folder `composition-assignments/`, single self-contained `index.html`, no build step, no dependencies, no browser storage APIs. Add a per-app `CLAUDE.md` following the root conventions.

## Purpose

A page of composition assignments for William's composition students. Each assignment is a card with the prompt. Most cards are prompt-only. A few carry a small tool that generates seed material the student then works with on paper or in notation software. The app does not accept melody, chord, or score entry in this version.

## Open decisions (defaults chosen; William to confirm or correct)

1. **Alphabet mapping default.** Default is A–G → A–G, then wrap: H=A, I=B, … N=G, O=A, … U=G, V=A … Z=E. William may substitute Pat Martino's mapping; the mapping editor makes this a data change.
2. **Digit mapping default.** 1–7 → scale degrees 1–7 of a user-chosen key (default C major), 8 → degree 1 up an octave, 9 → degree 2 up an octave, 0 → rest.
3. **Pitch spelling.** Tools default to sharps ascending; a sharps/flats toggle lives in the app header and applies everywhere.

## Page structure

Header: app title, sharps/flats toggle, tempo control (shared by all playback), master play/stop.

Six sections in this order, each a heading followed by cards:

1. Melody
2. Harmony
3. Rhythm / Form
4. Harmony & Melody
5. Arranging
6. Groove

A card shows the assignment prompt (text below, verbatim). Cards with a tool have an expand control that reveals the tool inline under the prompt. Only one tool is open at a time; opening one collapses the others.

## Assignment prompts (verbatim; William owns this copy)

**Melody**
- Contrafact
- Tone row melody *(tool: Row Builder)*
- Melody of only 2 notes per bar
- Pentatonic scale melody
- Invent your own pentatonic scale and compose a tune with it *(tool: Pentatonic Lab)*
- Each four-bar phrase explores an increasingly colorful chord tone
- Cell melody
- Completely diatonic melody over chromatic chords
- Harmonic major melody
- Letters and numbers as pitches: Pat Martino alphabet exercise; map the alphabet to notes and write a melody from a name or phrase; map digits to notes and hear what your phone number, birthday, etc. "sounds like" *(tool: Alphabet Mapper)*

**Harmony**
- Reharm ladder (work through in order): Happy Birthday (target 9ths, 11ths, 13ths) → folk tune → blues → standard
- Tone row as harmonic source: roots, or bass notes *(tool: Row Builder, root-chart view)*
- Compose a tune using only 1 or 2 chord qualities
- Compose a tune in standard 32-bar form using: modulations to ii, iii, IV, vi; backdoor ii–V

**Rhythm / Form**
- Compose a 10-bar blues
- Compose a tune with head changes and blowing changes (write the blowing changes first, then a head that obscures them)
- Compose a tune whose harmonic rhythm contracts or expands
- Compose a tune in odd-length phrases (5- or 7-bar)
- Compose a tune built from one rhythmic motif displaced across the bar *(tool: Motif Displacer)*
- Write the melody as pure rhythm first, add pitches last
- Compose a tune in 3 or 5 that hides its meter

**Harmony & Melody**
- Reharm a tune and write a new melody over it

**Arranging**
- Three-horn tune with harmonies and hits

**Groove** — find a tune with a compelling groove and build your own tune out of it *(tool: Playlist)*

## Tools

### Row Builder (two cards share it)

- Twelve slots. Click a slot to pick a pitch class from a 12-button chooser; a pitch already used elsewhere in the row is disabled in the chooser. **Randomize** fills all twelve. **Clear** empties. Row is complete only when all twelve are filled and distinct.
- Display the row as pitch names (respecting the spelling toggle) and as stemless noteheads on a treble staff, pitches placed within a single octave starting from the first row note.
- **Matrix**: standard 12×12 with P forms as rows and I forms as columns, RI and R read from the reverse. Label each with transposition level (P0, P4, I7, etc.), P0 = the row as entered. Clicking any row or column label plays that form.
- **Playback**: even eighth notes at the header tempo, synthesized voice. Play P0, or the form selected in the matrix. Loop toggle.
- **Root-chart view** (toggle): renders the row (or selected form) as a 12-bar chart, one bar per pitch, pitch shown as a chord-symbol root with the quality left blank, four slashes per bar. This is what the "tone row as harmonic source" card opens to by default; the melody card opens to the staff view. Same state, two views.
- **Copy** button copies the row as a text string (e.g. `C D♭ E …`) and the selected form as text.

### Pentatonic Lab

- Twelve chromatic pitch-class buttons, C at the left. Select exactly five; a sixth selection is ignored until one is deselected. **Random** picks five. **Clear** resets.
- Once five are chosen: show the scale ascending from the lowest selected pitch as noteheads on a treble staff; show the interval pattern in semitones (e.g. `2 2 3 2 3`); show the same scale rotated to start on each of its five members, since the student may hear a different note as home.
- **Name check**: compare the interval pattern (all five rotations) against a small library and print a match or "no named match." Library: major pentatonic (2 2 3 2 3) and its rotations named as modes (minor pentatonic, suspended, blues minor, blues major), hirajoshi (2 1 4 1 4), in (1 4 2 1 4), iwato (1 4 1 4 2), kumoi (2 1 4 2 3), ritusen (2 3 2 2 3). Keep the library as a data table so William can edit names.
- **Playback**: ascending then descending in eighth notes, from the chosen home note. Loop toggle. A **Drone** toggle sustains the home note under playback.

### Alphabet Mapper

- Text input. Letters map to pitches through an editable 26-entry mapping table; digits through a 10-entry table (see open decisions for defaults); everything else is ignored. **Reset mapping** restores defaults.
- Key selector for the digit mapping.
- Output: the resulting pitch sequence as names and as stemless noteheads on a treble staff, all in one octave (C4–B4) since rhythm and register are the student's job. Letters/digits shown under each notehead.
- **Playback**: even quarter notes at the header tempo. Loop toggle.
- **Copy** copies the pitch string as text.

### Motif Displacer

- Meter selector: 4/4 (default), 3/4, 5/4. Grid resolution: eighths (default) or sixteenths.
- One bar of cells (8, 6, or 10 for eighths; double for sixteenths). Click to toggle an attack. **Random** fills a pattern with 3–5 attacks. **Clear** resets.
- Below the entry bar, render every rotation of the pattern (one per grid cell) as a one-bar rhythm on a single-line percussion staff, labelled by displacement (`+0`, `+1♪`, `+2♪` …). Notation follows Argue: beam from beats 1 and 3, no figures crossing beat 3, rests to the beat, no dotted rests. Attacks are notated as the duration until the next attack or the bar line, with a tie across the bar line shown as a tied note into the next repetition when the loop wraps.
- Clicking any rotation plays it looped as a click sound. **Play all** plays the rotations in order, one bar each.
- **Copy** copies the pattern as `x . x . . x . .` text.

### Playlist

- Spotify embed iframe for playlist `4DdYDtOf8CMNhsM46R8nwg`, height 380, compact theme. Below the iframe, a plain list of the thirteen tunes (artist – title) as text so the list survives if the embed fails to load.

## Notation

Reuse the in-app SVG engraver from Improv Blocks for the treble-staff noteheads and the rhythm staff. No LilyPond pre-rendering is needed here; everything is live and simple. Follow Argue's conventions where they apply (beaming, rests, cautionary accidentals not needed since no key signatures are shown).

## Audio

Web Audio API. Reuse the lookahead scheduler (25 ms interval, 130 ms lookahead). One shared tempo. Synthesized voices only: a soft sine/triangle voice for pitched playback, a short noise burst for the rhythm click, a sustained low triangle for the drone.

## Visual language

Petrol/ink ground, bone text, brass accents on section headings and tool expand controls, monospace for pitch strings and interval patterns, serif for prompt text. Cards without a tool have no expand control and read as plain text.

## Navigation

Add "Composition Assignments" to the stand-alone section of the TOOLS dropdown on every app page and the index.

## Deferred (log in `composition-assignments/CLAUDE.md`)

- Melody and chord entry in the app, with per-assignment lint (strict/flag) and per-note chord-tone readout
- Reharm ladder tool with the four melodies notated and a chord-tone lookup
- Form builder (32-bar modulations, odd phrases, harmonic-rhythm ruler)
- Submission export (seed material as PDF alongside the student's score)
- Groove capture-and-mutate tool
- Pat Martino's exact alphabet mapping if William supplies it

## Deployment

Zip → "Unzip into ~/Projects, commit, and push."
