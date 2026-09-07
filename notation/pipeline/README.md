# Notation pipeline

Engraves every fingering shape in the Arpeggios Deck and Fretboard, in every key, with
LilyPond, and writes one lean SVG per cell to `notation/svg/<set>/`. The apps fetch these
on demand; if a cell is missing or the app is offline, they draw the same notes from
LilyPond's glyphs in the browser instead.

Requires: node, python3, lilypond (2.24+) on the PATH.

    cd notation/pipeline
    node gen-arpeggios.js        # → ly/arpeggios/*.ly   (2,112 cells: 176 shapes × 12 keys)
    node gen-fretboard.js        # → ly/fretboard/*.ly   (948 cells: 79 fingerings × 12 keys)
    ./render.sh all              # → ../svg/arpeggios/*.svg, ../svg/fretboard/*.svg

`render.sh` runs LilyPond in parallel (JOBS=n to override) and skips cells that already
exist, so re-running after a data change only renders what's new. Delete the SVGs for a
shape to force a re-render. About 1.5 s per cell per core: the full set is roughly
15 minutes on 8 cores.

Cell names — arpeggios: `<octaves>-<quality>-<shapeIndex>-<key>.svg`; fretboard:
`<scale>-<shape>[-<variant>]-<key>.svg`. Keys use `s` for sharp (`Fs`). The apps build the
same names in `notationPanel()`.

Files:
- `lyshape.js` — LilyPond source for one shape (also the in-app "Download .ly" generator; keep in sync).
- `gen-arpeggios.js`, `gen-fretboard.js` — load each app's own engine from its index.html
  and emit `.ly` for every shape × key. They read the apps, so they can't drift from them.
- `post.py` — strips LilyPond's white-out boxes and mm sizes, rounds numbers, sets
  `preserveAspectRatio`; output inherits `currentColor` from the page.
- `render.sh` — the batch.

Commit `svg/`; `ly/` and `build/` are regenerable and git-ignored.
