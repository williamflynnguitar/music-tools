/* Line Ladder — the four components of Stan Smith's Scale/Arpeggio Routine,
   from Appendix F. Pure data. Each degree string fills its segment exactly
   (min = max beats), so the eighths template's descending fill never runs.
   The assembled routine is a sequence of them — still data: scale to the 5th
   twice, scale to the 9th, the triad (routine-3 already holds both passes,
   which the notation beams into one bar), the arpeggio to the 9th, and the
   root as a whole note. Six bars and the landing note, seven in all, on one
   chord. The order is William's ruling of 2026-09-19: p. 86's notation is
   right and its text is not — components 1 and 3 repeat, 2 and 4 play once. */
window.LL_CONCEPTS = window.LL_CONCEPTS || [];
(function(){
  const SRC = "Stan Smith's Scale/Arpeggio Routine — Introduction to Jazz Guitar (2014), p. 86";
  const ALL = ["maj7","6","7","sus7","m7","m6","m7b5","mMaj7","maj7s5"];   // every quality but º7
  const part = (id, name, short, against, beats, degrees) => ({
    id, name, short,
    group: "Scale/arpeggio routine",
    source: SRC,
    tags: [],
    optIn: true,
    fixed: true,
    applies: { qualities: ALL, minBeats: beats, maxBeats: beats },
    degrees,
    against,
    rhythm: "eighths",
    endpoint: null });

  window.LL_CONCEPTS.push(
    part("routine-1", "Scale to the 5th",    "sc→5", "scale", 4, [1,2,3,4,5,4,3,2]),
    part("routine-2", "Scale to the 9th",    "sc→9", "scale", 8, [1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2]),
    part("routine-3", "Triad arpeggio",      "tri",  "chord", 4, [1,3,5,3,1,3,5,3]),
    part("routine-4", "Arpeggio to the 9th", "arp9", "chord", 4, [1,3,5,7,9,7,5,3]),

    { id: "routine",
      name: "The assembled routine",
      short: "routine",
      group: "Scale/arpeggio routine",
      source: SRC,
      tags: [],
      optIn: true,
      sequence: ["routine-1", "routine-1", "routine-2", "routine-3", "routine-4",
        /* the landing note is not one of the four components, so it is not a
           registry entry of its own: the root, held for the bar */
        { id: "routine-land", name: "Landing note", short: "R", fixed: true,
          applies: { qualities: ALL, minBeats: 4, maxBeats: 4 },
          degrees: [1], against: "chord", rhythm: "quarters", endpoint: null }] }
  );
})();
