/* Line Ladder — Three Ways In, Two Ways Out (Mike Steinel), from Appendix E.
   Pure data. A Way In leaves a ii for the V a fourth up and lands on its 3rd;
   a Way Out leaves a dominant for whatever sits a fourth up and lands on its
   3rd or its 5th. fixed: the order of the four notes is the Way. Degrees at
   or below zero reach under the root — 0 is the 7th below degree 1 — so the
   printed D B♭ G F is [5,3,1,0]. On a 7♭9 chord degree 2 is the ♭9, which is
   practice suggestion 4 with no entry of its own. */
window.LL_CONCEPTS = window.LL_CONCEPTS || [];
(function(){
  const SRC = "Mike Steinel, \"Three Ways In, Two Ways Out\" — Introduction to Jazz Guitar (2014), pp. 84–85";
  const way = (id, name, short, degrees, lands, applies) => ({
    id, name, short,
    group: "Ways in and out",
    source: SRC,
    tags: [],
    optIn: true,
    fixed: true,
    lands,
    applies: Object.assign({ minBeats: 2, maxBeats: 4 }, applies),
    degrees,
    against: "chord",
    rhythm: "eighths-hold",
    endpoint: null });
  const IN  = { qualities: ["m7"], next: { motion: 5, qualities: ["7","sus7"] } };
  const OUT = { qualities: ["7"],  next: { motion: 5 } };

  window.LL_CONCEPTS.push(
    way("way-in-1",  "Way in 1",  "in1",  [1,3,5,7], 3, IN),    // G B♭ D F → E
    way("way-in-2",  "Way in 2",  "in2",  [5,3,1,0], 3, IN),    // D B♭ G F → E
    way("way-in-3",  "Way in 3",  "in3",  [3,2,1,0], 3, IN),    // B♭ A G F → E
    way("way-out-1", "Way out 1", "out1", [3,2,1,0], 3, OUT),   // E D C B♭ → A
    way("way-out-2", "Way out 2", "out2", [3,5,7,9], 5, OUT),   // E G B♭ D → C
    /* practice suggestion 3: the first note up an octave */
    way("way-in-1-8va",  "Way in 1, displaced",  "in1↕",  [8,3,5,7],  3, IN),
    way("way-out-2-8va", "Way out 2, displaced", "out2↕", [10,5,7,9], 5, OUT)
  );
})();
