# Stage Plot

Stage plot builder for WSU ensembles playing Somewhere Works, 235 N Emporia.
Built from `briefs/sw-stage-plot-build-brief.md` (Sept 2026). Venue-specific by
design: the deck, the house backline, the monitor ceiling and the ensemble
rosters are all pre-loaded, so a director picks a group, drags a few things,
types the monitor requests and prints.

**The printed page is the product.** The canvas exists to produce it, and the
right rail is that page rendered live from the same code that prints. If a
change makes the screen nicer and the paper worse, it is the wrong change.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage (`check.js` fails if any storage API appears in the file). Root
`CLAUDE.md` conventions apply: petrol/ink app chrome, and a print stylesheet
that is its opposite — black on white, house gear light grey, BYO dashed.

## VENUE — the one place venue facts live

`VENUE` at the top of the script. Everything else reads from it: presets,
warnings, the house-equipment list, the delivery line. Values William is still
confirming are marked `// ASSUMED` in the code and listed here:

| Value | Status | Notes |
|---|---|---|
| `deck: {widthFt:24, depthFt:12}` | **ASSUMED** | tech is measuring. See "Changing the deck" below. |
| `deliverTo: somewhereworks@wichita.edu` | **ASSUMED** | confirm with the tech |
| `leadDays: null` | **ASSUMED** | null prints "as far in advance as possible"; set a number and the page prints "Please deliver by <date>", counted back from the performance date |
| `kit` label — Gretsch 4-pc | **ASSUMED** | the photo says Gretsch, the tech's example said Yamaha |
| `bassamp` — Ampeg 8×10 | **ASSUMED** | |
| `gtramp1`, `kb1`, `kb2` — "model TBD" | **ASSUMED** | left as written; do not invent models to fill these in — they print verbatim |
| `micstand` count 8, `musicstand` 20, `di` 8, `power` 6 | **ASSUMED** | only used to decide when to flag "more than SW has" |
| `riser` count 0 | **ASSUMED** | unknown whether SW owns any. At `count >= 2` the big band preset puts the trumpet row on two risers; at 0 they stand |
| `monitorMixes: 5`, `consoleChannels: 32` | confirmed | `warnChannelsAt: 28` is our own headroom line |

Confirmed and not assumptions: 5 wedges / 5 mixes typical with extras possibly
from Shocker Studios, a 32-channel console, monitors shared between musicians
for most groups, everything on the deck movable, no acoustic piano.

House `label` strings print verbatim on the page — that is the point, the tech
asked for exact equipment. `short` is the version that fits inside the shape on
the diagram; the verbatim label appears in "House equipment needed".

Two fields were added to VENUE beyond the brief's sketch, both venue facts:
`shortName` ("SW", used in warning text) and `extraWedgesFrom` ("Shocker
Studios"). `DRAW` (marker size, margins, type sizes) sits outside VENUE because
it is drawing, not venue.

### Changing the deck

Edit `VENUE.deck` — one line. Every preset is authored in **fractions** of the
deck, so all nine re-lay out proportionally. Plots already saved keep their own
`deck` and their own inch coordinates, so old files never shift; a plot's deck
is also editable per-plot in the Details tab. Footprints stay real inches, so on
a smaller deck things may hang over the edge — those get a red outline and a
warning rather than being silently moved.

After changing it, run `node check.js`: it verifies proportional re-layout, that
nothing starts off the deck, and that no two footprints land on the same square
foot.

## Coordinates

`x, y` are **inches from the downstage stage-left corner**, as the brief's data
model specifies: x runs 0 at the stage-left edge to `widthFt*12` at stage right,
y runs 0 downstage (audience) to `depthFt*12` upstage. Stage left and right are
the performer's.

The page is drawn audience-at-the-bottom, so **x = 0 draws on the RIGHT of the
page** (`sx = margin + (W - x)`, `sy = margin + (D - y)`). Reading a preset:
`fx .1` is stage left, near the page's right edge; `fx .9` is stage right, near
the page's left edge. This trips everyone up once. The legend on the printed
page says so in words, which heads off the most common plot argument.

Item `x, y` is the **centre** of the footprint. `rot` is 0/90/180/270.

## Channel ordering

Auto-assigned in this order, and this is the rule to keep: **drums, bass,
guitars, keys, horns, vocals**, then anything else. Horns run low to high:
bari, tenor, alto, generic sax, bass trombone, trombones, trumpets. Within a
group, roster order (which is chair order in the big band).

- One **unit** = one input as the director edits it. A stereo DI is one unit
  that eats two channels and prints as two rows (Keys L / Keys R).
- Reordering (↑/↓ in the Inputs tab) **freezes** the order into
  `plot.channelOrder` for that plot; new inputs land at the end. "Reset to
  automatic order" clears it.
- Drum mics are in console order — kick, snare, hat, tom 1, tom 2, OH L, OH R —
  not the order the brief listed the set in. "Jazz minimal" is kick, snare, 2 OH.
- A chair with no name typed carries its chair number in the source ("Tenor
  sax 1") and leaves the Who column blank, so unrostered big bands don't print
  every line twice.

Everything else on the page is derived from the input list too: DI count (a
stereo DI counts as 2 boxes), boom-stand count (one per person-anchored or
section mic — amp and drum mics are the tech's own choice), and the channel
total in the header.

## Ensembles

`ENSEMBLES` is data. Each preset is `{id, name, note, people, items, wedges}`:

```js
{ id:"group-x", name:"Group X", note:"shown in the New dialog",
  people:[ { key:"liz", name:"Liz Graber", role:"keys/vocals", at:RHY.keys },
           { key:"caden", name:"Caden Kennedy", role:"drums", chair:"kit" } ],
  items:[ { ref:"kb1", owners:["liz"], at:RHY.kb } ],      // ref = a VENUE.house id
  wedges:[ { at:RHY.keysWedge, who:["liz"] } ] }           // at = [fx, fy] or [fx, fy, rot]
```

- `at` is `[fx, fy]` fractions (see Coordinates). `RHY` holds the shared
  rhythm-section block so the groups agree with each other — which is also what
  makes the changeover sheet say "the kit stays put" instead of "the kit moves".
- `role` is free text; the category is matched from it (`ROLE_PATTERNS`), so
  "keys/vocals" gives a person both a keyboard part and a vocal mic. A person
  with `chair:"kit"` gets no marker of their own — their name prints on the kit.
- Inputs are **not** authored: `defaultInputsFor()` derives them from the role
  or the gear. Vocals get a mic, horns a mic, keyboards a stereo DI, bass a DI,
  guitar amp a mic, kit the 7-piece set.
- Two drummers on one kit: list both in `owners`. One set of drum inputs, both
  names on the kit, "(share kit)" underneath.
- Blank names are fine (`name:""`) — the diagram falls back to an abbreviated
  chair label ("Alto 1", "Tpt 4").

Both big bands share `bigBandPreset()`.

## URL-hash encoding — decision

`#s=<base64url of raw-deflated JSON>`, using the browser's built-in
`CompressionStream("deflate-raw")`. Measured on the samples:

| plot | JSON | base64 uncompressed | base64 deflated |
|---|---|---|---|
| Group C | 3.5 KB | 4.7 KB | **1.2 KB** |
| Combo C | 3.4 KB | 4.5 KB | **1.1 KB** |
| Big Band 1 | 6.5 KB | 8.7 KB | **1.5 KB** |

The brief's "store uncompressed if a big band stays under ~8 KB" — it doesn't
(8.7 KB), and a 9 KB link is unpleasant to text. Deflate is a 6× win for no
dependency, so it wins. No hand-rolled inflate: `CompressionStream` is native in
Chrome 103+, Safari 16.4+ and Firefox 113+. On an older browser the app falls
back to `#j=` (uncompressed) when *writing* a link, and a `#s=` link opened on a
browser with no `DecompressionStream` reports that plainly and asks for the
`.json` instead. The hash carries the whole session, so a showcase link opens
every plot and its changeover sheets.

Opening any link puts the app in read-only mode: no palette, no dragging, the
page front and centre, and Save / Print / "Edit a copy".

## What prints

One US Letter portrait page where it fits (Group A, Group C, Combo C all do;
Big Band 1 runs to two, which the brief allows). Header, diagram, then two
columns — monitors, house equipment, musicians provide, DI boxes on the left;
input list on the right — then personnel-by-song if any songs exist, notes, and
the delivery line. Body text is 10 pt, names on the diagram are 12 pt at any
deck size: type sizes are computed back through the print scale, so changing
`VENUE.deck` never shrinks the names below the tech's legibility line.

The preview's "≈ 1 page" is measured from the rendered height, not from the
browser's pagination — treat it as a good guide, not gospel.

## Deferred — not built, on purpose

From the brief's §11: per-person monitor requests for IEMs; mic model selection
per input (techs choose their own); lighting and video-capture areas; importing
rosters from the ensemble Airtable base; a venue-editor UI for `VENUE` (editing
the object is fine for v1).

Decided during the build, also not built:

- **Drag from the palette onto the canvas.** Clicking a palette item drops it in
  the middle of the deck, selected, ready to drag. Cheaper, and better on a
  tablet.
- **Drag to reorder the input list.** ↑/↓ buttons instead — same freeze
  behaviour, and they work on a touchscreen.
- **Automatic mic and music stands on the diagram.** Boom stands are counted
  from the input list and printed in the equipment list; they are only drawn if
  you place them from Misc. Music stands are place-only.
- **Print-all-plots in one go.** Print prints the active plot; Changeover prints
  every transition sheet.
- **A second changeover order.** Transitions follow tab order; move a tab to
  change the running order.

## Open questions for William

1. **Big Band channel count.** The brief's acceptance list expects Big Band 1
   with individual horn mics to trip the red over-32 warning. With the brief's
   own defaults it comes to **24** — 7 drums + 1 bass DI + 1 guitar + 2 keys +
   13 horn mics — so it never even reaches the amber line at 28. The warning
   logic is verified against a stress plot in `check.js` instead. If real big
   band nights should carry doubles mics (flute/clarinet on the sax chairs),
   solo mics for the sax and brass rows, or a vocal mic, say which and they can
   be preset defaults — that is what would push it past the ceiling honestly.
2. **Big band seating.** Lead chairs (Alto 1, Tbn 1, Tpt 1) are stacked in one
   column at stage centre, low chairs (bari, Tbn 4, Tpt 4) nearest the rhythm
   section, rhythm section at true stage left per the brief — which is the
   audience's *right*. Both are one-line changes in `bigBandPreset()`.
3. **Default wedge assignments** in each preset are a guess apart from Group C,
   where the brief asks for the four vocalists to start unassigned so the flags
   show.
4. Fusion Combo and both big bands have blank names, per the brief.

## Checks

`node check.js` — 91 assertions: presets build and fit, nothing overlaps,
Group C's four flags, Combo C's six horns and no kit, section mics, the channel
order and freeze, the shared kit, changeover A→B, deck re-layout, save/load
round trip, house counts, and no storage APIs. `node check.js --samples`
rewrites `samples/*.json`.

Samples are the preset as it opens, not a finished plot: Group C stresses the
wedge flags, Combo C the no-drums path, Big Band 1 the channel count.
