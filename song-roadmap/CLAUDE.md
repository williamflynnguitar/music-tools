# Song Roadmap

Built outside this repo and handed over finished; deployed 2026-11-16 from
`briefs/song-roadmap-deploy-brief.md`. A band tool for William's WSU commercial
ensembles, separate from the Jazz Guitar Practice Tools.

**Unlisted, like Stage Plot and Box Buddy.** Not on the landing page and not in
the spine menu; whether and where it gets listed is William's call. It carries
the spine block so there is a way home. One rule in the page's own stylesheet,
`nav.sp-menu{z-index:40}`, keeps that block under stand view (`#stand`,
z-index 50); print drops it twice over (`body>*:not(#print)` and the block's
own print rule). No practice strip (`scripts/strip-sync.js` skips this folder).

**Deliberate exception to the suite's no-storage rule.** This app uses
`localStorage` (see Storage below). Leave it in place: without it a director's
work disappears on reload.

**Band files** live in `bands/` beside `index.html`; `bands/README.md` is the
director's how-to. They are public.

User-facing text never uses the words "card" or "deck".

**Purpose.** One-page song roadmaps for band rehearsal and the stage. One director per band writes charts. Band members read them.

**Data model.** A chart is plain text. That text is the single source of truth, and the Build tab reads and rewrites it. Header lines (`title:`, `band:`, `key:`, `tempo:`, `time:`, `length:`, `start:`, `lead:`, `backing:`, `tier:`, `status:`, `ref:`) come first, then sections:

```
# Chorus | 8
@ 0:48
lyric: first few words
Bb7 | B7 | Bb7 . . B7 | Ab7 | <Eb7 | Eb7 x2 | Eb7!
-> horn stabs bars 7-8; back to riff
note: Bass: walk up in bar 8
```

- `# Label | n`, `| open`, or `| 16 open 32` starts a section.
- Chord row: one bar per `|`; `x16` repeats; a lone chord fills the section; `.` holds a beat; `<` is a push; `!` is a stop.
- `= 4` reuses section 4's chords; `= 4 +1` reuses them a half step up.
- `->` is the then-line. Numbers after "to", "into", or "from" are section references and are renumbered when sections move.
- `@ 0:48` is the recording time, `lyric:` a lyric cue, `note:` a player note (a leading `Bass:` or `Horns:` tags a part), `desc:` forces a description line.

**Main pieces in the file.** `parseChart` (text → chart), `renderChart` (chart → HTML for preview, stand view, and print), the builder (`toModel`, `serialize`, `commit`), stand view, set lists, share links (chart compressed into the URL hash), band files (`?band=<slug>` loads `bands/<slug>.json` read-only), and an inline QR encoder.

**Build must not shorten a chart it reads.** `toModel` takes the bar count from the chord row when the header has none (`| open` over several bars becomes `| 4 open`; a countless section gets its row's length). Before 2026-11-16 `resizeBars` cut those rows to one bar or none and the next Build edit autosaved the loss. Any new header form needs the same round-trip check: text → Build edit → text keeps every bar.

**Storage.** `localStorage` key `songRoadmap.v1` holds the director's charts, set lists, and settings. `songRoadmap.lib.<slug>` caches a band file for offline reading.

**Visual language.** Petrol/ink ground, bone text, brass accent, monospace for data, serif for reading text, matching the rest of the suite.

**Deferred, not built.**
- Live sync or accounts. The band sees changes only after the director republishes the band file.
- Installable offline mode (service worker). Reopening with no connection depends on the browser cache.
- Import from a Bandee section map.
- Nashville-number display.
- Private per-member notes.
- Click track, audio playback, lyrics engine, chord detection from audio.
- Section-level time signature changes.
- Testing on real iPads and phones.

**Known content issue.** The built-in Superstition sample is a test fixture. Its chords and bar counts have not been checked against the record, and its Solo then-line says "go to 8" in a seven-section chart.
