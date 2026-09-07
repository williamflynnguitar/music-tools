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
- The count-in is a separate phase, scheduled the same way; `playStart`
  is set to the beat *after* the last count click, so the count-in never
  eats round time. One bar ("1 2 3 4") normally; at
  `TWO_BAR_COUNT_BPM` = **160 bpm and up** it becomes the idiomatic
  two-bar jazz count — "1 … 2 … 1 2 3 4", clicks on beats 1 and 3 of the
  first bar, all four of the second (`countBeat`/`countLen`).

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
of bars/clicks kept). Two settings shape it:

```
p       = min(1, prog / settle)              // settle = S.settle / 100
density = floor + (1 − floor) · (1 − fallShape(p))
```

Density starts at 100% and reaches the floor at **S.settle% of the
round** ("Reaches floor at" slider, 50–100%, default 90), then holds.
The hold exists so the last stretch of the round is a stable sparse
pattern the player can settle into, rather than a still-moving target —
a deliberate teaching choice.

`fallShape(p)` is the curve type ("Curve" segmented control, `S.curve`):

- **linear** — `p`. Even fall; the default and the historical behaviour.
- **easein** — `p²`. Stays dense longer, then falls late and fast.
- **easeout** — `1 − (1−p)²`. Thins early, long sparse tail.
- **stepped** — equal-time plateaus. In phrase mode there is one plateau
  per available k level (n down to the floor's k), so every density gets
  the same dwell time; dwell is quantised to phrase boundaries because k
  still only updates at phrase tops. Thin mode uses 6 plateaus.

The dropout-plan chart samples this same curve at `PLAN_COLS` = 6 column
midpoints via `kAt`, so what the chart shows is exactly what will play.
The thin-mode density strip traces the real `densityAt` (60 samples with
step points, so stepped draws true stairs), not a hardcoded ramp.

**Chart liveness — history and current rules.** The chart's axis is
stages, not time. An early version moved a playhead across it, which
players read as "a click sounds when the cursor crosses a slash" —
wrong, and a drummer caught it — so all liveness was removed. In
Sep 2026 William explicitly asked for the *stage* highlight back:
`updateStageNow` (called from `paint`, reading the audio clock) lights
the `.stage-cell.now` whose sampled k matches the k currently in force,
tie-broken by round position. Guardrails that keep the old failure
modes out:

- No playhead and nothing moves within a cell — the highlight marks the
  density stage only, and changes at most a handful of times per round.
- `.stage-cell.now` styles the cell background/outline/label and MUST
  NOT touch `.slash` styling — the old `.active` highlight had a
  specificity bug where `.stage-cell.active .slash` overrode
  `.slash.off`, lighting silent bars as if clicking.
- The legend still says "not a timeline".

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
