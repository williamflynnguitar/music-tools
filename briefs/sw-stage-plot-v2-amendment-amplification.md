# Amendment to the v2 brief — amplification is a choice, not an assumption

Replaces the "default inputs" behaviour described in §2 of the v2 brief.

## The problem

v1 assumes that anything on the deck gets fully miked. Place a kit, get seven
channels. That's wrong often enough to matter: at Somewhere Works a jazz combo
might run the kit with two mics or none, a guitar amp may not be miked at all
in a small room, and a big band's sax row is usually acoustic or on a couple of
section mics rather than five individual ones. Defaulting to maximal coverage
inflates the channel count, makes the console warnings meaningless, and puts
things on the tech's input list they were never going to patch.

The deeper issue is that an absence in a plot is ambiguous. If drums don't
appear in the input list, the tech can't tell whether the band decided to go
acoustic or whether the bandleader forgot. Both unmiked and miked must be
explicit, printed states.

## What to build

1. **Mic packages per role.** Each role carries a list of available packages
   rather than a single fixed input set — label, inputs, channel count — and
   the bandleader picks one per position. Drums: not miked / kick only /
   kick + OH / kick + snare + OH / kick + snare + hat + OH / full close-mic.
   Guitar and bass amp: not miked / amp mic / DI / DI + amp mic. Keys: mono DI
   / stereo DI / not amplified. Horns: not miked / individual mic / shared
   section mics across a group. Voice: lead mic / shared mic / not miked.
   Upright, acoustic guitar and anything with a pickup: pickup DI, mic, both.
   Custom roles get a simple chooser at creation: none / one mic / one DI /
   stereo DI.
2. **Choose at placement, not silently** — the package selector sits in the
   item inspector with the default preselected. Placing a kit should never
   silently add seven channels.
3. **An amplification profile on the plot** — acoustic-leaning, light
   reinforcement, fully miked — setting sensible defaults for everything at
   once, with per-position override always winning. Changing the profile
   re-applies defaults only to positions the user has not overridden.
   Templates set a starting profile.
4. **Print unmiked sources explicitly**, in a short section below the input
   list ("Not miked: Drums (acoustic), Sax section, Guitar amp"), with a marker
   on the diagram. Omit the section when everything is miked.
5. **Let the channel budget drive the conversation** — over the warning line,
   offer the specific reductions available given what is on stage, with the
   channels each would save, applied in one click.
6. **Keep the input-list note line** (`Ch 8: amp mic`); package names feed it.

## Acceptance additions

- [ ] Place a kit under the acoustic-leaning profile → 0 channels, "Drums
      (acoustic)" in the Not miked section, marker on the diagram.
- [ ] Switch the plot to fully miked → kit moves to full close-mic; a position
      previously overridden to "kick only" stays at kick only.
- [ ] Big band under light reinforcement → sax row on section mics, channel
      total comfortably under 32.
- [ ] Big band switched to fully miked → red channel warning with specific
      reduction suggestions naming the sax row and the drums, with channel
      savings shown.
- [ ] A plot where everything is miked prints no Not miked section.
- [ ] v1 files migrate: a v1 kit with its 7-channel default maps to the full
      close-mic package, not to a broken state.
