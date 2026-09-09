# Line Ladder — leadsheet function annotations (worksheet)

**Status: ATTYA, Blue Bossa and Mr. P.C. are annotated in the app** (their †
flags are gone — the applied annotations are listed below for your veto).
The other 11 tunes await your red-pen pass on the proposals. Lines marked
**[?]** are the spots I'm unsure about.

Annotations now live directly in the tune text in `index.html`, riding on the
chord token — you can edit them there too:

    Cm7@ii/Bb        major-key degree (parent major, run starts on the chord root)
    G7b9@v/Cm        harmonic minor (minor-key degree)
    Ab7#11@iv/Ebmel  melodic minor ("Eb melodic minor from the 4th")
    F7@sec           non-diatonic dominant on its own scale
    Bbm7@own         keep the quality default, confirmed (clears the †)

## Rulings so far (applied)

1. **Minor ii-V** → harmonic minor of the target (`@ii/Cm`, `@v/Cm`), and the
   resolution chord transitions to major where it resolves major (`@I/C`).
2. **Minor-blues tonic -7** → Dorian via the relative major (`@ii/Bb`).
3. **iv chords in minor** → Dorian (`@ii/Eb` for F-7 in C minor).
4. **Lydian dominant / altered** → labeled and fingered as the **parent
   melodic minor**, run entered from the chord root: `@iv/Ebmel` reads
   "Eb melodic minor from the 4th", `@vii/Dbmel` "Db melodic minor from the
   7th". No separate Lydian-dominant/altered fingerings.
5. **Backdoor dominants** (root a whole step below the tonic) → Lydian
   dominant, i.e. `@iv/<tonic-minus-whole-step... the mm a 5th up>mel`:
   Gb7 → AbΔ is `@iv/Dbmel`; Bb7 → CΔ is `@iv/Fmel`.
6. **Δ7♯11 on ♭II/♭VI/♭VII** → Lydian via the major parent (`@IV/Db` for
   GbΔ7♯11 — major-scale fingering entered from the 4th).
7. **vi chords** → Aeolian via the major parent (`@vi/Ab` — major-scale
   fingering entered from the 6th). Confirmed already-working.

## Still open

- **D7 — position behavior**: annotated tunes now re-seat the position at
  key changes (this is what un-flagged ATTYA — it no longer climbs past
  fret 12 at all). Say if any tune moves around more than you'd teach it.
- **D8 — standing assumptions**: `sec` 7 → own Mixolydian, 7♭9 → own
  Phrygian dominant; -6/-Δ7 tonic → harmonic minor; -6 borrows the -Δ7
  arpeggio shape (6 borrows Δ7); 12-beat = 8+4 unit, 16-beat = 8+8.
- **Blue Bossa's G7♯9**: applied `@v/Cm` per ruling 1 — but the ♯9 (B♭)
  isn't in C harmonic minor. If you'd rather have altered there, change it
  to `@vii/Abmel`. Same question anywhere a ♯9/alt dominant sits in a
  minor ii-V.
- The remaining 11 tunes below.

---

## APPLIED — All The Things You Are (A♭)

vi/Ab · ii/Ab · V/Ab · I/Ab | IV/Ab | ii/Cm v/Cm | I/C (×2) | vi/Eb · ii/Eb ·
V/Eb · I/Eb | IV/Eb | ii/Gm v/Gm | I/G (×2) | ii/G · V/G · I/G (×2) |
ii/Em · v/Em · I/E | C7♯5 → vii/Dbmel | (A1 again) | IV/Ab | **Gb7 → iv/Dbmel
(backdoor)** | iii/Ab | B°7 arp | ii/Ab V/Ab I/Ab | ii/Fm v/Fm

## APPLIED — Blue Bossa (C minor)

Cm7 → ii/Bb · Fm7 → ii/Eb · Dø7 G7♯9 → ii/Cm v/Cm (see open question above) ·
Ebm7 Ab7 DbΔ → ii/Db V/Db I/Db

## APPLIED — Mr. P.C. (C minor blues)

Cm7 → ii/Bb · Fm7 → ii/Eb · Ab7♯11 → iv/Ebmel · G7♭9 → v/Cm

---

## Au Privave (F blues · 12 bars)

- 1–3 F7 — sec · 4 Cm7 F7 — ii/Bb, V/Bb · 5–6 B♭7 — sec · 7 F7 — sec
- 8 Am7 D7♭9 — iii/F, sec [?] (or v/Gm per ruling 1 — it resolves to Gm7)
- 9 Gm7 — ii/F · 10 C7 — V/F · 11 F7 D7♭9 — sec, sec · 12 Gm7 C7 — ii/F, V/F

## Autumn Leaves (G minor · 32 bars)

- 1–4 Cm7 F7 B♭Δ7 E♭Δ7 — ii/Bb, V/Bb, I/Bb, IV/Bb
- 5–7 Aø7 D7♭9 Gm6 — ii/Gm, v/Gm, i/Gm · 8 G7♭9 — sec (V of Cm) [?] (or v/Cm)
- 9–16 = 1–7 + Gm6 — i/Gm
- 17–20 Aø7 D7♭9 Gm6 Gm6 — ii/Gm, v/Gm, i/Gm
- 21–24 = 1–4
- 25–26 Aø7 D7♭9 — ii/Gm, v/Gm
- 27 Gm7 C7 — ii/F, V/F [?] · 28 Fm7 B♭7 — ii/Eb, V/Eb
- 29 E♭Δ7 — IV/Bb [?] · 30 Aø7 D7♭9 — ii/Gm, v/Gm · 31–32 Gm6 — i/Gm

## Beatrice (F · 16 bars)

- 1 FΔ7 — I/F · 2 G♭Δ7♯11 — IV/Db · 3 FΔ7 — I/F · 4 E♭Δ7♯11 — IV/Bb
- 5 Dm7 — vi/F · 6 E♭Δ7♯11 — IV/Bb · 7 Dm7 — vi/F
- 8 B♭m7 — own [?] (Dorian; iv-of-F color)
- 9 Am7 — iii/F · 10 B♭Δ7 — IV/F
- 11 Eø7 A7♭9 — ii/Dm, v/Dm (per ruling 1; resolves to Dm7)
- 12 Dm7 — vi/F · 13 Gm7 — ii/F · 14 G♭Δ7♯11 — IV/Db
- 15 Fm7 — own [?] · 16 G♭Δ7♯11 — IV/Db

## Honeysuckle Rose (F · 32 bars)

- A vamps (1–4, 9–12, 25–28) Gm7 C7 — ii/F, V/F
- 5/13/29 FΔ7 F7 — I/F, sec · 6/14/30 B♭Δ7 C7 — IV/F, V/F
- 7 FΔ7 B♭7 — I/F, sec [?] · 8/32 Am7 D7 — iii/F, sec
- 15–16 FΔ7 — I/F
- 17–18 Cm7 F7 — ii/Bb, V/Bb · 19–20 B♭Δ7 — IV/F [?] (or I/Bb — re-seats)
- 21 Dm7 — vi/F · 22 G7 — sec · 23–24 C7 — V/F
- 31 FΔ7 B♭7 — I/F, sec

## Lady Bird (C · 16 bars)

- 1–2 CΔ7 — I/C · 3 Fm7 — ii/Eb [?] (or own) · 4 B♭7 — **iv/Fmel (backdoor,
  per ruling 5)**
- 5–6 CΔ7 — I/C · 7 B♭m7 — ii/Ab · 8 E♭7 — V/Ab · 9–10 A♭Δ7 — I/Ab
- 11 Am7 D7 — ii/G, V/G [?] · 13 Dm7 — ii/C · 14 G7 — V/C
- 15 CΔ7 E♭7 — I/C, sec [?] (♭III7) · 16 A♭Δ7 D♭7 — [?] (♭VIΔ, ♭II7/subV)

## Someday My Prince Will Come (B♭ · 32 bars)

- 1 B♭Δ7 — I/Bb · 2 D7 — sec [?] · 3 E♭Δ7 — IV/Bb · 4 G7 — sec
- 5–8 Cm7 G7 Cm7 F7 — ii/Bb, sec, ii/Bb, V/Bb
- 9 Dm7 — iii/Bb · 10 C♯°7 — arp · 11–12 Cm7 F7 — ii/Bb, V/Bb
- 13–16 = 9–12 · 17–24 = 1–8
- 25–26 Fm7 B♭7 — ii/Eb, V/Eb · 27 E♭Δ7 — IV/Bb [?] · 28 E°7 — arp
- 29–32 B♭Δ7 G7 Cm7 F7 — I/Bb, sec, ii/Bb, V/Bb

## Take the "A" Train (C · 32 bars)

- 1–2/9–10/25–26 CΔ7 — I/C · 3–4/11–12/27–28 D7♯11 — **iv/Amel (ruling 4)**
- 5–6/13–14/29–30 Dm7 G7 — ii/C, V/C · 7 Em7 A7 — iii/C, sec
- 8/32 Dm7 G7 — ii/C, V/C · 15 CΔ7 — I/C · 16 Gm7 C7 — ii/F, V/F
- 17–20 FΔ7 — IV/C [?] (or I/F — re-seats) · 21–22 D7 — sec
- 23–24 Dm7 G7 — ii/C, V/C · 31 CΔ7 — I/C

## Tenor Madness (B♭ blues · 12 bars)

- 1 B♭7 — sec · 2 E♭7 — sec · 3 B♭7 — sec · 4 Fm7 B♭7 — ii/Eb, V/Eb
- 5–6 E♭7 — sec · 7 B♭7 — sec · 8 G7♭9 — sec [?] (or v/Cm)
- 9–10 Cm7 F7 — ii/Bb, V/Bb · 11 B♭7 G7♭9 — sec, sec · 12 Cm7 F7 — ii/Bb, V/Bb

## On Green Dolphin Street (C · 32 bars; E♭ version = same up a minor 3rd)

- 1–2 CΔ7 — I/C · 3–4 Cm7 — ii/Bb [?] (parallel minor)
- 5 D7 — sec [?] (or iv/Amel — it's the ♯11 sound) · 6 D♭Δ7 — IV/Ab
- 7 CΔ7 — I/C · 8 A7♭9 — sec [?] (or v/Dm)
- 9–12 Dm7 G7 CΔ7 — ii/C, V/C, I/C
- 13–14 Fm7 B♭7 — ii/Eb, V/Eb · 15 E♭Δ7 — I/Eb [?] · 16 G7 — sec
- 17–24 = 1–8
- 25 Dm7 — ii/C · 26 Bø7 E7♭9 — ii/Am, v/Am (ruling 1) · 27 Am7 — vi/C
- 28 F♯ø7 B7♭9 — ii/Em, v/Em [?] (resolves deceptively to Em7 A7...)
- 29 Em7 A7♭9 — iii/C, sec [?] (or v/Dm) · 30 Dm7 G7 — ii/C, V/C
- 31–32 CΔ7 Dm7 G7 — I/C, ii/C, V/C

## Strasbourg / St. Denis (A♭ · 8 bars)

- 1/3/5 B♭m7 Cm7 — ii/Ab, iii/Ab
- 2/4 D♭Δ7 F7♭9 — IV/Ab, v/Bbm (ruling 1 [?] — it pulls back to B♭m7)
- 6 D♭Δ7 E♭7 — IV/Ab, V/Ab · 7 A♭Δ7 — I/Ab · 8 F7♭9 — v/Bbm [?]
