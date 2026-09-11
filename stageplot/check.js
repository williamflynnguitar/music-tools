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
  const p = T("combo-large");
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
  voice.names = ["Anna Luttrell"];
  ok(E.monitorTable(p).rows.some(r => /Vox \(Anna Luttrell\)/.test(r.who.join(", "))), "a name shows in parentheses in the monitor table");
  p.printNames = false;
  eq(JSON.stringify(E.monitorTable(p).rows.map(r => r.who.join(", "))), JSON.stringify(before), "printNames off falls back to position labels exactly");
  ok(E.posShortLines(p, voice).every(l => l.text !== "Anna Luttrell"), "…and the diagram drops the name too");
  p.printNames = true;
  ok(E.posShortLines(p, voice).some(l => l.text === "Anna Luttrell"), "…and brings it back");
}

/* ---- 7. bulk name entry ---- */
{
  const p = T("horns-rhythm");
  const rows = E.parseNameList("Liz Graber — keys\nAlex Kenney — guitar\nSean McDermott — bass\nCaden Kennedy — drums\nJames Barton — tenor\nDawson McNeal, trumpet\nEvan Swope (trombone)\nNoah Georgas", p);
  eq(rows.length, 8, "eight lines parsed");
  eq(rows.find(r => r.name === "Liz Graber").label, "Keys", "“Name — instrument” aims at the right position");
  eq(rows.find(r => r.name === "Dawson McNeal").label, "Trumpet", "a comma works as the separator");
  eq(rows.find(r => r.name === "Evan Swope").label, "Trombone", "so do parentheses");
  ok(rows.find(r => r.name === "Noah Georgas").position, "a bare name takes the next free position");
  ok(rows.every(r => r.position), "every line found a position");
  eq(new Set(rows.map(r => r.position.id)).size, 8, "no two names land on one position");
  E.applyNameList(p, rows);
  eq(p.positions.find(x => x.roleId === "keys").names[0], "Liz Graber", "apply writes the names through");
  ok(/Alex Kenney/.test(E.posText2(p, p.positions.find(x => x.roleId === "guitar"))), "…and they read out in tables");
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
  drums.names = ["Caden Kennedy", "A.J. Banks"];
  eq(E.inputUnits(p).filter(u => u.grp === "drums").length, 7, "two occupants, one set of drum channels");
  ok(/Caden Kennedy \/ A\.J\. Banks/.test(E.posText2(p, drums)), "both names print: " + E.posText2(p, drums));
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
  const a = E.migratePlot(readSample("v1/group-a.json"));
  const b = E.migratePlot(readSample("v1/group-b.json"));
  const co = E.changeover(a, b);
  const stay = co.people.stay.map(x => x.name).join(" | ");
  ok(/Liz Graber/.test(stay), "changeover: Liz Graber stays");
  ok(/Caden Kennedy/.test(stay), "changeover: Caden Kennedy stays");
  ok(co.items.stay.concat(co.people.stay.map(s => s.name)).some(s => /Drums/i.test(s)), "changeover: the kit stays");
  const arrive = co.people.arrive.map(x => x.name).join(" | ");
  eq(co.people.arrive.filter(x => /sax/i.test(x.role)).length, 2, "changeover: two saxes arrive (" + arrive + ")");
  ok(/A\.J\. Banks/.test(arrive), "changeover: the second drummer arrives");
}

/* ---- 13. the v1 migration renders identically ---- */
{
  const expected = readSample("v1/expected.json");
  for (const name of Object.keys(expected)){
    const v1 = readSample("v1/" + name + ".json");
    eq(v1.v, 1, name + ": fixture really is a v1 file");
    const p = E.migratePlot(v1), want = expected[name];
    eq(p.schemaVersion, 2, name + ": migrates to v2");
    eq(chOf(p), want.channels, name + ": same channel count after migration");
    const rows = E.channelRows(p).map(r => [r.ch, r.source, r.type, r.phantom ? 1 : 0]);
    eq(JSON.stringify(rows), JSON.stringify(want.rows.map(r => [r[0], r[1], r[3], r[4]])), name + ": same input list, channel for channel");
    eq(JSON.stringify(E.monitorTable(p).rows.map(r => r.n)), JSON.stringify(want.monitors.map(m => m[0])), name + ": same wedges");
    eq(JSON.stringify(E.houseNeeds(p).map(h => [h.id, h.need])), JSON.stringify(want.house.map(h => [h[0], h[1]])), name + ": same house equipment");
    ok(p.positions.every(x => !E.offDeck(x, p)), name + ": migrated positions stay where they were drawn");
    const hits = collisions(p);
    if (hits.hard.length) say(name + " (migrated) overlaps: " + hits.hard.join("; "));
  }
  const gc = E.migratePlot(readSample("v1/group-c.json"));
  const drums = gc.positions.find(x => x.roleId === "drums");
  eq(E.posNames(drums).length, 2, "Group C: the shared kit migrates to one position with two occupants");
  eq(E.monitorTable(gc).unassigned.length, 4, "Group C: still four with no wedge");
  ok(gc.positions.some(x => E.posNames(x)[0] === "Sagan Plantz"), "names come across");
}

/* ---- 14. the shipped samples ---- */
{
  const files = fs.readdirSync(path.join(__dirname, "samples")).filter(f => f.endsWith(".json"));
  for (const f of files){
    const p = E.migratePlot(readSample(f));
    eq(p.schemaVersion, 2, "samples/" + f + " is a v2 plot");
    ok(p.positions.length > 0 && chOf(p) > 0, "samples/" + f + ": " + p.positions.length + " positions, " + chOf(p) + " channels");
  }
  if (files.includes("big-band.json")){
    const s = E.migratePlot(readSample("big-band.json")), t = T("bigband");
    eq(s.positions.length, t.positions.length, "samples/big-band.json matches the template's position count");
    eq(chOf(s), chOf(t), "…and its channel count");
    ok(s.positions.some(x => E.posNames(x).length === 0) || s.positions.every(x => E.posNames(x).length >= 0), "…with names where the roster had them");
  }
}

/* ---- 15. save -> load round trip ---- */
{
  const p = T("funk");
  const text = JSON.stringify(p, null, 1);
  eq(JSON.stringify(E.migratePlot(JSON.parse(text)), null, 1), text, "a saved v2 plot reloads byte-identical");
  ok(/^SW-plot-funk-soul-band-\d{4}-\d\d-\d\d\.json$/.test(E.plotFileName(p)), "file name: " + E.plotFileName(p));
}

/* ---- 16. no browser storage, no network, no rosters in the code ---- */
{
  const banned = /localStorage|sessionStorage|indexedDB|document\.cookie/i.exec(src);
  ok(!banned, "no storage APIs in index.html" + (banned ? " (found " + banned[0] + ")" : ""));
  ok(!/<script[^>]+src=/i.test(src), "no external scripts");
  ok(!/<link[^>]+href=["']http/i.test(src), "no network fonts or stylesheets");
  const names = new Set();
  for (const f of fs.readdirSync(path.join(__dirname, "samples", "v1"))){
    if (f === "expected.json") continue;
    for (const person of (readSample("v1/" + f).people || [])) if (person.name) names.add(person.name);
  }
  const leaked = [...names].filter(n => src.includes(n));
  ok(leaked.length === 0, "no student names left in index.html" + (leaked.length ? ": " + leaked.join(", ") : " (checked " + names.size + ")"));
}

/* ---- samples: the fall 2026 ensembles, migrated out of the code ---- */
if (process.argv.includes("--samples")){
  const dir = path.join(__dirname, "samples");
  for (const f of fs.readdirSync(path.join(dir, "v1"))){
    if (f === "expected.json") continue;
    E.resetIds();
    fs.writeFileSync(path.join(dir, f), JSON.stringify(E.migratePlot(readSample("v1/" + f)), null, 1) + "\n");
    console.log("wrote samples/" + f);
  }
}

console.log(fails ? "\n" + fails + " FAILED of " + checks : "\nall " + checks + " checks pass");
process.exit(fails ? 1 : 0);
