/* Line Ladder — 1-2-3-5 cells: the placements and permutations of p. 59.
   Pure data. The placements carry applies.rows, one row per line of the
   book's table: a row fires only where the chord-scale ruling already holds
   the cell's four notes, so "1-2-3-5 on the 9th of maj7" (it needs a #11)
   sounds on a IV and stays silent on a I. The table's "root of" lines are
   digital-1235 in core.js. Loaded after digital.js; registry order is the
   Drill fallback order and these packs come last so that it does not change.
   optIn: a concept that starts unchecked in Mixed. */
window.LL_CONCEPTS = window.LL_CONCEPTS || [];
(function(){
  const SRC = "Introduction to Jazz Guitar (2014), p. 59";
  const MAJ = ["maj7","6"];
  const placement = (id, name, short, degrees, rows) => ({
    id, name, short,
    group: "1-2-3-5 cells",
    source: SRC,
    tags: [],
    optIn: true,
    applies: { rows, minBeats: 2, maxBeats: 4 },
    degrees,
    against: "scale",
    rhythm: "eighths-hold",
    endpoint: null });

  window.LL_CONCEPTS.push(
    placement("cell-from-5", "1-2-3-5 from the 5th", "1235/5", [5,6,7,9], [
      /* 5th of maj7 · 5th of tonic minor (melodic: the 6 and 7 are both raised) */
      { qualities: MAJ.concat(["mMaj7","m6"]), offsets: [7,9,11,2], label: "5-6-7-9" },
      /* 5th of min7 · 5th of dominant 7 — the minor cell */
      { qualities: ["m7","7"], offsets: [7,9,10,2], label: "5-6-♭7-9" },
      /* ♭5 of half-diminished (Locrian) · ♭5 of altered dominant. The book
         prints the ø line's tones as ♭3-4-♭5-♭7, repeating the minor column's
         label; a major cell on the ♭5 of Bø is F G A C. */
      { qualities: ["m7b5","7"], offsets: [6,8,10,1], label: "♭5-♯5-♭7-♭9" } ]),

    placement("cell-from-9", "1-2-3-5 from the 9th", "1235/9", [2,3,4,6], [
      /* 9th of maj7 (Lydian) · 9th of dominant 7 (Lydian dominant) */
      { qualities: MAJ.concat(["7"]), offsets: [2,4,6,9], label: "9-3-♯11-13" },
      /* ♭9 of altered dominant — the minor cell */
      { qualities: ["7"], offsets: [1,3,4,8], label: "♭9-♯9-3-♯5" } ]),

    placement("cell-from-3", "1-2-3-5 from the 3rd", "1235/3", [3,4,5,7], [
      { qualities: ["m7"], offsets: [3,5,7,10], label: "♭3-4-5-♭7" },
      { qualities: MAJ, offsets: [4,6,7,11], label: "3-♯11-5-7" },
      { qualities: ["m7b5"], offsets: [3,5,6,10], label: "♭3-4-♭5-♭7" } ]),

    placement("cell-from-6", "1-2-3-5 from the 6th", "1235/6", [6,7,8,10], [
      { qualities: MAJ, offsets: [9,11,0,4], label: "6-7-R-3" } ])
  );

  /* every other order of 1, 2, 3 and 5, in the order the book lists them
     (1-2-3-5 itself is digital-1235). fixed: the order is the concept, so
     the smoothing rungs move a permutation by octaves and never rotate it.
     The digits stay inside one octave — 5-1-2-3 opens with a falling fifth. */
  const ORDER = ["1253","1325","1352","1523","1532","2153","2135","2315","2351","2513","2531",
    "3125","3152","3215","3251","3512","3521","5123","5132","5213","5231","5312","5321"];
  ORDER.forEach(digits => window.LL_CONCEPTS.push({
    id: "perm-" + digits,
    name: digits.split("").join("-"),
    short: digits,
    group: "1-2-3-5 cells",
    subgroup: "Permutations",
    source: SRC,
    tags: [],
    optIn: true,
    fixed: true,
    applies: { qualities: ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"], minBeats: 2, maxBeats: 4 },
    degrees: digits.split("").map(Number),
    against: "scale",
    rhythm: "eighths-hold",
    endpoint: null }));
})();
