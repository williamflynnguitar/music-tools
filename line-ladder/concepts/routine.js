/* Line Ladder — the four components of Stan Smith's Scale/Arpeggio Routine,
   from Appendix F. Pure data. Each degree string fills its segment exactly
   (min = max beats), so the eighths template's descending fill never runs.
   The assembled routine is not here. Its order is ruled (William, 2026-09-19:
   the notation is right — components 1 and 3 repeat, 2 and 4 play once); what
   it waits on is a way to split one long static segment. routine-3 already
   holds both passes of the triad, which the notation beams into one bar. */
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
    part("routine-4", "Arpeggio to the 9th", "arp9", "chord", 4, [1,3,5,7,9,7,5,3])
  );
})();
