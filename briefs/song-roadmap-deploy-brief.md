# Song Roadmap — deploy brief for Claude Code

Hand this file and `index.html` to Claude Code together. The app is finished for this round. The job is to put it in the repo, wire it into the site's conventions, and verify it on the live URL. Do not redesign or refactor it.

## What it is

Song Roadmap is a single-file web app where a band director writes a one-page roadmap for a song (sections, bar counts, chords, what happens next) and the band reads it on phones, tablets, or a TV. It serves William's WSU commercial ensembles. It is a band tool, separate from the Jazz Guitar Practice Tools that accompany the handbook.

The whole app is `index.html`: inline CSS and JS, no dependencies, no build step.

## Where it goes

- Repo: `williamflynnguitar/williamflynnguitar.github.io` (public, must stay public).
- Path: `music-tools/song-roadmap/index.html`, served at `https://williamflynnguitar.github.io/music-tools/song-roadmap/`.
- Before placing it, look at how two or three existing tools are laid out (folder naming, per-tool `CLAUDE.md`, nav home link, Open Graph tags). Match what is there. If the existing layout differs from the path above, follow the repo and say so in your report.

## Tasks

1. **Add the app.** Copy `index.html` to the path above unchanged, apart from the additions in tasks 2 and 3.
2. **Open Graph tags.** Add the same OG/Twitter tag block the other tools use: the single absolute-URL banner image at the repo root, with only title, description, and URL varying per page.
   - Title: `Song Roadmap`
   - Description: `One-page song roadmaps for rehearsal and the stage: sections, repeats, chords, and what happens next.`
3. **Home link.** Add the suite's standard link back to the tools home, in the form the other tools use. Put it in the top bar (`#top`). It must not appear in stand view or in print.
4. **Band files folder.** Create `music-tools/song-roadmap/bands/` with a short `README.md` (text below). The app loads `bands/<slug>.json` when opened with `?band=<slug>`, so this folder has to sit next to `index.html`.
5. **`CLAUDE.md` for the app.** Create `music-tools/song-roadmap/CLAUDE.md` from the "App notes" section below, including the deferred list.
6. **Do not add it to the tools index page yet.** The index is for the handbook's practice tools, and this app has a different audience. William decides whether and where it gets listed. Report this as an open question.
7. **Ship it** the way this repo normally ships (check git history for whether work lands on `main` directly or through a pull request, and follow that). Use the GitHub CLI.
8. **Verify on the live URL** with the checklist below, and report results item by item.

### Text for `bands/README.md`

```
Band files for Song Roadmap.

Each file here is one band's chart library, published from the app:
Library → Publish band file → pick the band → Download the file.

Put the downloaded file in this folder and push. Band members open
https://williamflynnguitar.github.io/music-tools/song-roadmap/?band=<file name without .json>

Replace the file whenever charts change. Readers get the new version
the next time they open their link.

These files are public. Do not publish anything the band shouldn't share.
```

## Rules that apply

- Single self-contained HTML file. No frameworks, no CDN links, no build step.
- User-facing text never uses the words "card" or "deck".
- No defensive preamble or banner disclaimers.
- Audit before patch: if you find a bug while verifying, check the whole app for the same pattern before fixing one instance.
- **One deliberate exception to the suite's rules:** this app uses `localStorage`. The director's charts, set lists, and display settings live there, and a reader's offline copy of a band file is cached there. Leave this in place. Without it a director's work disappears on reload.

## Verification checklist (run against the live URL)

Report pass or fail for each line.

1. The page loads with no console errors. The empty Library offers "Start from the sample (Superstition)".
2. Loading the sample opens the editor on the Build tab with 7 collapsed sections and a preview with a form line. The only item in the problems list is the Solo then-line pointing at section 8, which is expected.
3. Clicking a section type adds it at the end. Dragging one from the row of buttons inserts it where dropped. Dragging a section by its handle reorders it, and then-line section numbers follow the move.
4. Adding a second Chorus creates it as "same as" the first. Setting it to "up a half step" shows transposed chords in every-bar mode.
5. Typing `E7..F7` in a bar box becomes `E7 . . F7` and shows in the preview as E7 · · F7. Pasting `Bb7 | B7 | Ab7 x2` into a box fills the row.
6. Undo and Redo buttons step through edits. Removing a section shows a prompt with Undo that restores it.
7. Stand view: section buttons and arrow keys move between sections, typing a number then Enter jumps, the instrument selector set to B♭ moves every chord up a whole step, and the Compact / Every bar button switches the chord display.
8. Print produces one letter page in portrait for the sample.
9. "Transpose view to" Dm moves every chord (the chorus becomes A7, Bb7, A7, G7, D7).
10. Share link: the dialog shows a link and a QR code. The link opens in a private window in stand view with a "Shared chart, as of <date>" banner.
11. Band file: with the sample in the Library, Publish band file downloads `flunk.json`. Commit it to `bands/` as a test, open `?band=flunk` in a private window, and confirm the read-only library loads with the published date and no editing buttons. **Remove the test file afterward** unless William says to keep it.
12. Set lists: create a set, add two songs and a set break, tick segue on one song, and confirm the running time, the printed running order, and "Open in stand view" with previous and next song.
13. The home link works and is absent from stand view and print.
14. Paste the page URL into the Open Graph validator the suite used before. Expect the same result as the other tools.

If you can, also check items 3 and 7 on a real iPad or phone. Finger dragging, the keep-awake request, and full screen have only been tested under desktop emulation.

## App notes (use as the body of `CLAUDE.md`)

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

## Report back

- The live URL.
- Pass or fail for each checklist line, with detail on any failure.
- Anything in the repo's conventions that differed from this brief and what you did.
- The open question: whether Song Roadmap gets listed on the tools index, and where.
