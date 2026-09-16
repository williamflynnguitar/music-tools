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
       soundcheckDate, soundcheck, soundcheckOrder, startTime, setOrder,
       deck, positions[], items[], wedges[], songs[], customRoles[],
       sections{}, sectionsIncludeUnmiked, channelOrder }
Position { id, roleId, x, y, rot, moved, names[], doubles[], inputs[], notes, byo[], pkg }
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

Everything reads from it: templates, warnings, the house-equipment list, the
delivery line. The backline was read off the real gear in September 2026; the
counts and the deck are still placeholders.

| Value | Status | Notes |
|---|---|---|
| `deck: {widthFt:24, depthFt:12}` | **ASSUMED** | tech is measuring. See "Changing the deck" |
| `deliverTo: timothy.shade@wichita.edu` | confirmed | William, 2026-09-15. Prints in the delivery line at the foot of every page, and the Email button addresses it. This is the plot's one fixed contact |
| `leadDays: null` | **ASSUMED** | null prints "as far in advance as possible"; a number prints "Please deliver by <date>" counted back from the performance date |
| `kb1` — Korg SV-2S 88 | confirmed | ≈54″ × 15″ |
| `kb2` — Nord Stage 4 88 | confirmed | ≈51″ × 14″ |
| `gtramp3`, `gtramp4` — Fender Deluxe Reverb (1) and (2) | confirmed | ≈25″ × 10″ |
| `bassamp` head — Markbass Little Mark Tube 800 | confirmed | ≈24″ × 20″ with the cab |
| `gtramp1`, `gtramp2` — Vox AC combo, black and red | **ASSUMED** model | AC15C1 or AC30C2, not yet read off the back panel. The colour is what the label says, because the colour is how the tech tells them apart |
| `bassamp` cab — Markbass 4×10 | **ASSUMED** model | the head is confirmed, the cab is not |
| `kit` label — "House drum kit" | confirmed | no model: the house has several kits (Tim Shade, 2026-09-16). A drums position chooses House kit / Bring your own (`pos.kit`) and may name it (`pos.kitLabel`) |
| `micstand` 8, `musicstand` 20, `di` 8, `power` 6 | **ASSUMED** | only used to flag "more than Somewhere Works has" |
| `riser` count 0 | **ASSUMED** | unknown whether Somewhere Works owns any |
| `monitorMixes: 5`, `consoleChannels: 32` | confirmed | `warnChannelsAt: 28` is our own headroom line |

Footprints are approximate on purpose: they only have to draw at a sensible
size on a 24′ deck, and the tech is not measuring off this page.

**No mics come with the house gear** (2026-09-15). The mics on the amps in the
photos live in the rehearsal rooms and do not travel to the deck, so no house
item carries `inputs`, none names a mic, and the printed house-equipment list
never implies one. A player is miked the same way everything else is miked:
by hand, with **+ mic** in the Positions tab. `BYO_KINDS` carried a dead
`inputs` field from v1 — `byo-gtramp` "arrived" with an amp mic that nothing
ever read, since `addByo()` always writes `inputs:[]`. It is gone rather than
left to be wired up by mistake.

### Backline is a kind, not a named amp

A role's `backline` names a **category** — `gtramp`, `keys`, `bass`, `kit`, the
keys of `BACKLINE_CATS` — and each house item carries the category it belongs
to as `bcat`. `pickBackline()` hands out the first item of that category the
plot is not already using, so two guitarists get the black Vox and the red Vox
rather than one amp booked twice, and two keys players get the Korg and the
Nord. **The order inside `VENUE.house` is the preference order**: Korg before
Nord, the Voxes before the Deluxe Reverbs. `organ` additionally carries
`backlinePrefer:"kb2"`, so an organ still takes the Nord when it is free and
old plots come out exactly as they did.

- **The swap.** Select a house amp or keyboard and the inspector offers the
  others of its kind. The swap keeps the owner, the spot on the deck and the
  pinned state; picking one another player already has exchanges the two
  rather than sending both to the same box. Re-layout leaves it alone because
  `findBackline()` matches on **owner and category, never on the id** —
  matching on the id is what would silently undo the director's choice.
- **The over-count is about the category.** Five guitarists exhaust four amps,
  so the fifth doubles up and the warning reads "5 × House guitar amp needed;
  Somewhere Works has 4" — one fact about the category rather than an
  argument about one amp. Categories holding a single item (the kit, the bass
  rig) keep the old per-item wording.
- **Migration.** `settleBackline()` runs on load, on both the v1 and v2 paths.
  A file that put two guitarists on `gtramp1` — which every file saved before
  this change did — comes back as `gtramp1` + `gtramp2` and stops printing an
  over-count that is no longer true. Ids are unchanged otherwise, so saved
  plots and share links still open and simply pick up the real labels. Only
  gear that belongs to a player is settled: an extra amp placed by hand from
  the House tab is a deliberate ask and keeps the box it names.
- **House gear is shared between sets and never conflict-checked.** Two plots
  in one session on the same Deluxe Reverb is normal at Somewhere Works and
  raises nothing; the changeover sheet treats an amp that stays in place as
  staying, whichever ensembles the two plots belong to. Structurally this
  cannot go wrong by accident: `warnings()` lives in the engine block, which
  has no access to `S.plots` at all.

## Where a plot goes, and who leads the band

Every plot is delivered to Tim Shade: the foot of every printed page reads
*Please deliver to timothy.shade@wichita.edu as far in advance as possible*
(`deliverLine()`, off `VENUE.deliverTo` and `leadDays`), and the Email button
opens a `mailto:` to the same address. That line is the plot's fixed contact.
There is deliberately **no separate contact block at the top of the page** —
the first cut of this (2026-09-15) printed *Contact: Tim Shade, Director, WSU
School of Music* under the ensemble name, which read as though Tim led every
band. William had it removed the same day.

`p.director` is the **band leader/director** — that wording, in the Details
tab, the meta row and the email text, because acts from outside the School of
Music load in here too and "ensemble director" is a school word. It is
optional, and the meta row omits it rather than printing a dash.

### The soundcheck and the performance: day, block start, place in the block

The tech needs three things for each event (William, 2026-09-15): what day
it is, when the block starts, and where this band falls in it. Six per-plot
fields, all optional, in two matching groups on the Details tab:

| | day | block starts | place in the block |
|---|---|---|---|
| Soundcheck | `soundcheckDate` | `soundcheck` | `soundcheckOrder` |
| Performance | `date` | `startTime` | `setOrder` |

The days are date inputs; the times are free text ("5:30 PM", "after Combo
B" — a time input would force a format nobody writes on a call sheet); the
orders are 1 = first. `date` kept its old name because every saved file
carries it. `scheduleLines()` turns them into the two lines the meta row and
the email text both print — *Soundcheck: 2026-11-14 · 5:30 PM · 2nd up*
and *Performance: 2026-11-14 · 7:30 PM · 3rd up* — one function for both
surfaces so they cannot disagree. **Both lines always print**: a soundcheck
nobody has filled in reads *Soundcheck: —*, because a missing soundcheck is
something the tech should see rather than something the page hides. A slot
left empty simply leaves its place. `orderNum()` settles whatever a file
carries to a positive integer or `null` ("2nd" → 2, "0" → null) and
`ordinal()` spells it, 11th–13th included. Files from before the fields
existed load with them empty; `check.js` covers the v1 and v2 paths.

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
  backline:"gtramp",             // a BACKLINE_CATS category this role implies (optional)
  gearSide:"up",                 // "up" = amp behind the player, "down" = keyboard in front
  zone:"front",                  // "front" | "front-center" | "rhythm" | "mid"
  pkgs:"horn",                   // which PKG_SETS entry names its setups
  start:"none" }                 // the package a new player gets — never one with a mic
```

- `family` drives row packing (`voice`, `sax`, `brass`, `rhythm`, `strings`,
  `other`); `grp`/`sub` drive channel order; they are deliberately separate.
- `pick` is the longer name shown in the instrument picker when `label` is the
  short table-friendly one ("Drums" / "Drum kit").
- **Backline is implied, not placed by hand**: guitar → a house guitar amp,
  bass and upright → the house rig, keys and organ → a house keyboard (Somewhere
  Works has no acoustic piano, so piano *is* a house keyboard), drums → the
  house kit. The role asks for a *kind* and the plot hands out one it isn’t
  already using — see "Backline is a kind, not a named amp". A
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

## Mics: set by hand, per player

**Amplification is a choice, not an assumption.** v1 miked everything it could:
place a kit, get seven channels. That inflated the count, made the console
warnings meaningless, and put things on the tech's list nobody was going to
patch. Worse, a source missing from the input list was ambiguous — acoustic by
decision, or forgotten?

**The director sets mics by hand** (William, 2026-09-14). Every row in the
Positions tab's On stage list carries **+ mic** and **− mic**, and says what the
player has ("2 mics · DI", "not miked"). `addMic()` names the new mic the way
the role's own setups name it — a kit fills in Kick, Snare, Hi-hat, Tom 1… in
order; a guitar's is an amp mic; a voice's is Vocal — and `removeMic()` takes
the player's last mic away, never a DI. Renaming a mic, adding a DI or removing
a specific input is in the inspector (edit), one row per input with ×.

**Nothing starts miked** (William, 2026-09-14). No template, no blank plot and
no player added later — an unrecognised "Other" included — arrives with a mic, and no horn row starts on section
mics. A DI source keeps its DI — keys, organ, bass, upright, acoustic guitar,
violin, cello, DJ and playback — because an electric instrument with nothing plugged
in isn't a choice anyone is making. Every template therefore opens at a
couple of channels (the jazz combo and the big band are both **2**: keys and
bass) with everything else listed under Not miked, and the director builds the
input list up from there.

Where this came from, so it isn't rebuilt by accident: the amplification
amendment gave the plot three profiles (acoustic-leaning / light
reinforcement / fully miked), let each template pick one, and put the profile
buttons on the Positions tab, a per-player package dropdown in the inspector,
and "full kit (7)" / "jazz minimal (4)" buttons on a kit. William removed all
of it in one afternoon in favour of + mic / − mic, then removed the channel
warning's suggested cuts, then the templates' starting mics. `PROFILES`,
`applyProfile()`, `role.pkgDefaults`, `plot.ampProfile` and `pos.pkgOverride`
are gone; `migratePlot()` strips the last two from files saved while they
existed.

What survives is the **package** vocabulary, because it still names a
player's setup. A role offers packages (`PKG_SETS`, chosen per role by `pkgs`)
and a position records the one its inputs amount to in `pos.pkg`. Sets: `kit`
(none / kick / kick+OH / kick+snare+OH / +hat / full close-mic), `amp`
(none / amp mic / DI / DI+mic), `keys` (none / mono / stereo), `horn`
(none / individual mic), `voice`, `pickup` (none / DI / mic / both), `simple`,
`section`, `line`. Packages are how `inferPackage()` reads an old file, how the
Not miked section words its reason ("acoustic", "amp not miked"), and what
`addMic()` borrows its mic names from. `role.start` is the package a new
player gets — `none`, or the DI package for a DI source (keys start **mono**,
which William kept). Any hand edit re-reads `pos.pkg` with `inferPackage()`;
it is `null` when the inputs match no package, and nothing depends on it.

A double ticked "own channel" gets `doubleInputs()`: the DI the role would
start with, or one mic. Ticking the box is the director asking for the
channel, so that one is not a starting mic; the duo template's acoustic
guitar double brings only its DI.

A shared **section** mic is a row-level thing — `plot.sections` — because it
covers a group, not a position. A row is every horn of that kind on stage,
miked or not (`sectionRows()`), so ticking "Sax section" on the Inputs tab is
how an unmiked row gets two shared mics. A section folds away only the mics of
players *in* that row: a vocalist doubling tenor on their own channel keeps
it when the sax section is ticked.

Files saved before 2026-09-14 were written when a row held only horns with a
mic, so a ticked section on a row the director had unmiked by hand printed
nothing. `settleOldSections()` clears those ticks on load, so the file prints
what it printed before, and marks the plot `sectionsIncludeUnmiked: true`.

**Not miked is printed, not implied.** `notMiked()` lists every position with
nothing reaching the console — "Drums (acoustic)", "Vox (not miked)" — under
the input list on the page and in the email text, and each carries a ⊘ on the
diagram. A fully-miked plot prints no such section. A position covered by its
row's section mics is not unmiked. Two or more silent players collapse to
"Sax section (acoustic)" only when the row is a real section (`SEC_CORE`:
saxes; trombones; trumpets and flugelhorn) and nobody in it has any input — a
flute and a clarinet, or a row where someone's double has a mic, are named one
by one.

**The channel warning states the count and stops there.** Amber past
`VENUE.warnChannelsAt`, red past the console. It used to offer one-click cuts
("Sax section on 2 shared mics −3", "Drums to kick, snare + overheads −3");
William had them removed on 2026-09-14 — the director makes the cuts with
+ mic / − mic and the section-mic setting.

Reading an older file: `inferPackage()` matches a position's inputs against its
role's packages, so a v1 kit with its seven channels lands on `close` rather
than a broken state. A v1 plot keeps every input it had — nothing about
starting mics touches a file that already has inputs.

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
- Within a row, chairs run stage-left to stage-right in channel order.
  **Lead chairs are not centred** in a small band — see deferred.
- Five or fewer horns merge into a single front line instead of thin rows.
- The rhythm section owns the upstage band: kit upstage centre, bass stage
  left, guitar stage right, keys downstage of them. With **eight or more
  horns** the band is treated as a big band and seated the way William sets
  one up (2026-09-14). Page left to right, which is stage right to stage left:

  | row | seats |
  |---|---|
  | back | bass rig in the corner, drums, Tpt 2, Tpt 1, Tpt 3, Tpt 4 |
  | middle | keys (keyboard turned vertical), Tbn 2, Tbn 1, Tbn 3, Tbn 4 |
  | front | Gtr, Tenor 1, Alto 1, Alto 2, Tenor 2, Bari |

  `bigBandSeats()` gives each section row its chair order and its lead chair;
  the rows then share columns so **Alto 1, Tbn 1 and Tpt 1 line up**, and
  every chair lines up with the rows behind it. The guitar takes the column
  just stage right of Tenor 1. The keyboard is rotated 90° and sits stage left
  of its player, who is on the wall side facing the band — so it runs
  upstage-downstage just behind and to the side of the guitar, since the kit
  and the guitar amp fill the space directly behind. Generalised: brass reads
  lead-second (2 1 3 4 5…), with bass trombone, tuba and flugelhorn at the far
  end; saxes read Tenor 1, the altos, soprano/clarinet/flute, the remaining
  tenors, bari. The rhythm block is `LAYOUT.rhythmBig`; the horn columns start
  at `LAYOUT.bigBandColumn` of the width.
- `plot.rhythmPlan` picks between two standard arrangements, because combos
  argue about this one: `"drums-centre"` (the default — kit upstage centre,
  bass out at the stage-left edge) and `"bass-centre"` (the two swapped,
  `LAYOUT.rhythmSwapped`). The toggle is on the Positions tab and only shows
  for a band that has both and isn't a big band. Flipping it unpins the
  rhythm players so they move, and leaves everything else alone. **The two
  buttons read "Drums center" and "Bass center"; the values keep the British
  spelling.** `rhythmPlan` is written into every saved file and share link,
  so respelling the value would quietly flip an old `bass-centre` plot back
  to drums — spell the label, never the value. UI text is American (William,
  2026-09-15); the changeover sheet's footer, the only other user-visible
  "centre", reads center too.
- Amps sit behind their player, keyboards in front of theirs — except the
  big band's vertical keyboard, above.
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
Adding an instrument later does not conjure a wedge or redeal the existing
ones: the new position simply has no mix, and says so in the Positions tab
and in the "No wedge assigned" line on the printed page. A blank plot stays
at zero wedges no matter how many instruments go into it — the first
version of this fix still dealt mixes when a plot had none, which meant
building a band from blank grew a wedge on the first instrument. That
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
bands does, and the big bands run to two, which the brief allows. Header, diagram, a key, two columns (monitors, house equipment, musicians
provide, DI boxes on the left; input list on the right), then personnel by song
if any, notes, and the delivery line. Body text is 10 pt and diagram labels are
12 pt **at any deck size** — type sizes are computed back through the print
scale, so changing `VENUE.deck` never shrinks names below the tech's
legibility line.

**The key** (added 2026-09-14, when William pointed out nobody would read ⊘)
sits under the diagram on the page and under the canvas on screen. It lists
only what this plot draws — `legendKeys()` decides, `legendHTML()` draws the
swatches — so a fully miked band's key never mentions not miked and a plot
with no band-brought gear has no dashed box. Labelled things (DRAPE, PA,
AUDIENCE, the names) aren't keyed; they already say what they are. Keep an
entry's words short: the key has to stay on one line on a big band's page.

The diagram's frame has a deeper bottom margin (`DRAW.marginBottom`) than its
sides, to hold the PA stacks and the AUDIENCE label; until 2026-09-14 both were
drawn outside the frame and never printed. The margin is as tight as it can be
while a big band's page still fits on one sheet — check that before growing it.

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

- **Lead chairs are not centred in a small band.** Below eight horns a row
  runs in channel order. The big band has William's seating (lead second from
  the rhythm section, lead column lined up); a combo does not.
- **Row-to-row label crossings.** With three horn rows on a 12′ deck, a label
  can grazes the row in front (`check.js` prints these as "label crossings",
  currently 3–11″ overlaps). The white halo keeps them readable. A proper fix
  is per-row label sides, or leader lines.
- **Rotation is 45° steps, not arbitrary** (was 90° until 2026-09-16, when
  William wanted the kit and the keyboard angled). R and the rotate button add
  45°, shift-R takes it back. `rectOf()` is the axis-aligned bounds of the
  rotated footprint — exact at right angles, the diagonal at 45° — so the
  overlap and off-deck checks stay honest; item labels lie along the item at
  `labelAngle()`, folded so they never read upside down.
- **The instrumentation form doesn't reorder positions**; a role added later
  numbers after the existing ones.

## Open questions for William

1. **Big band channels.** 17 players with individual horn mics comes to
   **24** channels (7 drums + 1 bass + 1 guitar + 2 keys + 13 horns) — it never
   reaches the amber line at 28, let alone red at 32. The v1 brief expected it
   to. Nothing starts miked now, so this is only a note on the arithmetic: a
   big band that wants doubles mics or solo mics adds them by hand.
2. **Big band seating** — settled by William, 2026-09-14 (see the layout
   engine). It moved the rhythm section from stage left, where the v1 brief
   had it, to stage right. He described the trumpets once as "4, 3, 2, 1" and
   once as "2, 1, 3, 4" left to right; the engine uses 2 1 3 4, which also
   puts Tpt 1 in line with Alto 1 and Tbn 1 as he asked.
3. **Upright bass implies the house bass rig** — clear the role's `backline`
   if uprights usually go straight to a DI at Somewhere Works. (The Vox models
   and the Markbass cab are the other things still to read off the gear; they
   are marked `ASSUMED` in the VENUE table and print verbatim, so do not guess.)
4. **Which sources start on a DI** (`start` on each role) is my reading:
   bass, upright, acoustic guitar, violin and cello start on their DI or
   pickup; keys and organ on a mono DI; DJ and playback on a stereo DI.
   Everything else starts with nothing. One line each.
5. Miked the way the old "fully miked" profile did it (`FULLY_MIKED` in
   `check.js`), the 17-piece big band totals **25** channels — still inside a
   32-channel console, so it raises no channel warning.
## Checks

`node check.js` — 354 assertions: the role library, every template (builds,
fits, deterministic, no two footprints in one place), the big band with no
names, building from counts, channel order and freezing, names on/off, bulk
name parsing, doubles and shared chairs, a custom role, the layout engine's
pinning and re-layout, deck re-layout, changeover, the v1 migration against
`samples/v1/expected.json`, the shipped samples, save/load round trip,
backline by category (two guitarists on two amps, five on an amber over-count
naming 4, Korg and Nord, an organ on the Nord, a swap surviving re-layout, an
old doubled `gtramp1` settling on load, two plots sharing an amp in silence),
the delivery address and the band leader/director wording, the soundcheck
and lineup fields, no mics on any house item, and no storage APIs or student
names in `index.html`.

`node print-check.js` measures the thing node cannot see: the printed page is
paginated by *rendered height*, so it drives a headless Chromium through
Playwright, renders `sheetHTML()` for every template and for the migrated v1
fixture, and fails if a plot that fitted one page before now runs to two. It
also confirms the delivery line to Tim Shade ends every page.
`check.js` runs it and reports what it found; with no Playwright on the
machine it exits 2 and check.js says it skipped, the way the local samples do.
`node print-check.js --shots <dir>` writes the same pages out as PNGs.

**Watch the bottom of the page.** A jazz combo with two guitarists, a long
director name and all six schedule fields filled — the fullest header a plot
can print — is the tightest single-page plot; `print-check.js` reports its
height each run. Naming the
real amps costs a bullet per amp in the house-equipment list, so a band with
four guitarists and two keyboard players can run to a second page where it
used to fit one. That is the arithmetic, not a bug; if it starts to bite, the
house-equipment column is where the room is.

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
