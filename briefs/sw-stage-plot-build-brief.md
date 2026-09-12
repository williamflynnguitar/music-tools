# Build Brief — Somewhere Works Stage Plot Tool

**For:** Claude Code
**Owner:** William Flynn, Director of Jazz Studies, Wichita State University
**Target:** `music-tools/stageplot/index.html` (single self-contained HTML file, no build step, no dependencies, no browser storage APIs)
**Deadline pressure:** plots are needed for WSU jazz concerts at Somewhere Works in late September 2026. Ship a working v1 before polishing.

---

## 1. What this is

A stage plot builder for WSU student ensembles performing at Somewhere Works, 235 N Emporia, Wichita. It replaces hand-drawn plots that Somewhere Works student techs have complained about. It is venue-specific by design: the stage, the house backline, the monitor ceiling, and the ensemble rosters are all pre-loaded. A director should be able to open the file, pick an ensemble, drag a few things, type monitor requests, and print a one-page plot in under five minutes.

What the Somewhere Works techs said they need (verbatim priorities, from a student tech):

1. Layout of stage — instruments and placement, legible.
2. Monitors — how many, and what each wedge's musicians want in it.
3. Exact house equipment needed (make/model) versus what musicians bring, plus DI boxes needed.
4. Delivered as far in advance as possible.

The printed page is the product. The canvas exists to produce it.

## 2. Architecture (non-negotiable)

- One HTML file. Inline CSS and JS. No frameworks, no CDN, no fonts loaded from network (system font stacks only).
- No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
- Persistence is by **file** and by **URL**:
  - **Save** downloads a `.json` (`SW-plot-<ensemble>-<date>.json`).
  - **Load** accepts that file via file input or drag-and-drop onto the page.
  - **Share** encodes the full state into the URL hash (`#s=<base64url of deflated JSON>`), so a link can be texted to a tech and opens the plot read-only. Use a tiny inline deflate/inflate (pako-style, hand-rolled, or store uncompressed if the hash stays under ~8 KB for a big band — measure and decide; note the decision in CLAUDE.md).
- Print via `window.print()` with a dedicated `@media print` stylesheet. Export to PDF is the browser's job.
- Canvas is inline SVG. Drag with Pointer Events so mouse and touch both work. Snap to a 6-inch grid by default (toggle off).
- Runs from `file://` as well as GitHub Pages.

## 3. Venue config

Put this at the top of the script as a single editable object with a comment header telling future editors this is the only place venue facts live. Values marked `// ASSUMED` are placeholders William will correct.

```js
const VENUE = {
  name: "Somewhere Works — The Lot",
  address: "235 N Emporia, Wichita KS 67202",
  deliverTo: "somewhereworks@wichita.edu",   // ASSUMED — confirm with tech
  deck: { widthFt: 24, depthFt: 12 },        // ASSUMED — tech is checking real dimensions
  monitorMixes: 5,                           // confirmed: 5 wedges, 5 mixes typical; extras possible via Shocker Studios
  consoleChannels: 32,                       // confirmed
  warnChannelsAt: 28,                        // leave headroom for talkback/spare
  house: [
    // id, label (printed exactly as written), category, footprint in inches (w × d), default position, notes
    { id:"kit",     label:"House drum kit (Gretsch 4-pc, hats/ride/2 crash)", cat:"drums",  w:72, d:60, notes:"" },   // ASSUMED model — tech's example said Yamaha; confirm
    { id:"bassamp", label:"House bass rig (Ampeg 8×10 + head)",               cat:"amp",    w:26, d:20, notes:"" },   // ASSUMED model
    { id:"gtramp1", label:"House guitar amp (model TBD)",                     cat:"amp",    w:26, d:12, notes:"" },   // ASSUMED
    { id:"kb1",     label:"House keyboard 1 (model TBD)",                     cat:"keys",   w:54, d:16, notes:"" },   // ASSUMED
    { id:"kb2",     label:"House keyboard 2 (model TBD)",                     cat:"keys",   w:54, d:16, notes:"" },   // ASSUMED
    { id:"wedge",   label:"Wedge (house)",       cat:"monitor", w:22, d:18, count:5 },
    { id:"micstand",label:"Mic stand (boom)",    cat:"stand",   w:12, d:12, count:8 },   // ASSUMED count
    { id:"musicstand", label:"Music stand",      cat:"stand",   w:18, d:12, count:20 },  // ASSUMED count
    { id:"di",      label:"DI box (house)",      cat:"di",      w:6,  d:6,  count:8 },   // ASSUMED count
    { id:"power",   label:"Power strip",         cat:"power",   w:14, d:4,  count:6 },   // ASSUMED count
    { id:"riser",   label:"Riser 8×4",           cat:"riser",   w:96, d:48, count:0 },   // ASSUMED — unknown if Somewhere Works has any
  ],
  // Fixed context drawn outside the deck, not draggable:
  context: {
    trussCorners: true,          // four corners
    mainsDownstageLR: true,      // PA stacks outside DS corners
    drapeUpstage: true,
    audienceLabel: "AUDIENCE",
  }
};
```

House `label` strings print verbatim on the plot. That is the point: the tech asked for "exact equipment."

## 4. Data model

```
Plot {
  id, ensembleId, ensembleName, director, date, showName, notes,
  deck: {widthFt, depthFt},          // copied from VENUE at creation so old plots survive config changes
  items: [Item],
  wedges: [Wedge],
  people: [Person],
  songs: [Song]                      // optional per-song personnel grid
}
Item {
  id, kind: "house"|"byo"|"person"|"wedge"|"stand"|"di"|"power"|"riser"|"label",
  ref (house id if kind=house), label, x, y (inches from DS-left corner), rot (0/90/180/270),
  ownerPersonId?, inputs: [Input], notes
}
Person { id, name, role (instrument/voice), doubles: [string], wedgeId?, byo: [string] }
Wedge { id, number, x, y, rot, assignees: [personId], request: string }
Input { channel?: auto, source: string, type: "mic"|"di"|"xlr"|"stereo-di", phantom: bool, notes }
Song { title, onstage: [personId] }
```

Rules:
- Every Item of kind `person` is the anchor for that musician's inputs. A vocalist item carries one mic input by default. A keyboard item owned by a person carries one stereo DI (2 channels) by default. Bass carries one DI + optional amp mic. Guitar carries one amp mic by default. Drums carry a configurable kit mic set (default: kick, snare, hat, 2 OH, 2 tom = 7 channels; a "jazz minimal" preset of kick, snare, 2 OH = 4). Horns carry one mic each by default; a section toggle collapses a sax or brass row to shared section mics (default 2 per row).
- Inputs are editable per item. The input list is derived, never hand-maintained.
- Channel numbers are auto-assigned in a stable order: drums, bass, guitars, keys, horns (low to high: bari, tenor, alto, trombones, trumpets), vocals. Reordering is allowed by drag in the input list panel; then numbers are frozen for that plot.

## 5. Ensemble presets

Presets are data, editable in a `ENSEMBLES` array. Each has a roster and a default layout expressed as relative positions (fractions of deck width/depth, 0,0 = downstage-left) so they scale if the deck dimensions change.

Rosters to include (names print on the plot):

> **Rosters redacted from the committed copy.** The original brief lists the
> fall 2026 WSU students by name; this repo is public, so the names live only
> in `briefs/sw-stage-plot-build-brief.local.md` on William's machine
> (gitignored), alongside the saved plots in `stageplot/samples/`. What the
> brief specified, instrumentation only:
>
> - **Group A** — keys/vocals, guitar, bass, drums
> - **Group B** — voice, 2 sax, guitar, keys/voice, bass, **two drummers on one
>   kit**
> - **Group C** — four vocalists, guitar, bass, **two drummers on one kit**;
>   the four vocalists start with no wedge, which is the flag this preset is
>   meant to surface
> - **Fusion Combo** — guitar, 2 sax, bass, drums; no names yet
> - **Combo A** — 2 tenor sax, trumpet, trombone, piano, guitar, bass, drums
> - **Combo B** — alto sax/flute, bari sax, 2 trumpet, piano, bass, drums; no
>   guitar
> - **Combo C** — alto sax, 2 trumpet, 2 trombone, bass trombone, guitar, bass;
>   no drums, no piano. Horns in a shallow arc downstage, guitar and bass
>   upstage
> - **Big Band 1 / Big Band 2** — 5 sax, 4 trumpet, 4 trombone, guitar, piano,
>   bass, drums; no names yet
>
> Shared personnel across ensembles was expected and deliberately not
> deduplicated.

"Piano" in any jazz roster maps to a house keyboard item by default, since Somewhere Works has no acoustic piano. The person's role still prints as "piano."

Shared personnel across ensembles (a keys/vocalist and a drummer across A and B, a drummer across B and C, a guitarist and two sax players across the groups and combos) is expected; do not deduplicate. [names redacted — see above]

## 6. UI

Three regions, desktop-first but usable on a tablet:

**Left rail — palette.** Tabs: *House* (from VENUE, shows remaining count where `count` is set), *Bring-own* (generic icons: guitar amp, bass amp, keyboard, kit, pedalboard, laptop, acoustic guitar, upright bass, misc — each takes a free-text description that prints, e.g. "BYO: Fender Deluxe Reverb"), *People* (the current roster; unplaced people are listed here), *Wedges*, *Misc* (stands, DI, power, riser, text label).

**Center — canvas.** Deck at true proportion. Fixed context outside the deck. Downstage at the bottom of the screen with the audience label; a small "Stage L / Stage R" legend from the performer's perspective, and a note in the legend that plots are drawn from the performer's view (this avoids the most common plot argument). Items are simple, flat, top-down shapes with the label inside or beside; no 3D icons. Selected item shows a small inspector: label, owner, rotate, inputs, notes, delete. Keyboard: arrows nudge, R rotates, Delete removes, Cmd/Ctrl-Z undo (keep an in-memory undo stack, 50 deep).

**Right rail — the printed page, live.** This is a live preview of exactly what will print. Sections in order:
1. Header: ensemble, director, show, date, venue, "prepared <date>", channel count and mix count used vs. available.
2. Stage diagram (rendered from the same SVG, scaled).
3. **Monitors** table: wedge #, who, request text.
4. **Input list**: ch, source, type, phantom, notes.
5. **House equipment needed**: list with counts, verbatim labels.
6. **Musicians provide**: BYO list with descriptions.
7. **DI boxes needed**: total count (house DIs requested), plus which sources.
8. **Personnel by song** (only if songs exist): grid of song × person, ✓ where on stage.
9. Notes.

One US Letter page in portrait if it fits; allow a second page for big bands. Black on white, minimum 10 pt body, 12 pt names on the diagram. This is the tech's legibility complaint answered; do not print the app's dark theme.

**Top bar.** New (pick ensemble), Load, Save, Share link, Print, and an **Email text** button that copies a plain-text version of sections 1 and 3–8 to the clipboard for pasting into an email to `VENUE.deliverTo`, with a `mailto:` prefilled as a bonus if it fits.

**Showcase mode.** A session can hold multiple plots (tabs across the top). When two or more exist, a **Changeover** button produces a printable sheet per transition: items that stay in place, items that move (from → to), items that leave, items that arrive, people who stay (shared personnel), and wedge assignment changes. This is the feature that most helps a multi-ensemble jazz night. It is derived data; no extra authoring.

## 7. Constraint logic (shown, never blocking)

- Wedges placed > `VENUE.monitorMixes` → amber banner: "6 wedges placed; Somewhere Works normally runs 5. Extras may be available from Shocker Studios — ask the tech."
- Wedge with no assignees → flagged in the Monitors table.
- Person with no wedge → listed under the Monitors table as "No wedge assigned" so sharing is decided consciously. Group C's four vocalists will surface this immediately, which is intended.
- Channels used > `warnChannelsAt` → amber; > `consoleChannels` → red with the count. Offer the section-mic collapse for horn rows as the one-click fix.
- House item placed more than `count` times → amber.
- Two people assigned the same chair (two drummers, one kit) → render both names on the kit, print "<drummer> / <drummer> (share kit)" and one set of drum inputs, not two.
- Item overlapping the deck edge → red outline.

## 8. Visual language

App chrome follows the music-tools suite: petrol/ink dark ground, bone text, brass accent, monospace for data labels (channel numbers, dimensions), serif for headings. Print stylesheet is the opposite: white ground, black ink, no color except a single light-grey fill on house items to distinguish them from BYO (which print with a dashed outline). Test the print in Chrome, Safari, and Firefox print preview; check that the diagram does not split across a page break.

Open Graph tags follow the suite's single-banner convention.

## 9. Deliverables

1. `stageplot/index.html`
2. `stageplot/CLAUDE.md` documenting: the VENUE config and every ASSUMED value; the URL-hash encoding decision; the channel-ordering rule; how to add an ensemble; and the deferred list below.
3. Three sample `.json` plots committed under `stageplot/samples/`: Group C, Combo C, Big Band 1 — chosen because they stress the wedge, no-drums, and channel-count paths respectively.
4. A printed-preview screenshot of each sample in the PR description.

## 10. Acceptance checklist

- [ ] Open the file from `file://` with no network; everything works.
- [ ] Pick Group C → four "No wedge assigned" flags appear before anything is dragged.
- [ ] Assign four vocalists to two wedges, type requests → Monitors table prints both rows with all four names.
- [ ] Pick Combo C → no kit on the deck, six horn inputs, channel count ≤ 32.
- [ ] Pick Big Band 1 with individual horn mics → red channel warning; click "section mics" → clears.
- [ ] Save → reload the page → Load the file → identical plot.
- [ ] Share link opens the same plot in a fresh tab, read-only, on a phone.
- [ ] Print preview is one page for Group A, black on white, names legible at 100%.
- [ ] Changeover sheet between Group A and Group B lists the shared keys/vocalist and drummer as staying, the kit as staying, and two saxes plus a second drummer as arriving.
- [ ] Change `VENUE.deck` to different numbers → presets re-layout proportionally; a previously saved plot keeps its own stored deck size.
- [ ] Undo works across drag, delete, and text edits.
- [ ] No `localStorage` / `sessionStorage` / cookies anywhere in the file (grep it).

## 11. Deferred (log in CLAUDE.md, do not build now)

- Per-person monitor requests when the venue adds IEMs.
- Mic model selection per input (techs currently choose their own).
- Lighting and video-capture area marking.
- Importing rosters from the ensemble Airtable base.
- A venue-editor UI for VENUE (editing the JS object is fine for v1).

## 12. Open items William will supply

- Real deck dimensions (tech is checking) → update `VENUE.deck`.
- Keyboard 1 and 2 make/model; house kit make/model; guitar and bass amp models → update `VENUE.house` labels.
- Confirmed delivery address and lead time → update `VENUE.deliverTo` and the header line "Please deliver by …".
- Fusion combo and big band names, when rostered.
