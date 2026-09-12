#!/usr/bin/env node
/*
 * practice-journal/check.js — guards the invariants that cost a semester.
 *
 *   node practice-journal/check.js
 *
 * This tool is the suite's sanctioned exception to the no-browser-storage rule
 * (see practice-journal/CLAUDE.md). The exception is narrow: writes go through
 * one chokepoint, and calendar dates never come from UTC. Both are easy to
 * undo by accident and neither shows up as a broken page, so they are checked
 * here instead.
 */
const fs = require("fs"), path = require("path");

const FILE = path.join(__dirname, "index.html");
const src = fs.readFileSync(FILE, "utf8");

/* the script body only — the spine menu block arrives from spine-sync and is
   not ours to police */
const body = src.slice(src.indexOf("<!-- ===== end spine menu ===== -->"));
/* call-site counts run against the code with block comments stripped, so a comment
   that names a banned call (this file's own prose does) is not mistaken for one */
const code = body.replace(/\/\*[\s\S]*?\*\//g, "");

let bad = 0;
const fail = m => { console.log("FAIL  " + m); bad++; };
const ok   = m => console.log("ok    " + m);

function count(re){ return (code.match(re) || []).length; }

/* ---- the storage exception stays narrow ---- */
const setItems = count(/localStorage\.setItem/g);
setItems === 2
  ? ok("localStorage.setItem appears twice (persist + restoreRaw)")
  : fail("localStorage.setItem appears " + setItems + " times; it must be exactly 2 — " +
         "every write goes through store.persist()");

const otherStorage = /\b(sessionStorage|indexedDB)\b/.exec(code);
otherStorage ? fail("uses " + otherStorage[1] + "; only localStorage is sanctioned here")
             : ok("no sessionStorage or IndexedDB");

count(/localStorage\.removeItem/g) <= 2
  ? ok("localStorage.removeItem is confined to the probe and restoreRaw")
  : fail("localStorage.removeItem appears outside the probe and restoreRaw");

/^\s*const K_ENTRIES = NS \+ "entries:v1";/m.test(body) &&
/^\s*const K_CONFIG  = NS \+ "config:v1";/m.test(body)
  ? ok("storage keys are the namespaced v1 pair")
  : fail("the storage key names have changed; Phase 2 and any existing student data depend on them");

/* ---- calendar dates are local, timestamps are UTC ---- */
/toISOString\(\)\s*\.\s*slice/.test(body)
  ? fail("toISOString().slice() — that is a UTC date. An 11pm session files under tomorrow. Use dateToISO()")
  : ok("no UTC slicing into a calendar date");

/new Date\(\s*["'`]\d{4}-\d{2}-\d{2}["'`]\s*\)/.test(body)
  ? fail('new Date("YYYY-MM-DD") parses as UTC midnight. Use isoToDate()')
  : ok("no UTC-parsed date literals");

/function isoToDate/.test(body) && /d\.getFullYear\(\) === y/.test(body)
  ? ok("isoToDate round-trip-checks the date (2026-02-31 is rejected)")
  : fail("isoToDate must round-trip-check, or JS rolls 2026-02-31 into March");

/* ---- uuid on file:// ---- */
const unguarded = /(?<!typeof )crypto\.randomUUID\(\)/.test(body) &&
                  !/typeof crypto\.randomUUID === "function"/.test(body);
unguarded
  ? fail("crypto.randomUUID() is called unguarded; it is undefined on file://, which the suite requires")
  : ok("crypto.randomUUID is guarded, with a getRandomValues fallback");

/* ---- concurrency ---- */
/function syncFromDisk/.test(body)
  ? ok("syncFromDisk exists (a stale second tab must not clobber the store)")
  : fail("syncFromDisk is gone; a second tab will overwrite the whole envelope");

const mutators = ["function saveEntry", "function setDeleted", "function purgeDeleted", "function applyImport"];
mutators.forEach(m => {
  const i = body.indexOf(m);
  if (i < 0) return fail(m + " not found");
  body.slice(i, i + 400).includes("syncFromDisk()")
    ? ok(m.replace("function ", "") + " merges from disk before mutating")
    : fail(m.replace("function ", "") + " must call syncFromDisk() first");
});

/* ---- soft delete ---- */
/deletedAt/.test(body) && /function softDelete/.test(body)
  ? ok("soft delete is intact")
  : fail("soft delete is gone; a hard delete resurrects on the first Phase 2 sync");

/* ---- self-contained ---- */
const ext = [...body.matchAll(/<script[^>]+src=|<link[^>]+href=/g)];
ext.length ? fail("external resource reference found; the tool must work from file://")
           : ok("no external scripts or stylesheets");

/* ---- the spine block is present and untouched by hand ---- */
src.indexOf("<!-- ===== spine menu") === -1
  ? fail("the spine menu markers are missing; run node scripts/spine-sync.js")
  : ok("carries the spine menu block");

/* ---- student text is escaped ---- */
/const esc = s =>/.test(body)
  ? ok("esc() is defined")
  : fail("esc() is gone; student notes, tunes and tags are rendered into innerHTML");

console.log(bad ? "\n" + bad + " problem(s)" : "\nall good");
process.exit(bad ? 1 : 0);
