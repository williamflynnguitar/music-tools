# Stage Plot

Stage plot builder for any act loading into Somewhere Works, 235 N Emporia.
Built from `briefs/sw-stage-plot-build-brief.md`, then generalised per
`briefs/sw-stage-plot-v2-brief.md` (Sept 2026).

Venue-specific by design and instrumentation-agnostic on purpose: **the venue
knowledge is the moat, the roster knowledge was a mistake.** The deck, the
house backline and the monitor ceiling are pre-loaded; who is playing is not.
v1 hardcoded the fall 2026 WSU rosters into the app; v2 moved them out into
saved plot files — which live on William's machine, not in this public repo.

**The printed page is the product.** The canvas exists to produce it, and the
right rail is that page rendered live from the same code that prints. If a
change makes the screen nicer and the paper worse, it is the wrong change.

Single self-contained `index.html`, no dependencies, no build step, no browser
storage (`check.js` fails if any storage API appears in the file). Root
`CLAUDE.md` conventions apply: petrol/ink app chrome, and a print stylesheet
that is its opposite — black on white, house gear light grey, BYO dashed.

**Unlisted, like Box Buddy.** It is deployed with the suite but deliberately
absent from `index.html` and from the spine menu, because it is William's tool
rather than a student one. It still *carries* the spine chip so he can get back
to the other tools. Unlisted is not private: the repo is public and
`.../music-tools/stageplot/` answers for anyone who has the URL.

**Rosters are local.** Saved plots carry student names, so `samples/*.json` and
the real `samples/v1/*.json` are gitignored and live only on William's machine;
he loads them with the Load button, and the Examples row finds them when he
serves the folder locally. The one committed fixture, `samples/v1/example-v1.json`,
is an invented band. `check.js` greps `index.html` for every name in whatever
sample files are on the machine and fails if one appears in the source.

## The model: positions first, names optional

A plot is a list of **positions**. Each position holds a role, its own inputs,
a spot on the deck, and — optionally — one or more names.

```
Plot { schemaVersion:2, name, director, date, showName, notes, printNames,
       deck, positions[], items[], wedges[], songs[], customRoles[],
       sections{}, channelOrder }
Position { id, roleId, x, y, rot, moved, names[], doubles[], inputs[], notes, byo[] }
Item     { id, kind:"house"|"byo"|"label", ref, label, x, y, rot, moved,
           ownerPositionIds[], inputs[] }   // inputs only on migrated v1 gear
Wedge    { id, number, x, y, rot, moved, assignees:[positionId], request }
```

- Labels come from the role and the count: two trumpets are `Tpt 1` and
  `Tpt 2`, a lone alto is just `Alto`. Nothing numbers itself unnecessarily.
- Names live in `position.names`. Empty is the normal case and nothing looks
  unfinished without them — a 17-piece with no names at all prints completely.
  `printNames:false` drops every name from the diagram and the tables at once
  (the Positions tab has the toggle) for a positions-only plot.
- Tables read `Tpt 2 (Sam Ortiz)` — short chair label, name in parentheses.
  Wedges reference positions, so a monitor row reads `Mix 2 — Alto, Tenor 1`
  whether or not anyone has been named.
- More than one name on a position is a **shared chair** (two drummers on one
  kit, rotating vocalists on one mic): one set of inputs, one wedge, both
  names printed.
- `moved:true` means a human dragged it. The layout engine never touches it
  again until someone hits re-layout.
- On the canvas a label carries the same `data-id` as the thing it names, so
  the grab cursor holds across the name and dragging the name drags the
  player. The drag handler moves every element with that id — the shape group
  by absolute transform, label groups (`data-abs`) by delta. SVG text is
  `user-select:none`, or hovering a name flips the pointer to an I-beam over
  text nobody can edit.

## VENUE — the one place venue facts live

Unchanged from v1, `ASSUMED` markers included. Everything reads from it:
templates, warnings, the house-equipment list, the delivery line.

| Value | Status | Notes |
|---|---|---|
| `deck: {widthFt:24, depthFt:12}` | **ASSUMED** | tech is measuring. See "Changing the deck" |
| `deliverTo: somewhereworks@wichita.edu` | **ASSUMED** | confirm with the tech |
| `leadDays: null` | **ASSUMED** | null prints "as far in advance as possible"; a number prints "Please deliver by <date>" counted back from the performance date |
| `kit` label — Gretsch 4-pc | **ASSUMED** | the photo says Gretsch, the tech's example said Yamaha |
| `bassamp` — Ampeg 8×10 | **ASSUMED** | |
| `gtramp1`, `kb1`, `kb2` — "model TBD" | **ASSUMED** | left as written; they print verbatim, so do not invent models |
| `micstand` 8, `musicstand` 20, `di` 8, `power` 6 | **ASSUMED** | only used to flag "more than Somewhere Works has" |
| `riser` count 0 | **ASSUMED** | unknown whether Somewhere Works owns any |
| `monitorMixes: 5`, `consoleChannels: 32` | confirmed | `warnChannelsAt: 28` is our own headroom line |

Confirmed: 5 wedges / 5 mixes typical with extras possibly from Shocker
Studios, a 32-channel console, monitors shared for most groups, everything on
the deck movable, no acoustic piano.

`shortName` is "Somewhere Works" — the short form of `name`, which carries the
room ("Somewhere Works — The Lot"). It appears in the warning banners, the
Wedges tab and the email text. The printed house-equipment list deliberately
does *not* use it: an over-count reads "— house has 8", because that column is
narrow, the bullets already carry long verbatim model names, and the tech cares
that the house has 8 rather than what the house is called. Spelling it out
there wrapped bullets and pushed Group B onto a second page.

Download filenames keep the `SW-plot-…` / `SW-showcase-…` prefixes: nothing
parses them, they sort together in a Downloads folder, and renaming would only
affect new saves.

### Changing the deck

Edit `VENUE.deck` — one line. Templates and the layout engine work in
**fractions** of the deck, so every template re-lays out proportionally. Saved
plots keep their own `deck` and their own inch coordinates, so old files never
shift; a plot's deck is editable per-plot in the Details tab. Run
`node check.js` afterwards: it verifies proportional re-layout, that nothing
starts off the deck, and that no two footprints share a square foot.

## ROLES — the instrument library

`ROLES` is the single place instrument knowledge lives. To teach the app a new
instrument, add a row; nothing else in the file enumerates instruments.

```js
{ id:"trumpet", label:"Trumpet", short:"Tpt", family:"brass",
  grp:"horn", sub:10,            // where its channels sort
  stance:"seated",               // "standing" | "seated" | "object" (the gear is the marker)
  w:22, d:22,                    // footprint in inches
  backline:"gtramp1",            // a VENUE.house id this role implies (optional)
  gearSide:"up",                 // "up" = amp behind the player, "down" = keyboard in front
  zone:"front",                  // "front" | "front-center" | "rhythm" | "mid"
  inputs:[{ source:"Trumpet", type:"mic", phantom:false }] }
```

- `family` drives row packing (`voice`, `sax`, `brass`, `rhythm`, `strings`,
  `other`); `grp`/`sub` drive channel order; they are deliberately separate.
- `pick` is the longer name shown in the instrument picker when `label` is the
  short table-friendly one ("Drums" / "Drum kit").
- **Backline is implied, not placed by hand**: guitar → house amp, bass and
  upright → house rig, keys → house keyboard 1, organ → keyboard 2 (Somewhere Works
  has no acoustic piano, so piano *is* a house keyboard), drums → the house kit. A
  `stance:"object"` role like the kit *is* its gear: the position draws as the
  kit and no separate item exists, which is why two drummers on one kit give
  one set of channels. `kitPieces()` draws the kit in plan view inside that
  footprint — kick at the downstage edge with its resonant head to the
  audience, snare and toms behind it, floor tom and ride to the drummer's
  right, hats to their left, and the drummer as a solid mark at the back with
  a tick for which way they face. Cymbals are thinner than drums rather than
  dashed: dashed means "the band brings it" on this page. The name sits under
  the kit like every other position's, so the drawing has the footprint to
  itself.
- Custom roles: the Positions tab's "custom role…" writes into
  `plot.customRoles`, so an odd instrument travels inside the saved file and
  needs no code change. `roleDef()` looks there first.
- Doubles are generic: `position.doubles = [{roleId, input}]`. They print on
  the diagram (`Alto / Flute`) and add channels only when `input` is true. A
  double's channel sorts under the double's own role, not the position's.

`ROLE_MATCH` turns free text into a role id ("Sam — bass trombone"), most
specific pattern first. It is used by bulk name entry and the v1 migration.

## Channel ordering

Auto-assigned in this order, and this is the rule to keep: **drums, bass,
guitars, keys, horns, strings, vocals**, then anything else. Horns run low to
high: bari, tenor, alto, soprano, clarinet, flute, tuba, bass trombone,
trombones, horn section, trumpets. Within a group, position order.

- One **unit** = one input as the director edits it. A stereo DI is one unit
  that eats two channels and prints as two rows (Keys L / Keys R).
- Reordering (↑/↓ in the Inputs tab) freezes the order into
  `plot.channelOrder`; new inputs land at the end; "reset to automatic order"
  clears it.
- Drum mics are in console order — kick, snare, hat, tom 1, tom 2, OH L, OH R.
  "Jazz minimal" is kick, snare, 2 OH.
- Everything else on the page derives from the input list too: DI count (a
  stereo DI counts as 2 boxes), boom stands (one per mic that isn't a rhythm
  role's — amp and drum mics are the tech's own choice), and the header total.

## Templates

Five shapes, deliberately few: the main page can add and drop positions in one
click, so a template only needs to get you into the right ballpark. Anything
more specific (a little big band, a funk horn line, a vocal jazz group) is the
instrumentation form or three clicks of the quick-add chips.

`TEMPLATES` is a list of instrumentation **shapes**, not rosters:

```js
{ id:"funk", name:"Funk / soul band", note:"rhythm section plus a horn line",
  parts:[["voice",1],["alto",1],["tenor",1],["trumpet",1],["trombone",1],
         ["guitar",1],["keys",1],["bass",1],["drums",1]] }
```

A part is `[roleId, count]`, or `[{roleId, doubles:[…]}, count]` when the shape
implies a double (the solo act is one voice doubling acoustic guitar). Adding a
template is adding an entry. The instrumentation form (Path B) is the same
thing built by hand, and it reconciles against an existing plot — raise the
trumpet count and a Tpt 3 appears, lower it and the last one goes.

## The layout engine

Hand-authored layouts can't survive arbitrary instrumentation, so `autoLayout()`
places everything from the role library. Conventions live in one commented
block above `LAYOUT` and are meant to be argued with:

- Rows pack front to back in score order: voices downstage, then saxes, then
  low brass, then high brass, then strings and oddments.
- Within a row, chairs run stage-left to stage-right in channel order, so the
  bari sits nearest the rhythm section as a big band sits. **Lead chairs are
  not centred** — see deferred.
- Five or fewer horns merge into a single front line instead of thin rows.
- The rhythm section owns the upstage band: kit upstage centre, bass stage
  left, guitar stage right, keys downstage of them. With **eight or more
  horns** the band is treated as a big band: the rhythm section moves into a
  stage-left column (`LAYOUT.rhythmBig`) and the horn rows take the rest of
  the deck at full depth.
- `plot.rhythmPlan` picks between two standard arrangements, because combos
  argue about this one: `"drums-centre"` (the default — kit upstage centre,
  bass out at the stage-left edge) and `"bass-centre"` (the two swapped,
  `LAYOUT.rhythmSwapped`). The toggle is on the Positions tab and only shows
  for a band that has both and isn't a big band. Flipping it unpins the
  rhythm players so they move, and leaves everything else alone.
- Amps sit behind their player, keyboards in front of theirs.
- Wedges land downstage of the group they serve; a group parked upstage would
  otherwise put its wedge inside the row in front, so those go outboard at the
  end of their row.
- Everything is a fraction of the deck, so a new `VENUE.deck` re-lays out every
  template proportionally.
- `resolveOverlaps()` then walks every object in a fixed order and nudges
  anything overlapping or off-deck along a deterministic spiral. Dragged
  objects go first and never move; the rest pack around them. If something
  can't be placed it is counted in `plot.layoutStuck` and shows as a warning
  rather than silently overlapping.
- Rows tighten to `LAYOUT.minSpacing` before they give up, and say so
  (`plot.layoutNote` → an amber banner).

Same instrumentation always yields the same layout; `check.js` asserts it.

## Monitor mixes

**Mixes are dealt once.** `layoutWedges()` builds them when the plot is
created and when the re-layout button runs, and never again on its own.
Adding an instrument later does not conjure a sixth wedge or redeal the
existing five: the new position simply has no mix, and says so in the
Positions tab and in the "No wedge assigned" line on the printed page. That
line is the feature — who shares a wedge is the director's call, not the
engine's. Wedges nobody has dragged still follow the players they serve, so
the drum wedge moves when the rhythm arrangement flips.

`monitorGroups()` builds groups in priority order — voices, drums, bass,
guitar, keys, sax row, trombones, trumpets, strings, other — then merges the
smallest adjacent pair until they fit `VENUE.monitorMixes`. Voice groups carry
a weight so the lead vocal is the last mix anyone is made to share. A big band
comes out as rhythm / sax / sax / trombones / trumpets; a five-piece gets one
each.

## Schema and migration

`schemaVersion: 2`. `migratePlot()` reads anything: a v2 file passes through
normalised, a v1 file (no `schemaVersion`) goes through `migrateV1()`.

v1 stored named people plus items that carried the inputs; v2 stores positions
that carry their own. The migration walks the v1 **items in order** so channel
numbers come out identical, and:

- a v1 person marker becomes a position, keeping its exact x/y and inputs;
- a chair item everybody rode (the kit) becomes one position with every
  occupant's name on it;
- gear owned by someone (amp, keyboard) stays an item and hands its inputs to
  its owner's position, tagged with the role they belong to, so "keys/vocals"
  still sorts Keys L, Keys R, Vocal exactly as v1 printed it;
- orphan gear keeps its own inputs (`item.inputs` still counts);
- wedges, requests, songs and `channelOrder` come across by id.

Everything migrated is marked `moved:true` — a v1 plot was laid out by hand, so
the engine leaves it exactly where it was drawn. v1 **share links** open the
same way: the hash decodes to plot JSON and goes through the same migration.

`samples/v1/` holds the original v1 files as migration fixtures plus
`expected.json` (channel list, monitors, house needs captured from v1 before
the refactor). `check.js` re-derives all of it after migrating and fails on any
difference — that is the "renders identically" guarantee.

## URL-hash encoding — decision

`#s=<base64url of raw-deflated JSON>` via the browser's built-in
`CompressionStream("deflate-raw")`. Measured on the v1 samples: a big band was
6.5 KB of JSON, 8.7 KB base64 uncompressed, **1.5 KB deflated** — the brief's
"store it uncompressed if it stays under ~8 KB" doesn't hold, and a 9 KB link
is unpleasant to text. No hand-rolled inflate: the API is native in Chrome
103+, Safari 16.4+, Firefox 113+. Older browsers get `#j=` (uncompressed) when
*writing* a link, and a `#s=` link opened without `DecompressionStream` says so
and asks for the `.json`. The hash carries the whole session, so a showcase
link opens every plot and its changeover sheets, read-only.

## The start screen

Three sections, in this order: **Build the instrumentation** (the form, plus a
blank plot), **Start from a shape** (the five templates), **Open something**
(Load a `.json`, or drop one anywhere on the page). Building comes first
because it is the general path — the templates are a shortcut, not the point.

There is no Examples list. It fetched `samples/*.json`, which are gitignored,
so it found nothing on the deployed site and only worked on a local server —
a button that fails for everyone but one person. The saved plots still open
through Load, and dropping a file on the page works anywhere.

## What prints

One US Letter portrait page where it fits — every sample plot but the big
bands does, and the big bands run to two, which the brief allows. Header, diagram, two columns (monitors, house equipment, musicians
provide, DI boxes on the left; input list on the right), then personnel by song
if any, notes, and the delivery line. Body text is 10 pt and diagram labels are
12 pt **at any deck size** — type sizes are computed back through the print
scale, so changing `VENUE.deck` never shrinks names below the tech's
legibility line.

The preview's "≈ 1 page" is measured from the rendered height, not the
browser's own pagination — a good guide, not gospel.

## Deferred — not built, on purpose

From the v1 brief, still deferred: per-person monitor requests for IEMs; mic
model selection per input (techs choose their own); lighting and video-capture
areas; importing rosters from the ensemble Airtable base; a venue-editor UI for
`VENUE` (editing the object is fine).

Decided during v1, still true: drag from the palette onto the canvas (click
drops it centre-deck instead); drag to reorder the input list (↑/↓ buttons,
which also work on a touchscreen); automatic mic and music stands on the
diagram (counted, not drawn); print-all-plots in one go; reordering changeover
transitions other than by moving tabs.

New in v2:

- **Lead chairs are not centred.** A row runs in channel order stage-left to
  stage-right, so Tpt 1 sits at the rhythm-section end rather than in the
  middle of the row as a lead player usually does. It is one comparison in the
  row-packing loop; left alone until William says which he wants.
- **Row-to-row label crossings.** With three horn rows on a 12′ deck, a label
  can grazes the row in front (`check.js` prints these as "label crossings",
  currently 3–11″ overlaps). The white halo keeps them readable. A proper fix
  is per-row label sides, or leader lines.
- **No arbitrary rotation** — still 90° steps.
- **The instrumentation form doesn't reorder positions**; a role added later
  numbers after the existing ones.

## Open questions for William

1. **Big band channels.** 17 players with individual horn mics comes to
   **24** channels (7 drums + 1 bass + 1 guitar + 2 keys + 13 horns) — it never
   reaches the amber line at 28, let alone red at 32. The v1 brief expected it
   to. If real big band nights should carry doubles mics, solo mics for the sax
   and brass rows, or a vocal mic, they can be preset defaults.
2. **Big band seating**: rhythm section at true stage left per the brief, which
   is the audience's *right*; low chairs nearest the rhythm section.
3. **Upright bass implies the house bass rig** — change the role's `backline`
   if uprights usually go straight to a DI at Somewhere Works.
## Checks

`node check.js` — 195 assertions: the role library, every template (builds,
fits, deterministic, no two footprints in one place), the big band with no
names, building from counts, channel order and freezing, names on/off, bulk
name parsing, doubles and shared chairs, a custom role, the layout engine's
pinning and re-layout, deck re-layout, changeover, the v1 migration against
`samples/v1/expected.json`, the shipped samples, save/load round trip, and no
storage APIs or student names in `index.html`.

The migration section always checks `samples/v1/example-v1.json` against
`example-expected.json` (a golden file). When the real rosters are on the
machine it checks those too and says so; on a fresh clone it says it skipped
them.

`node check.js --samples` rewrites `samples/*.json` by migrating whichever real
`samples/v1/` files are present — a local operation, since neither side is
committed.

The fall 2026 WSU ensembles — Group A/B/C, Combo A/B/C, Big Band — exist as
saved plots on William's machine: examples to load and edit, not app structure,
and not in the repo.
