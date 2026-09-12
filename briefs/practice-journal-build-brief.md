# Practice Journal — Build Brief

**Status:** Phase 1 (local-first). Phase 2 (cross-device sync) is out of scope for this build but the data model below must be built to accommodate it without migration.

---

## 1. Purpose

A practice logging tool for students, hosted alongside the existing JGTH tool suite and linked from Blackboard. Students log what they practiced, for how long, and what happened. The tool is heavily configurable so that students with different practice habits can shape what they track, without the underlying data becoming unqueryable.

Primary user: a student, often on a phone, logging a session immediately after practicing. Secondary use: reviewing history before a lesson.

---

## 2. Architecture constraints

Follows existing suite conventions with one deliberate exception.

- Single self-contained HTML file. No build step, no dependencies, inline CSS and JS.
- Hosted at `williamflynnguitar.github.io/music-tools/`.
- Existing visual language: petrol/ink dark ground, bone text, brass accent, monospace for data labels, serif for reading text.
- **Exception to suite convention:** this tool uses `localStorage`. Every other tool in the suite is stateless and explicitly avoids browser storage APIs. This departure is intentional and must be documented as such in the app's `CLAUDE.md` so it isn't "corrected" by a later audit.

### Mobile is a first-class target

Students will log sessions on a phone in a practice room. The entry form must be fully usable one-handed on a small screen. Do not treat mobile as a reflow of a desktop layout.

---

## 3. Storage

### Keys

All keys namespaced to avoid collision with other tools on the same origin:

- `jgth:practice-journal:entries:v1` — the entry store
- `jgth:practice-journal:config:v1` — user configuration

### Entry shape

Every entry carries sync-readiness fields even though nothing syncs in Phase 1. These exist so Phase 2 can reconcile records without a data migration.

```json
{
  "id": "uuid-v4",
  "schemaVersion": 1,
  "createdAt": "2026-09-11T14:22:03.000Z",
  "updatedAt": "2026-09-11T14:22:03.000Z",
  "deletedAt": null,
  "date": "2026-09-11",
  "durationMinutes": 45,
  "notes": "free text",
  "fields": {
    "tempo": 84,
    "tool": "two-and-four",
    "tune": "All the Things You Are",
    "key": "Ab",
    "category": "transcription",
    "tags": ["comping", "slow"],
    "rating": 4
  }
}
```

Notes on the shape:

- `id` is a UUID generated client-side (`crypto.randomUUID()`).
- Timestamps are ISO 8601 UTC. `date` is a separate local calendar date, because a student practicing at 11pm should see it logged on that day, not the next.
- **Deletes are soft.** Set `deletedAt` and filter from views. A hard delete in Phase 1 becomes a record that silently resurrects on first sync in Phase 2. Provide a "permanently clear deleted entries" action in settings for students who want it gone.
- `fields` is a flat bag of **fixed, known keys**. Students toggle which of these they use; they do not define new ones. This is the constraint that keeps the data queryable later and lets other tools write into the same store eventually.

### Config shape

```json
{
  "schemaVersion": 1,
  "enabledFields": ["tempo", "tool", "category", "tags"],
  "categories": ["technique", "repertoire", "transcription", "reading", "improvisation"],
  "defaultDurationMinutes": 30,
  "defaultView": "log"
}
```

`categories` is student-editable free text — this is where genuine individual difference lives. The field *types* are fixed; the vocabulary inside them is not.

---

## 4. Field library

**Always present (the spine, not toggleable):**

| Field | Type | Notes |
|---|---|---|
| Date | date | Defaults to today |
| Duration | number (minutes) | Defaults to `defaultDurationMinutes` |
| Notes | textarea | Free text, no length cap |

**Optional, toggled in settings:**

| Field | Type | Notes |
|---|---|---|
| Tempo | number (BPM) | |
| Tool / exercise | select | Populated from the JGTH tool suite (Two-and-Four, Fretboard, Scale Practice, Arpeggios Deck, Shell Voicing Builder, Inversion Drill, Voice-Leading Trainer, Charleston, Box Buddy, Triad Voicings, Line Ladder, Quartal Voicings) plus a free-text "Other" |
| Tune | text | |
| Key | select | 12 keys |
| Category | select | From student's editable `categories` list |
| Tags | multi, student-defined | Autocomplete from previously used tags |
| Focus / goal | text | What they set out to do |
| Rating | 1–5 | How the session went |

Default enabled set for a first-time user: **Tool, Category, Tempo**. Keep the first-run form short — a student who opens it and sees eleven fields will not log a second session.

---

## 5. Views

Three views, switchable. `defaultView` in config decides which opens first.

### Log
The entry form. Optimized for speed: date and duration prefilled, cursor ready in notes, one primary action. Saving returns to a confirmed state without a full page rerender.

### History
Reverse-chronological list. Filterable by date range, category, tag, tool, and tune. Each row is expandable and editable. Editing updates `updatedAt`.

### Summary
Aggregates over a selectable window (week / month / all time):
- Total practice time
- Time by category
- Time by tool
- Entry count and average session length

Present these as plain data — the existing monospace data-label treatment. No progress bars, badges, or streak counters (see Open Questions).

---

## 6. Export and import

Export is load-bearing in Phase 1: it is the only way a student moves data between devices or recovers from a cleared cache. Surface it clearly rather than burying it in settings.

- **JSON** — full fidelity, re-importable, includes config. This is the backup format.
- **CSV** — flattened, one row per entry, one column per enabled field. For spreadsheets.
- **Plain text** — readable summary of a selected date range, formatted for pasting into a Blackboard assignment submission or emailing before a lesson.

**Import (JSON only):** merge by entry `id`. On collision, keep the record with the later `updatedAt`. Never silently overwrite the whole store — show a preview of how many entries will be added, updated, and skipped, then require confirmation.

---

## 7. Failure and edge cases

These matter more than usual because the failure mode is a student losing a semester of logs.

- **`localStorage` unavailable** (private browsing, blocked storage): detect on load. Show a clear, non-apologetic message explaining that entries can't be saved in this browsing mode and what to do instead. Do not let the form accept entries that will silently vanish.
- **Framed inside Blackboard:** detect `window.self !== window.top`. Cross-origin iframes get storage partitioned in some browsers, which can make entries disappear between sessions. When framed, show a prominent prompt to open the tool in a new tab, and do not present the entry form.
- **Storage quota approaching:** warn and prompt an export before writes start failing.
- **Shared or lab computer:** Phase 1 has no identity, so entries from multiple students on one machine will mix. Not solved here — note it in `CLAUDE.md` as a known limitation resolved by Phase 2.
- **Clearing browser data wipes everything.** Surface this honestly somewhere calm (settings or an About panel), paired with the export action. One unhurried explanation, not a banner on every screen.

---

## 8. Quality floor

Responsive to phone width. Visible keyboard focus. Reduced motion respected. Accessible contrast within the existing palette. No motion beyond what confirms a user action.

---

## 9. Deferred — log in `CLAUDE.md`, do not build

- Phase 2: identity (student code or passphrase, not full accounts) and cross-device sync via a serverless proxy + key-value store. Likely shares infrastructure with the Chartwright scan proxy.
- Auto-logging: other tools in the suite writing sessions into this store directly.
- Teacher visibility of entries.
- Multiple student profiles on one device.
- Streaks, goals, and any gamification.
- Lick journal integration — explicitly a separate application.

---

## 10. Open questions for William

1. **Streaks and goals.** Deliberately excluded above. Motivating for some students, quietly punishing for others, and a streak break is a common reason people abandon a log entirely. Include a weekly time goal, or leave it out?
2. **Default enabled fields.** Proposed Tool / Category / Tempo. Should the default set match what you'd actually want a first-semester student tracking?
3. **Category starter list.** Proposed: technique, repertoire, transcription, reading, improvisation. Editable by the student, but the default shapes what most of them will use.
