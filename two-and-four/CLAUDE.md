# two-and-four — fading backbeat trainer

A metronome that clicks only on beats 2 and 4, then gradually drops clicks
out over the round so the player's inner pulse has to carry more of the
time. Sessions run in rounds (optionally at random tempos) with rests
between them.

## Timing: the lookahead scheduler

Standard Web Audio lookahead pattern (see root CLAUDE.md):

- `setInterval(scheduler, LOOKAHEAD)` wakes every **25 ms**.
- Each wakeup, `scheduler()` schedules every beat that falls within the
  next **`AHEAD` = 0.13 s** onto `ctx.currentTime`, advancing
  `nextNoteTime` by `60/bpm` per beat. Scheduling granularity is one
  quarter note; `beatInBar` cycles 0–3 and clicks fire only when it is
  1 or 3 (i.e. beats 2 and 4).
- Round-end is detected inside `scheduleBeat` at a bar boundary
  (`beatInBar === 0`): when `t - playStart >= duration` it calls
  `endRound(t)` and returns false, which aborts the fill loop so no
  stray beats are scheduled past the chime.
- The count-in is a separate phase; the four count clicks are scheduled
  the same way, and `playStart` is set to the beat *after* the last
  count click, so the count-in never eats round time.

Visuals never touch timing. Every scheduled beat also pushes
`{t, beat, audible, bar}` onto `visQ`; a `requestAnimationFrame` loop
(`paint`) drains events whose timestamp has passed `ctx.currentTime` and
updates lamps, bar counter and clock from the audio clock. The dropout
chart is deliberately NOT driven by the clock — see below. Rests between
rounds use `setTimeout` — acceptable because nothing is keeping musical
time during a rest.

## Phrase dropout math

In phrase mode, each phrase of `n` bars (4/8/12/16, `S.phrase`) gets `k`
clicking bars spread **maximally evenly** through the phrase rather than
bunched at the front:

```
barClicks(i, k, n)  =  (i·k) mod n < k        // i = 0-based bar in phrase
```

This is the Bresenham / Euclidean-rhythm distribution. Bar 0 (bar 1 as
players count it) always clicks whenever k ≥ 1, giving a reliable
re-sync point at the top of every phrase — a deliberate teaching choice.
Examples for n = 8: k=2 → bars 1 and 5; k=3 → bars 1, 4, 7.

`k` is recomputed only at the top of each phrase (`pos === 0`) via
`kAt(prog)` and held constant through the phrase, so the pattern within
a phrase is stable:

```
kAt(prog) = clamp(round(densityAt(prog) · n), 1, n)
```

Note the lower clamp: phrase mode never goes fully silent — even at a
0% floor, one bar per phrase still clicks.

**Random-thin mode** skips all of this: each individual 2-or-4 click is
an independent coin flip with probability `densityAt(prog)`. It can go
fully silent and offers no reliable re-sync point; the UI note says so.

## The settle curve

`densityAt(prog)` maps round progress (0–1) to click density (fraction
of bars/clicks kept):

```
SETTLE = 0.9
p       = min(1, prog / SETTLE)
density = floor + (1 − floor) · (1 − p)      // floor = S.floor / 100
```

Linear ramp from 100% at the start down to the floor at **90% of the
round**, then flat for the final 10%. The hold exists so the last
stretch of the round is a stable sparse pattern the player can settle
into, rather than a still-moving target — another deliberate teaching
choice (documented in the code comment above `SETTLE`).

The dropout-plan chart samples this same curve at `PLAN_COLS` = 6 column
midpoints via `kAt`, so what the chart shows is exactly what will play.

**The chart is a static pre-round preview, not a live display.** Its
axis is stages, not time; an earlier version moved a playhead across it
and highlighted the current stage, which players read as "a click
sounds when the cursor crosses a slash" — wrong, and a drummer caught
it. The playhead, the `.active` stage highlight and the per-frame chart
status text were removed; the chart renders on parameter change, at
round start and on stop only. Clicking bars draw as brass slashes,
silent bars as small dots (shape + colour), with a legend strip saying
so and labelling the columns "6 stages sampled across the round · a
preview, not a timeline". (The old `.active` highlight also had a
specificity bug — `.stage-cell.active .slash` overrode `.slash.off`, so
every bar in the highlighted cell lit as if clicking. Gone with the
live display; don't reintroduce a live cursor here.)

## Other structure worth knowing

- `S` is the single settings object; all state is in memory (no storage
  APIs, per root CLAUDE.md).
- Phases: `idle | countin | play | rest`. `take` counts repeats of the
  same round ("Repeat tempo" restarts the current tempo without
  consuming the round queue).
- Random tempos use a shuffled-bag draw over `[low..high]` stepped by
  `step`, refilled when empty, avoiding an immediate repeat across bag
  boundaries.
- Tap tempo (button in the fixed-tempo field, or `T`) sets `S.bpm` from the
  average of the last 4 tap intervals (`TAP_WINDOW` = 5 taps kept), so the
  tempo can be steered while tapping; a gap over `TAP_RESET_MS` = 2 s starts
  a fresh run. Taps are timestamped on `pointerdown`, not `click`, because
  `click` fires on release and adds jitter. Result clamps to the slider's
  40–300 range. No-op in random-tempo mode. Like the tempo slider, a
  mid-session change takes effect at the next session start, not the
  current round. (bandpassed noise transient + short
  triangle body) — no samples, no network.
- Screen Wake Lock is requested while running and re-acquired on
  visibility change.
