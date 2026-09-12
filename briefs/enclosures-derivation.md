# Enclosures — where the pattern catalogue came from

The engine in `enclosures/index.html` does not contain a hand-written theory of
enclosures. Its catalogue was read off the source notation and checked back
against it. This note records how, so the work can be redone if the sources
change.

## Sources

| file | what was taken from it |
| --- | --- |
| `Enclosures_101.pdf` | goal-note types; families 1–5 in C major; the rhythmic rule |
| `Access_Point_Enclosures.pdf` | families 2–4 on all seven access points of D‑7 |
| `EnclosuresConcert.pdf` | families 2–5 in C major and C natural minor; the composed pages |
| `Enclosure_Scale_Exercise.pdf`, `Descending_…pdf` | the two scale exercises |
| `Outline.docx` | the front-matter headings |

## How the notation was read

`Enclosures_101.pdf` pages 2–6 embed their notation as raster images; everything
else is vector. Two readers were used:

- **Vector** — glyph origins come straight out of the PDF text layer. Staff
  lines are the horizontal rules whose height is exactly four staff spaces;
  a note's pitch is `round((topLine − originY) / halfSpace)`. Goal notes are
  drawn with the ringed notehead `¡` from `Inkpen2SpecialStd`, whose origin sits
  **1.62 half-spaces** below the notehead centre — calibrated by solving for the
  offset that makes all 24 occurrences land on integer staff positions.
- **Raster** — staff lines by row darkness, noteheads by binary erosion with a
  kernel taller than a beam and wider than a stem, accidentals by aspect ratio.

Two checks guard the vector reader: every accidental must sit immediately left
of, and vertically on, the note it alters (0 violations across all four pages),
and every bar must fill its meter. Accidentals carry through the bar, which
matters — several enclosures repeat a pitch that is written as a bare notehead.

## How the catalogue was derived

For a goal note on scale degree *d*, the approach tones are

```
L  lower diatonic neighbour        U  upper diatonic neighbour
l  half step below the GN          u  half step above the GN
S  half step below l               S2 half step below L       T2 half step above U
```

`l` and `u` take the **letter names of L and U**, respelled. That one rule is
what makes the 3rd of C minor read `Fb` above `Eb` rather than `E`, and the 3rd
of C major read `F` rather than `Fb` — both as printed.

Type A goal notes have `l ≡ L`; Type B have `u ≡ U`; Type C have neither
collapse. Each printed enclosure was then tokenised against its own tone set,
matching by pitch class so `A#`/`Bb` resolve to the same token, and the distinct
token sequences per (family, type) became the catalogue.

## Verification

`enclosures/index.html` is checked by regenerating the sources from it:

- All **85** enclosures printed across the three PDFs round-trip — the engine
  produces each one from key, scale, degree and family alone.
- Both scale exercises regenerate **note for note** in C (41 and 21 notes), and
  therefore transpose correctly to the other eleven keys.

## Two things to know

- The brief's engine section says Type A is "half step both sides". It is not,
  and cannot be: a major scale's two half steps are never adjacent. The brief's
  own terminology section — half below, whole above — matches the source and is
  what the engine uses.
- The workbook reuses the major four-note root enclosures verbatim for the minor
  root, so its `[U u L l]` there prints `D Db B B` rather than the `D Db Bb B`
  the rule gives in natural minor. The engine follows the rule.
