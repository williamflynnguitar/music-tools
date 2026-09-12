# Practice Journal

A practice log for students. They log what they practiced and for how long,
and look back over it before a lesson. Built from `briefs/practice-journal-build-brief.md`
(Sept 2026). Linked from Blackboard as well as from the landing page.

Primary user: a student on a phone, in a practice room, logging a session the
moment it ends. Secondary: the same student reviewing the week before a lesson.

Single self-contained `index.html`, no dependencies, no build step, works from
`file://`. Root `CLAUDE.md` conventions apply — petrol/ink ground, bone text,
brass accent, monospace for every label and number.

---

## The localStorage exception — deliberate, do not "fix"

**Root `CLAUDE.md` forbids browser storage APIs. This tool uses `localStorage`
anyway, on purpose, because the brief requires it.** A journal that forgets
what you logged is not a journal. Chartwright is the other exception; this one
is load-bearing rather than historical.

- Keys, namespaced against the rest of the origin:
  - `jgth:practice-journal:entries:v1`
  - `jgth:practice-journal:config:v1`
- **Every write goes through `store.persist()`.** `localStorage.setItem` appears
  exactly twice in the file — in `persist()` and in `restoreRaw()`, the rollback
  helper. `check.js` fails the build if that stops being true.
- Nothing else in the file touches `localStorage` directly. If you need a write,
  add a method to `store`.

Run `node practice-journal/check.js` after editing. It guards this and the
date handling below.

---

## The two rules that cost a semester if broken

**1. Calendar dates are local; timestamps are UTC.** `date` is the student's own
calendar day (`"2026-09-11"`), produced by `dateToISO`/`todayISO` from the local
clock. `createdAt` / `updatedAt` / `deletedAt` are ISO 8601 UTC instants.
`toISOString().slice(0,10)` is **banned** — a student practicing at 11pm in
Kansas would have the session filed under tomorrow. `new Date("2026-09-11")`
is banned too: it parses as UTC midnight. Use `isoToDate`, which builds a local
date with the three-argument constructor and round-trip-checks it, so
`2026-02-31` is rejected instead of silently rolling to March.

Date ranges compare `YYYY-MM-DD` **lexicographically** — fixed-width and
zero-padded makes string order identical to chronological order. No `Date`
object ever reaches a filter. Values from `<input type="date">` go through
`isValidISODate` first, because the element degrades to a text field on old
browsers and `"2026-9-5"` would break the comparison silently.

**2. Deletes are soft.** `softDelete` sets `deletedAt` and bumps `updatedAt`;
the record stays. A hard delete now becomes an entry that resurrects on the
first Phase 2 sync. The same reasoning is why the **JSON export includes
tombstones** and CSV and plain text do not: drop the tombstones from a backup
and the delete-on-phone-A / restore-on-phone-B round trip brings the entry back.
Settings has an explicit "delete permanently" that removes the records outright.

---

## Data shape

Entries live in an **object envelope**, not a bare array, so Phase 2 adds keys
instead of migrating a top-level type:

```
{ schemaVersion, kind:"practice-journal.entries", deviceId, updatedAt,
  lastExportedAt, entries:[ Entry ] }

Entry { id, schemaVersion, createdAt, updatedAt, deletedAt, date,
        durationMinutes, notes, fields:{ tempo, tool, tune, key,
        category, tags[], focus, rating } }
```

`fields` is a flat bag of **fixed, known keys**. Students toggle which they use;
they never define new ones. That is what keeps the data queryable and lets other
suite tools write into the same store later.

- **Normalizers preserve unknown keys verbatim** — top-level and inside `fields`.
  A Phase 2 or foreign write round-trips through this version unchanged. The UI
  iterates `FIELD_IDS`, never `Object.keys(fields)`. Do not "clean" unknown keys;
  dropping data you don't understand is how a semester goes missing.
- `schemaVersion` is never downgraded on write.
- **A foreign `id` is never regenerated** — that would duplicate every entry on
  each re-import and defeat merge-by-id. An imported record with *no* id gets a
  content-derived one from `stableId()`, so re-importing the same file is a no-op
  instead of doubling the log.
- `tool` values are the suite's **folder slugs** (`two-and-four`), not labels, so
  deferred auto-logging can match. Labels are for display only.
- Tags are lower-cased on the way in. They are a filter facet and a Summary key;
  `Comping` and `comping` as two rows fragments exactly the data the tool exists
  to produce.
- `fields.category` is **not** validated against `config.categories`. Removing a
  category in Settings must never blank out entries already logged under it —
  they keep the label, History shows it as `(retired)`, and Summary still buckets
  it. Renaming is the same: it changes the menu going forward, not the past.

`crypto.randomUUID()` is secure-context-only and `file://` is not a secure
context, which the suite requires. `uuid()` falls back to
`crypto.getRandomValues` (not gated) and then to a `Math.random` tier that is
still v4-*shaped*. Never call `randomUUID` unguarded.

---

## Concurrency: two tabs are the ordinary case

The framed-in-Blackboard card tells students to open a second tab, so two tabs
holding the same store is normal, not exotic. `persist()` writes the **whole**
envelope, so a stale tab would otherwise erase everything the other one logged.

`syncFromDisk()` runs at the start of every mutator: same id → later `updatedAt`
wins, ids only on disk are taken, ids only in memory are kept. A `storage` event
listener re-reads and re-renders when the other tab writes. Any new mutator must
call it first.

---

## Failure states

`store.state()` collapses to one of `framed > missing > blocked > corrupt > full > ok`.

| state | what happens |
|---|---|
| `framed` | `window.self !== window.top`. The log form is replaced by a card that explains frame-partitioned storage and links to the tool in its own tab. History, Summary and export stay readable; import is hidden. |
| `missing` / `blocked` | Storage throws or is absent (private browsing, blocked site data). The form is removed rather than greyed out — the brief forbids accepting entries that will silently vanish. |
| `corrupt` | The entries key didn't parse. **Writing stays enabled**: import and "start fresh" are the only ways back and both must write. The unreadable bytes are protected by hiding the log form and every edit path behind `body.pj-corrupt`, so nothing overwrites them until the student chooses to. Export refuses to hand over the empty in-memory store — an empty file that looks like a backup is worse than no file. A corrupt *config* key is not this state: config falls back to the defaults and the entries load normally. |
| `full` | Quota. The entry stays on screen and in `store.unsavedEntries()`, never rolled back out from under the student, with retry / download / copy offered in the warn bar. |

CSS carries the hiding: `[data-mutates]` for anything that writes,
`[data-import]` for the import controls (which survive `corrupt`).

Rollback policy: a failed write rolls back in memory **except** for `saveEntry`,
where rolling back would delete what the student just typed. Loud beats tidy.

---

## Views

- **Log** — the entry form, designed at 360px first. Date and duration prefilled,
  duration quick-pick chips beside the number, one primary action in a sticky
  bar inside the thumb arc. Every control is ≥44px and ≥16px (iOS zooms the
  viewport on focus below 16px, which throws a one-handed logger out of the form).
  After a save the **frame** carries (date, tool, tune, key, category) and the
  **block** clears (duration, tempo, tags, focus, rating, notes) — a carried-over
  tag silently mislabels the next entry.
- **History** — reverse chronological, grouped by day with a day total, each row
  expandable to the full record plus edit and delete. Six AND-ed filters behind a
  collapsed bar. Absolute dates, never "Today" — the tab is expected to sit open
  across midnight.
- **Summary** — rolling 7 / 30 / all-time windows (not calendar: a lesson sits on
  a fixed weekday, so "since the last lesson" is always the last seven days).
  Total, sessions, average, days. Time by category and by tool, each summing
  exactly to the total because every entry lands in exactly one row — that is
  what the `not recorded` bucket is for. Plain tables, tabular figures, no bars.
- **Settings** — export and import first, then fields, categories, defaults,
  deleted entries, and one calm paragraph about what clearing browser data does.

---

## Export and import

Export is the only backup path in Phase 1, so it is also surfaced at the foot of
History, not only in Settings. Every export shows its text in a textarea with a
copy button as well as downloading, because an in-app browser that silently
swallows a download is the worst failure here.

- **JSON** — the backup. Full fidelity, includes config and tombstones,
  re-importable. `kind: "practice-journal.backup"` is the only thing the importer
  sniffs on.
- **CSV** — spine columns then one per enabled field, in canonical `FIELD_IDS`
  order so last month's export lines up with this one. RFC 4180 quoting, CRLF,
  and a UTF-8 BOM so Excel doesn't mangle the curly quotes iOS inserts. A cell
  starting `=`, `+`, `-` or `@` is **quoted, never prefixed with an apostrophe** —
  notes beginning "- worked on the bridge" are common and editing a student's
  words is the worse failure.
- **Plain text** — a date range formatted for pasting into Blackboard. No box
  drawing, no column alignment, no hard wrapping: all three break in a
  proportional editor.

Import is JSON only, merges by `id` with later `updatedAt` winning, and is
**re-classified at apply time** — the plan is built when the student presses
"check it" and they may edit an entry before pressing "import", which must not
let a stale plan overwrite the newer copy. Nothing is written until confirm.
Config is merged additively and only if the student ticks the box; silently
replacing their category list would be hostile.

---

## Known limitations (Phase 1)

- **No identity.** On a shared or lab computer, entries from several students mix
  into one store. Resolved by Phase 2 identity + sync; do not attempt a local
  workaround.
- Clearing browser data, private browsing, or switching browser or device loses
  everything. Stated plainly in Settings, next to the export action.

## Deferred — do not build

- Phase 2: identity (a student code or passphrase, not accounts) and cross-device
  sync via a serverless proxy plus a key-value store. Likely shares the
  Chartwright scan proxy's infrastructure. The envelope, `deviceId`, the
  tombstones and the merge function are all already shaped for it.
- Auto-logging: other suite tools writing sessions into this store.
- Teacher visibility of entries.
- Multiple student profiles on one device.
- **Streaks, goals and any gamification.** The Summary's `days 4 of 7` is a count
  of distinct days, order-insensitive, with nothing to break — it is not a streak
  and must not grow into one. Explicitly rejected: a 7-dot day grid (consecutive
  gaps become visually legible, which *is* a streak display), colouring the figure
  against a threshold, "+35m vs last week", superlatives, and average rating.
- Lick journal — a separate application.

## Open with William

1. A weekly time goal: left out per the brief. Motivating for some students,
   quietly punishing for others, and a broken streak is a common reason people
   abandon a log.
2. Default enabled fields — Tool / Category / Tempo, as the brief proposed.
3. Default category list — technique, repertoire, transcription, reading,
   improvisation.

## Notes for a later editor

- `window.__pj` exposes the store, `agg()`, the three export builders and the
  render functions. It is the seam the Playwright checks drive; harmless in
  production, and removing it breaks them.
- `--bone-dim` is `#b4aa96` here, four steps lighter than the suite's `#a89f8c`,
  and `--edge` `#3a7285` carries control borders. The suite values fail WCAG AA
  where a dim label sits on `--petrol-2` (3.97:1) and for control boundaries
  against ink (2.15:1). Side by side the difference reads as a slightly brighter
  label. Revert both if family consistency matters more than the AA margin.
- `.rc` rating cells are `<label>`s, so their CSS has to out-specify
  `.fld label{display:block}`. That is what `.fld .rate .rc` is for; don't
  shorten it.
- The Log form is deliberately outside the global `render()` path. A background
  store change must never wipe half-typed notes.
