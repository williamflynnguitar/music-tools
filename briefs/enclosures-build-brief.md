# Enclosures — Build Brief

## Purpose

A companion practice tool for enclosure vocabulary. The center of the app is a rule-driven generation engine — students pick a key, a target chord tone, and a family, and see the enclosure built, rather than only browsing pre-composed pages. The three genuinely composed sections (the ii-V vocabulary phrases, the "All the Things You Are" reduction, and the application-to-progressions lines) stay as authored reference material. Drill/quiz mode (system hides the answer and checks the student) stays out of v1 but is now much more concretely specifiable, since the engine that renders the reference examples is the same thing a quiz mode would check against.

## v1 scope (decided Sept 11, 2026; direction updated same day)

- Core interaction: guided playthrough, now built around a live generation engine rather than static pages wherever the content is rule-derived
- Coverage: everything across all source documents
- No audio. Notation display only, same as Scale Practice
- Drill/quiz mode deferred, but de-risked by the engine work below

## Terminology

- **Goal Note (GN)** — the chord tone being enclosed (root, 3rd, 5th on the base material; extended to 7th/9th/11th/13th under Access Points)
- **GN Type** — classifies a GN by its diatonic neighbors: **Type A** (half step below, whole step above), **Type B** (whole step below, half step above), **Type C** (whole step below, whole step above)
- **Family** — how many notes precede the GN, 1 through 5
- **Rhythmic placement rule** — the GN always lands on a downbeat; odd-numbered families (1, 3, 5) begin on the upbeat, even-numbered families (2, 4) begin on the downbeat

## Source files

Hand these along with this brief, not just the brief on its own:

- **Enclosures_101.pdf** — essential. This is where Claude Code verifies the Family 3–5 patterns (pages 2–3), and it's the source for the Theory section's content.
- **Access_Point_Enclosures.pdf** — source for the Access Points section; also cross-checks the Family 1–2 formulas above.
- **Descending_Enclosure_Scale_Exercise.pdf**, **Enclosure_Scale_Exercise.pdf** — source for the Scale-Based Practice section, so Claude Code can see the intended shape of that content even though the final output is engine-generated.
- **Outline.docx** — source for the Front Matter section text.
- **EnclosuresConcert.pdf**, **EnclosuresBb.pdf**, **EnclosuresEb.pdf** — source for the three fixed sections (Vocabulary Application, Harmonic Generalization, Application to Progressions). Claude Code can rasterize and crop these directly (`pdftoppm` + crop per section) the same way I just did to read the notation above — a manual Sibelius export isn't strictly necessary unless you want cleaner vector output than a high-DPI raster crop gives you.
- **Enclosures.sib / EnclosuresBb.sib / EnclosuresEb.sib** — optional. Only needed if you'd rather export the fixed-section images yourself at higher fidelity than a PDF crop.

## Enclosure Generation Engine

The core insight: most of the content is a function of three inputs — key/scale context, target chord tone, and Family — plus a direction flag (normal/reversed). One engine, parameterized, drives Raw Materials, Building Enclosures (Major/Minor), and Access Points, instead of needing a static export for each.

**Verified directly against the source notation** (Enclosures_101.pdf pp. 1–2; Access_Point_Enclosures.pdf):

- **GN Type derivation** — look at the diatonic scale tones directly above and below the target degree: half step both sides → Type A; whole below / half above → Type B; whole step both sides → Type C.
- **Family 1** ("pre-enclosure") — a single approach note: either the chromatic tone a half step below the GN, or the diatonic tone above it. Two valid options, not one fixed answer.
- **Family 2** — both combined: chromatic-below, then diatonic-above, then the GN. Confirmed in the Access Points chart — enclosing the root of D-7 plays C♯ → E → D. Reversing the order (diatonic-above first) is explicitly taught as a variation and still resolves correctly; build this as a toggle rather than a separate code path.
- **Access Points** — the identical engine applied to the 7th, 9th, 11th, and 13th instead of just root/3/5, plus the ii/V equivalence as an optional overlay (a ii chord's access points double as the V chord's access points a step away).
- **Rhythmic placement** — as above; the engine should place the GN on the downbeat and derive the start beat from family parity, not need it specified separately.

**Not yet verified** — Families 3–5 add "additional options" (3-note), note repetition (4-note), and a repeated pitch (5-note) on the same chromatic/diatonic vocabulary, and I can see the shapes in the notation, but haven't pinned the exact note choices per type closely enough to encode as rules yet. That needs a closer pass against Enclosures_101.pdf pages 2–3 before it goes into the engine — happy to do that now if useful, or hand it to Claude Code with those exact page references.

## Build sequence

1. **Engine v1** — Families 1–2, all three GN types, root/3/5/7/9/11/13 access points, direction toggle, rhythmic placement built in. This is also, not coincidentally, what the source calls "the best place to start."
2. **Engine v2** — Families 3–5, once the exact patterns are confirmed against source.
3. **Scale-Based Practice** — strings engine output across a full ascending/descending scale line; a natural extension once the engine itself works, needed for both the descending-3rd drill and the full-triad version, in all twelve keys.
4. **Fixed/composed sections** — Vocabulary Application to ii-V Phrases, Harmonic Generalization ("All the Things You Are"), and Application to Progressions — stay as before, exported from the Sibelius source, since they're composed choices rather than engine output.

## Content model

1. **Front Matter** — Outline.docx framing: why chromaticism is needed, William's definition of bebop, the stated goal
2. **Theory: Enclosures 101** — GN definition, the three Types, the five Families, the rhythmic rule — ideally with live engine examples inline rather than static illustrations, so the theory section doubles as the first hands-on encounter with the tool
3. **Raw Materials** — major/minor triad + scale (static reference — not engine output, just the plain scale/triad)
4. **Building Enclosures — Major / Minor** — engine-driven, Families 1–2 first, then 3–5 once available
5. **Access Points** — engine-driven, root through 13th, reversal toggle, ii/V overlay
6. **Scale-Based Enclosure Practice** — engine-driven scale-line generation, all twelve keys, once the engine supports it
7. **Vocabulary Application to ii-V Phrases** — fixed, from Enclosures_101's closing example
8. **Harmonic Generalization** — fixed, "All the Things You Are" mm. 1–16
9. **Application to Progressions** — fixed, major/minor ii-V-I and standard progressions with passing tones

## Instrument / transposition handling

Engine-driven sections (4–6) can offer a full twelve-key selector, since the engine generates correctly in any key. Fixed sections (7–9) are limited to the three transpositions that actually exist as engraved charts: Concert, Bb, Eb.

## UI / navigation

- Section list mirroring the content model above
- Next/previous through sections; nothing gated
- Front matter shown once at load, collapsible afterward
- Section state reflected in the URL hash so reload or a shared link preserves position, without needing browser storage
- For engine-driven sections, the parameter controls (key, GN, family, direction) should stay visible and adjustable in place — this is the "build from there" part; a student shouldn't have to leave the page to try a different combination

## Deferred to Phase 2

- Drill/quiz mode: system presents a target and hides the answer, student attempts, gets checked. The engine built above is most of what this needs — the remaining work is the interaction/checking layer, not the music theory.

## Naming

Working title: "Enclosures," in keeping with the plain naming used across the rest of the suite. Final call is William's.
