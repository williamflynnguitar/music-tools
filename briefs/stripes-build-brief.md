# Stripes — build brief (phase 1: Lookup + Conversion drill)

Written 2026-11-06. Fills slot 3 ("half-whole diminished scale") in the JGTH build order. Hand this to Claude Code as-is; open decisions are already resolved below.

## What this app is for

Guitarists know how to apply the diminished scale and still freeze when a chord symbol has to become notes on the neck. The app removes two bottlenecks: (1) converting a chord symbol to the right diminished collection, and (2) seeing that collection as one fixed fretboard picture instead of a scale fingering. It never uses the words "half-whole" or "whole-half" as the primary name of anything. There are three collections, called **families**, and each is named by its four dominant roots.

## The theory the engine encodes (authoritative)

Pitch classes 0–11, C = 0.

**Families.** Family index `f` ∈ {0, 1, 2}.

| f | Dominant roots (the family's name) | Collection (pcs where `pc mod 3 ∈ {f, f+1}`) | Dark pcs (`pc mod 3 = f+2`) |
|---|---|---|---|
| 0 | C · Eb · Gb · A | C Db Eb E Gb G A Bb | D F Ab B |
| 1 | Db · E · G · Bb | Db D E F G Ab Bb B | C Eb Gb A |
| 2 | D · F · Ab · B | D Eb F Gb Ab A B C | Db E G Bb |

Note the symmetry: the dark notes of each family are the dominant roots of another. Each family is also the union of two dim7 chords a half step apart (f=0: Cdim7 + Dbdim7).

**Conversion rules.** This is the entire lookup the app teaches.

- Dominant chord with root `r` → family `r mod 3`.
- Diminished chord (dim7, dim triad, °, °7, o7) with root `d` → family `(d − 1) mod 3`. Spoken rule: "a half step below the dim root is the dominant root."
- Slash chords use the chord above the slash; the bass note is ignored for family purposes.
- Not this scale (rejected with a one-line note, never silently mapped): `alt`, `7b13`, `7#5`, `+7`, `m7b5`, `ø`, and any chord that isn't dominant or diminished. Note text for alt/b13: "This chord wants b13. That's the altered scale, not a diminished family." Note text for ø: "Half-diminished isn't a diminished-scale chord."

**Fretboard facts.** On every string the collection is always two lit frets, one dark fret, repeating. Open-string pc `s`, fret `x` is dark iff `(s + x) mod 3 = f + 2`. In standard tuning this yields three string groups with identical dark-fret patterns:

- Low E, G, high E: dark at `x ≡ f + 1 (mod 3)`
- D, B: dark at `x ≡ f (mod 3)` (one fret below the E/G/E group)
- A: dark at `x ≡ f + 2 (mod 3)` (one fret above the E/G/E group)

The relationship between groups is the same for all three families; changing family shifts the whole picture by one fret.

**Anchor rule** (shown to the user after every lookup and every drill reveal): the dominant root is always the *lower* note of a lit pair; the dim root is always the *upper* note of a lit pair.

Worked check for f=0 (C7 / Dbdim7): low E string lit frets 0, 2, 3, 5, 6, 8, 9, 11, 12; dark 1, 4, 7, 10. A string dark 2, 5, 8, 11. D string dark 0, 3, 6, 9, 12. G string matches low E. B string matches D. High E matches low E.

## Chord symbol parser

Accept: root `A–G` with optional `#`/`b` (also `♯`/`♭`); qualities `7, 9, 13, 7b9, 7#9, 13b9, 7#11, 13#11, 9#11, 7b9#11, 7#9#11, 13b9#11, 7(b9), 7(#9)` and any parenthesized combination of b9/#9/#11/13; `dim, dim7, °, °7, o, o7`; an optional `/bass`. Case-insensitive. Reject everything else with the one-line note. Input is a text field plus a quick-pick row of 12 roots and 6 quality buttons (7 · 13b9 · 7#11 · 7#9 · dim7 · dim) so phone users never type.

Display the family spelled as the user spelled the root (G7 → "Db · E · G · Bb"; F#dim7 → "D · F · Ab · B" since the dominant is F). Always spell family names with the fixed spellings in the table; don't respell per input.

## Mode 1 — Lookup

Layout, top to bottom:

1. Chord input (text + quick picks).
2. Result line: family name in brass, then the conversion sentence in bone. Examples:
   - `G7 → root G → family Db · E · G · Bb`
   - `Bdim7 → a half step below B is Bb → family Db · E · G · Bb`
   - `Bb7/D → use Bb7 → family Db · E · G · Bb`
3. Fretboard (SVG, inline). Frets 0–15 by default, toggle to 0–24. Lit frets: bone dots. Chord tones of the entered chord: brass dots. The four dominant roots of the family: brass ring around the dot (so a root that is also a chord tone shows filled + ring). Dark frets: no dot, cell shaded one step darker than the fretboard ground so the stripe reads as a stripe. Optional toggle "show string groups" labels the three groups at the nut: `E·G·e`, `D·B`, `A`.
4. Anchor line: "Dominant root = lower note of a lit pair. Dim root = upper note." Static text, always visible.
5. The three family stripes shown small side by side (a 6-string, 12-fret thumbnail each) with the active one highlighted, so the "same shape shifted one fret" fact is visible at all times.

Changing family: no animation. Redraw. (Suite rule: no motion that isn't necessary.)

Display options: note names on dots (off by default; on shows pc names, chord tones labeled by degree relative to the entered chord: R, b9, #9, 3, #11, 5, 13, b7 for dominants; R, b3, b5, bb7, 9, 11, b13, 7 for dim7).

## Mode 2 — Conversion drill

Purpose: make the chord-to-family lookup automatic. A chord symbol appears large; the user answers; the neck reveals.

**Answer buttons:** the three family names. At level 4, a fourth button "Not this scale."

**Levels** (scaffold supported → independent, as in Training Wheels):

1. Dominants, plain `7` only, all 12 roots.
2. Diminished only: `dim7` and `°7`, all 12 roots.
3. Mixed: dominants with extensions (b9, 13, #11, #9 combinations) and dim7, random spellings including enharmonic roots (Gb7 and F#7 both appear).
4. Everything above plus dim triads, slash chords, and distractors that should be rejected (alt, 7b13, 7#5, m7b5, ø). Distractors are at most 1 in 4 prompts.

**Round structure:** 12 prompts per round (default; 24 available). Before the round, user picks level. During the round: chord symbol, four or three buttons, a plain count "7 of 12". No timer bar, no countdown, no moving cursor. Response time is measured silently from prompt render to button press.

**After each answer:** correct/incorrect in one word, the conversion sentence (same text as Lookup), and the fretboard revealed for the correct family with the chord tones in brass. Advance on tap/key. Keyboard: 1/2/3/4 for buttons, space/enter to advance.

**Round summary:** accuracy, median response time, slowest prompt type (dominant vs dim vs distractor), and every miss listed as `prompt → your answer → correct family`. A "Copy summary" button puts a plain-text version on the clipboard. No persistence across reloads (suite rule: no browser storage APIs).

**Hint toggle** (per round, off by default): shows the small three-family thumbnails during the prompt. Removing the hint is the step from supported to independent.

## Copy and voice

- Never "card" or "deck" in user-facing text. Use "family," "stripe," "lit," "dark," "anchor," "round," "prompt."
- One short intro paragraph at the top of the page, William writes it; ship with this placeholder for him to trim:
  > There are only three diminished scales. Each one is a family of four dominant chords a minor third apart, and on the guitar each one is the same striped picture shifted by a fret. This page is for getting the chord symbol to the family fast, and seeing the stripes once so you never have to think in fingerings again.
- No provenance or AI disclaimers on the page (colophon rule).

## Architecture and conventions

- One self-contained HTML file: `stripes/index.html` in the `music-tools` repo, inline CSS and JS, no dependencies, no build step, no browser storage.
- Visual language: petrol/ink ground, bone text, brass accent, monospace for chord symbols and family names, serif for the intro paragraph. Match the existing tools' nav (home link reads "Jazz Guitar Practice Tools") and the shared OG tags using the single repo-root banner image; per-page title/description/URL only.
- If the shared slide-up mini metronome panel snippet already exists in the repo, include it; if not, log it in CLAUDE.md as deferred rather than building a one-off.
- Phone-first layout: the fretboard scrolls horizontally on narrow screens; buttons are thumb-sized; the drill is fully usable one-handed.
- Add `stripes/CLAUDE.md` documenting the engine rules above, the acceptance checklist, and the deferred list.

## Acceptance checklist (Claude Code runs all of it before reporting done)

1. Engine table: all 12 dominant roots → expected family index; all 12 dim roots → expected family index `(d−1) mod 3`. Print the full table in the test output.
2. Stripes: for each family, for each of the six strings, list the dark frets 0–15 and compare against the formula. Confirm E/G/e identical, D/B identical, A one above E group, D/B one below E group.
3. Parser: a fixture of at least 40 symbols covering every accepted quality, both accidental glyph styles, slash chords, and every rejected quality; each rejection shows the correct note text.
4. Anchor rule holds: for every dominant root in every family, fret `root` lit and fret `root+1` lit and `root+2` dark on every string. For every dim root, fret `d−1` lit, `d` lit, `d+1` dark.
5. No animated or moving element during a drill round. Audit the whole file, not just the round view.
6. Drill: 12-prompt round at each level completes on a 375 px wide viewport without horizontal page scroll (fretboard may scroll inside its own container).
7. Chord-tone degree labels verified against at least three chords by hand: G13b9, Bdim7, Db7#11.
8. OG validator passes; nav and heading match the other tools.

## Deferred (log in CLAUDE.md, do not build in phase 1)

- Mode 3, Structures: overlays on the lit neck for the two dim7 grips, the four major triads, four minor triads, four dominant 7 arpeggios, and a user-entered four-note cell transposed in minor thirds. Handoff into Line Ladder.
- Mode 4, Through changes: progressions (blues with passing dims, rhythm changes bridge, leadsheet presets once the TUNES table exists) with every chord colored by family, showing how few family changes a tune actually has.
- Audio playback of the collection / chord tones (Web Audio, same scheduler as the suite).
- Left-handed fretboard mirror.
- Alternate tunings (drop D changes only the low string's group).
- Response-time trend across sessions (would need stored data; wait for the accounts decision).
