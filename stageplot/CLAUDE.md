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

A plot is a list of **positions**. Each position holds a role, a spot on the
deck, and — optionally — one or more names.

```
Plot { schemaVersion:2, name, director, date, showName, notes, printNames,
       soundcheckDate, soundcheck, soundcheckOrder, startTime, setOrder,
       deck, positions[], items[], wedges[], songs[], customRoles[] }
Position { id, roleId, x, y, rot, moved, names[], doubles[], notes, byo[], kit, kitLabel }
Item     { id, kind:"house"|"byo"|"label", ref, label, x, y, rot, moved,
           ownerPositionIds[] }
Wedge    { id, number, x, y, rot, moved }
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
  kit, rotating vocalists on one mic): one chair, one wedge, both names
  printed.
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
| `deck: {widthFt:24, depthFt:20}` | Tim Shade, 2026-09-16 | the published spec says 20 × 20 of 4 × 8 platforms; Tim doesn't think it is square and calls it 24 wide × 20 deep. Other venues: the Details tab edits a plot's own deck. See "Changing the deck" |
| `deliverTo: timothy.shade@wichita.edu` | confirmed | William, 2026-09-15. Prints in the delivery line at the foot of every page. This is the plot's one fixed contact |
| `leadDays: null` | **ASSUMED** | null prints "as far in advance as possible"; a number prints "Please deliver by <date>" counted back from the performance date |
| `kb1` — Korg SV-2S 88 | confirmed | ≈54″ × 15″ |
| `kb2` — Nord Stage 4 88 | confirmed | ≈51″ × 14″ |
| `piano` — House upright piano | confirmed there is one (William, 2026-09-17) | footprint ≈58″ × 24″ **ASSUMED**, a typical upright, not measured. Keys backline like the two keyboards, but last in the category, so a keys player takes it by swap, from the House tab, or as the third keyboard; `acoustic:true` — it is miked, never DI'd |
| `deluxe` — Fender Deluxe Reverb, `count:2` | confirmed | ≈25″ × 10″. One model with a count, not two named boxes (William, 2026-09-16) |
| `bassamp` head — Markbass Little Mark Tube 800 | confirmed | ≈24″ × 20″ with the cab |
| `vox` — VOX AC combo, `count:2` | **ASSUMED** model | AC15C1 or AC30C2, not yet read off the back panel; one black, one red, but the plot never says which — the choice on offer is a VOX or a Fender, or bring your own (William, 2026-09-16). Written VOX, in caps, everywhere it is drawn or printed: "Vox" is the vocalist's chair |
| `bassamp` cab — Markbass 4×10 | **ASSUMED** model | the head is confirmed, the cab is not |
| `kit` label — "House drum kit" | confirmed | no model: the house has several kits (Tim Shade, 2026-09-16). A drums position chooses House kit / Bring your own (`pos.kit`) and may name it (`pos.kitLabel`) |
| `mic` 8, `musicstand` 20, `di` 8, `chair` 40 | **ASSUMED** | only used to flag "more than Somewhere Works has" |
| power strips, risers | removed 2026-09-16 | Somewhere Works handles power; there are no risers. An old file's power/riser items are dropped on load |
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
plot has room on — a house item is a model with a `count`, so two guitarists
get the two VOX combos and a third the Deluxe Reverb, and two keys players get
the Korg and the Nord. **The order inside `VENUE.house` is the preference
order**: Korg before Nord, VOX before the Deluxe Reverb. Files saved with the
old four amp ids (`gtramp1`–`gtramp4`) are renamed on load (`renameOldAmps`). `organ` additionally carries
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
- **The house upright piano** (William, 2026-09-17: there is one, usable
  instead of or as well as the keyboards). A house item in the keys category,
  `piano`, after the Korg and the Nord, so nothing changes for a plot that
  never asks for it: two keys players still get the two keyboards, a third
  gets the piano rather than an over-count, and the category's over-count
  reads "House keyboard / piano … has 3". It is also **a chair of its own**:
  the `piano` role, "Upright piano" in the picker (William, the same day —
  the swap alone was not findable), with `backlinePrefer:"piano"`, so a
  pianist gets the piano and a second pianist falls back to a keyboard.
  The role carries `di:true` for exactly that fallback: on a keyboard the
  box is needed, on the piano `settleDI()` takes it away. The layout engine
  treats the role as keys — same slot, shared stagger, the big band's
  vertical turn — and it shares the keys monitor group. On a roster,
  "upright piano" / "acoustic piano" / "house piano" is the piano (matched
  before "upright", which is the bass); plain "piano" is still a keyboard. It carries `acoustic:true`, and
  that is the one thing the rest of the file reads: a piano is miked, not
  DI'd, so `settleDI()` takes away the DI box a keys player arrived with when
  they land on the piano and gives it back, beside the gear, when they go back
  to a keyboard. It runs only where the backline actually changes — the
  inspector's swap (both ends of a trade, every owner of a shared item), a
  fresh item from the layout engine, a load-time `settleBackline()` that
  moves a ref — never on a plain re-layout, so a DI box deleted on purpose
  stays deleted. One wrinkle in the load path: a pre-schema-3 file still
  holds its DI as `position.inputs` when `settleBackline()` runs, so
  `migratePlot()` settles any pianist again after `placeInputs()` has made
  the box; such a file predates the piano, so the only pianist it can hold
  is one the settle just put there (Copilot caught this on PR #12). Drawn like a
  keyboard but with the key lines as a strip along the player's edge and a
  fallboard line, the case plain behind it, so the page shows which way it
  faces; the name sits in the case at 0° and 180° and is centred like the
  Korg's at any other angle, where horizontal text would not fit the case.
  A mic added with the piano selected is labelled "Piano", not "Keys amp".
  The big band's vertical-keyboard rule turns it like any keys item.
- **House gear is shared between sets and never conflict-checked.** Two plots
  in one session on the same Deluxe Reverb is normal at Somewhere Works and
  raises nothing; the changeover sheet treats an amp that stays in place as
  staying, whichever ensembles the two plots belong to. Structurally this
  cannot go wrong by accident: `warnings()` lives in the engine block, which
  has no access to `S.plots` at all.

## Where a plot goes, and who leads the band

Every plot is delivered to Tim Shade: the foot of every printed page reads
*Please deliver to timothy.shade@wichita.edu as far in advance as possible*
(`deliverLine()`, off `VENUE.deliverTo` and `leadDays`). That line is the
plot's fixed contact.
There is deliberately **no separate contact block at the top of the page** —
the first cut of this (2026-09-15) printed *Contact: Tim Shade, Director, WSU
School of Music* under the ensemble name, which read as though Tim led every
band. William had it removed the same day.

`p.director` is the **band leader/director** — that wording, in the Details
tab and the meta row, because acts from outside the School of
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
carries it. `scheduleLines()` turns them into the two lines the meta row
prints — *Soundcheck: 2026-11-14 · 5:30 PM · 2nd up*
and *Performance: 2026-11-14 · 7:30 PM · 3rd up* — one function
surfaces so they cannot disagree. **Both lines always print**: a soundcheck
nobody has filled in reads *Soundcheck: —*, because a missing soundcheck is
something the tech should see rather than something the page hides. A slot
left empty simply leaves its place. `orderNum()` settles whatever a file
carries to a positive integer or `null` ("2nd" → 2, "0" → null) and
`ordinal()` spells it, 11th–13th included. Files from before the fields
existed load with them empty; `check.js` covers the v1 and v2 paths.

### Changing the deck

Edit `VENUE.deck` — one line. (24 × 12 → 24 × 20 on 2026-09-16, D1: the
diagram grew from 4.4″ to its cap (5.3″ then, 5.0″ since chairs and stands added lines) and the page paid for it with what
B1 and B2 removed — every template still prints on one page, the big band
at 873 of 960 px.) Templates and the layout engine work in
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
  grp:"horn", sub:10,            // how its family orders itself in a row
  stance:"seated",               // "standing" | "seated" | "object" (the gear is the marker)
  w:22, d:22,                    // footprint in inches
  backline:"gtramp",             // a BACKLINE_CATS category this role implies (optional)
  gearSide:"up",                 // "up" = amp behind the player, "down" = keyboard in front
  zone:"front",                  // "front" | "front-center" | "rhythm" | "mid"
  di:true }                      // reaches the console on a DI box (bass, keys, DJ…)
```

- `family` drives row packing (`voice`, `sax`, `brass`, `rhythm`, `strings`,
  `other`); `grp`/`sub` order a row; they are deliberately separate.
- **The big band spreads out** (2026-09-16): `bigBandColumn` went from .465
  to .39 so the section rows take more of the width, with the kit at .76
  and the bass and keys packed toward the stage-right wall to make room;
  `wedgeGap` went from 30″ to 44″ so a seated player's chair and label fit
  between the row and its wedge.
- **A row's labels take one side.** `labelBoxes()` groups players at the
  same depth and, if any label would have to flip upstage, flips the whole
  row (`positionLabelBox(…, force)`), so a section never reads with names
  above some chairs and below others.
- `pick` is the longer name shown in the instrument picker when `label` is the
  short table-friendly one ("Drums" / "Drum kit").
- **Backline is implied, not placed by hand**: guitar → a house guitar amp,
  bass and upright → the house rig, keys and organ → a house keyboard (piano
  means a house keyboard by default; the house upright piano is the last item
  in the keys category, so it is a swap, a House-tab add, or what a third
  keys player gets — see "The house upright piano"), drums → the house kit. The role asks for a *kind* and the plot hands out one it isn’t
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
  itself. **The footprint is the kit itself, 54″ × 52″, with no rug** (B3,
  Tim Shade 2026-09-16): the old 72″ × 60″ carpet, drawn filled, hid a wedge
  parked at the kick, which is exactly where he wants one. The kick's front
  edge is the footprint's front edge, so a wedge can touch it; the footprint
  is still there, invisible, to grab, and it outlines itself when selected or
  over the deck edge.
- Custom roles: the Positions tab's "custom role…" writes into
  `plot.customRoles`, so an odd instrument travels inside the saved file and
  needs no code change. `roleDef()` looks there first.
- Doubles are generic: `position.doubles = [{roleId}]` or `[{label}]`. They
  print on the diagram (`Alto / Flute`) and nothing more.

`ROLE_MATCH` turns free text into a role id ("Sam — bass trombone"), most
specific pattern first. It is used by bulk name entry and the v1 migration.

## No input list (B1, Tim Shade 2026-09-16)

The app used to carry a per-player input list — mics and DIs as attributes of
a position, packages, section mics, a frozen channel order, and a numbered
Input list on the page with a channel count in the header. Tim's sound team
never read it and no act was going to fill it in, so it is gone: the page
says where things go, and what reaches the console is counted from the mic
and DI objects placed on the deck (see "Mics and DI boxes", C1/C3). Nothing
carries `inputs`, `pkg`, `sections` or `channelOrder` any more, and a file
that has them loads without them — except a position's `inputs`, which ride
along untouched so the mic placement can turn them into objects on the deck.
`role.di` marks the instruments that reach the console on a DI box (bass,
upright, keys, organ, DJ, playback, acoustic guitar, violin, cello). Doubles
are a label on the diagram (`Alto / Flute`) and nothing more.

`VENUE.consoleChannels` (32) and `warnChannelsAt` (28) stay on record for
William to confirm with Mary Elliott (D3); the only thing that reads them now
is the count of placed mics and DIs.

## Mics and DI boxes are objects on the deck (C1/C2)

**Every microphone is a thing you place** (Tim Shade, 2026-09-16). A mic is
a house item with `ref:"mic"` — "Mic (on stand)", one object per physical
stand, so two trumpets sharing a mic is one mic labelled "tpt 1+2" — drawn as
the standard lollipop (`micGlyph()`) with its label under it. A DI box is
`ref:"di"`, drawn as a small box labelled "DI · bass". Both carry `label` and,
optionally, `ownerPositionIds`: an unlabelled mic reads as its owner's chair
(`micText()`), and gear that belongs to a player goes when the player goes.
There is no separate mic stand any more; a placed `micstand` in an old file
loads as a mic.

The **Mics & DIs** tab places them. Select a player or an amp first and the
mic lands at them, labelled for the chair ("Tpt 2", "Gtr amp"), then drag it
to where the stand goes; with nothing selected it lands centre-deck. The
tab's On stage list edits or removes each one. The mic'd-amp / DI'd-amp
distinction is just which object stands at the amp.

**A DI instrument arrives with its DI box** — `role.di`: bass, upright,
keys, organ, DJ, playback, acoustic guitar, violin, cello. `addPosition()`
adds it, owned by the player and labelled for the instrument; `placeDI()`
puts it on the stage-left side of the player's backline (or of the player)
until someone drags it. Mics never arrive on their own. The one exception
is a keys player on the house upright piano, which is miked: their box goes
when they take the piano and comes back when they leave it (`settleDI()`).

**The page counts them and nothing else counts them** (C3). Microphones — N
and DI boxes — N are two sections in the right column, one line per object
with the chair it belongs to (`micList()` / `diList()`). They are not in the
house-equipment list. The meta
row carries the one derived number, "Mics 3 · DI boxes 2", and
`consoleCount()` — one channel each — turns the banner red past
`VENUE.consoleChannels`; more mics than the house owns is amber. A mic'd amp
and a DI'd amp are told apart by which object stands at the amp.

**Migration** (`placeInputs()`, schema 2 → 3): a file that carried inputs on
its positions gets them back as objects — each mic 10″ downstage of its
player, spread 14″ apart, labelled as the input was; each DI beside the
player's gear, a stereo DI as two ("Keys L", "Keys R"); a ticked section as
its mics 24″ in front of the row, belonging to every player in it. All pinned
where they land. `migrateV1()` now hands a v2-shaped plot to `migratePlot()`,
which takes it the rest of the way, so v1 files get the same treatment.

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

## The venue's own objects on the deck (D2)

`VENUE.fixtures` — two PA columns, ground-stacked, on the deck at the
downstage edge a foot inboard of the corner truss posts (Tim's photo), and
two shallow stairs on the side edges: downstage on the stage-left edge,
upstage on the stage-right edge near the back (see "The stairs are
shallow"; "does not need to be 100%"). They exist so acts stop
putting gear on top of them. `venueFixtures(plot)` returns them for a plot on
the venue's deck and nothing for any other size, because another size is
another room. Drawn hatched with a label, `pointer-events="none"`, keyed as
"venue: PA, stairs"; the old PA boxes drawn outside the deck are gone.

The layout engine treats them as already placed: `resolveOverlaps()` starts
with their rectangles, a row starts inboard of any fixture on the stage-left
edge at its depth (`slClearance()`; the big band's section rows share the
widest clearance so their columns stay lined up), the bass-side rhythm slots
sit inboard of the stairs, and DI boxes are placed after the de-overlap pass
so they follow their gear's final spot. `check.js` lays every template out
and fails if anything lands on a fixture.

## Help and export (E1, E3, E4; update 2)

The inspector has rotate ⟳ (R) and rotate ⟲ (⇧R). A "?" in the top bar and
a "How it works" button on the New plot dialog open the same panel:
`helpSections()` is the one source of the prose and `helpHTML()` renders it
for both — never duplicate the text. It opens with the seven steps, read off
`RAIL_TABS` so the list cannot drift from the sidebar, then select and drag,
the two rotations, ⊗ and Delete, which way the kit faces, adding and
labelling a mic, wedge numbers, and sending it — including that the printed
plot carries a link to itself. Nothing opens itself on load — with no browser
storage it would open on every load; a guided first-run tour is deferred.
The one-click export is **Print / PDF**: the stage and the equipment sheet on
one Letter page, saved as PDF from the print dialog. Save (.json) and Share
link are the other two; there is no PNG. Email text — a plain-text copy for
a mailto — was removed 2026-09-16: it had no diagram, and the PDF and the
link cover it.

## Seated or standing (2026-09-16)

`pos.chairs` is how many chairs a player needs: 0 standing, 1 seated, 2 a
shared or double chair. Absent means the role's stance (`chairsOf()`), and
**the only seated roles are the keyboard players**, keys, piano and organ;
every other human stands in every configuration — combo, rock/pop, vocals, duo.
**A big band** additionally seats its saxes, trombones (bass trombone
included) and guitarist: when the winds reach `hornsForBigBand`,
`makeFromParts()` gives those a chair, so the template and the counts
builder agree; trumpets stand. William's list, 2026-09-16. A big band
asks for 11 chairs. `setChairs()` removes the field when a player is back
at the role's default, so nothing saved before this changed meaning.

On the stage a seated player's circle sits on a square chair 6″ larger
than the circle, so the corners show all round; two chairs draw two squares.
**Every human being is 22″ × 22″** (William, the same day: "why are the
trombone players bigger than the saxes?") — footprints are people, not
horns; only gear and the horn-section group marker differ.
The key has "standing player" and "seated". Every card on the Positions tab
and the inspector carry **− chair / + chair** with the state in words
("standing", "1 chair", "2 chairs"). Chairs are never placed as objects:
`chairCount()` feeds House equipment as "N × Chair" (`chair` in
`VENUE.house`, count 40, ASSUMED — ask Tim).

The Positions tab's two shortcuts are **Bulk add players…** (counts per
instrument, the old Instrumentation dialog) and **Paste a roster…** (names,
one per line, sent to their instruments); the help panel's "Filling the
band fast" section says so, because nobody found them.

## Mics & DIs: select first (2026-09-16)

The Mics & DIs tab opens with the rule, above the + Mic / + DI buttons:
**to attach a mic or a DI to an instrument or a piece of equipment, select
that player or that piece of equipment on the stage first, then add the mic
or DI** (William, 2026-09-16). The note then says where the next one will
land — "Right now it goes to Alto 1" from the selection, or, with nothing
selected, that it lands mid-stage belonging to nobody (`freeSpot()`). The
help's Microphones entry leads with the same sentence.

## Music stands (2026-09-16)

`pos.stands`, absent = 0, with `standsOf()` / `setStands()` / `standCount()`
mirroring the chairs. **Each preset carries a stands rule** (`stands` on
`TEMPLATES`, applied by `defaultStands()` in `makeFromTemplate()`;
William, 2026-09-16): the jazz combo `"all"`, one each; the big band
`"bigband"`, one each and two for the bass player and the drummer, whose
parts are longer; rock / pop, vocals + rhythm and solo / duo `"none"`.
A rule fills only positions with no count of their own, except `"none"`,
which clears them. Bulk add players (`makeFromParts()`) has no preset to
read, so it applies the big band rule when the horn count makes it a big
band and gives a smaller band none.
**A stand is a solid bar, top-down** (`STAND`: 12″ × 3″, bone on screen
and black in print): along the downstage edge of a seated player's chair
tile, inset from the corners; 2″ below a standing player's circle; below
the kit's footprint. **Every bar is the same size**, whoever owns it and
whether placed by hand — the first bar was 60% of its owner's width, which
made the kit's stands wide and the bass player's pair narrow, and a tech
would wonder why (William, 2026-09-16). Two stands are two bars 2″ apart,
centred on the player, so a standing player's pair overhangs the circle by
2″ a side. It is drawn in the player's own group, so it turns with them and
always sits in front. The
first version was a side-view desk-and-stem icon beside the player; it read
as a monitor and collided with the neighbours. A stand placed from the Misc
tab draws the bar alone, unlabelled; it is for a stand that belongs to
nobody. House equipment counts the players' stands plus the placed ones as
"N × Music stand" against the 20 the house has (ASSUMED).

## Labels inside shapes (2026-09-16)

Every object's label is drawn centred and upright inside its own shape
(`fitLabel()`): at full size, then as two lines broken at the space nearest
the middle, then smaller in half-point steps down to `DRAW.minPt` (7pt),
and only then outside — never smaller. `insideBox()` is what a label may
occupy: a circle's inscribed square (0.78 of the diameter), a rectangle
less 2″ (its own sides at right angles; the short side's square at 45°).
`labelPlan()` splits a player's block: the chair label inside the circle,
doubles and names outside in the box `positionLabelBox()` places, which
now starts clear of the chair tile or the stand bar (`labelClear()`); a
row's outside labels still take one side. Text is measured at .56 em a
character, so a 22″ circle holds "Gtr" at 12pt and "Tenor / 1" at about
8pt. **The kit is named once, on the kick** ("Drums", `kitPieces()`); it has
no label of its own. A DI box is 10″, just enough for "DI" inside; a box
with no source within 3′ says "DI · <instrument>" outside instead. House
and band-brought gear carry a `short` sized to the shape ("VOX",
"Deluxe 1", "Korg", "Bass rig", "Gtr amp"); the full labels still print in
House equipment and Musicians provide.

**Outside-label fallbacks in the default presets:** none — every chair
label and every piece of gear in all five presets fits inside (`check.js`
asserts it per preset). By design, outside: names and doubles under a
player; a mic's label (a 12″ capsule holds nothing); a band-brought kit's
"BYO Drum kit" under the kit; and from the band-brought palette the
16″ laptop and the 18″ × 10″ acoustic guitar, whose shapes hold no word at
7pt. The vertical stairs strip's label reads up its length (a fixture, not
an object). Deferred: an outside label that dodges neighbours for gear (it
only dodges for players); measuring text with real glyph widths rather
than .56 em.

## The seven steps (update 2)

The sidebar is `RAIL_TABS`, numbered 1–7 in order: Positions, House, Band
brings (id `byo`, once labelled Bring-own — ids never change, because the
panel switches on them and `plot.skipped` records them), Wedges, Mics & DIs,
Misc, Details. Each tab shows a state from `stepState()`: **done** (○ → ✓,
brass) when the step has something in it — a position; a house backline
item or a house kit; a band-brought item, kit or "brings" note; a wedge; a
mic or DI; a music stand, power strip, riser or text label; a plot name and
a date — **skipped** (–) when the act ticked "nothing here" at the top of
tabs 2–6 (`SKIPPABLE`; Positions and Details cannot be skipped), otherwise
**not started** (○). Skips live in `plot.skipped = ["byo", …]`; absent means
nothing skipped, and `setSkipped()` removes the field when the last tick
goes, so a plot that never used it saves byte-identical. It is a checklist,
not a gate: nothing is ever blocked. The read-only view hides the rail, so
the toggles with it.

## The page links to itself (update 2)

Under the delivery line the page prints *View or edit this plot online*,
the sentence itself being the plot's own read-only link as a real `<a href>`
(it survives Save as PDF; on paper the sentence is all that is left — the
URL in full ran to six lines of hash for a big band, and William had it
taken off the same day); then `VENUE.editNotice`, the one-place sentence
that Somewhere Works may adjust placements and monitor assignments. The
link is `encodeHash([p], 0)` — this one plot, a
snapshot as printed; a reprint makes a new link — off `shareBase()`, which
is the page's own origin and path on http(s) and `APP_URL` on a file://
preview, **with `?open=<token>` between them and the hash**, the token new
for every link built. That query string is load-bearing: a link to the page's own address plus a fragment is, to
Chrome's Save as PDF, an in-document jump to an element that does not
exist, and it writes no link annotation at all (verified with headless
Chrome: same page + hash → 0 annotations, same page + query + hash → 1;
and the token matters because a page opened from a printed link is itself
at `?open=…`, so a fixed query would make its own printed link
same-document again).
The link also opens in a new tab, because followed in place it would be a
same-document hash change that never re-runs `init()`; a `hashchange`
listener reloads for a plot hash that arrives any other way.
Compressing is async, so `plotLink()` renders the sheet with the last link
built for exactly this content and asks for a fresh one when the content
changed; Print `await`s `ensureLink()` first, so what goes out
matches what is on the page.

**The hash has a version marker.** `#s=` is deflate-raw then base64url, made
with the browser's own `CompressionStream`; `#j=` is plain base64url JSON,
the fallback where there is no CompressionStream and the form of the oldest
links. `decodeHash()` reads both, so every link ever produced still opens;
a 17-piece big band's link is about 1 KB (2.8 KB uncompressed).

## The stairs are shallow (update 2)

What a staircase takes from the deck is a one-foot landing strip on the
edge, three or four treads wide; the steps go down off the deck. So
`stairs-dsl` is 12″ × 42″ on the stage-left edge about 8′ from the front,
and `stairs-usr` is 12″ × 42″ on the stage-right edge just below the back
corner — both side edges, from William's marks (`steps:true` draws them
ruled as treads, a vertical strip's label reading up its length).
`onFixture()` refuses a drag or an arrow nudge that would put anything on a
fixture — the PA and the stairs are not floor — and the layout engine never
places there either.

## Removing things (A4)

Tim could not find out how to delete anything. Three ways now, all through
`removeObject()`: the ⊗ drawn off the top-right corner of the selected object
on the canvas (screen only, never printed), the inspector's delete button,
and Delete / Backspace on a selection. A position takes the gear that belongs
to it — amp, DI box, mics. "clear stage" beside re-layout empties the deck
behind a confirm; undo brings everything back.

## Monitor wedges

**A wedge is a placeable object and nothing more** (Tim Shade, 2026-09-16):
a number and a spot on the deck. The app used to record who shared each mix
(`assignees`, a checkbox list per wedge) and what they wanted in it
(`request`, "more me, less drums"), and printed both in a Monitors table.
Nobody submits mix contents ahead of time — that is what soundcheck is for —
so both are gone, from the Wedges tab, the inspector, the page, the email and
the changeover sheet. A file that has them loads without them. The one place
an act can say something ahead of time is the notes on the Details tab.

**Wedges are dealt once.** `layoutWedges()` builds them when the plot is
created and when the re-layout button runs, and never again on its own.
Adding an instrument later does not conjure a wedge or move the existing
ones, and a blank plot stays at zero wedges no matter how many instruments go
into it. `monitorGroups()` decides how many, their numbers and where: groups
in priority order — voices, drums, bass, guitar, keys, sax row, trombones,
trumpets, strings, other — merged smallest-adjacent-pair until they fit
`VENUE.monitorMixes`, each wedge landing downstage of its group. Nothing
records the grouping afterwards; the number is the mix and the diagram is
where it stands. The printed Monitors table is mix number and location
(`posText()`), one row per wedge — the zone in words, "Center stage right",
with no feet and inches (William, 2026-09-16; the tech reads the diagram
for the spot). `posText()` is the one place a position becomes text, so
the Wedges tab, the inspector headings, the email and the changeover sheet
all say the same thing; the changeover decides "moved" by distance, not by
whether the words changed. The mix number on a wedge is drawn as large as
the wedge holds (`fitLabel`, up to 12pt) on screen and in print.

**Numbers are the tech's priority order and are set by hand** (A1). A
number field on each Wedges-tab card and in the wedge inspector writes
through `setWedgeNumber()`: give a wedge another one's number and the two
swap, so numbers stay unique; a number nobody holds is simply taken. A new
wedge takes the lowest free number (`nextWedgeNumber()`), so deleting mix 2
and adding a wedge gives you mix 2 back, not mix 6. Before this there was no
control at all — Tim tried to renumber and nothing took.

## Schema and migration

`schemaVersion: 2`. `migratePlot()` reads anything: a v2 file passes through
normalised, a v1 file (no `schemaVersion`) goes through `migrateV1()`.

v1 stored named people plus items that carried the inputs; v2 stores
positions. The migration walks the v1 **items in order**, and:

- a v1 person marker becomes a position, keeping its exact x/y; its v1
  inputs ride along on the position for mic placement to pick up (C1);
- a chair item everybody rode (the kit) becomes one position with every
  occupant's name on it;
- gear owned by someone (amp, keyboard) stays an item and hands its v1 inputs
  to its owner's position, tagged with the role they belong to;
- wedges and songs come across by id; a v1 wedge's assignees and request are dropped.

Everything migrated is marked `moved:true` — a v1 plot was laid out by hand, so
the engine leaves it exactly where it was drawn. v1 **share links** open the
same way: the hash decodes to plot JSON and goes through the same migration.

`samples/v1/` holds the original v1 files as migration fixtures plus
`expected.json` (monitors and house needs captured from v1 before the
refactor; the channel lists in it are history now). `check.js` re-derives the
rest after migrating and fails on any difference — that is the "renders
identically" guarantee.

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
bands does, and the big bands run to two, which the brief allows. Header, diagram, a key, two columns (monitors and house equipment on the
left; microphones, DI boxes and musicians provide on the right), then personnel by song
if any, notes, and the delivery line. Body text is 10 pt and diagram labels are
12 pt **at any deck size** — type sizes are computed back through the print
scale, so changing `VENUE.deck` never shrinks names below the tech's
legibility line.

**The key** (added 2026-09-14, when William pointed out nobody would read ⊘)
sits under the diagram on the page and under the canvas on screen. It lists
only what this plot draws — `legendKeys()` decides, `legendHTML()` draws the
swatches — so a plot with no band-brought gear has no dashed box. Labelled things (DRAPE, PA,
AUDIENCE, the names) aren't keyed; they already say what they are. Keep an
entry's words short: the key has to stay on one line on a big band's page.

The diagram's frame has a deeper bottom margin (`DRAW.marginBottom`) than its
sides, to hold the PA stacks and the AUDIENCE label; until 2026-09-14 both were
drawn outside the frame and never printed. The margin is as tight as it can be
while a big band's page still fits on one sheet — check that before growing it.

The preview's "≈ 1 page" is measured from the rendered height, not the
browser's own pagination — a good guide, not gospel.

## Deferred — not built, on purpose

From the v1 brief, still deferred: per-person monitor requests for IEMs;
a guided first-run tour (the help panel is the next best thing);
lighting and video-capture
areas; importing rosters from the ensemble Airtable base; a venue-editor UI for
`VENUE` (editing the object is fine).

Decided during v1, still true: drag from the palette onto the canvas (click
drops it centre-deck instead); automatic music stands on the
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

1. **Big band seating** — settled by William, 2026-09-14 (see the layout
   engine). It moved the rhythm section from stage left, where the v1 brief
   had it, to stage right. He described the trumpets once as "4, 3, 2, 1" and
   once as "2, 1, 3, 4" left to right; the engine uses 2 1 3 4, which also
   puts Tpt 1 in line with Alto 1 and Tbn 1 as he asked.
2. **Upright bass implies the house bass rig** — clear the role's `backline`
   if uprights usually go straight to a DI at Somewhere Works. (The Vox models
   and the Markbass cab are the other things still to read off the gear; they
   are marked `ASSUMED` in the VENUE table and print verbatim, so do not guess.)
## Checks

`node check.js` — 652 assertions: the role library, every template (builds,
fits, deterministic, no two footprints in one place), the big band with no
names, building from counts, names on/off, bulk
name parsing, doubles and shared chairs, a custom role, the layout engine's
pinning and re-layout, deck re-layout, changeover, the v1 migration against
`samples/v1/expected.json`, the shipped samples, save/load round trip,
backline by category (two guitarists on two amps, five on an amber over-count
naming 4, Korg and Nord, an organ on the Nord, a third keys player on the
house piano with no DI box and four over-counting "keyboard / piano … has
3", the Upright piano role taking the piano and falling back to the Korg
with a DI box, a big band with its pianist on the piano turned vertical,
the piano swap taking the DI box away and giving it back, a schema-2
file with legacy DI inputs loading its third keys player onto the piano
without a box, a shared piano settling both players, a swap surviving
re-layout, an old doubled `gtramp1` settling on load, two plots sharing an
amp in silence),
the delivery address and the band leader/director wording, the soundcheck
and lineup fields, no mics on any house item, and no storage APIs or student
names in `index.html`.

`node print-check.js` measures the thing node cannot see: the printed page is
paginated by *rendered height*, so it drives a headless Chromium through
Playwright, renders `sheetHTML()` for every template, for the migrated v1 fixture and
for a three-keys plot with one player on the house piano, and fails if a
plot that fitted one page before now runs to two. It
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
