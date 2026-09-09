/* Line Ladder — core concept pack.
   Concepts are data; the engine owns rhythm templates and smoothing.
   Registry order matters: in Drill mode a segment the drilled concept
   does not apply to falls back to the first applicable concept here. */
window.LL_CONCEPTS = window.LL_CONCEPTS || [];
window.LL_CONCEPTS.push(
  { id: "digital-1235",
    name: "Digital 1-2-3-5",
    short: "1235",
    group: "Digital patterns",
    source: "JGTH 3rd ed., pp. 86–95 (2-beat chords)",
    tags: [],
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"], minBeats: 2, maxBeats: 2 },
    degrees: [1,2,3,5],
    against: "scale",
    rhythm: "eighths",
    endpoint: null },

  { id: "arp-r357",
    name: "Arpeggio R–3–5–7",
    short: "R357",
    group: "Arpeggios",
    source: "JGTH 3rd ed., pp. 76–78, 86–95",
    tags: [],
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","dim7","mMaj7","maj7s5"], minBeats: 2 },
    degrees: [1,3,5,7],
    against: "chord",
    rhythm: "eighths-hold",
    endpoint: null },

  { id: "scale-run",
    name: "Scale run",
    short: "run",
    group: "Scale runs",
    source: "JGTH 3rd ed., pp. 86–95",
    tags: [],
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"], minBeats: 4 },
    degrees: [1],
    against: "scale",
    rhythm: "eighths",
    /* per-unit run endpoints: a 4-beat unit ascends to the 7th (a quarter on
       beat 4); an 8-beat unit ascends to the 9th and falls back to the 3rd */
    endpoint: { 4: 7, 8: 3 } }
);
