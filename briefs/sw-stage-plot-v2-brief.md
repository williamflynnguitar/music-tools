# Claude Code Prompt — SW Stage Plot Tool v2: generalize the ensemble model

Paste into a Claude Code session on the `music-tools` repo.

Read `stageplot/CLAUDE.md` and `stageplot/index.html` before changing anything.

v1 works, but it hardcoded my fall 2026 WSU rosters into the app. That was the
wrong altitude. This tool should serve any act loading into Somewhere Works —
other WSU ensembles, next semester's personnel, touring bands, community groups
— while staying venue-specific to SW. The venue knowledge is the moat; the
roster knowledge was a mistake.

This is a refactor, not a rebuild. Keep the venue config, the canvas, the wedge
model, the input-list derivation, the constraint warnings, the changeover
sheet, and the print output. Replace the ensemble layer.

## 1. Roles are primary, names are optional

Right now a plot is a list of named people. Invert it: a plot is a list of
positions, each with an instrument role, and a name is an optional attribute of
a position.

- Every position gets an auto-generated label from its role and index: `Tpt 1`,
  `Tpt 2`, `Alto`, `Tenor 2`, `Bari`, `Gtr`, `Bass`, `Drums`, `Keys 1`, `Vox 1`.
  Duplicated roles number automatically; a solitary role drops the number.
- A name field sits next to each position, empty by default. When filled, it
  prints in smaller type beneath the position label on the diagram and in
  parentheses in the monitor table. When empty, everything falls back to the
  position label and nothing looks broken or unfinished.
- Add a "Print names" toggle, on by default, so a bandleader can produce a
  positions-only plot for a large group.
- Add a bulk name entry panel: a textarea where someone pastes a list, one per
  line, optionally `Name — instrument`, and the app assigns down the position
  list in order. Bandleaders usually have the roster sitting in an email
  already; retyping it into sixteen separate fields is why they won't bother.
  Parse loosely and show a preview of the mapping before applying.
- Wedge assignment and the monitor table reference positions, not names, so
  they keep working when names are absent: `Wedge 2 — Alto, Tenor 1` reads fine
  to a sound tech.

Rationale to hold onto: the tech needs to know what's on each channel and who
shares a wedge. Names help when they exist, but they are never load-bearing. A
17-piece big band plot with no names at all should still be completely useful.

## 2. An instrument library, not an enumerated roster

Build a `ROLES` table — the single place instrument knowledge lives — where
each entry carries:

- `id`, `label` (`"Trumpet"`), `short` (`"Tpt"`), `family` (`rhythm` | `sax` |
  `brass` | `voice` | `strings` | `other`)
- default inputs: type (`mic` | `di` | `stereo-di` | `xlr` | `none`), channel
  count, phantom
- footprint in inches, and whether the position is seated, standing, or a fixed
  object (a kit)
- whether it implies a piece of house backline (piano → house keyboard, since
  SW has no acoustic piano; bass → bass rig; guitar → guitar amp)
- layout affinity: which zone it wants (see §4) and how strongly

Seed it with everything SW plausibly sees: voice, guitar, electric bass,
upright bass, drums, percussion (aux), keys/piano, organ, alto/tenor/bari/
soprano sax, flute, clarinet, trumpet, flugelhorn, trombone, bass trombone,
tuba, violin, cello, acoustic guitar, harmonica, DJ/laptop, horn section
(generic), backing track playback.

Add a custom role path: name it, pick an input type and channel count, pick a
footprint size. Anything unusual that walks in the door gets handled without a
code change.

Doubles are generic: any position can carry a list of doubles (`Alto sax /
Flute`, `Keys / Vocal`), which prints on the diagram and can add inputs if the
double needs its own channel.

Shared chairs are generic: any position can hold more than one occupant (two
drummers on one kit, rotating vocalists on one mic). One set of inputs, both
names printed, one wedge.

## 3. A builder entry screen

Replace "pick one of my nine ensembles" with a three-path start:

**Path A — Template.** A library of instrumentation shapes, not rosters:

- Jazz combo (small) — horns + rhythm, adjustable counts
- Jazz combo (large) / little big band
- Big band (17) — 5 sax, 4 tpt, 4 tbn, gtr, pno, bass, drums
- Rock / pop band — gtr, bass, drums, keys, lead vocal
- Vocal-forward pop group — multiple vocals + rhythm section
- Funk / soul band — rhythm + horn section
- Singer-songwriter duo / trio
- Horn section + rhythm
- Vocal jazz ensemble + rhythm
- Solo act

Picking a template lands you in the builder with those positions filled in,
fully editable.

**Path B — Build it.** A compact instrumentation form: a row per role with a
stepper for how many. Add roles, remove roles, set counts. Show a live running
total of positions, channels, and wedges needed against SW's limits as the
numbers change — a bandleader learning that 17 individually-miked players
exceed a 32-channel console while building is the whole point.

**Path C — Load.** Open a saved `.json` or a share link. This is how a
returning ensemble works: last semester's plot loads, you swap the names,
you're done.

All three converge on the same editor.

## 4. Auto-layout that works for arbitrary instrumentation

v1 had hand-authored layouts per ensemble. That can't survive arbitrary input.
Write a layout engine instead.

Divide the deck into zones expressed as fractions of width and depth so
everything scales when the real stage dimensions arrive: downstage-center (lead
vocal), downstage rows (horn sections, front line), mid-stage, upstage-center
(drums), upstage-left/right (bass rig, guitar amp, keys). Each role has a zone
affinity; the engine places positions by family, packs rows front-to-back in
conventional order (saxes downstage, trombones behind, trumpets behind that),
centers rows, respects footprints, keeps the drum kit clear of traffic, and
puts amps within reach of their players.

Requirements:

- Deterministic — same instrumentation always yields the same starting layout.
- Never overlaps, never places anything off-deck.
- Degrades gracefully: if the positions won't fit the deck at comfortable
  spacing, tighten spacing, then flag it rather than failing or overflowing.
- Re-layout button regenerates from scratch, discarding manual moves (confirm
  first).
- Manual moves always win and survive everything else.

Layout conventions should live in one commented block so they can be argued
with later.

## 5. Retire the hardcoded rosters

Move my fall 2026 ensembles out of the code and into `stageplot/samples/` as
saved `.json` plots — Group A, Group B, Group C, Combo A, Combo B, Combo C, Big
Band. They become example files anyone can load and edit, not app structure.
Add a small "Examples" list on the entry screen that loads them.

Nothing in `index.html` should contain a student's name after this refactor.
Grep for it.

## 6. Compatibility and schema

- Add a `schemaVersion` to the plot JSON. v1 files must still load — write a
  migration that maps v1's named people to v2 positions with names attached.
- Share links from v1 must still open.
- The `VENUE` config stays exactly as it is, including the `ASSUMED` markers. I
  still expect the real stage dimensions this week, and changing `VENUE.deck`
  must re-lay out every template proportionally.

## 7. Acceptance

- [ ] Start from Big Band template, add no names, print → a fully usable plot:
      positions labeled, sections in rows, input list complete, channel warning
      correct.
- [ ] Build a 5-piece from scratch via the instrumentation form in under a
      minute; running totals update as counts change.
- [ ] Paste 8 names into bulk entry → preview shows the mapping → apply → names
      appear on diagram and in the monitor table.
- [ ] Toggle "Print names" off → diagram and tables fall back to position
      labels with no layout breakage.
- [ ] Add a custom role ("Steel pan", one mic) → it places, mics, and prints.
- [ ] Give one position a double and another position two occupants → inputs
      stay correct (no doubled kit channels), both names print.
- [ ] Load a v1 sample file → migrates cleanly, renders identically.
- [ ] Load `samples/big-band.json` → matches what the template generates, with
      names.
- [ ] Re-layout on a 17-piece → deterministic, no overlaps, nothing off-deck.
- [ ] Change `VENUE.deck` → every template re-lays out proportionally; saved
      plots keep their stored deck size.
- [ ] Still no browser storage APIs anywhere (grep).
- [ ] Print output unchanged in quality from v1: one page where it fits, black
      on white, legible at 100%.

## 8. Notes

Audit rather than patch — if this refactor exposes places where v1 assumed a
fixed roster beyond the obvious ones, fix the pattern.

Update `stageplot/CLAUDE.md`: the `ROLES` table and how to extend it,
layout-engine conventions and zone fractions, the schema migration, and
anything deferred. Keep the deferred list from v1 intact.

Prefer shipping a working v2 over a perfect one. If the layout engine's polish
is expensive, ship a correct-but-plain version and log the refinement.
