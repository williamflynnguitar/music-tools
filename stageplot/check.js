// Headless checks for the stage plot tool (node check.js). Loads the engine
// block out of index.html (the check-deck.js extraction pattern) and walks the
// build brief's §10 acceptance list as far as it can be walked without a
// browser: presets, channel counts and ordering, wedge flags, section mics,
// changeover, deck re-layout, and file round-tripping.
//
//   node check.js             run the checks
//   node check.js --samples   (re)write samples/*.json
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const A = src.indexOf("/* ===== stage plot engine"), B = src.indexOf("/* ===== end stage plot engine ===== */");
if (A < 0 || B < 0) throw new Error("engine markers not found in index.html");
const E = new Function(src.slice(A, B) + `; return { VENUE, DRAW, BYO_KINDS, KIT_FULL, KIT_MIN, ENSEMBLES, ensemble,
  makePlot, migratePlot, roleCats, displayName, shortName, roleLine, inputUnits, channelRows, channelCount,
  monitorTable, houseNeeds, diSources, byoList, warnings, collapseSections, changeover, sectionRows,
  offDeck, rectOf, deckIn, posText, zoneOf, plotFileName, syncWedgeIds, itemDef, ownerNames, kitInputs,
  diagramGeom, footprint, personLabelBox, labelBoxes };`)();

/* Boxes as the diagram actually draws them — the shape plus, for a person,
   the name label where personLabelBox() puts it. HARD = two physical
   footprints on the same square foot; SOFT = a name label crossing
   something, which the halo keeps readable but is worth knowing about. */
function drawnBoxes(p){
  const g = E.diagramGeom(p), LB = E.labelBoxes(p, g), out = [];
  for (const it of p.items){
    if (it.kind === "label") continue;
    const who = it.kind === "person" ? p.people.find(x => x.id === it.ownerPersonIds[0]) : null;
    out.push({ what: who ? E.displayName(who) : (E.itemDef(it) || {}).short || it.kind, box:E.rectOf(it) });
    if (who && LB[it.id]){
      const lb = LB[it.id];
      out.push({ what:E.displayName(who) + " label (" + lb.side + ")", label:true, box:lb });
    }
  }
  for (const w of p.wedges) out.push({ what:"wedge " + w.number, box:E.rectOf(Object.assign({ kind:"wedge" }, w)) });
  return out;
}
function collisions(p){
  const b = drawnBoxes(p), hard = [], soft = [];
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++){
    const A = b[i].box, B = b[j].box;
    const ox = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), oy = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0);
    if (ox <= 1.5 || oy <= 1.5) continue;
    const line = b[i].what + " × " + b[j].what + " (" + Math.round(ox) + "″ × " + Math.round(oy) + "″)";
    (b[i].label || b[j].label ? soft : hard).push(line);
  }
  return { hard, soft };
}

let fails = 0, checks = 0;
const ok = (cond, m) => { checks++; if (!cond){ fails++; console.log("FAIL " + m); } };
const eq = (a, b, m) => ok(a === b, m + "  (got " + JSON.stringify(a) + ", want " + JSON.stringify(b) + ")");
const P = id => E.makePlot(id);
const chOf = p => E.channelCount(p);
const say = (...a) => console.log("     ", ...a);

/* ---- 1. every preset builds, and nothing starts off the deck ---- */
for (const e of E.ENSEMBLES){
  const p = P(e.id);
  ok(p.people.length > 0, e.name + " has a roster");
  const off = p.items.filter(i => E.offDeck(i, p)).map(i => E.itemDef(i) ? E.itemDef(i).short : "person")
    .concat(p.wedges.filter(w => E.offDeck(Object.assign({ kind:"wedge" }, w), p)).map(w => "wedge " + w.number));
  ok(off.length === 0, e.name + " starts wholly on the deck (off: " + off.join(", ") + ")");
  const everyone = p.people.every(pp => p.items.some(i => i.ownerPersonIds.includes(pp.id)));
  ok(everyone, e.name + ": every player is on the deck or at a chair");
  const hits = collisions(p);
  ok(hits.hard.length === 0, e.name + " has no two things standing in the same place:\n        " + hits.hard.join("\n        "));
  if (hits.soft.length) say(e.name + " label crossings: " + hits.soft.join("; "));
}

/* ---- 2. Group C — the wedge path ---- */
{
  const p = P("group-c");
  const mon = E.monitorTable(p);
  eq(mon.unassigned.length, 4, "Group C: four players with no wedge before anything is dragged");
  ok(mon.unassigned.every(n => /Emmalynn|Issy|Liam|Jack/.test(n)), "Group C: the four are the vocalists — " + mon.unassigned.join(", "));
  const w = E.warnings(p);
  ok(w.some(x => /no wedge/i.test(x.text)), "Group C: no-wedge warning shows");
  // assign the four vocalists to the two spare wedges, as the checklist does
  const spare = p.wedges.filter(w => w.assignees.length === 0);
  eq(spare.length, 2, "Group C: two spare wedges to share");
  const voc = p.people.filter(pp => /vocals/.test(pp.role));
  spare[0].assignees = [voc[0].id, voc[1].id]; spare[0].request = "all four voices, light piano";
  spare[1].assignees = [voc[2].id, voc[3].id]; spare[1].request = "voices and kick";
  E.syncWedgeIds(p);
  const mon2 = E.monitorTable(p);
  eq(mon2.unassigned.length, 0, "Group C: no flags once the four are assigned");
  const shared = mon2.rows.filter(r => [spare[0].number, spare[1].number].includes(r.n));
  eq(shared.length, 2, "Group C: the two shared rows print");
  eq(shared.reduce((n, r) => n + r.who.length, 0), 4, "Group C: all four vocalists appear across those two rows");
  ok(shared.every(r => r.request), "Group C: both shared rows carry their request text");
  eq(chOf(p), 13, "Group C channel count");
}

/* ---- 3. Combo C — the no-drums path ---- */
{
  const p = P("combo-c");
  ok(!p.items.some(i => i.ref === "kit"), "Combo C: no house kit placed");
  const horns = E.inputUnits(p).filter(u => u.grp === "horn");
  eq(horns.length, 6, "Combo C: six horn inputs");
  ok(chOf(p) <= E.VENUE.consoleChannels, "Combo C: within the console (" + chOf(p) + " ch)");
  eq(E.warnings(p).filter(w => w.level === "red").length, 0, "Combo C: no red warnings");
}

/* ---- 4. Big Band — the channel-count path ---- */
{
  const p = P("bigband-1");
  eq(p.people.length, 17, "Big Band: 17 players");
  const ch = chOf(p);
  say("Big Band 1 with individual horn mics: " + ch + " channels of " + E.VENUE.consoleChannels);
  const rows = E.sectionRows(p);
  eq(Object.keys(rows).sort().join(","), "sax,tbn,tpt", "Big Band: three horn rows");
  eq(rows.sax.length + rows.tbn.length + rows.tpt.length, 13, "Big Band: 13 horn chairs");
  E.collapseSections(p);
  const after = chOf(p);
  say("Big Band 1 with section mics: " + after + " channels");
  ok(after < ch, "section mics cut the channel count (" + ch + " → " + after + ")");
  eq(after, ch - 13 + 6, "section mics: 13 individual horn mics become 6");

  // the red-warning path itself, driven past the ceiling
  const q = P("bigband-1"), kit = q.items.find(i => i.ref === "kit");
  for (let i = 0; i < 9; i++) kit.inputs.push({ id:"x" + i, source:"Spare " + i, type:"mic", phantom:false, notes:"" });
  ok(chOf(q) > E.VENUE.consoleChannels, "stress plot exceeds the console (" + chOf(q) + " ch)");
  const red = E.warnings(q).filter(w => w.level === "red");
  eq(red.length, 1, "over the ceiling shows exactly one red warning");
  eq(red[0].fix, "sections", "the red warning offers the section-mic fix");
  E.collapseSections(q);
  ok(chOf(q) <= E.VENUE.consoleChannels, "section mics clear it (" + chOf(q) + " ch)");
  eq(E.warnings(q).filter(w => w.level === "red").length, 0, "red warning gone");
}

/* ---- 5. channel ordering rule ---- */
{
  const p = P("combo-a");
  const grps = E.inputUnits(p).map(u => u.grp);
  const order = ["drums","bass","guitar","keys","horn","vocals","other"];
  const idx = grps.map(g => order.indexOf(g));
  ok(idx.every((v, i) => i === 0 || v >= idx[i - 1]), "Combo A: drums, bass, guitars, keys, horns, vocals — " + [...new Set(grps)].join(" "));
  const horns = E.inputUnits(p).filter(u => u.grp === "horn").map(u => u.source);
  eq(horns.join(" | "), "Tenor sax | Tenor sax | Trombone | Trumpet", "Combo A horns run low to high");
  const bb = P("bigband-1"), bh = E.inputUnits(bb).filter(u => u.grp === "horn").map(u => u.source);
  ok(/^Bari sax/.test(bh[0]), "Big Band horns start at the bari (" + bh[0] + ")");
  ok(/^Trumpet/.test(bh[bh.length - 1]), "Big Band horns end at the trumpets (" + bh[bh.length - 1] + ")");
  eq(bh.join(" "), "Bari sax Tenor sax 1 Tenor sax 2 Alto sax 1 Alto sax 2 Trombone 1 Trombone 2 Trombone 3 Trombone 4 Trumpet 1 Trumpet 2 Trumpet 3 Trumpet 4", "Big Band horn order");
  // freezing
  const q = P("group-a"), keys = E.inputUnits(q).map(u => u.key);
  q.channelOrder = [keys[keys.length - 1]].concat(keys.slice(0, -1));
  eq(E.inputUnits(q)[0].key, keys[keys.length - 1], "a frozen order is honoured");
  eq(chOf(q), chOf(P("group-a")), "freezing does not change the channel count");
}

/* ---- 6. shared kit ---- */
{
  const p = P("group-b"), kit = p.items.find(i => i.ref === "kit");
  eq(kit.ownerPersonIds.length, 2, "Group B: two drummers on one kit");
  ok(/share kit/.test(E.ownerNames(kit, p.people)), "shared kit prints both names: " + E.ownerNames(kit, p.people));
  const drums = E.inputUnits(p).filter(u => u.grp === "drums");
  eq(drums.length, 7, "one set of drum inputs, not two");
}

/* ---- 7. changeover A → B ---- */
{
  const co = E.changeover(P("group-a"), P("group-b"));
  const stay = co.people.stay.map(x => x.name);
  ok(stay.includes("Liz Graber"), "changeover: Liz Graber stays");
  ok(stay.includes("Caden Kennedy"), "changeover: Caden Kennedy stays");
  ok(co.items.stay.some(s => /drum kit/i.test(s)), "changeover: the kit stays put");
  const arrive = co.people.arrive.map(x => x.name);
  eq(co.people.arrive.filter(x => /sax/i.test(x.role)).length, 2, "changeover: two saxes arrive");
  ok(arrive.includes("A.J. Banks"), "changeover: the second drummer arrives");
  say("changeover A→B: stay " + stay.join(", ") + " | arrive " + arrive.join(", ") + " | channels " + co.channels.from + "→" + co.channels.to);
}

/* ---- 8. deck size: presets re-lay out, saved plots do not ---- */
{
  const a = P("group-a"), big = E.makePlot("group-a", { widthFt:32, depthFt:16 });
  const kitA = a.items.find(i => i.ref === "kit"), kitB = big.items.find(i => i.ref === "kit");
  ok(Math.abs(kitA.x / (24 * 12) - kitB.x / (32 * 12)) < 1e-9, "preset re-lays out proportionally on a bigger deck");
  eq(kitB.y > kitA.y, true, "the deeper deck pushes the kit further upstage in inches");
  const saved = JSON.parse(JSON.stringify(a));
  eq(saved.deck.widthFt, 24, "a saved plot keeps the deck it was drawn on");
  ok(E.rectOf(kitB).x1 <= 32 * 12 + .5, "kit still fits the bigger deck");
}

/* ---- 9. save → load round trip ---- */
{
  const p = P("combo-b");
  const text = JSON.stringify(p, null, 1);
  const back = E.migratePlot(JSON.parse(text));
  eq(JSON.stringify(back, null, 1), text, "a saved plot reloads byte-identical");
  eq(chOf(back), chOf(p), "and derives the same channel count");
  ok(/^SW-plot-combo-b-\d{4}-\d\d-\d\d\.json$/.test(E.plotFileName(p)), "file name pattern: " + E.plotFileName(p));
}

/* ---- 10. house needs, DI counting, mic stands ---- */
{
  const p = P("group-a"), needs = E.houseNeeds(p);
  const by = Object.fromEntries(needs.map(n => [n.id, n]));
  eq(by.kit.need, 1, "one house kit needed");
  eq(by.wedge.need, 4, "four wedges needed");
  eq(by.di.need, 3, "keys stereo DI (2) + bass DI (1) = 3 DI boxes");
  eq(by.micstand.need, 1, "one boom stand: Liz's vocal");
  ok(needs.every(n => !n.over), "Group A stays inside the house counts");
  const bb = P("bigband-1"), bneeds = Object.fromEntries(E.houseNeeds(bb).map(n => [n.id, n]));
  eq(bneeds.micstand.need, 13, "Big Band: 13 horn mics need 13 stands");
  eq(bneeds.micstand.over, true, "and that is more than the " + E.VENUE.house.find(h => h.id === "micstand").count + " SW lists");
}

/* ---- 11. no browser storage anywhere in the file ---- */
{
  const banned = /localStorage|sessionStorage|indexedDB|document\.cookie/i.exec(src);
  ok(!banned, "no storage APIs in index.html" + (banned ? " (found " + banned[0] + ")" : ""));
  ok(!/<script[^>]+src=/i.test(src), "no external scripts");
  ok(!/<link[^>]+href=["']http/i.test(src), "no network fonts or stylesheets");
}

/* ---- samples ---- */
if (process.argv.includes("--samples")){
  const dir = path.join(__dirname, "samples");
  fs.mkdirSync(dir, { recursive: true });
  for (const [id, file] of [["group-c","group-c.json"], ["combo-c","combo-c.json"], ["bigband-1","big-band-1.json"]])
    fs.writeFileSync(path.join(dir, file), JSON.stringify(P(id), null, 1) + "\n");
  console.log("wrote samples/group-c.json, samples/combo-c.json, samples/big-band-1.json");
}

console.log(fails ? "\n" + fails + " FAILED of " + checks : "\nall " + checks + " checks pass");
process.exit(fails ? 1 : 0);
