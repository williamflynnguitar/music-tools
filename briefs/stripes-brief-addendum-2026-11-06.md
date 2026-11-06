# Stripes brief addendum (2026-11-06): position windows and dim7-grip overlay

Layers on top of `stripes-build-brief.md`, which is unchanged. Everything else in the brief stands.

## 1. New engine facts (add to "The theory the engine encodes")

**Position windows.** Any four-fret window over the stripes contains, per string, either three lit frets (the dark fret is inside the window) or two (dark frets sit on both edges). Because the three string groups have dark frets at three different offsets, every four-fret window has exactly one group with two-note strings and two groups with three-note strings. There are therefore exactly three position shapes per family, numbered by which group carries the two-note strings: Shape 1 = E·G·e group has two notes, Shape 2 = D·B group has two notes, Shape 3 = A string has two notes. The same shape recurs every three frets, and shifting the window one fret gives the same shape for the next family. Reference example, family {C Eb Gb A}, window frets 1–4 (Shape 1): low E 2,3 · A 1,3,4 · D 1,2,4 · G 2,3 · B 1,2,4 · high E 2,3. Sixteen notes.

**Dim7 doubling.** For a dominant, the family equals the dim7 arpeggio on the dominant root with every note doubled one fret higher (G7 = Gdim7 + Abdim7). For a dim chord, it equals the chord's own dim7 arpeggio with every note doubled one fret lower (Cdim7 = Cdim7 + Bdim7). This is the anchor rule in arpeggio form.

## 2. Mode 1 additions (after item 5 of the Lookup layout)

6. **Position window overlay.** A toggle "Position" draws a translucent four-fret window on the fretboard; the user drags it or steps it with left/right arrow keys and ‹ › buttons, one fret at a time. Inside the window, lit frets render at full brightness; outside, lit frets dim to roughly 35%. A label next to the window reads "Shape 1 / 2 / 3" per the numbering above, plus which group has the two-note strings (e.g., "Shape 3 · two notes on A"). A fret-range toggle 0–15 / 0–24 still applies. The window never animates; stepping redraws.
7. **Dim7-grip overlay.** A toggle "Grip" dims everything except the anchor dim7 arpeggio and its doubled fret. For a dominant chord the anchor arpeggio is the dim7 on the dominant root, drawn in brass, with the doubled notes one fret higher drawn in bone. For a dim chord the anchor arpeggio is the chord's own dim7, drawn in brass, with the doubled notes one fret lower drawn in bone. A one-line caption states the rule in words for the current chord: "G7: Gdim7 shape, plus every note one fret up." / "Cdim7: Cdim7 shape, plus every note one fret down." The Position and Grip toggles can be on at the same time.

## 3. Mode 2 addition

On the post-answer reveal, show the same fretboard as Lookup with Position and Grip off by default; the user's last-used toggle state from Lookup carries into the drill reveal for the session only (in-memory variable, no storage).

## 4. Acceptance checklist additions

9. Position windows: for each family and each window start fret 0–14, compute per-string note counts and confirm the pattern is always one group with two notes and two groups with three. Confirm the three shapes recur every three frets and that family f+1 at start fret x+1 equals family f at start fret x. Print the reference example above and compare fret-for-fret.
10. Grip overlay: for all 12 dominant roots, confirm the brass set equals the dim7 on the root and the bone set equals that set shifted +1 fret, and their union equals the family. For all 12 dim roots, brass = the chord's dim7, bone = shifted −1 fret, union = family.
11. Position and Grip on simultaneously render correctly at 375 px wide with no page-level horizontal scroll.

## 5. Deferred list additions

- Three-notes-per-string view: each string is either a 0-1-3 cell (fingers 1-2-4) or a 0-2-3 cell (fingers 1-3-4), strictly alternating string to string, shifting down one fret per string except across the G–B pair. Eighteen notes over six strings.
- Minor-third cell builder (user enters a four-note cell, app transposes it every three frets). Moves to Mode 3, Structures.
- Dominant-arpeggios-in-minor-thirds and major-triads-in-minor-thirds overlays. Mode 3.

## 6. CLAUDE.md

Document shape numbering, the doubling rule, and the overlay behavior alongside the existing engine rules.

Two things to watch when Code reports back: that the shape numbers it labels match the group-with-two-notes definition (easy to invert), and that the Grip overlay for dim chords doubles downward, not upward.
