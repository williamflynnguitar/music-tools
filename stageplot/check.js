// Headless checks for the stage plot tool (node check.js). Loads the engine
// block out of index.html (the check-deck.js extraction pattern) and walks the
// v2 acceptance list as far as it can be walked without a browser: the role
// library, templates, the layout engine, channel ordering, section mics,
// doubles and shared chairs, changeover, deck re-layout, the v1 migration,
// and file round-tripping.
//
//   node check.js             run the checks
//   node check.js --samples   rewrite samples/*.json by migrating samples/v1/
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const A = src.indexOf("/* ===== stage plot engine"), B = src.indexOf("/* ===== end stage plot engine ===== */");
if (A < 0 || B < 0) throw new Error("engine markers not found in index.html");
const E = new Function(src.slice(A, B) + `; return { VENUE, DRAW, ROLES, LAYOUT, TEMPLATES, BYO_KINDS, KIT_FULL, KIT_MIN,
  roleDef, roleOf, roleInputs, roleIdFromText, positionLabels, posText2, posShortLines, posNames,
  blankPlot, addPosition, makeFromParts, makeFromTemplate, autoLayout, monitorGroups, resetIds,
  parseNameList, applyNameList, migratePlot, migrateV1, inputUnits, channelRows, channelCount,
  monitorTable, houseNeeds, diSources, byoList, warnings, collapseSections, sectionRows, changeover,
  offDeck, rectOf, footprintOf, deckIn, posText, zoneOf, plotFileName, syncWedgeIds, itemDef,
  diagramGeom, labelBoxes, positionLabelBox, kitInputs };`)();

/* Boxes as the diagram actually draws them — the footprint plus, for a
   position, the label where labelBoxes() puts it. HARD = two physical
   footprints on the same square foot; SOFT = a label crossing something,
   which the halo keeps readable but is worth knowing about. */
function drawnBoxes(p){
  const g = E.diagramGeom(p), LB = E.labelBoxes(p, g), labels = E.positionLabels(p), out = [];
  for (const pos of p.positions){
    out.push({ what:labels[pos.id].short, box:E.rectOf(pos, p) });
    if (LB[pos.id]) out.push({ what:labels[pos.id].short + " label (" + LB[pos.id].side + ")", label:true, box:LB[pos.id] });
  }
  for (const it of p.items){ if (it.kind === "label") continue; out.push({ what:(E.itemDef(it) || {}).short || it.kind, box:E.rectOf(it, p) }); }
  for (const w of p.wedges) out.push({ what:"wedge " + w.number, box:E.rectOf(w, p) });
  return out;
}
function collisions(p){
  const b = drawnBoxes(p), hard = [], soft = [];
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++){
    const A2 = b[i].box, B2 = b[j].box;
    const ox = Math.min(A2.x1, B2.x1) - Math.max(A2.x0, B2.x0), oy = Math.min(A2.y1, B2.y1) - Math.max(A2.y0, B2.y0);
    if (ox <= 1.5 || oy <= 1.5) continue;
    const line = b[i].what + " × " + b[j].what + " (" + Math.round(ox) + "″ × " + Math.round(oy) + "″)";
    (b[i].label || b[j].label ? soft : hard).push(line);
  }
  return { hard, soft };
}

let fails = 0, checks = 0;
const ok = (cond, m) => { checks++; if (!cond){ fails++; console.log("FAIL " + m); } };
const eq = (a, b, m) => ok(a === b, m + "  (got " + JSON.stringify(a) + ", want " + JSON.stringify(b) + ")");
const T = id => E.makeFromTemplate(id);
const chOf = p => E.channelCount(p);
const say = (...a) => console.log("     ", ...a);
const labelsOf = p => E.positionLabels(p);
const readSample = f => JSON.parse(fs.readFileSync(path.join(__dirname, "samples", f), "utf8"));

/* ---- 1. the role library ---- */
{
  const ids = E.ROLES.map(r => r.id);
  eq(new Set(ids).size, ids.length, "role ids are unique");
  ok(E.ROLES.every(r => r.label && r.short && r.family && r.grp && r.w && r.d), "every role is complete");
  ok(E.ROLES.some(r => r.id === "voice") && E.ROLES.some(r => r.id === "tuba") && E.ROLES.some(r => r.id === "dj"),
     "the library covers what SW plausibly sees (" + E.ROLES.length + " roles)");
  eq(E.roleIdFromText("bass trombone"), "btrombone", "text match: bass trombone before trombone");
  eq(E.roleIdFromText("upright"), "upright", "text match: upright before bass");
  eq(E.roleIdFromText("Tenor Sax"), "tenor", "text match is case-insensitive");
  eq(E.roleDef(null, "nope").id, "other", "an unknown role falls back rather than throwing");
}

/* ---- 2. every template builds, fits, and is deterministic ---- */
for (const t of E.TEMPLATES){
  const p = T(t.id);
  ok(p.positions.length > 0, t.name + " has positions");
  const off = p.positions.concat(p.items, p.wedges).filter(o => E.offDeck(o, p));
  ok(off.length === 0, t.name + " starts wholly on the deck (" + off.length + " off)");
  const hits = collisions(p);
  ok(hits.hard.length === 0, t.name + " has no two things in the same place:\n        " + hits.hard.join("\n        "));
  if (hits.soft.length) say(t.name + " label crossings: " + hits.soft.join("; "));
  ok(p.wedges.length <= E.VENUE.monitorMixes, t.name + " asks for no more than " + E.VENUE.monitorMixes + " mixes (" + p.wedges.length + ")");
  const again = T(t.id);
  eq(JSON.stringify(p.positions.map(x => [x.roleId, Math.round(x.x), Math.round(x.y)])),
     JSON.stringify(again.positions.map(x => [x.roleId, Math.round(x.x), Math.round(x.y)])),
     t.name + " lays out deterministically");
}

/* ---- 2b. the two rhythm arrangements, and adding or dropping a player ---- */
{
  eq(E.TEMPLATES.length, 5, "five templates — counts are editable on the main page now");
  for (const t of E.TEMPLATES){
    const p = T(t.id);
    p.rhythmPlan = "bass-centre";
    E.autoLayout(p, { force:true });
    const hits = collisions(p);
    ok(hits.hard.length === 0, t.name + " with bass centre has no two things in one place:\n        " + hits.hard.join("\n        "));
    ok(p.positions.concat(p.items, p.wedges).every(o => !E.offDeck(o, p)), t.name + " with bass centre stays on the deck");
  }
  const combo = T("combo");
  const drums = combo.positions.find(x => x.roleId === "drums"), bass = combo.positions.find(x => x.roleId === "bass");
  const centreish = o => Math.abs(o.x - E.deckIn(combo).w / 2) < E.deckIn(combo).w * .2;
  ok(centreish(drums) && !centreish(bass), "default: the kit is centre, the bass is out to the side");
  combo.rhythmPlan = "bass-centre"; E.autoLayout(combo, { force:true });
  const d2 = combo.positions.find(x => x.roleId === "drums"), b2 = combo.positions.find(x => x.roleId === "bass");
  ok(centreish(b2) && !centreish(d2), "swapped: the bass is centre, the kit is out to the side");
  ok(b2.x > E.deckIn(combo).w / 2 - 40 && d2.x < E.deckIn(combo).w / 3, "…and the kit took the stage-left side (" + Math.round(d2.x) + "″ from the stage-left edge)");

  // add a vocalist, then drop them again — what the buttons on the main page do
  const q = T("combo"), before = chOf(q), n = q.positions.length;
  const mixesBefore = q.wedges.length;
  const assignedBefore = JSON.stringify(q.wedges.map(w => w.assignees.slice().sort()));
  const added = E.addPosition(q, "voice");
  E.autoLayout(q, { force:false });
  eq(q.positions.length, n + 1, "adding a vocalist adds a position");
  eq(chOf(q), before + 1, "…and one channel");
  ok(!E.offDeck(added, q) && collisions(q).hard.length === 0, "…placed clear of everyone else");
  eq(q.wedges.length, mixesBefore, "…and no wedge appears on its own");
  eq(JSON.stringify(q.wedges.map(w => w.assignees.slice().sort())), assignedBefore, "…nor is anyone else's mix redealt");
  ok(!q.wedges.some(w => w.assignees.includes(added.id)), "…the new position has no mix until someone gives it one");
  ok(E.monitorTable(q).unassigned.some(x => /Vox|Voice/.test(x)), "…and says so under the monitors table");
  E.autoLayout(q, { force:true });
  ok(q.wedges.some(w => w.assignees.includes(added.id)), "re-layout deals the mixes again, including the new position");

  // a blank plot has no mixes, and building a band in it must not invent any
  const blank = E.blankPlot();
  for (const r of ["guitar","bass","drums"]){ E.addPosition(blank, r); E.autoLayout(blank, { force:false }); }
  eq(blank.wedges.length, 0, "a blank plot stays at zero wedges however many instruments you add");
  eq(E.monitorTable(blank).unassigned.length, 3, "…and all three read as having no mix");
  E.autoLayout(blank, { force:true });
  eq(blank.wedges.length, 3, "…until re-layout deals them");
  q.positions = q.positions.filter(x => x.id !== added.id);
  for (const w of q.wedges) w.assignees = w.assignees.filter(id => id !== added.id);
  E.autoLayout(q, { force:false });
  eq(chOf(q), before, "dropping them again puts the channel count back");
  ok(collisions(q).hard.length === 0, "…and the row closes up cleanly");
}

/* ---- 2c. hand-assigned mixes survive a re-layout ---- */
{
  const p = T("rock");
  const voice = p.positions.find(x => x.roleId === "voice"), drums = p.positions.find(x => x.roleId === "drums");
  const mix = p.wedges[0];
  mix.assignees = [voice.id, drums.id];
  mix.request = "vocal and kick";
  p.wedgesTouched = true;
  E.addPosition(p, "alto");
  E.autoLayout(p, { force:false });
  const still = p.wedges.find(w => w.id === mix.id);
  eq(still.request, "vocal and kick", "a typed monitor request is not rewritten when the band changes");
  eq(JSON.stringify(still.assignees.slice().sort()), JSON.stringify([voice.id, drums.id].sort()), "…nor are hand-picked assignees");
}

/* ---- 3. big band: usable with no names at all ---- */
{
  const p = T("bigband");
  eq(p.positions.length, 17, "Big Band template: 17 positions");
  ok(p.positions.every(x => E.posNames(x).length === 0), "no names anywhere");
  const labels = labelsOf(p);
  const shorts = p.positions.map(x => labels[x.id].short);
  ok(shorts.includes("Tpt 1") && shorts.includes("Tpt 4"), "duplicated roles number themselves: " + shorts.filter(s => /Tpt/.test(s)).join(", "));
  ok(shorts.includes("Bari") && !shorts.includes("Bari 1"), "a solitary role drops the number");
  eq(chOf(p), 24, "Big Band channel count with individual horn mics");
  ok(E.channelRows(p).every(r => r.who !== undefined), "every channel says which position it is");
  const secRows = E.sectionRows(p);
  eq(Object.keys(secRows).sort().join(","), "sax,tbn,tpt", "three horn rows");
  E.collapseSections(p);
  eq(chOf(p), 24 - 13 + 6, "section mics fold 13 horn mics into 6");
  const q = T("bigband"), kit = q.positions.find(x => x.roleId === "drums");
  for (let i = 0; i < 9; i++) kit.inputs.push({ id:"x" + i, source:"Spare " + i, type:"mic", phantom:false, notes:"" });
  const red = E.warnings(q).filter(w => w.level === "red");
  eq(red.length, 1, "over 32 channels shows one red warning (" + chOf(q) + " ch)");
  eq(red[0].fix, "sections", "and offers the section-mic fix");
  E.collapseSections(q);
  eq(E.warnings(q).filter(w => w.level === "red").length, 0, "section mics clear it (" + chOf(q) + " ch)");
}

/* ---- 4. building from an instrumentation list ---- */
{
  const p = E.makeFromParts([["voice",1],["guitar",1],["keys",1],["bass",1],["drums",1]], null, "Five piece");
  eq(p.positions.length, 5, "a five-piece builds from counts");
  eq(chOf(p), 12, "…and totals 12 channels");
  eq(p.wedges.length, 5, "…and five mixes");
  const needs = Object.fromEntries(E.houseNeeds(p).map(n => [n.id, n.need]));
  eq(needs.kit, 1, "the drums position implies the house kit");
  eq(needs.gtramp1, 1, "the guitar implies a house amp");
  eq(needs.kb1, 1, "keys implies a house keyboard — SW has no acoustic piano");
  eq(needs.bassamp, 1, "the bass implies the house rig");
  eq(needs.di, 3, "keys stereo DI (2) + bass DI (1)");
  eq(needs.micstand, 1, "one boom stand: the vocal");
}

/* ---- 5. channel ordering ---- */
{
  const p = E.makeFromParts([["bari",1],["tenor",1],["alto",1],["trombone",1],["trumpet",2],["guitar",1],["keys",1],["bass",1],["drums",1]], null, "Little big band");
  const order = ["drums","bass","guitar","keys","horn","strings","vocals","other"];
  const idx = E.inputUnits(p).map(u => order.indexOf(u.grp));
  ok(idx.every((v, i) => i === 0 || v >= idx[i - 1]), "drums, bass, guitars, keys, horns, strings, vocals");
  const horns = E.inputUnits(p).filter(u => u.grp === "horn").map(u => u.source);
  eq(horns.join(" | "), "Bari sax | Tenor sax | Alto sax | Trombone | Trumpet | Trumpet", "horns run low to high");
  const q = T("rock"), keys = E.inputUnits(q).map(u => u.key);
  q.channelOrder = [keys[keys.length - 1]].concat(keys.slice(0, -1));
  eq(E.inputUnits(q)[0].key, keys[keys.length - 1], "a frozen order is honoured");
  eq(chOf(q), chOf(T("rock")), "freezing does not change the count");
}

/* ---- 6. names are optional, and never load-bearing ---- */
{
  const p = T("rock");
  const voice = p.positions.find(x => x.roleId === "voice");
  const before = E.monitorTable(p).rows.map(r => r.who.join(", "));
  voice.names = ["Avery Stone"];
  ok(E.monitorTable(p).rows.some(r => /Vox \(Avery Stone\)/.test(r.who.join(", "))), "a name shows in parentheses in the monitor table");
  p.printNames = false;
  eq(JSON.stringify(E.monitorTable(p).rows.map(r => r.who.join(", "))), JSON.stringify(before), "printNames off falls back to position labels exactly");
  ok(E.posShortLines(p, voice).every(l => l.text !== "Avery Stone"), "…and the diagram drops the name too");
  p.printNames = true;
  ok(E.posShortLines(p, voice).some(l => l.text === "Avery Stone"), "…and brings it back");
}

/* ---- 7. bulk name entry ---- */
{
  const p = E.makeFromParts([["alto",1],["tenor",1],["trumpet",1],["trombone",1],["guitar",1],["keys",1],["bass",1],["drums",1]], null, "Horns + rhythm");
  const rows = E.parseNameList("Sam Ortiz — keys\nDana Bell — guitar\nChris Aoki — bass\nJo Fischer — drums\nMax Iverson — tenor\nPat Okonkwo, trumpet\nRené Duval (trombone)\nAvery Stone", p);
  eq(rows.length, 8, "eight lines parsed");
  eq(rows.find(r => r.name === "Sam Ortiz").label, "Keys", "“Name — instrument” aims at the right position");
  eq(rows.find(r => r.name === "Pat Okonkwo").label, "Trumpet", "a comma works as the separator");
  eq(rows.find(r => r.name === "René Duval").label, "Trombone", "so do parentheses");
  ok(rows.find(r => r.name === "Avery Stone").position, "a bare name takes the next free position");
  ok(rows.every(r => r.position), "every line found a position");
  eq(new Set(rows.map(r => r.position.id)).size, 8, "no two names land on one position");
  E.applyNameList(p, rows);
  eq(p.positions.find(x => x.roleId === "keys").names[0], "Sam Ortiz", "apply writes the names through");
  ok(/Dana Bell/.test(E.posText2(p, p.positions.find(x => x.roleId === "guitar"))), "…and they read out in tables");
}

/* ---- 8. doubles and shared chairs ---- */
{
  const p = E.makeFromParts([["alto",1],["drums",1]], null, "Doubles");
  const alto = p.positions.find(x => x.roleId === "alto"), drums = p.positions.find(x => x.roleId === "drums");
  const before = chOf(p);
  alto.doubles = [{ roleId:"flute", input:false }];
  eq(chOf(p), before, "a double with no channel of its own costs nothing");
  ok(/Flute/.test(E.posShortLines(p, alto).map(l => l.text).join(" ")), "…and still prints on the diagram");
  alto.inputs.push(Object.assign({ id:"dbl1", role:"flute" }, E.roleInputs(E.roleDef(p, "flute"))[0]));
  eq(chOf(p), before + 1, "a double that needs its own channel adds one");
  const fl = E.inputUnits(p).find(u => u.source === "Flute");
  ok(fl && fl.grp === "horn", "the double's channel sorts with the horns");
  drums.names = ["Jo Fischer", "Riley Nunez"];
  eq(E.inputUnits(p).filter(u => u.grp === "drums").length, 7, "two occupants, one set of drum channels");
  ok(/Jo Fischer \/ Riley Nunez/.test(E.posText2(p, drums)), "both names print: " + E.posText2(p, drums));
  eq(E.houseNeeds(p).find(n => n.id === "kit").need, 1, "and one house kit, not two");
  eq(p.wedges.filter(w => w.assignees.includes(drums.id)).length, 1, "one chair, one wedge");
}

/* ---- 9. a custom role behaves like any other ---- */
{
  const p = E.makeFromParts([["voice",1],["drums",1]], null, "Custom");
  p.customRoles.push({ id:"custom-steelpan", label:"Steel pan", short:"Pan", family:"other", grp:"other", sub:9,
    stance:"standing", w:36, d:36, zone:"front", inputs:[{ source:"Steel pan", type:"mic", phantom:false }] });
  const before = chOf(p);
  const pos = E.addPosition(p, "custom-steelpan");
  E.autoLayout(p, { force:true });
  eq(chOf(p), before + 1, "a custom role brings its channel");
  eq(E.positionLabels(p)[pos.id].short, "Pan", "…labels itself");
  ok(!E.offDeck(pos, p), "…is placed on the deck");
  ok(E.channelRows(p).some(r => r.source === "Steel pan"), "…and prints in the input list");
  eq(E.houseNeeds(p).find(n => n.id === "micstand").need, 2, "…and asks for a stand");
}

/* ---- 10. the layout engine ---- */
{
  const p = T("bigband");
  const moved = p.positions[0];
  moved.x = 40; moved.y = 20; moved.moved = true;
  E.autoLayout(p, { force:false });
  eq(Math.round(moved.x) + "," + Math.round(moved.y), "40,20", "a dragged position is never moved by the engine");
  E.autoLayout(p, { force:true });
  ok(Math.round(moved.x) !== 40 || Math.round(moved.y) !== 20, "re-layout with force discards the manual move");
  const hits = collisions(p);
  ok(hits.hard.length === 0, "17 positions re-lay out with no overlaps");
  ok(p.positions.concat(p.items, p.wedges).every(o => !E.offDeck(o, p)), "…and nothing off the deck");
  const tight = E.makeFromTemplate("bigband", { widthFt:16, depthFt:10 });
  ok(tight.positions.concat(tight.items, tight.wedges).every(o => !E.offDeck(o, tight)) || tight.layoutStuck > 0,
     "a cramped deck either fits or says it couldn't (" + (tight.layoutStuck || 0) + " stuck)");
}

/* ---- 11. deck size ---- */
{
  const a = T("bigband"), big = E.makeFromTemplate("bigband", { widthFt:32, depthFt:16 });
  const ka = a.positions.find(x => x.roleId === "drums"), kb = big.positions.find(x => x.roleId === "drums");
  ok(Math.abs(ka.x / (24 * 12) - kb.x / (32 * 12)) < .02, "templates re-lay out proportionally on a bigger deck");
  ok(kb.y > ka.y, "a deeper deck puts the kit further upstage in inches");
  eq(JSON.parse(JSON.stringify(a)).deck.widthFt, 24, "a saved plot keeps the deck it was drawn on");
}

/* ---- 12. changeover ---- */
{
  const a = E.migratePlot(readSample("v1/example-v1.json"));
  const b = E.migratePlot(readSample("v1/example-v1.json"));
  b.positions = b.positions.filter(x => x.roleId !== "tenor");        // the sax player is off this set
  E.addPosition(b, "trumpet");                                        // a trumpet chair arrives, unnamed
  E.autoLayout(b, { force:false });
  const co = E.changeover(a, b);
  const stay = co.people.stay.map(x => x.name).join(" | ");
  ok(/Sam Ortiz/.test(stay), "changeover: the keys player stays");
  ok(/Jo Fischer/.test(stay) && /Riley Nunez/.test(stay), "changeover: both drummers stay");
  ok(co.items.stay.concat(co.people.stay.map(s2 => s2.name)).some(s2 => /Drums/i.test(s2)), "changeover: the kit stays put");
  ok(co.people.leave.some(x => /Max Iverson/.test(x.name)), "changeover: the sax player comes off");
  ok(co.people.arrive.some(x => /Tpt|Trumpet/.test(x.name)), "changeover: an unnamed chair still reads as arriving (" + co.people.arrive.map(x => x.name).join(", ") + ")");
}

/* ---- 13. the v1 migration renders identically ---- *
 * samples/v1/example-v1.json is an invented band in v1's format, and
 * example-expected.json is what v1 printed for it. William's real rosters
 * are not in the repo (see CLAUDE.md); when they are on the machine, they
 * get checked too. */
{
  const compare = (name, v1, want) => {
    const p = E.migratePlot(v1);
    eq(p.schemaVersion, 2, name + ": migrates to v2");
    eq(chOf(p), want.channels, name + ": same channel count after migration");
    const rows = E.channelRows(p).map(r => [r.ch, r.source, r.type, r.phantom ? 1 : 0]);
    eq(JSON.stringify(rows), JSON.stringify(want.rows.map(r => [r[0], r[1], r[3], r[4]])), name + ": same input list, channel for channel");
    eq(JSON.stringify(E.monitorTable(p).rows.map(r => r.n)), JSON.stringify(want.monitors.map(m => m[0])), name + ": same wedges");
    eq(JSON.stringify(E.houseNeeds(p).map(h => [h.id, h.need])), JSON.stringify(want.house.map(h => [h[0], h[1]])), name + ": same house equipment");
    ok(p.positions.every(x => !E.offDeck(x, p)), name + ": migrated positions stay where they were drawn");
    return p;
  };
  const ex = compare("example-v1", readSample("v1/example-v1.json"), readSample("v1/example-expected.json"));
  eq(ex.positions.length, 5, "six v1 people become five positions — the two drummers share the kit");
  const drums = ex.positions.find(x => x.roleId === "drums");
  eq(E.posNames(drums).join(" / "), "Jo Fischer / Riley Nunez", "both occupants keep their names");
  eq(E.inputUnits(ex).filter(u => u.grp === "drums").length, 7, "…and one set of drum channels");
  const keys = ex.positions.find(x => x.roleId === "keys");
  eq(E.inputUnits(ex).filter(u => u.posId === keys.id).length, 2, "the keys/vocals player keeps both of their inputs");
  eq(E.channelRows(ex).filter(r => r.source === "Vocal")[0].ch, 13, "…and the vocal still sorts last, as v1 printed it");
  ok(ex.items.some(i => i.ref === "kb1") && ex.items.some(i => i.kind === "byo"), "owned gear and BYO items come across");
  eq(ex.wedges[0].request, "more me, less kick", "wedge requests survive");
  eq(ex.songs[0].onstage.length, 5, "song personnel remap onto positions (the two drummers collapse to one chair)");

  const real = fs.existsSync(path.join(__dirname, "samples/v1/expected.json"));
  if (real){
    const expected = readSample("v1/expected.json");
    for (const name of Object.keys(expected)) compare(name, readSample("v1/" + name + ".json"), expected[name]);
    say("real rosters present on this machine: checked " + Object.keys(expected).length + " of them too");
  } else say("real rosters are not in the repo — checked the example fixture only");
}

/* ---- 14. any sample plots sitting in the folder still load ---- */
{
  const files = fs.readdirSync(path.join(__dirname, "samples")).filter(f => f.endsWith(".json"));
  if (!files.length) say("no sample plots in samples/ — they are local-only, see CLAUDE.md");
  for (const f of files){
    const p = E.migratePlot(readSample(f));
    eq(p.schemaVersion, 2, "samples/" + f + " loads as a v2 plot");
    ok(p.positions.length > 0 && chOf(p) > 0, "samples/" + f + ": " + p.positions.length + " positions, " + chOf(p) + " channels");
  }
}

/* ---- 15. save -> load round trip ---- */
{
  const p = T("rock");
  const text = JSON.stringify(p, null, 1);
  eq(JSON.stringify(E.migratePlot(JSON.parse(text)), null, 1), text, "a saved v2 plot reloads byte-identical");
  ok(/^SW-plot-rock-pop-band-\d{4}-\d\d-\d\d\.json$/.test(E.plotFileName(p)), "file name: " + E.plotFileName(p));
}

/* ---- 16. no browser storage, no network, no rosters in the code ---- */
{
  const banned = /localStorage|sessionStorage|indexedDB|document\.cookie/i.exec(src);
  ok(!banned, "no storage APIs in index.html" + (banned ? " (found " + banned[0] + ")" : ""));
  ok(!/<script[^>]+src=/i.test(src), "no external scripts");
  ok(!/<link[^>]+href=["']http/i.test(src), "no network fonts or stylesheets");
  const names = new Set();
  const dir = path.join(__dirname, "samples");
  const scan = p => { for (const person of (p.people || [])) if (person.name) names.add(person.name);
                      for (const pos of (p.positions || [])) for (const n of (pos.names || [])) names.add(n); };
  for (const d of [dir, path.join(dir, "v1")]) for (const f of fs.readdirSync(d)){
    if (!f.endsWith(".json") || f.startsWith("example") || f === "expected.json") continue;   // the fixture is invented on purpose
    scan(JSON.parse(fs.readFileSync(path.join(d, f), "utf8")));
  }
  const leaked = [...names].filter(n => src.includes(n));
  ok(leaked.length === 0, "no real names in index.html" + (leaked.length ? ": " + leaked.join(", ") : " (checked " + names.size + ")"));
}

/* ---- samples: the fall 2026 ensembles, migrated out of the code ---- */
if (process.argv.includes("--samples")){
  const dir = path.join(__dirname, "samples");
  for (const f of fs.readdirSync(path.join(dir, "v1"))){
    if (f === "expected.json" || f.startsWith("example")) continue;
    E.resetIds();
    fs.writeFileSync(path.join(dir, f), JSON.stringify(E.migratePlot(readSample("v1/" + f)), null, 1) + "\n");
    console.log("wrote samples/" + f);
  }
}

console.log(fails ? "\n" + fails + " FAILED of " + checks : "\nall " + checks + " checks pass");
process.exit(fails ? 1 : 0);
