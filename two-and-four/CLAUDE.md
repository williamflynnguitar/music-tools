# two-and-four — fading backbeat trainer

A metronome that clicks only on beats 2 and 4, then gradually drops clicks
out over the round so the player's inner pulse has to carry more of the
time. Sessions run in rounds (optionally at random tempos) with rests
between them.

A top-level mode switch adds **Training Wheels** (`appMode = "tw"`), an
on-ramp for students who phase-flip — they hear the click fine but assign
it to beat 1. It shares the one lookahead scheduler (`scheduleBeat`
dispatches to `twScheduleBeat`), has its own settings object `T` and
frozen-at-round-start copy `RW`, and never mixes state with the dropout
settings `S`. The standard mode is unchanged.

## Training Wheels: rungs

The 2&4 click is present on every rung. Free choice — the student picks
any rung at any time; nothing auto-advances. Per-rung count-in default in
parentheses (overridable, wood block on all 4, accent on 1; taps during it
are ignored).

| Rung | Downbeat evidence added | Count-in |
|---|---|---|
| 1 | Wood block on all 4 (accent on 1) + kick on 1 & 3 | 2 bars |
| 2 | Kick on 1 & 3 | 2 |
| 3 | Kick on 1, every bar | 2 |
| 4 | Kick on 1, every other bar | 1 |
| 5 | Kick on 1, every 4th bar | 1 |
| 6 | Kick on 1 at 35% (`kickBus.gain`), every 4th bar | 0 |
| 7 | Click only — sonically identical to the standard mode | 0 |

`twVoices(rung, bar, beat)` is the single source of truth for what sounds
when; the plan chart draws from it, so chart and audio cannot disagree.
Voices are symmetric: click, kick and wood block each have their own gain
node (`clickBus` / `kickBus` / `blockBus`) into `master`. Kick = sine,
150→50 Hz over 40 ms, ~120 ms decay. Block = bandpassed noise (~1.8 kHz,
Q 6, brighter when accented) + 900 Hz triangle blip; accent ≈ 2.5× gain.

## Training Wheels: tap time and scoring

Taps (spacebar or the tap pad, `pointerdown` not `click`) are timestamped
with the event's performance-clock time and converted to audio time via an
offset sampled once at round start — `ctx.getOutputTimestamp()` when
available (tracks what is actually heard, incl. output latency), plain
`ctx.currentTime − performance.now()/1000` as fallback, and the output
timestamp is distrusted if it disagrees with the fallback by >0.5 s
(fresh/suspended contexts report garbage). The user-facing latency offset
field (±100 ms) is subtracted from every tap. Never score against
wall-clock reads taken after the event.

Each tap gets a beat phase within its bar against the scheduled grid.
`tol` = 0.15 beats, clamped to a 40–100 ms window (±75 ms at q=120).
Buckets: **down** |ph−0| < tol (wrapping at 4) · **flip** near 1 or 3 (on
the click) · **half** near 2 · **drift** otherwise. A tap belongs to the
bar window [4b−0.5, 4b+3.5) beats, so early downbeat taps stay with their
bar. Verdicts: **flip** = ≥2 consecutive flip-bucket taps (first bar
recorded); **held** = no flip and ≥90% of bars got a down tap.
**Ready** (per rung, this page load only — no storage) = 8 consecutive
bars, each with taps, every tap down-bucket, mean |offset| ≤ 60 ms.
Readiness on rung 7 shows Graduate → Two-and-Four (same tempo). All of
this is in `twScore`, which is pure — simulate it in node when touching it.

## Training Wheels: nothing moves during a round

Project rule applied hard here: during a round there is no cursor, no bar
counter, no beat indicator, no live tap feedback (the tap pad deliberately
has no `:active` style), and readiness badges update only after the round.
The one permitted change is the static "recording…" status label at round
start. The plan chart is drawn before the round and not touched; the
results chart replaces it only after the audible end. Escape stops a
round; stopping early scores the bars completed.

## Training Wheels: deferred

- Perception-only identification mode (bass line + click; "is the click on
  1&3 or 2&4?") — reuse Comping Rhythms ear-training scaffolding.
- Persisting readiness across sessions (blocked by the no-storage
  constraint; would need an export/import string).
- Per-student latency calibration routine.

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
  `TWO_BAR_COUNT_BPM` = **160 bpm and up** it counts two full bars of
  quarter-note clicks, accent on each downbeat (`countBeat`/`countLen`).
  William chose 8 quarters over the "1 … 2 … 1 2 3 4" jazz count.

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
