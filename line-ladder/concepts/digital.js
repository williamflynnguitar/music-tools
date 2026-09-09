/* Line Ladder — digital-pattern expansion pack.
   Pure data: adding an entry here is the whole job of adding a concept. */
window.LL_CONCEPTS = window.LL_CONCEPTS || [];
window.LL_CONCEPTS.push(
  { id: "digital-12345321",
    name: "Digital 1-2-3-4-5-3-2-1",
    short: "12345321",
    group: "Digital patterns",
    source: "",
    tags: [],
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"], minBeats: 4 },
    degrees: [1,2,3,4,5,3,2,1],
    against: "scale",
    rhythm: "eighths-hold",
    endpoint: null },

  { id: "digital-12345765",
    name: "Digital 1-2-3-4-5-7-6-5",
    short: "12345765",
    group: "Digital patterns",
    source: "",
    tags: [],
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"], minBeats: 4 },
    degrees: [1,2,3,4,5,7,6,5],
    against: "scale",
    rhythm: "eighths-hold",
    endpoint: null },

  { id: "digital-15321235",
    name: "Digital 1-5-3-2-1-2-3-5",
    short: "15321235",
    group: "Digital patterns",
    source: "",
    tags: [],
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"], minBeats: 4 },
    degrees: [1,5,3,2,1,2,3,5],
    against: "scale",
    rhythm: "eighths-hold",
    endpoint: null },

  { id: "arp-3579",
    name: "Arpeggio 3–5–7–9",
    short: "3579",
    group: "Arpeggios",
    source: "",
    tags: [],
    /* 9 = the scale degree 2 an octave up; º7 has no 9th and keeps R–3–5–7 */
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"], minBeats: 2 },
    degrees: [3,5,7,9],
    against: "chord",
    rhythm: "eighths-hold",
    endpoint: null },

  { id: "arp-up-scale-down",
    name: "Arp up, scale down",
    short: "arp↑scale↓",
    group: "Arpeggios",
    source: "",
    tags: [],
    /* R-3-5-7 in eighths, then the eighths template's fill descends the
       parent collection to the segment end */
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"], minBeats: 4 },
    degrees: [1,3,5,7],
    against: "chord",
    rhythm: "eighths",
    endpoint: null }
);
