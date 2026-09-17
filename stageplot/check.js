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
const E = new Function(src.slice(A, B) + `; return { VENUE, DRAW, ROLES, LAYOUT, TEMPLATES, BYO_KINDS,
  roleDef, roleOf, roleIdFromText, positionLabels, posText2, posShortLines, posNames,
  blankPlot, addPosition, makeFromParts, makeFromTemplate, autoLayout, monitorGroups, resetIds,
  parseNameList, applyNameList, migratePlot, migrateV1,
  monitorTable, houseNeeds, byoList, warnings, changeover,
  offDeck, rectOf, footprintOf, deckIn, posText, zoneOf, plotFileName, itemDef,
  diagramGeom, labelBoxes, positionLabelBox,
  bigBandSeats, legendKeys,
  BACKLINE_CATS, houseCat, backlineCat, refCat, objectRef,
  pickBackline, findBackline, settleBackline, orderNum, ordinal, scheduleLines, fmtDate, labelAngle, kitIsByo, kitLine,
  micsOn, disOn, ownerOf, micText, addMicItem, addDI, placeDI, placeInputs, micList, diList, consoleCount, setWedgeNumber, nextWedgeNumber, wedgeClashes, wedgeClashText, venueFixtures,
  onFixture, SKIPPABLE, isSkipped, setSkipped, stepDone, stepState, chairsOf, setChairs, chairCount, chairText, standsOf, setStands, standCount, standText, defaultStands,
  STAND, DRUMMER, drummerAt, drummerBox, fitLabel, insideBox, labelPlan, labelClear, textWidth, breakTwo };`)();

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
  for (const f of E.venueFixtures(p)) out.push({ what:"fixture " + f.id, box:E.rectOf(f, p) });
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
  const rock = T("rock");
  const drums = rock.positions.find(x => x.roleId === "drums"), bass = rock.positions.find(x => x.roleId === "bass");
  const centreish = o => Math.abs(o.x - E.deckIn(rock).w / 2) < E.deckIn(rock).w * .2;
  eq(rock.rhythmPlan, "drums-centre", "a rock band opens with the kit centre — the app's default");
  ok(centreish(drums) && !centreish(bass), "default: the kit is centre, the bass is out to the side");
  rock.rhythmPlan = "bass-centre"; E.autoLayout(rock, { force:true });
  const d2 = rock.positions.find(x => x.roleId === "drums"), b2 = rock.positions.find(x => x.roleId === "bass");
  ok(centreish(b2) && !centreish(d2), "swapped: the bass is centre, the kit is out to the side");
  ok(b2.x > E.deckIn(rock).w / 2 - 40 && d2.x < E.deckIn(rock).w / 3, "…and the kit took the stage-left side (" + Math.round(d2.x) + "″ from the stage-left edge)");
  // the jazz combo preset opens bass centre (William, 2026-09-16); every other preset, drums centre
  const combo = T("combo");
  eq(combo.rhythmPlan, "bass-centre", "the jazz combo opens with the bass centre");
  ok(centreish(combo.positions.find(x => x.roleId === "bass")) && !centreish(combo.positions.find(x => x.roleId === "drums")), "…and is laid out that way from the first layout, not after a re-layout");
  eq(E.TEMPLATES.filter(t => t.rhythm === "bass-centre").map(t => t.id).join(","), "combo", "…and it is the only preset that does");
  ok(E.TEMPLATES.every(t => !t.rhythm || ["drums-centre","bass-centre"].includes(t.rhythm)), "a preset's rhythm plan is one of the two the app knows");
  eq(E.blankPlot().rhythmPlan, "drums-centre", "a blank plot still opens with the kit centre");

  // add a vocalist, then drop them again — what the buttons on the main page do
  const q = T("combo"), n = q.positions.length;
  const mixesBefore = q.wedges.length, wedgesBefore = JSON.stringify(q.wedges.map(w => [w.number, w.x, w.y]));
  const added = E.addPosition(q, "voice");
  E.autoLayout(q, { force:false });
  eq(q.positions.length, n + 1, "adding a vocalist adds a position");
  ok(!E.offDeck(added, q) && collisions(q).hard.length === 0, "…placed clear of everyone else");
  eq(q.wedges.length, mixesBefore, "…and no wedge appears on its own");
  eq(JSON.stringify(q.wedges.map(w => [w.number, w.x, w.y])), wedgesBefore, "…nor does any existing wedge move or renumber");
  E.autoLayout(q, { force:true });
  ok(q.wedges.length === mixesBefore && q.wedges.some(w => w.number === 1 && Math.abs(w.x - added.x) < 30),
     "re-layout deals the wedges again: the vocalist's is mix 1, downstage of them");

  // a blank plot has no mixes, and building a band in it must not invent any
  const blank = E.blankPlot();
  for (const r of ["guitar","bass","drums"]){ E.addPosition(blank, r); E.autoLayout(blank, { force:false }); }
  eq(blank.wedges.length, 0, "a blank plot stays at zero wedges however many instruments you add");
  E.autoLayout(blank, { force:true });
  eq(blank.wedges.length, 3, "…until re-layout deals them");
  q.positions = q.positions.filter(x => x.id !== added.id);
  E.autoLayout(q, { force:false });
  ok(collisions(q).hard.length === 0, "…and the row closes up cleanly");
}

/* ---- 2c. a wedge is a spot on the deck and a number, nothing more (B2, Tim Shade 2026-09-16) ---- */
{
  const p = T("rock");
  ok(p.wedges.every(w => JSON.stringify(Object.keys(w).sort()) === JSON.stringify(["id","moved","number","rot","x","y"])),
     "a dealt wedge is id, number, x, y, rot, moved: " + Object.keys(p.wedges[0]).sort().join(","));
  eq(p.wedges.map(w => w.number).join(","), "1,2,3,4,5", "…numbered 1 to 5 in priority order");
  const rows = E.monitorTable(p).rows;
  ok(rows.length === 5 && rows.every(r => /^(Downstage|Center stage|Upstage)( (left|center|right))?$/.test(r.where)) && !("who" in rows[0]) && !("request" in rows[0]),
     "the Monitors table is mix number and the zone in words, no feet and inches: " + rows[0].where);
  eq(E.posText({ x:E.deckIn(p).w * .2, y:E.deckIn(p).d * .5 }, p), "Center stage left", "posText spells the zone out from the performer's view");
  eq(E.posText({ x:E.deckIn(p).w * .5, y:E.deckIn(p).d * .5 }, p), "Center stage", "…and the middle is just Center stage");
  ok(!/ftIn\(o\.x\)|from SL|from DS/.test(src.slice(src.indexOf("function posText("), src.indexOf("function posText(") + 400)), "…no inches anywhere in it");
  ok(!/feet are measured/.test(src), "the changeover footer no longer promises feet");
  ok(!E.warnings(p).some(w => /assigned|no wedge/.test(w.text)), "no assignment warnings exist");
  const old = JSON.parse(JSON.stringify(p));
  old.wedges[0].assignees = [p.positions[0].id]; old.wedges[0].request = "more me"; old.positions[0].wedgeId = old.wedges[0].id;
  const back = E.migratePlot(old);
  ok(!("assignees" in back.wedges[0]) && !("request" in back.wedges[0]) && !("wedgeId" in back.positions[0]),
     "an old file's assignees and requests are dropped on load");
  const a = T("rock"), b = T("rock");
  b.wedges[0].x += 40; b.wedges.pop();
  const co = E.changeover(a, b);
  ok(co.wedges.change.length === 1 && co.wedges.change[0].n === 1 && /stage/.test(co.wedges.change[0].from + co.wedges.change[0].to) && co.wedges.leave.join(",") === "5",
     "changeover: a moved wedge and a struck wedge, by number");
  ok(!/data-wassign|data-wreq|What this mix wants|What they want|no one assigned|No wedge assigned/.test(src), "no mix-contents UI or wording left in the page");
  ok(/Notes for the tech/.test(src), "the one free-text field is the notes on the Details tab");
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
}

/* ---- 3b. the input list is gone (B1, Tim Shade 2026-09-16) ---- *
 * The sheet says where things go; what reaches the console is counted from
 * the mics and DI boxes placed on the deck (C1/C3), never from a per-player
 * attribute. Nothing carries inputs, packages, section mics or a channel
 * order any more, and a file that has them loads without them — except the
 * inputs themselves, which ride along for mic placement to turn into objects. */
{
  for (const t of E.TEMPLATES){
    const p = T(t.id);
    ok(p.positions.every(x => !("inputs" in x) && !("pkg" in x)), t.name + ": no position carries inputs or a mic package");
    ok(!("sections" in p) && !("channelOrder" in p), t.name + ": no section mics, no channel order");
  }
  const blank = E.blankPlot();
  for (const r of E.ROLES.map(r => r.id)) E.addPosition(blank, r);
  ok(blank.positions.every(x => !("inputs" in x)), "no role in the library arrives with inputs (" + E.ROLES.length + " tried)");
  ok(E.ROLES.every(r => !r.inputs && !r.pkgs && !r.start), "…and no role carries mic packages");
  eq(E.ROLES.filter(r => r.di).map(r => r.id).join(","), "bass,upright,keys,organ,dj,playback,acoustic,violin,cello",
     "the DI instruments are marked, for the DI box that goes with them");
  for (const name of ["inputUnits","channelRows","channelCount","PKG_SETS","addMic","notMiked","unmiked","sectionRows","diSources","settleOldSections"])
    ok(!new RegExp("function " + name + "\\(|const " + name + " =").test(src), "no " + name + " left in the page");
  ok(!/\["inputs","Inputs"\]/.test(src), "no Inputs tab");
  ok(!/Input list<\/h2>|Not miked<\/h2>|DI boxes needed<\/h2>|INPUT LIST|NOT MIKED/.test(src), "the page and the email print no input list, not-miked or DI section");
  ok(!/Channels ' \+|"Channels " \+/.test(src), "…and no channel count");
  ok(!/\+ mic\b|− mic\b|own channel|48V/.test(src), "no per-player mic controls");
  eq(E.VENUE.consoleChannels, 32, "the console's channel count stays on record (D3)");
  const old = JSON.parse(JSON.stringify(T("combo"))); old.schemaVersion = 2;
  old.sections = { sax:{ on:true, mics:2 } }; old.channelOrder = ["x"]; old.ampProfile = "light";
  old.positions[0].inputs = [{ id:"in1", source:"Tenor sax", type:"mic", phantom:false, notes:"" }]; old.positions[0].pkg = "mic";
  old.positions[0].doubles = [{ roleId:"flute", input:true }];
  const p = E.migratePlot(old);
  ok(!("sections" in p) && !("channelOrder" in p) && !("ampProfile" in p), "an old file drops sections, channel order and profile on load");
  ok(!("pkg" in p.positions[0]) && !("input" in p.positions[0].doubles[0]), "…and packages and a double's own-channel tick");
  ok(!("inputs" in p.positions[0]) && E.micsOn(p).some(m => m.label === "Tenor sax"), "…while the inputs themselves become mics on the deck");
}

/* ---- 3d. the diagram's key lists what the diagram draws ---- */
{
  const ids = p => E.legendKeys(p).map(k => k.id).join(",");
  const combo = T("combo");
  eq(ids(combo), "player,seated,stand,wedge,house,di,kitparts", "the jazz combo's key (its keys player sits, so seated is in it; everyone reads, so stand is too): " + ids(combo));
  const blank = E.blankPlot();
  eq(ids(blank), "", "an empty deck's key is empty: the truss posts, the PA and the stairs are the venue's own and are not keyed (William, 2026-09-16)");
  E.addPosition(blank, "keys");
  ok(!/kitparts|wedge|byo/.test(ids(blank)), "…and never lists a symbol that isn't drawn: " + ids(blank));
  const byo = T("combo"); byo.items.push({ id:"b1", kind:"byo", ref:"byo-pedals", label:"", x:40, y:40, rot:0, moved:true, ownerPositionIds:[] });
  ok(/byo/.test(ids(byo)), "band-brought gear adds the dashed box to the key");
  ok(E.legendKeys(combo).every(k => k.text && !/⊘/.test(k.text)), "every key entry is words, not another symbol");
  ok(/class="legend"/.test(src) && /id="canvaslegend"/.test(src), "the key is on the printed page and under the canvas");
}

/* ---- 4. building from an instrumentation list ---- */
{
  const p = E.makeFromParts([["voice",1],["guitar",1],["keys",1],["bass",1],["drums",1]], null, "Five piece");
  eq(p.positions.length, 5, "a five-piece builds from counts");
  eq(p.wedges.length, 5, "…and five mixes");
  const needs = Object.fromEntries(E.houseNeeds(p).map(n => [n.id, n.need]));
  eq(needs.kit, 1, "the drums position implies the house kit");
  eq(needs.gtramp1, 1, "the guitar implies a house amp");
  eq(needs.kb1, 1, "keys implies a house keyboard — SW has no acoustic piano");
  eq(needs.bassamp, 1, "the bass implies the house rig");
  eq(E.diList(p).map(d => d.label).sort().join(","), "Bass,Keys", "two DI boxes on the deck — keys and bass — counted from the objects, not from an input list");
  ok(!("micstand" in needs) && !("mic" in needs) && !("di" in needs), "…and neither mics nor DIs are in the house-equipment list: they have their own sections");
}

/* ---- 6. names are optional, and never load-bearing ---- */
{
  const p = T("rock");
  const voice = p.positions.find(x => x.roleId === "voice");
  const before = E.posText2(p, voice);
  voice.names = ["Avery Stone"];
  ok(/Vox \(Avery Stone\)/.test(E.posText2(p, voice)), "a name shows in parentheses in the tables");
  p.printNames = false;
  eq(E.posText2(p, voice), before, "printNames off falls back to the position label exactly");
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
  alto.doubles = [{ roleId:"flute" }];
  ok(/Flute/.test(E.posShortLines(p, alto).map(l => l.text).join(" ")), "a double prints on the diagram");
  drums.names = ["Jo Fischer", "Riley Nunez"];
  ok(/Jo Fischer \/ Riley Nunez/.test(E.posText2(p, drums)), "both names print: " + E.posText2(p, drums));
  eq(E.houseNeeds(p).find(n => n.id === "kit").need, 1, "and one house kit, not two");
}

/* ---- 9. a custom role behaves like any other ---- */
{
  const p = E.makeFromParts([["voice",1],["drums",1]], null, "Custom");
  p.customRoles.push({ id:"custom-steelpan", label:"Steel pan", short:"Pan", family:"other", grp:"other", sub:9,
    stance:"standing", w:36, d:36, zone:"front" });
  const pos = E.addPosition(p, "custom-steelpan");
  E.autoLayout(p, { force:true });
  eq(E.positionLabels(p)[pos.id].short, "Pan", "a custom role labels itself");
  ok(!E.offDeck(pos, p), "…is placed on the deck");
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

/* ---- 10b. big band seating (William, 2026-09-14) ---- */
{
  const p = T("bigband"), L = labelsOf(p), W = p.deck.widthFt * 12;
  const at = s => p.positions.find(x => L[x.id].short === s);
  // page left to right is stage right to stage left, which is x falling
  const leftToRight = names => names.map(at).every((q, i, a) => i === 0 || a[i - 1].x > q.x);
  const rowY = names => names.map(at).every(q => Math.abs(q.y - at(names[0]).y) < 1);
  ok(leftToRight(["Tpt 2","Tpt 1","Tpt 3","Tpt 4"]) && rowY(["Tpt 2","Tpt 1","Tpt 3","Tpt 4"]), "trumpets read 2 1 3 4");
  ok(leftToRight(["Tbn 2","Tbn 1","Tbn 3","Tbn 4"]) && rowY(["Tbn 2","Tbn 1","Tbn 3","Tbn 4"]), "trombones read 2 1 3 4");
  ok(leftToRight(["Gtr","Tenor 1","Alto 1","Alto 2","Tenor 2","Bari"]) && rowY(["Gtr","Tenor 1","Alto 1","Alto 2","Tenor 2","Bari"]),
     "front row reads Gtr, Tenor 1, Alto 1, Alto 2, Tenor 2, Bari");
  ok(Math.abs(at("Alto 1").x - at("Tbn 1").x) < 1 && Math.abs(at("Tbn 1").x - at("Tpt 1").x) < 1, "Alto 1, Tbn 1 and Tpt 1 share a column");
  ok(Math.abs(at("Tenor 1").x - at("Tpt 2").x) < 1 && Math.abs(at("Tenor 2").x - at("Tpt 4").x) < 1, "…and every chair lines up with the rows behind");
  ok(at("Tpt 1").y > at("Tbn 1").y && at("Tbn 1").y > at("Alto 1").y, "saxes front, trombones behind, trumpets at the back");
  const rig = p.items.find(i => i.ref === "bassamp"), kit = at("Drums"), kb = p.items.find(i => i.ref === "kb1");
  ok(p.items.concat(p.positions).every(o => o === rig || o.x <= rig.x + 1), "the bass rig is the furthest stage-right thing on the deck");
  ok(rig.y > p.deck.depthFt * 12 * .8, "…in the back corner");
  ok(kit.x < rig.x && kit.x > at("Tpt 2").x && Math.abs(kit.y - at("Tpt 2").y) < 12, "drums between the bass rig and Tpt 2, in the back row");
  eq(kb.rot, 90, "the keyboard is turned vertical");
  ok(kb.y > at("Gtr").y && Math.abs(kb.x - at("Gtr").x) < 60, "…upstage of the guitar");
  ok(at("Keys").x > kb.x, "…with its player on the wall side");
  const hits = collisions(p);
  ok(hits.hard.length === 0, "the big band seating has no overlaps" + (hits.hard.length ? ": " + hits.hard.join("; ") : ""));
  // a different big band still gets lead-second brass and a lined-up lead column
  const q = E.makeFromParts([["alto",2],["tenor",2],["bari",1],["trumpet",5],["trombone",3],["btrombone",1],["guitar",1],["keys",1],["bass",1],["drums",1]], null, "18");
  const M = labelsOf(q), by = s => q.positions.find(x => M[x.id].short === s);
  ok(by("Tpt 2").x > by("Tpt 1").x && by("Tpt 1").x > by("Tpt 5").x, "five trumpets still read 2 1 3 4 5");
  ok(by("B.Tbn").x < by("Tbn 3").x, "a bass trombone sits at the far end of its row");
  ok(Math.abs(by("Tpt 1").x - by("Alto 1").x) < 1, "…and the lead column still lines up");
  ok(q.positions.concat(q.items, q.wedges).every(o => !E.offDeck(o, q)), "…nothing off the deck");
  ok(collisions(q).hard.length === 0, "…and no overlaps" + (collisions(q).hard.length ? ": " + collisions(q).hard.join("; ") : ""));
  // a combo is untouched: keyboard flat, in front of its player
  const c = T("combo"), ckb = c.items.find(i => i.ref === "kb1");
  eq(ckb.rot, 0, "a combo's keyboard stays flat");
}

/* ---- 11. deck size ---- */
{
  eq(E.VENUE.deck.widthFt + "×" + E.VENUE.deck.depthFt, "24×20", "the Somewhere Works deck is 24′ wide × 20′ deep (Tim Shade, 2026-09-16)");
  const a = T("bigband"), big = E.makeFromTemplate("bigband", { widthFt:32, depthFt:28 });
  const ka = a.positions.find(x => x.roleId === "drums"), kb = big.positions.find(x => x.roleId === "drums");
  ok(Math.abs(ka.x / (24 * 12) - kb.x / (32 * 12)) < .02, "templates re-lay out proportionally on a bigger deck");
  ok(kb.y > ka.y, "a deeper deck puts the kit further upstage in inches");
  eq(JSON.parse(JSON.stringify(a)).deck.widthFt + "×" + JSON.parse(JSON.stringify(a)).deck.depthFt, "24×20", "a saved plot keeps the deck it was drawn on");
  const shallow = E.makeFromTemplate("combo", { widthFt:24, depthFt:12 });
  eq(shallow.deck.depthFt, 12, "…and another venue's deck is still a per-plot choice");
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
    eq(p.schemaVersion, 3, name + ": migrates to the current schema");
    eq(JSON.stringify(E.monitorTable(p).rows.map(r => r.n)), JSON.stringify(want.monitors.map(m => m[0])), name + ": same wedges");
    const gear = h => !["di","micstand","mic","chair"].includes(h[0]);   // stands were counted off the input list; mics and DIs are objects now; chairs are new
    eq(JSON.stringify(E.houseNeeds(p).map(h => [h.id, h.need]).filter(gear)), JSON.stringify(want.house.filter(gear).map(h => [h[0], h[1]])), name + ": same house equipment");
    const diWant = (want.house.find(h => h[0] === "di") || [0, 0])[1];
    eq(E.disOn(p).length, diWant, name + ": the DI boxes v1 counted are DI boxes on the deck (" + diWant + ")");
    eq(E.micsOn(p).length, want.rows.filter(r => r[3] === "mic").length, name + ": every v1 mic channel is a mic on the deck");
    ok(p.positions.every(x => !E.offDeck(x, p)), name + ": migrated positions stay where they were drawn");
    return p;
  };
  const ex = compare("example-v1", readSample("v1/example-v1.json"), readSample("v1/example-expected.json"));
  eq(ex.positions.length, 5, "six v1 people become five positions — the two drummers share the kit");
  const drums = ex.positions.find(x => x.roleId === "drums");
  eq(E.posNames(drums).join(" / "), "Jo Fischer / Riley Nunez", "both occupants keep their names");
  eq(E.micsOn(ex).filter(m => m.ownerPositionIds.includes(drums.id)).length, 7, "…and the kit's seven v1 mics are seven mics on the deck, belonging to the kit");
  ok(!("ampProfile" in ex) && !("pkg" in drums) && !("sections" in ex), "…with no mic-profile, package or section fields on the migrated plot");
  const old = T("combo"); old.ampProfile = "light"; old.positions[0].pkgOverride = true;
  const reread = E.migratePlot(JSON.parse(JSON.stringify(old)));
  ok(!("ampProfile" in reread) && !reread.positions.some(x => "pkgOverride" in x), "a plot saved with the old profile fields loads without them");
  const keys = ex.positions.find(x => x.roleId === "keys");
  const keysGear = ex.items.filter(i => (i.ownerPositionIds || []).includes(keys.id) && ["mic","di"].includes(i.ref)).map(i => i.ref + ":" + i.label).sort().join("|");
  eq(keysGear, "di:Keys L|di:Keys R|mic:Vocal", "the keys/vocals player's v1 inputs are two DI boxes and a vocal mic on the deck");
  ok(ex.items.some(i => i.ref === "kb1") && ex.items.some(i => i.kind === "byo"), "owned gear and BYO items come across");
  ok(!("request" in ex.wedges[0]) && !("assignees" in ex.wedges[0]), "a v1 wedge comes across as a spot and a number");
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
    eq(p.schemaVersion, 3, "samples/" + f + " loads at the current schema");
    ok(p.positions.length > 0, "samples/" + f + ": " + p.positions.length + " positions");
  }
}

/* ---- 15. save -> load round trip ---- */
{
  const p = T("rock");
  const text = JSON.stringify(p, null, 1);
  eq(JSON.stringify(E.migratePlot(JSON.parse(text)), null, 1), text, "a saved v2 plot reloads byte-identical");
  ok(/^SW-plot-rock-pop-band-\d{4}-\d\d-\d\d\.json$/.test(E.plotFileName(p)), "file name stays ISO so it sorts: " + E.plotFileName(p));
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

/* ---- 17. house backline: a category, not one named amp ---- */
{
  const two = E.makeFromParts([["guitar",2],["keys",1],["bass",1],["drums",1]], null, "Two guitars");
  const ampsOf = q => q.items.filter(i => i.kind === "house" && E.refCat(i.ref) === "gtramp").map(i => i.ref).sort();
  eq(ampsOf(two).join(", "), "gtramp1, gtramp2", "two guitarists get the two Voxes, not one amp booked twice");
  ok(!E.houseNeeds(two).some(n => n.over), "…and nothing is over-counted");
  ok(!E.warnings(two).some(w => /amp/i.test(w.text)), "…and no amber warning about amps");
  for (const it of two.items.filter(i => E.refCat(i.ref) === "gtramp"))
    eq(it.ownerPositionIds.length, 1, "…each amp belongs to one guitarist");

  const five = E.makeFromParts([["guitar",5],["bass",1],["drums",1]], null, "Five guitars");
  const over = E.warnings(five).find(w => /House guitar amp/.test(w.text));
  ok(over && over.level === "amber", "five guitar amps raise an amber over-count");
  ok(over && / has 4\./.test(over.text), "…naming what the house has: " + (over ? over.text : "no warning"));
  ok(E.houseNeeds(five).some(n => n.id === "cat:gtramp" && n.need === 5 && n.have === 4),
     "…and the printed list says 5 needed of 4");
  ok(!E.houseNeeds(five).some(n => n.id === "gtramp1" && n.over),
     "…as a fact about the category, not a second warning about one amp");

  const keys2 = E.makeFromParts([["keys",2],["bass",1],["drums",1]], null, "Two keys");
  eq(keys2.items.filter(i => E.refCat(i.ref) === "keys").map(i => i.ref).sort().join(", "), "kb1, kb2",
     "two keys players get the Korg and the Nord");
  const organ = E.makeFromParts([["organ",1],["bass",1],["drums",1]], null, "Organ trio");
  eq(organ.items.filter(i => E.refCat(i.ref) === "keys").map(i => i.ref).join(", "), "kb2",
     "organ with no other keys still takes the Nord, as it always did");
  const both = E.makeFromParts([["keys",1],["organ",1],["bass",1],["drums",1]], null, "Keys and organ");
  eq(both.items.filter(i => E.refCat(i.ref) === "keys").map(i => i.ref).sort().join(", "), "kb1, kb2",
     "keys and organ take one each");

  // a swap sticks: the lookup matches on owner and category, never on the id
  const sw = E.makeFromParts([["guitar",1],["bass",1],["drums",1]], null, "Swap");
  const amp = sw.items.find(i => E.refCat(i.ref) === "gtramp");
  const owner = amp.ownerPositionIds[0];
  amp.ref = "gtramp3"; amp.moved = true;
  const where = [amp.x, amp.y];
  E.autoLayout(sw, { force:true });
  const after = sw.items.filter(i => E.refCat(i.ref) === "gtramp");
  eq(after.length, 1, "a swap doesn't grow a second amp on re-layout");
  eq(after[0].ref, "gtramp3", "…the Deluxe Reverb stays chosen");
  eq(after[0].ownerPositionIds[0], owner, "…keeps its owner");
  eq(JSON.stringify([after[0].x, after[0].y]), JSON.stringify(where), "…and keeps the spot it was pinned to");

  // an old file that booked gtramp1 twice
  const old = JSON.parse(JSON.stringify(two));
  for (const it of old.items) if (E.refCat(it.ref) === "gtramp") it.ref = "gtramp1";
  const loaded = E.migratePlot(old);
  eq(ampsOf(loaded).join(", "), "gtramp1, gtramp2", "a saved file with both guitarists on gtramp1 loads onto two amps");
  ok(!E.warnings(loaded).some(w => /amp/i.test(w.text)), "…and stops printing an over-count that is no longer true");
  eq(JSON.stringify(loaded.items.map(i => [i.x, i.y])), JSON.stringify(old.items.map(i => [i.x, i.y])),
     "…without moving anything");

  // the same on the v1 path
  const v1 = JSON.parse(fs.readFileSync(path.join(__dirname, "samples", "v1", "example-v1.json"), "utf8"));
  const dup = JSON.parse(JSON.stringify(v1));
  const src1 = dup.items.find(i => i.kind === "house" && i.ref === "gtramp1");
  dup.items.push(Object.assign({}, src1, { id:"i99", x:src1.x - 40 }));
  E.resetIds();
  eq(ampsOf(E.migrateV1(dup)).join(", "), "gtramp1, gtramp2", "a v1 file with two of the same amp lands on two real amps");

  // house gear is shared between sets and never conflict-checked
  const a = E.makeFromParts([["guitar",1],["bass",1],["drums",1]], null, "Set one");
  const b = E.makeFromParts([["guitar",1],["bass",1],["drums",1]], null, "Set two");
  for (const q of [a, b]) q.items.find(i => E.refCat(i.ref) === "gtramp").ref = "gtramp3";
  ok(!E.warnings(a).length && !E.warnings(b).length,
     "two plots on the same Deluxe Reverb warn about nothing (" + E.warnings(a).concat(E.warnings(b)).map(w => w.text).join("; ") + ")");
  ok(E.changeover(a, b).items.stay.some(x => /Deluxe Reverb \(1\)/.test(x)),
     "…and the changeover sheet says the amp stays put");
  ok(!/S\.plots/.test(src.slice(A, B)), "the engine cannot see the other plots in the session, so nothing can cross-check them");
}

/* ---- 18. where the plot goes, who leads the band, and no mics with the house gear ---- */
{
  eq(E.VENUE.deliverTo, "timothy.shade@wichita.edu", "every plot is delivered to Tim Shade");
  ok(!/ASSUMED[^\n]*$/m.test(src.split("\n").find(l => /deliverTo:/.test(l)) || ""), "…and that is no longer marked ASSUMED");
  ok(!/PLOT_CONTACT|contactLine/.test(src), "no separate fixed contact: the delivery line is the contact");
  ok(/Band leader\/director<\/label>/.test(src), "the Details tab calls p.director the band leader/director");
  ok(/Band leader\/director: ' \+ esc\(p\.director\)/.test(src) && !/"Director: \u2014"|Director: —|Ensemble director/.test(src),
     "…the meta row prints it under that name, and only when it is filled in");
  ok(/L\.push\("Band leader\/director: " \+ p\.director\)/.test(src), "…and so does the email text");
  ok(/"mailto:" \+ VENUE\.deliverTo/.test(src), "the Email button addresses the same place the page says to deliver to");
  // the mics in the photos stay in the rehearsal rooms
  for (const h of E.VENUE.house.filter(h => h.bcat)){
    ok(!h.inputs, h.label + " brings no inputs");
    ok(!/\bmic/i.test(h.label + " " + h.short), h.label + " names no mic");
  }
  ok(!E.BYO_KINDS.some(b => b.inputs), "no bring-your-own item arrives miked either");
}

/* ---- 19. the soundcheck and the performance: day, block start, place in the block ---- */
{
  const b = E.blankPlot();
  eq(JSON.stringify([b.soundcheckDate, b.soundcheck, b.soundcheckOrder, b.date, b.startTime, b.setOrder]),
     JSON.stringify(["", "", null, "", "", null]), "a new plot has all six schedule fields, empty");
  eq(JSON.stringify(E.scheduleLines(b)), JSON.stringify(["Soundcheck: \u2014", "Performance: \u2014"]),
     "\u2026and prints both lines anyway, so the tech sees what is missing");
  eq([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(E.ordinal).join(" "), "1st 2nd 3rd 4th 11th 12th 13th 21st 22nd 23rd 101st 111th", "ordinals");
  eq(JSON.stringify(["2", 2, "2nd", "", "0", "-1", 2.7, null, undefined, "abc"].map(E.orderNum)), JSON.stringify([2, 2, 2, null, null, null, 2, null, null, null]),
     "an order settles to a positive integer or null");
  b.soundcheckDate = "2026-11-14"; b.soundcheck = "5:30 PM"; b.soundcheckOrder = 2;
  b.date = "2026-11-14"; b.startTime = "7:30 PM"; b.setOrder = 3;
  eq(JSON.stringify(E.scheduleLines(b)), JSON.stringify(["Soundcheck: 11/14/2026 \u00b7 5:30 PM \u00b7 2nd up", "Performance: 11/14/2026 \u00b7 7:30 PM \u00b7 3rd up"]),
     "both lines in full: day, block start, place in the block \u2014 dates MM/DD/YYYY");
  eq(E.fmtDate("2026-01-05"), "01/05/2026", "a date prints month first, zero-padded");
  eq(E.fmtDate("after Combo B"), "after Combo B", "free text passes through");
  eq(E.fmtDate(""), "", "empty stays empty");
  b.soundcheckOrder = null;
  eq(E.scheduleLines(b)[0], "Soundcheck: 11/14/2026 \u00b7 5:30 PM", "a slot left empty leaves its place");
  b.soundcheckDate = ""; b.soundcheck = ""; b.soundcheckOrder = 1;
  eq(E.scheduleLines(b)[0], "Soundcheck: 1st up", "an order alone");
  b.startTime = ""; b.setOrder = null;
  eq(E.scheduleLines(b)[1], "Performance: 11/14/2026", "the performance line with only its date");
  b.soundcheck = "after Combo B"; b.soundcheckOrder = "3"; b.setOrder = 0;
  const back = E.migratePlot(JSON.parse(JSON.stringify(b)));
  eq(JSON.stringify([back.soundcheck, back.soundcheckOrder, back.setOrder]), JSON.stringify(["after Combo B", 3, null]), "a saved file settles its orders on load");
  const old = JSON.parse(JSON.stringify(E.makeFromTemplate("combo")));
  for (const k of ["soundcheckDate","soundcheck","soundcheckOrder","startTime","setOrder"]) delete old[k];
  const loaded = E.migratePlot(old);
  eq(JSON.stringify([loaded.soundcheckDate, loaded.soundcheck, loaded.soundcheckOrder, loaded.startTime, loaded.setOrder]),
     JSON.stringify(["", "", null, "", null]), "a file from before the fields existed loads with them empty");
  const v1 = E.migrateV1(JSON.parse(fs.readFileSync(path.join(__dirname, "samples", "v1", "example-v1.json"), "utf8")));
  eq(JSON.stringify([v1.soundcheckDate, v1.soundcheck, v1.soundcheckOrder, v1.startTime, v1.setOrder]),
     JSON.stringify(["", "", null, "", null]), "\u2026and so does a v1 file");
  for (const id of ["fCheckDate","fCheck","fCheckOrder","fDate","fStart","fSetOrder"])
    ok(new RegExp('id="' + id + '"').test(src), "the Details tab has " + id);
  ok(/scheduleLines\(p\)\.map/.test(src) && /for \(const l of scheduleLines\(p\)\) L\.push\(l\)/.test(src),
     "the printed page and the email text both print them, from the same function");
  ok(!/"Performance: " \+ esc\(p\.date\)|"Performance: " \+ p\.date/.test(src), "\u2026and nothing prints the performance date on its own any more");
}

/* ---- 19b. rotation in 45° steps ---- */
{
  const band = () => E.makeFromParts([["voice",1],["guitar",1],["keys",1],["bass",1],["drums",1]], null, "Turned");
  const p = band(), amp = p.items.find(i => E.refCat(i.ref) === "gtramp"), f = E.footprintOf(amp, p);
  const box = r => { amp.rot = r; const b = E.rectOf(amp, p); return [Math.round(b.w * 100) / 100, Math.round(b.d * 100) / 100]; };
  eq(JSON.stringify(box(0)), JSON.stringify([f.w, f.d]), "at 0° the box is the footprint");
  eq(JSON.stringify(box(90)), JSON.stringify([f.d, f.w]), "at 90° it is exactly the swap it always was");
  eq(JSON.stringify(box(180)), JSON.stringify([f.w, f.d]), "180° exact");
  eq(JSON.stringify(box(270)), JSON.stringify([f.d, f.w]), "270° exact");
  const h = Math.round((f.w + f.d) * Math.SQRT1_2 * 100) / 100;
  eq(JSON.stringify(box(45)), JSON.stringify([h, h]), "at 45° the box is the diagonal both ways (" + h + "″)");
  eq(JSON.stringify(box(135)), JSON.stringify(box(45)), "135° covers the same box as 45°");
  amp.rot = 0;
  eq([0, 45, 90, 135, 180, 225, 270, 315].map(E.labelAngle).join(" "), "0 45 -90 -45 0 45 -90 -45", "labels lie along the item and never read upside down");
  // a kit laid out against the drape of a shallow deck and turned 45° pokes
  // over the edge — the box is honest about that, and the page says so
  const q = E.makeFromParts([["voice",1],["guitar",1],["keys",1],["bass",1],["drums",1]], { widthFt:24, depthFt:12 }, "Turned, shallow");
  const kit = q.positions.find(x => x.roleId === "drums"), kb = q.items.find(i => E.refCat(i.ref) === "keys");
  kit.rot = 45; kit.moved = true;
  ok(E.offDeck(kit, q), "a kit turned 45° where the engine put it hangs over the upstage edge (its box grew from 54×52 to 75×75)");
  ok(E.warnings(q).some(w => /deck edge/.test(w.text)), "…and the warning says so");
  // rotate, then drag it clear: what the director actually does
  kit.y = E.deckIn(q).d / 2; kb.rot = 45; kb.moved = true; kb.x = 230; kb.y = 45;
  E.autoLayout(q, { force:false });
  const hits = collisions(q);
  ok(hits.hard.length === 0, "dragged to the middle, a 45° kit and keyboard sit clear of everything else:\n        " + hits.hard.join("\n        "));
  ok(q.positions.concat(q.items, q.wedges).every(o => !E.offDeck(o, q)), "…and everything is on the deck");
  eq(kit.rot + "/" + kb.rot, "45/45", "…and re-layout left the pinned angles alone");
  ok(!/\+ 90\) % 360/.test(src) && /\+ 45\) % 360/.test(src), "the rotate button steps 45°");
  ok(/e\.shiftKey \? -45 : 45/.test(src), "shift-R steps back");
  ok(/id="bRotL"[^>]*>rotate ⟲ \(⇧R\)/.test(src) && /id="bRot"[^>]*>rotate ⟳ \(R\)/.test(src), "both directions have a button in the inspector, naming their key (E1)");
}

/* ---- 19c. the kit: a right-handed kit, drums thick and cymbals thin, the drummer a player circle (William, 2026-09-16) ---- */
{
  // the kit is drawn outside the engine block, so lift just that function
  const K = new Function(src.slice(src.indexOf("function kitPieces("), src.indexOf("/* A mic on a stand")) + "; return { kitPieces };")();
  const kit = K.kitPieces({ w:54, d:52 }, "#000", "#555", "#eee");
  ok(/>\(kick\)<\/text>/.test(kit) && !/>Drums<\/text>|>Kick<\/text>/.test(kit), "the kick says (kick), and the kit's name is not on it");
  ok(!/drummerMark/.test(src), "the solid dot with a stem is gone");
  const circles = [...kit.matchAll(/<circle cx="(-?[\d.]+)" cy="(-?[\d.]+)" r="([\d.]+)" fill="([^"]+)" stroke="([^"]+)" stroke-width="([\d.]+)"/g)].map(m => ({ x:+m[1], y:+m[2], r:+m[3], fill:m[4], stroke:m[5], sw:+m[6] }));
  eq(circles.length, 7, "seven pieces: kick, snare, one rack tom, floor tom, hats, crash, ride");
  const drums = circles.filter(c => c.sw === 2.4 && c.fill === "#eee" && c.stroke === "#000"), cymbals = circles.filter(c => c.sw === .7 && c.fill === "none" && c.stroke === "#555");
  eq(drums.length + "/" + cymbals.length, "4/3", "four drums thick and filled, three cymbals thin, dim and open");
  const kick = drums.find(c => c.y + c.r > 25), snare = drums.find(c => c.x > 5 && c !== kick), rack = drums.find(c => c.x < 0 && c.x > -10), floor = drums.find(c => c.x < -10);
  ok(kick && Math.abs(kick.x) < .01 && Math.abs(kick.y + kick.r - 26) < .6, "the kick is front centre, on the footprint's front edge");
  ok(snare && snare.y < kick.y && snare.y > -15, "the snare is on the drummer's left, in front of them");
  ok(rack && rack.y < kick.y - kick.r && rack.x < 0 && rack.x > -8, "one rack tom just upstage of the kick, a little to the drummer's right");
  ok(floor && floor.x < -10 && floor.y < 0, "the floor tom is on the drummer's right, beside them");
  const hats = cymbals.find(c => c.x > 10 && c.y < 0), crash = cymbals.find(c => c.x > 10 && c.y > 5), ride = cymbals.find(c => c.x < -10);
  ok(hats && crash && ride, "hats far left beside the snare, crash beside the kick on the left, ride beside the kick on the right");
  ok(hats.x > snare.x && Math.abs(hats.y - snare.y) < 12, "…the hats beside the snare");
  ok(circles.every(c => c.x - c.r >= -27 && c.x + c.r <= 27 && c.y - c.r >= -26 && c.y + c.r <= 26), "every piece is inside the 54×52 footprint");
  const drummer = { x:0, y:-E.DRUMMER.up, r:E.DRUMMER.r };
  const all = circles.concat([drummer]);
  const overlaps = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y) < all[i].r + all[j].r - .01) overlaps.push(i + "-" + j);
  eq(overlaps.join(","), "", "no piece overlaps another, or the drummer");
  ok(drummer.y - drummer.r >= -26, "the drummer's circle is inside the footprint too");
  const dashed = K.kitPieces({ w:54, d:52 }, "#000", "#555", "#eee", true);
  eq((dashed.match(/stroke-dasharray="4 3"/g) || []).length, 7, "a band-provided kit is dashed on drums and cymbals both");
  ok(/kitparts:'<circle cx="6\.5" cy="8" r="4\.4" fill="' \+ ground \+ '" stroke="' \+ ink \+ '" stroke-width="2\.4"\/><circle cx="16\.5" cy="8" r="4\.4" fill="none" stroke="' \+ dim \+ '" stroke-width="\.7"\/>'/.test(src), "the key shows one drum and one cymbal, thick and thin");
  ok(/const dr = drummerAt\(pos, plot\);/.test(src) && /'<circle cx="' \+ dr\.x\.toFixed\(1\) \+ '" cy="' \+ dr\.y\.toFixed\(1\) \+ '" r="' \+ dr\.r\.toFixed\(1\) \+ '" fill="' \+ \(print \? "#fff" : "#0d232b"\) \+ '" stroke="' \+ stroke\(pos\) \+ '" stroke-width="' \+ swid\(pos\) \+ '"\/>'/.test(src),
     "the drummer is an open circle in the player style, drawn with the kit position");
  const p = T("combo"), kitPos = p.positions.find(x => x.roleId === "drums"), dr = E.drummerAt(kitPos, p);
  eq(dr.r, 11, "…a 22″ circle like any standing player's");
  eq(dr.y, -15, "…15″ upstage of the kit's centre, over the throne");
}

/* ---- 19d. the kit: the house's or the band's (A3, Tim Shade 2026-09-16) ---- */
{
  const p = T("combo"), kit = p.positions.find(x => x.roleId === "drums");
  eq(E.VENUE.house.find(h => h.id === "kit").label, "House drum kit", "the house kit names no model — the house has several");
  ok(!E.kitIsByo(p, kit), "a kit starts as the house kit");
  ok(E.houseNeeds(p).some(n => n.id === "kit" && n.label === "House drum kit"), "…and is asked of the house");
  kit.kitLabel = "the Yamaha";
  ok(E.houseNeeds(p).some(n => n.id === "kit" && n.label === "House drum kit — the Yamaha"), "a house kit carries its label on the house line");
  kit.kit = "byo"; kit.kitLabel = "Yamaha Stage Custom";
  ok(E.kitIsByo(p, kit), "Bring your own is recorded on the position");
  ok(!E.houseNeeds(p).some(n => n.id === "kit"), "…and the house is not asked for a kit");
  const byo = E.byoList(p).find(b => /Drum kit/.test(b.what));
  ok(byo && byo.what === "Drum kit — Yamaha Stage Custom" && /Drums/.test(byo.who), "…it prints under Musicians provide: " + (byo ? byo.what + " — " + byo.who : "missing"));
  ok(E.legendKeys(p).some(k => k.id === "byo"), "…and the key says the band brings it");
  const q = E.migratePlot(JSON.parse(JSON.stringify(p)));
  ok(E.kitIsByo(q, q.positions.find(x => x.roleId === "drums")), "the choice survives save and load");
  const co = E.changeover(T("combo"), p);
  ok(co.items.arrive.some(s => /^Drum kit — Yamaha Stage Custom/.test(s)) && co.items.leave.some(s => /^House drum kit/.test(s)),
     "changeover: the house kit comes off and the band's kit comes on");
  const none = E.blankPlot();
  eq(E.houseNeeds(none).length, 0, "a blank plot asks the house for nothing");
}

/* ---- 19e. mics and DI boxes are objects on the deck (C1/C2, Tim Shade 2026-09-16) ---- */
{
  eq(E.VENUE.house.find(h => h.id === "mic").label, "Mic (on stand)", "one mic object, on a stand");
  ok(!E.VENUE.house.some(h => h.id === "micstand"), "…and no separate mic stand");
  const combo = T("combo");
  eq(E.micsOn(combo).length, 0, "nothing starts miked: a template has no mics");
  const dis = E.disOn(combo);
  eq(dis.map(d => d.label).sort().join(","), "Bass,Keys", "…and a DI box for each DI instrument, labelled");
  for (const d of dis){ const own = E.ownerOf(combo, d); ok(own && E.roleOf(combo, own).di, "the " + d.label + " DI belongs to its player"); }
  const rig = combo.items.find(i => E.refCat(i.ref) === "bass"), bdi = dis.find(d => d.label === "Bass");
  ok(Math.abs(bdi.y - rig.y) < 1 && bdi.x < rig.x, "the bass DI sits beside the rig, on its stage-left side");
  ok(collisions(combo).hard.length === 0, "…clear of everything: " + collisions(combo).hard.join("; "));
  for (const t of E.TEMPLATES){ const p = T(t.id); ok(E.disOn(p).every(d => !E.offDeck(d, p)), t.name + ": its DI boxes are on the deck"); }
  const blank = E.blankPlot();
  for (const r of E.ROLES) E.addPosition(blank, r.id);
  eq(E.disOn(blank).length, E.ROLES.filter(r => r.di).length, "every DI instrument, and only those, arrives with a DI box");

  const tpt = combo.positions.find(x => x.roleId === "trumpet");
  const mic = E.addMicItem(combo, { x:tpt.x, y:tpt.y - 21 }, "Tpt", [tpt.id], true);
  eq(E.micsOn(combo).length, 1, "a placed mic is a mic on the deck");
  eq(E.micText(combo, mic), "Tpt", "…labelled");
  mic.label = ""; ok(/Tpt/.test(E.micText(combo, mic)), "…an unlabelled mic reads as its owner's chair: " + E.micText(combo, mic));
  const keys = E.legendKeys(combo).map(k => k.id);
  ok(keys.includes("mic") && keys.includes("di"), "the key lists mics and DI boxes when they are drawn: " + keys.join(","));
  eq(E.micList(combo).length, 1, "…and the page lists one microphone");
  const two = E.makeFromParts([["trumpet",2],["bass",1],["drums",1]], null, "Two tpts");
  const t = two.positions.filter(x => x.roleId === "trumpet");
  E.addMicItem(two, { x:(t[0].x + t[1].x) / 2, y:t[0].y - 21 }, "tpt 1+2", t.map(x => x.id), true);
  eq(E.micsOn(two).length, 1, "two trumpets on one mic is one mic, labelled for both");

  // an old file: per-player inputs become objects on the deck
  const old = JSON.parse(JSON.stringify(T("combo"))); old.schemaVersion = 2;
  old.items = old.items.filter(i => i.ref !== "di");
  const kit = old.positions.find(x => x.roleId === "drums"), kp = old.positions.find(x => x.roleId === "keys"), tp = old.positions.find(x => x.roleId === "trumpet");
  kit.inputs = [{ source:"Kick", type:"mic" }, { source:"Snare", type:"mic" }, { source:"OH L", type:"mic" }];
  kp.inputs = [{ source:"Keys", type:"stereo-di" }];
  tp.inputs = [{ source:"Trumpet", type:"mic" }];
  old.sections = { sax:{ on:true, mics:2 } };
  const p = E.migratePlot(old);
  eq(p.schemaVersion, 3, "an old file migrates to schema 3");
  eq(E.micsOn(p).map(m => m.label).sort().join("|"), "Kick|OH L|Snare|Trumpet|sax section 1|sax section 2", "its mics are mics on the deck, labelled as the inputs were");
  eq(E.disOn(p).map(d => d.label).sort().join("|"), "Keys L|Keys R", "a stereo DI is two DI boxes");
  ok(p.positions.every(x => !("inputs" in x)) && !("sections" in p), "…and no position carries inputs, no plot carries sections");
  ok(E.micsOn(p).concat(E.disOn(p)).every(i => i.moved), "…all pinned where they landed");
  const kmics = E.micsOn(p).filter(m => m.ownerPositionIds[0] === kit.id);
  ok(kmics.every(m => m.y < kit.y) && new Set(kmics.map(m => m.x)).size === 3, "the kit's mics sit downstage of it, spread out");
  const tenor = p.positions.find(x => x.roleId === "tenor");
  ok(E.micsOn(p).filter(m => /sax section/.test(m.label)).every(m => m.ownerPositionIds.includes(tenor.id)), "section mics belong to the row");
  const stand = JSON.parse(JSON.stringify(T("combo"))); stand.schemaVersion = 2;
  stand.items.push({ id:"m1", kind:"house", ref:"micstand", label:"", x:60, y:60, rot:0, moved:true, ownerPositionIds:[] });
  ok(E.migratePlot(stand).items.some(i => i.ref === "mic" && i.id === "m1"), "a placed mic stand from an old file is a mic now");
  const again = E.migratePlot(JSON.parse(JSON.stringify(p)));
  eq(E.micsOn(again).length, E.micsOn(p).length, "a migrated file reloads without growing more mics");
  ok(/\["mics","Mics & DIs"\]/.test(src), "the Mics & DIs tab exists");
  ok(/"tpt 1\+2" : "keys L"/.test(src), "a mic's label is edited in the inspector");
  ok(!/\["stand","di","power","riser"\]/.test(src), "the Misc tab no longer offers a stand or a DI");
}

/* ---- 19f. the page lists mics and DI boxes, counted from the deck (C3) ---- */
{
  const p = E.makeFromParts([["guitar",1],["acoustic",1],["bass",1],["drums",1]], null, "Mic'd and DI'd");
  const gtr = p.positions.find(x => x.roleId === "guitar"), amp = p.items.find(i => E.refCat(i.ref) === "gtramp");
  E.addMicItem(p, { x:amp.x, y:amp.y - 12 }, "gtr amp", [gtr.id], true);
  eq(JSON.stringify(E.micList(p)), JSON.stringify([{ label:"gtr amp", who:"Gtr" }]), "the electric guitar is miked: one microphone, at the amp, for the guitarist");
  eq(E.diList(p).map(d => d.label + " — " + d.who).join(" | "), "Acoustic guitar — Ac gtr | Bass — Bass", "the acoustic and the bass are DI'd: two DI boxes, each for its player");
  eq(E.consoleCount(p), 3, "three channels' worth on the deck");
  ok(!E.houseNeeds(p).some(n => n.id === "mic" || n.id === "di"), "…and none of it in the house-equipment list");
  ok(!E.warnings(p).some(w => w.level === "red"), "no red warning at three");
  const big = E.blankPlot(); big.deck = { widthFt:40, depthFt:30 };
  for (let i = 0; i < 33; i++) E.addMicItem(big, { x:20 + i * 12, y:100 }, "m" + i, [], true);
  const red = E.warnings(big).find(w => w.level === "red");
  ok(red && /33 mics and DI boxes/.test(red.text) && /32 channels/.test(red.text), "past the console's 32 it turns red: " + (red ? red.text : "no warning"));
  const many = E.blankPlot();
  for (let i = 0; i < 9; i++) E.addMicItem(many, { x:20 + i * 12, y:100 }, "", [], true);
  ok(E.warnings(many).some(w => w.level === "amber" && /9 × Mic \(on stand\) needed; Somewhere Works has 8/.test(w.text)), "nine mics: amber, the house has eight");
  const unl = E.blankPlot(); const v = E.addPosition(unl, "voice"); E.addMicItem(unl, { x:v.x, y:v.y - 21 }, "", [v.id], true);
  eq(JSON.stringify(E.micList(unl)[0]), JSON.stringify({ label:"Vox", who:"" }), "an unlabelled mic lists as its owner's chair");
  ok(/gearList\("Microphones", mics\)/.test(src) && /gearList\("DI boxes", dis\)/.test(src), "the page prints Microphones and DI boxes as separate sections");
  ok(/"MICROPHONES \(" \+ mics\.length/.test(src) && /"DI BOXES \(" \+ dis\.length/.test(src), "…and so does the email");
  ok(/'<span>Mics ' \+ mics\.length \+ ' · DI boxes ' \+ dis\.length/.test(src), "the meta row carries the one derived count");
}

/* ---- 19g. renumbering wedges (A1, Tim Shade 2026-09-16) ---- */
{
  const p = T("rock"), byNum = n => p.wedges.find(w => w.number === n);
  const w3 = byNum(3), w1 = byNum(1);
  eq(E.wedgeClashes(p).length, 0, "a fresh plot has every mix on its own number");
  E.setWedgeNumber(p, w3, 1);
  ok(w3.number === 1 && w1.number === 1, "giving wedge 3 the number 1 takes it — nothing swaps behind your back (William, 2026-09-16)");
  const cl = E.wedgeClashes(p);
  ok(cl.length === 1 && cl[0].number === 1 && cl[0].wedges.length === 2 && cl[0].wedges.includes(w1) && cl[0].wedges.includes(w3), "…and the clash is reported: mix 1 on two wedges");
  ok(E.warnings(p).some(w => w.level === "red" && /Mix 1 is on 2 wedges/.test(w.text) && /every mix needs its own number/.test(w.text)), "…in red, in the warnings: " + E.warnings(p).map(w => w.text).join(" | "));
  ok(/clashing\.has\(obj\.id\) \? ' stroke="#c0392b"/.test(src), "…and both wedges are outlined red on the stage");
  ok(/wedgecard' \+ \(c \? " clash" : ""\)/.test(src) && /class="clashnote"/.test(src), "…and the card says so");
  E.setWedgeNumber(p, w3, 9);
  eq(w3.number, 9, "a number nobody holds is simply taken");
  eq(E.wedgeClashes(p).length, 0, "…and the clash is gone");
  E.setWedgeNumber(p, w3, "0"); E.setWedgeNumber(p, w3, "abc"); E.setWedgeNumber(p, w3, "");
  eq(w3.number, 9, "zero, nonsense and a blank are ignored");
  E.setWedgeNumber(p, w3, "2.6");
  ok(w3.number === 3 && byNum(2).number === 2, "a typed decimal rounds");
  eq(E.monitorTable(p).rows[2].id, w3.id, "…and the Monitors table lists it third");
  p.wedges = p.wedges.filter(w => w.number !== 2);        // now 1, 3, 4, 5 (w1 went back to 1 by nobody's hand — it never left)
  eq(E.nextWedgeNumber(p), 2, "a new wedge takes the lowest number nobody has");
  p.wedges.push({ id:"wx", number:2, x:0, y:0, rot:0, moved:true });
  eq(E.nextWedgeNumber(p), 6, "…the next lowest after that");
  ok(/data-wnum=/.test(src) && /id="iWedgeNum"/.test(src), "the number is editable on the Wedges tab and in the inspector");
  ok(/<input type="text" inputmode="numeric" pattern="\[0-9\]\*" data-wnum=/.test(src) && /<input type="text" inputmode="numeric" pattern="\[0-9\]\*" id="iWedgeNum"/.test(src), "…as a plain box you type into, not a spinner");
  ok(!/type="number"[^>]*wnum|type="number"[^>]*iWedgeNum/.test(src), "…nowhere a number spinner");
  ok(!/they swap\b|the two swap\b/.test(src), "…and nothing on the page still promises a swap");
  ok(/twice = lastPress\.id === id && now - lastPress\.t < 450/.test(src) && /function editWedgeOnStage\(g, w\)/.test(src) && /setWedgeNumber\(q, ww, v\)/.test(src), "pressing a wedge on the stage twice opens a number box over it, on the same setWedgeNumber (William, 2026-09-16)");
  ok(/if \(twice && !obj\.kind && !isPosition\(obj\) && !S\.readOnly\)/.test(src) && !/addEventListener\("dblclick"/.test(src), "…wedges only, not on a shared read-only plot, and counted by hand — the stage re-renders between the two clicks, so dblclick never fires");
  ok(/^let lastPress = \{ id:null, t:0 \};/m.test(src), "…and the press memory lives outside wireCanvas, which runs again after every render");
  ok(/e\.key === "Escape"\)\{ e\.preventDefault\(\); finish\(false\);/.test(src) && /addEventListener\("blur", \(\) => finish\(true\)\)/.test(src), "…Escape drops the edit, Enter or clicking away keeps it");
  ok(/double-click a wedge on the stage/.test(src) && /or double-click the wedge on the stage/.test(src), "…and the help and the Wedges tab both say so");
}

/* ---- 19h. deleting is visible (A4, Tim Shade 2026-09-16) ---- */
{
  ok(/data-del="' \+ obj\.id/.test(src) && /class="delx"/.test(src), "the selected object carries an ⊗ on the canvas");
  ok(/id="bClear"/.test(src) && /function clearStage/.test(src) && /confirm\("Clear the stage\?/.test(src), "a clear-stage button, behind a confirm");
  eq((src.match(/removeObject\(/g) || []).length, 4, "the ⊗, the inspector button and the Delete key share one delete routine (definition + 3 calls)");
  ok(/e\.key === "Delete" \|\| e\.key === "Backspace"/.test(src), "…and the keyboard shortcut stays");
  ok(/click its ⊗ or press Delete/.test(src), "…and the note under the canvas says so");
  ok(!/print/.test(src.slice(src.indexOf("if (!print && S.sel){"), src.indexOf("if (!print && S.sel){") + 40).replace("!print", "")), "the ⊗ is never printed");
}

/* ---- 19i. the kit is the kit, no rug (B3, Tim Shade 2026-09-16) ---- */
{
  const p = T("combo"), kit = p.positions.find(x => x.roleId === "drums"), f = E.footprintOf(kit, p);
  eq(f.w + "×" + f.d, "54×52", "the drums footprint is the kit itself");
  eq(E.BYO_KINDS.find(b => b.id === "byo-kit").w + "×" + E.BYO_KINDS.find(b => b.id === "byo-kit").d, "54×52", "…and so is the band's own kit");
  const K = new Function(src.slice(src.indexOf("function kitPieces("), src.indexOf("/* A mic on a stand")) + "; return { kitPieces };")();
  const kick = /<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)" fill="#eee" stroke="#000" stroke-width="2.4"\/>(?=<text)/.exec(K.kitPieces({ w:54, d:52 }, "#000", "#555", "#eee"));
  ok(kick && Math.abs(+kick[2] + +kick[3] - 26) < .6, "the kick's front edge is the footprint's front edge (" + (kick ? (+kick[2] + +kick[3]).toFixed(1) : "?") + " of 26)");
  ok(!/rx="2" fill="' \+[\s\S]{0,120}kitPieces\(f, stroke\(pos\)/.test(src), "the kit position draws no filled rectangle under the drums");
  const w = p.wedges[0]; w.x = kit.x; w.y = kit.y - 26 - 9; w.rot = 0; w.moved = true;   // a wedge touching the kick, throw face at the drummer
  E.autoLayout(p, { force:false });
  ok(Math.abs(w.y - (kit.y - 35)) < .01 && Math.abs(w.x - kit.x) < .01, "a wedge dragged to the kick stays where it was put");
}

/* ---- 19j. the venue's own objects on the deck (D2, Tim Shade 2026-09-16) ---- */
{
  const p = T("combo"), fx = E.venueFixtures(p);
  eq(fx.map(f => f.id).join(","), "pa-sl,pa-sr,stairs-dsl,stairs-usr", "a Somewhere Works plot has the two PA columns and both stairs");
  const D = E.deckIn(p);
  for (const f of fx){ const r = E.rectOf(f, p); ok(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= D.w && r.y1 <= D.d, f.id + " is on the deck"); }
  const pa = fx.filter(f => /^pa/.test(f.id));
  ok(pa.every(f => E.rectOf(f, p).y0 === 0), "the PA columns stand at the downstage edge");
  ok(pa[0].x < D.w / 3 && pa[1].x > D.w * 2 / 3, "…one at each side");
  const dsl = E.rectOf(fx.find(f => f.id === "stairs-dsl"), p), usr = E.rectOf(fx.find(f => f.id === "stairs-usr"), p);
  ok(dsl.x0 === 0 && dsl.y1 < D.d / 2 && usr.x1 === D.w && usr.y0 > D.d / 2, "the downstage stairs are on the stage-left edge, the upstage stairs on the stage-right edge toward the back");
  ok(dsl.w <= 12 && usr.w <= 12 && dsl.d >= 36 && usr.d >= 36, "…both a shallow strip, a foot deep and three or four treads wide (update 2)");
  ok(fx.filter(f => f.steps).length === 2 && /f\.steps/.test(src) && /rotate\(-90 /.test(src.slice(src.lastIndexOf("for (const f of venueFixtures(plot)){"), src.lastIndexOf("for (const f of venueFixtures(plot)){") + 1600)),
     "…drawn ruled as treads, the vertical one's label reading up its length");
  const walker = E.addPosition(p, "voice");
  ok(E.onFixture(p, walker, 6, 96) && E.onFixture(p, walker, 282, 207) && E.onFixture(p, walker, 24, 12), "a player dropped on the stairs or the PA is refused");
  ok(!E.onFixture(p, walker, 144, 120), "…and the middle of the deck is fine");
  ok(/onFixture\(p, obj, x, y\)\) return;/.test(src) && /onFixture\(p, sel, sel\.x \+ dx, sel\.y \+ dy\)\) return;/.test(src), "…both the drag and the arrow keys check it");
  for (const t of E.TEMPLATES){
    const q = T(t.id), hits = collisions(q).hard.filter(h => /fixture/.test(h));
    ok(hits.length === 0, t.name + ": nothing is laid out on the PA or the stairs" + (hits.length ? ": " + hits.join("; ") : ""));
  }
  eq(E.venueFixtures(E.makeFromTemplate("combo", { widthFt:24, depthFt:12 })).length, 0, "another deck size is another room: no fixtures");
  ok(!E.legendKeys(p).some(k => k.id === "fixture" || k.id === "truss"), "the key does not name them — the tech knows their own room");
  ok(!/mainsDownstageLR/.test(src), "the old PA boxes outside the deck are gone");
  ok(/pointer-events="none"><rect/.test(src), "…and the fixtures cannot be grabbed");
}

/* ---- 19k. quick help (E3) ---- */
{
  ok(/id="bHelp"/.test(src) && /function openHelp\(\)/.test(src) && /id="bStartHelp"/.test(src), "a ? in the top bar and a How it works button on New plot");
  ok(/id="bPrint" title="[^"]*Save as PDF[^"]*">Print \/ PDF<\/button>/.test(src), "the one-click export is Print / PDF, and says so (E4)");
  for (const topic of ["Bulk add players", "Paste a roster", "− chair", "− stand", "Click to select, drag to move", "45° clockwise", "counter-clockwise", "click its ⊗", "Delete", "The kick faces the audience", "+ Mic", "One mic is one stand", "mix 1 is the tech", "Print / PDF", "Save as PDF", "carries a link to itself", "Edit a copy", "a reprint produces a new link"])
    ok(src.indexOf(topic) !== -1, "the help covers: " + topic);
  ok(/#helpDlg\{display:none!important\}|,#helpDlg\{display:none!important\}/.test(src), "…and never prints");
  ok(!/openHelp\(\);\s*\}\)\(\);/.test(src), "…and nothing opens it on load");
}

/* ---- 19l. update 2: one help source, numbered steps with a state, the printed link, the venue notice ---- */
{
  // help: one source, two entry points
  ok(/function helpSections\(\)/.test(src) && /function helpHTML\(\)/.test(src) && (src.match(/helpHTML\(\)/g) || []).length >= 2, "the help text has one source, rendered by helpHTML()");
  eq((src.match(/Click to select, drag to move/g) || []).length, 1, "…and the prose exists once");
  ok(/\["The seven steps"/.test(src) && /RAIL_TABS\.map\(\(\[id, label\]\)/.test(src), "…opening with the seven steps, read off the same tab list");
  ok(/id="bStartHelp">How it works/.test(src) && /<h2>How it works<\/h2>/.test(src), "the start screen button and the panel both say How it works");
  ok(!/Bring-own/.test(src), "Bring-own appears nowhere");
  // the seven steps
  ok(/const RAIL_TABS = \[\["positions","Positions"\],\["house","House"\],\["byo","Band brings"\],\["wedges","Wedges"\],\["mics","Mics & DIs"\],\["misc","Misc"\],\["details","Details"\]\]/.test(src), "tabs 1–7: Positions, House, Band brings, Wedges, Mics & DIs, Misc, Details, ids unchanged");
  ok(/<span class="n">' \+ \(i \+ 1\) \+ '<\/span>/.test(src), "…numbered before the label");
  const b = E.blankPlot(), ids = ["positions","house","byo","wedges","mics","misc","details"];
  eq(ids.map(id => E.stepState(b, id)).join(","), "todo,todo,todo,todo,todo,todo,todo", "a fresh plot: seven steps not started");
  E.addPosition(b, "voice");
  eq(E.stepState(b, "positions"), "done", "adding a position marks step 1 done");
  E.setSkipped(b, "byo", true);
  eq(E.stepState(b, "byo"), "skipped", "nothing here on step 3 marks it skipped");
  eq(JSON.stringify(b.skipped), '["byo"]', "…stored as plot.skipped");
  const back = E.migratePlot(JSON.parse(JSON.stringify(b)));
  eq(E.stepState(back, "byo"), "skipped", "…and it survives save and load");
  E.setSkipped(b, "positions", true);
  ok(!("positions" in (b.skipped || [])) && !b.skipped.includes("positions"), "Positions cannot be skipped");
  E.setSkipped(b, "byo", false);
  ok(!("skipped" in b), "unticking the last one removes the field, so a fresh save is byte-identical to before");
  const combo = T("combo");
  eq(ids.map(id => E.stepState(combo, id)).join(","), "done,done,todo,done,done,todo,todo", "a jazz combo: positions, house, wedges, mics/DIs done; band brings, misc, details to do");
  combo.name = "Combo A"; combo.date = "2026-11-14";
  eq(E.stepState(combo, "details"), "done", "a name and a date complete Details");
  combo.items.push({ id:"lbl", kind:"label", ref:null, label:"riser here", x:100, y:100, rot:0, moved:true, ownerPositionIds:[] });
  eq(E.stepState(combo, "misc"), "done", "a text label completes Misc");
  const kit = combo.positions.find(x => x.roleId === "drums"); kit.kit = "byo";
  eq(E.stepState(combo, "byo"), "done", "a band-brought kit completes Band brings");
  const old = JSON.parse(JSON.stringify(T("rock"))); old.skipped = "byo";
  ok(!("skipped" in E.migratePlot(old)), "a malformed skipped field is dropped on load");
  ok(/data-skip=/.test(src) && /SKIPPABLE\.includes\(S\.tab\)/.test(src), "the nothing-here toggle is drawn on the skippable tabs only");
  ok(/body\.ro \.rail[^}]*display:none/.test(src), "…and the read-only view hides the rail, toggles included");
  // the printed link and the notice
  ok(/<a href="' \+ esc\(link\) \+ '" target="_blank" rel="noopener">View or edit this plot online<\/a>/.test(src), "the page prints the sentence as the link, not the URL, opening in a new tab");
  ok(/addEventListener\("hashchange", \(\) => \{ if \(\/\^#\[sj\]=\/\.test\(location\.hash\)\) location\.reload\(\); \}\)/.test(src), "…and a plot hash arriving in an open tab reloads the app");
  const foot = src.slice(src.indexOf("H.push('<p class=\"foot\">' + esc(deliverLine(p))"), src.indexOf("H.push('<p class=\"foot\">' + esc(deliverLine(p))") + 1200);
  ok(foot.indexOf("deliverLine(p)") < foot.indexOf("View or edit this plot online") && foot.indexOf("View or edit this plot online") < foot.indexOf("VENUE.editNotice"), "…deliver line, link, venue sentence, in that order");
  eq(E.VENUE.editNotice, "Somewhere Works may adjust placements and monitor assignments to fit the room.", "the venue sentence lives in VENUE");
  ok(/\.sheet \.foot\.link a\{color:#0645ad;text-decoration:underline\}/.test(src), "…blue and underlined, so it reads as a link on the page");
  ok(/L\.push\("View or edit this plot online: " \+ link\)/.test(src) && /L\.push\(VENUE\.editNotice\)/.test(src), "the email carries the link and the sentence too");
  ok(/await ensureLink\(p\); renderSheet\(p\);/.test(src) && /emailText\(p, await ensureLink\(p\)\)/.test(src), "Print and Email wait for the link, so it matches what goes out");
  ok(/shareBase\(\) \+ "\?open=" \+ Date\.now\(\)\.toString\(36\) \+ await encodeHash\(\[p\], 0\)/.test(src), "the printed link is this one plot, with a fresh ?open= token before the hash so Chrome's Save as PDF keeps it as a link from any page");
  ok(/location\.origin \+ location\.pathname : APP_URL/.test(src), "…built off the page's origin and path, never an existing query");
  ok(/return "#s=" \+ B64\.enc/.test(src) && /return "#j=" \+ B64\.enc/.test(src) && /\/\^#\(\[sj\]\)=\(\.\+\)\$\//.test(src) && /CompressionStream\("deflate-raw"\)/.test(src),
     "the hash is deflate-raw + base64url under the s marker; plain base64url JSON under j still decodes");
  ok(/const APP_URL = "https:\/\/williamflynnguitar\.github\.io\/music-tools\/stageplot\/"/.test(src) && /shareBase\(\)/.test(src), "a file:// preview still prints the live address");
}

/* ---- 19m. seated or standing: chairs (William, 2026-09-16) ---- */
{
  const bb = T("bigband"), L = E.positionLabels(bb), by = f => bb.positions.filter(f);
  ok(by(p => p.roleId === "alto" || p.roleId === "tenor" || p.roleId === "bari").every(p => E.chairsOf(bb, p) === 1), "a big band's saxes sit");
  ok(by(p => p.roleId === "trombone").every(p => E.chairsOf(bb, p) === 1), "…and its trombones");
  ok(by(p => p.roleId === "trumpet").every(p => E.chairsOf(bb, p) === 0), "…its trumpets stand (William, 2026-09-16)");
  eq(E.chairsOf(bb, by(p => p.roleId === "guitar")[0]), 1, "…and its guitarist sits");
  ok(E.chairsOf(bb, by(p => p.roleId === "keys")[0]) === 1 && E.chairsOf(bb, by(p => p.roleId === "bass")[0]) === 0 && E.chairsOf(bb, by(p => p.roleId === "drums")[0]) === 0, "keys sit (always), bass stands, and the kit is the kit");
  eq(E.chairCount(bb), 11, "11 chairs: 5 saxes, 4 trombones, the guitarist, the keys player");
  ok(E.houseNeeds(bb).some(n => n.id === "chair" && n.need === 11 && !n.over), "…asked of the house as 11 × Chair, with no over-count");
  // labels: a row takes one side
  const g = E.diagramGeom(bb), LB = E.labelBoxes(bb, g);
  for (const row of [["Gtr","Tenor 1","Alto 1","Alto 2","Tenor 2","Bari"], ["Tbn 2","Tbn 1","Tbn 3","Tbn 4"], ["Tpt 2","Tpt 1","Tpt 3","Tpt 4"]]){
    const outside = row.map(s => LB[bb.positions.find(x => L[x.id].short === s).id]).filter(Boolean);
    eq(outside.length, 0, row[0] + "'s row: every chair label fits inside its circle, nothing outside");
  }
  bb.positions.forEach(p => { p.names = ["Pat Q"]; });
  const LB2 = E.labelBoxes(bb, E.diagramGeom(bb));
  for (const row of [["Gtr","Tenor 1","Alto 1","Alto 2","Tenor 2","Bari"], ["Tbn 2","Tbn 1","Tbn 3","Tbn 4"], ["Tpt 2","Tpt 1","Tpt 3","Tpt 4"]]){
    const sides = new Set(row.map(s => LB2[bb.positions.find(x => L[x.id].short === s).id].side));
    ok(sides.size === 1, row[0] + "'s row: the names all on one side (" + [...sides].join(",") + ")");
  }
  bb.positions.forEach(p => { p.names = []; });
  const spacing = Math.abs(by(p => L[p.id].short === "Tpt 1")[0].x - by(p => L[p.id].short === "Tpt 2")[0].x);
  ok(spacing >= 36, "big band chairs are at least 36″ apart (" + spacing.toFixed(1) + "″)");
  ok(E.ROLES.filter(r => r.stance !== "object" && r.id !== "hornsection").every(r => r.w === 22 && r.d === 22), "every human being is the same size, 22 × 22");
  const combo = T("combo");
  eq(E.chairsOf(combo, combo.positions.find(p => p.roleId === "tenor")), 0, "a combo's tenor stands");
  eq(E.chairsOf(combo, combo.positions.find(p => p.roleId === "trumpet")), 0, "…and its trumpet");
  eq(E.chairsOf(combo, combo.positions.find(p => p.roleId === "keys")), 1, "…its keys player sits, as keyboard players always do");
  for (const t of ["rock","vocals","duo"]){ const q = T(t); ok(q.positions.every(p => E.chairsOf(q, p) === (p.roleId === "keys" || p.roleId === "organ" ? 1 : 0)), t + ": everyone stands but the keys player"); }
  eq(E.ROLES.filter(r => r.stance === "seated").map(r => r.id).join(","), "keys,organ", "the only seated roles are the keyboard players");
  const t = combo.positions.find(p => p.roleId === "tenor");
  E.setChairs(combo, t, 1);
  ok(t.chairs === 1 && E.chairsOf(combo, t) === 1, "+ chair seats a standing player");
  E.setChairs(combo, t, 2);
  eq(E.chairText(E.chairsOf(combo, t)), "2 chairs", "…and again for a double chair");
  E.setChairs(combo, t, 0);
  ok(!("chairs" in t), "back to the role's default removes the field, so the file is unchanged");
  E.setChairs(combo, t, -3);
  eq(E.chairsOf(combo, t), 0, "never below zero");
  const kit = combo.positions.find(p => p.roleId === "drums");
  E.setChairs(combo, kit, 2);
  eq(E.chairsOf(combo, kit), 0, "the kit takes no chairs — the throne is part of the kit");
  const keys = E.legendKeys(combo).map(k => k.id);
  ok(keys.includes("player") && keys.includes("seated"), "the key shows both standing and seated when both are drawn");
  ok(/const n = chairsOf\(plot, pos\), cs = f\.w \+ 6;/.test(src) && /rx="3" fill="' \+ houseFill/.test(src), "a seated player is drawn on a square chair a little larger than the circle");
  ok(/data-chair=/.test(src) && (src.match(/− chair/g) || []).length >= 2, "− chair / + chair on the card and in the inspector");
  const saved = E.migratePlot(JSON.parse(JSON.stringify(bb)));
  eq(E.chairCount(saved), 11, "chairs survive save and load");
  // power strips and risers are gone
  ok(!E.VENUE.house.some(h => h.id === "power" || h.id === "riser"), "no power strip or riser in the palette");
  const old = JSON.parse(JSON.stringify(T("rock")));
  old.items.push({ id:"pw", kind:"house", ref:"power", label:"", x:50, y:50, rot:0, moved:true, ownerPositionIds:[] });
  ok(!E.migratePlot(old).items.some(i => i.ref === "power"), "…and one in an old file is dropped on load");
  ok(/id="bInstr"[^>]*>Bulk add players…<\/button>/.test(src) && /id="bBulk"[^>]*>Paste a roster…<\/button>/.test(src), "the two shortcuts are Bulk add players… and Paste a roster…");
  ok(!/Instrumentation…|Paste names…/.test(src), "…and the old labels are gone");
}

/* ---- 19n. music stands (William, 2026-09-16) ---- */
{
  const bb = T("bigband");
  ok(bb.positions.every(p => E.standsOf(bb, p) >= 1), "everyone in a big band has a stand");
  ok(bb.positions.filter(p => ["bass","drums"].includes(p.roleId)).every(p => E.standsOf(bb, p) === 2), "…and the bass player and the drummer have two");
  eq(E.standCount(bb), 19, "19 stands: 15 players with one, two with two");
  ok(E.houseNeeds(bb).some(n => n.id === "musicstand" && n.need === 19 && !n.over), "…asked of the house as 19 × Music stand, under the 20 it has");
  // the presets' stands rules (William, 2026-09-16)
  eq(E.TEMPLATES.map(t => t.id + ":" + t.stands).join(" "), "combo:all bigband:bigband rock:none vocals:none duo:none", "every preset carries a stands rule");
  const combo = T("combo");
  ok(combo.positions.every(p => E.standsOf(combo, p) === 1), "a jazz combo gives every player one stand — the bass player and the drummer too");
  eq(E.standCount(combo), 5, "…five for five");
  for (const id of ["rock","vocals","duo"]){ const q = T(id); eq(E.standCount(q), 0, id + ": no music stands"); }
  const counts = E.makeFromParts([["tenor",1],["trumpet",1],["keys",1],["bass",1],["drums",1]], null, "from counts");
  eq(E.standCount(counts), 0, "Bulk add players gives a combo-sized band none: the rule belongs to the preset, and the big band one still comes from the horn count");
  eq(E.standCount(E.makeFromParts([["alto",2],["tenor",2],["bari",1],["trumpet",4],["trombone",4],["bass",1],["drums",1]], null, "from counts")), 17, "…17 for a 15-piece built from counts: one each, two for the bass player and the drummer");
  const kept = E.makeFromParts([["tenor",1]], null, "kept"); kept.positions[0].stands = 3; E.defaultStands(kept, "all");
  eq(kept.positions[0].stands, 3, "a rule never overwrites a count a player already has; \"none\" clears them all");
  E.defaultStands(kept, "none"); ok(!("stands" in kept.positions[0]), "…cleared");
  const t = combo.positions.find(p => p.roleId === "tenor");
  E.setStands(combo, t, 2); eq(E.standsOf(combo, t), 2, "+ stand gives a player another stand");
  E.setStands(combo, t, 0); ok(!("stands" in t), "…and back to none removes the field");
  combo.items.push({ id:"ms", kind:"house", ref:"musicstand", label:"", x:100, y:100, rot:0, moved:true, ownerPositionIds:[] });
  E.setStands(combo, t, 2);
  eq(E.houseNeeds(combo).find(n => n.id === "musicstand").need, 7, "the house count is the players' stands plus any placed by hand");
  ok(E.legendKeys(combo).some(k => k.id === "stand"), "the key names the stand icon");
  ok(!/standGlyph/.test(src) && /standBars\(pos, f\)/.test(src) && /if \(!isStand\) labelled\(it, px, py, gl\);/.test(src), "stands draw as solid bars in front of the player and a placed stand carries no label");
  ok(/data-stand=/.test(src) && (src.match(/− stand/g) || []).length >= 2, "− stand / + stand on the card and in the inspector");
  // the Mics & DIs tab says how to attach one (William, 2026-09-16): select the instrument or the equipment first, then add
  ok((src.match(/To attach a mic or a DI to an instrument or a piece of equipment, (<b>)?select that player or that piece of equipment on the stage first/g) || []).length === 2,
     "the Mics & DIs tab opens with the select-first instruction, and the help repeats it");
  ok(/Nothing is selected, so it lands mid-stage, belonging to nobody\./.test(src) && /Right now it goes to <b>/.test(src), "…and says where the next mic or DI will land");
  eq(E.standCount(E.migratePlot(JSON.parse(JSON.stringify(bb)))), 19, "stands survive save and load");
}

/* ---- 19o. labels inside shapes, and the stand as a bar (William, 2026-09-16) ---- */
{
  const bb = T("bigband"), g = E.diagramGeom(bb), L = E.positionLabels(bb);
  const box = E.insideBox(bb.positions.find(p => p.roleId === "guitar"), bb);
  ok(Math.abs(box.w - 22 * .78) < .01, "a player's label box is the circle's inscribed square (" + box.w.toFixed(1) + "″)");
  const gtr = E.fitLabel(g, "Gtr", box.w, box.h, 12);
  ok(gtr && gtr.lines.length === 1 && gtr.pt === 12, "Gtr fits at full size on one line");
  const ten = E.fitLabel(g, "Tenor 1", box.w, box.h, 12);
  ok(ten && ten.lines.join("/") === "Tenor/1" && ten.pt >= 7 && ten.pt < 12, "Tenor 1 breaks at the space and shrinks (" + (ten ? ten.pt : "?") + "pt)");
  ok(E.fitLabel(g, "Somethingfartoolong", box.w, box.h, 12) === null, "what will not fit at the minimum goes outside, never smaller");
  eq(E.DRAW.minPt, 7, "the minimum type size is 7pt");
  for (const p of bb.positions){
    const plan = E.labelPlan(bb, p, g, L);
    ok(plan.inside && plan.inside.pt >= 7, L[p.id].short + " reads inside its circle at " + (plan.inside ? plan.inside.pt : "?") + "pt" + (p.roleId === "drums" ? " — the drummer's circle" : ""));
  }
  for (const t of E.TEMPLATES){                    // every preset: every chair label inside, none outside
    const q = T(t.id), G = E.diagramGeom(q), M = E.positionLabels(q);
    const out = q.positions.filter(p => p.roleId !== "drums" && !E.labelPlan(q, p, G, M).inside).map(p => M[p.id].short);
    eq(out.length, 0, t.name + ": every chair label fits inside" + (out.length ? " — not " + out.join(", ") : ""));
  }
  // a name goes outside, clear of the chair tile and of the stand bar
  const alto = bb.positions.find(p => L[p.id].short === "Alto 1"); alto.names = ["Sam Ortiz"];
  const lb = E.positionLabelBox(bb, alto, g, [], L);
  ok(lb && lb.lines.length === 1 && lb.lines[0].text === "Sam Ortiz" && lb.y1 <= alto.y - 14, "a seated player's name sits outside, below the chair tile");
  const tpt = bb.positions.find(p => L[p.id].short === "Tpt 1"); tpt.names = ["Dana Bell"];
  const lb2 = E.positionLabelBox(bb, tpt, g, [], L);
  ok(lb2 && lb2.y1 <= tpt.y - 11 - E.STAND.gap - E.STAND.thick, "a standing player's name sits below their stand bar");
  eq(E.labelClear(bb, tpt), 16, "…16″ from the centre: the circle, the gap and the bar");
  // the bar
  eq(JSON.stringify(E.STAND), JSON.stringify({ w:12, thick:3, gap:2, between:2 }), "the stand is a 12″ × 3″ bar, 2″ off a standing player, 2″ between a pair");
  // every stand on the page is the same size, whoever it belongs to (William, 2026-09-16); diagramSVG is not headless, so the source is read
  ok(/const bw = STAND\.w, span = n \* bw \+ STAND\.between \* \(n - 1\);/.test(src) && /width="' \+ bw \+ '" height="' \+ STAND\.thick/.test(src),
     "a player's bars are each STAND.w wide, however many and whatever the shape: the kit's, the bass player's pair and a trumpet's alike");
  ok(/isStand \? hitRect \+ '<rect x="' \+ \(-STAND\.w \/ 2\) \+ '" y="-1\.5" width="' \+ STAND\.w \+ '"/.test(src), "…and a stand placed by hand is the same bar");
  ok(!/STAND\.frac|frac:/.test(src), "…nothing scales a stand to its owner's shape");
  ok(/yTop = obj \? f\.d \/ 2 \+ STAND\.gap : seated \? \(f\.w \+ 6\) \/ 2 - STAND\.thick - 1\.5 : f\.w \/ 2 \+ STAND\.gap/.test(src), "…on the tile's downstage edge when seated, just below the circle when standing, below the kit");
  ok(/fill="' \+ ink \+ '"\/>';\n    }\n    return out;/.test(src), "…solid, in the ink colour");
  ok(/stand:   '<circle cx="11" cy="6"/.test(src) && /<rect x="6\.5" y="12\.6" width="9" height="2\.4" rx="\.8" fill="' \+ ink/.test(src), "the key shows the bar under a player circle");
  // DI boxes and gear
  eq(E.VENUE.house.find(h => h.id === "di").w, 10, "a DI box is 10″, just enough to hold DI at the minimum size");
  const dib = E.insideBox(bb.items.find(i => i.ref === "di"), bb);
  ok(E.fitLabel(g, "DI", dib.w, dib.h, 9.5) !== null, "…and DI fits in it");
  ok(/gl = ts\("DI", px, py \+ g\.pt\(fit\.pt\) \* \.36, fit\.pt, "dim"\); insideFit = true;/.test(src) && /"DI" \+ \(String\(it\.label \|\| ""\)\.trim\(\) \? " · "/.test(src),
     "DI reads inside the box; far from any source it says which, outside");
  ok(!/labelAngle\(it\.rot\)/.test(src), "gear labels stay upright, whatever the rotation");
  const byoFits = E.BYO_KINDS.filter(b => b.id !== "byo-kit").map(b => [b.short, !!E.fitLabel(g, b.short, b.w - 2, b.d - 2, 9.5)]);
  eq(byoFits.filter(x => !x[1]).map(x => x[0]).join(","), "Laptop,Ac gtr", "the band-brought palette holds its names inside, but for the laptop and the acoustic guitar (logged fallbacks)");
  const amp = bb.items.find(i => E.refCat(i.ref) === "gtramp"), ab = E.insideBox(amp, bb);
  ok(E.fitLabel(g, "Vox blk", ab.w, ab.h, 9.5) !== null, "Vox blk fits inside its amp — the short names are what the shape holds");
  const kb = bb.items.find(i => E.refCat(i.ref) === "keys"), kbb = E.insideBox(kb, bb);
  ok(kbb.w < kbb.h && E.fitLabel(g, "Korg", kbb.w, kbb.h, 9.5) !== null, "Korg fits upright inside the vertical keyboard");
  for (const t of E.TEMPLATES){                    // every preset: every piece of gear holds its name
    const q = T(t.id), G = E.diagramGeom(q), out = [];
    for (const it of q.items){ const def = E.itemDef(it); if (!def || ["mic","di","musicstand"].includes(it.ref)) continue;
      const b = E.insideBox(it, q); if (!E.fitLabel(G, def.short || def.label, b.w, b.h, 9.5)) out.push(def.short); }
    eq(out.length, 0, t.name + ": every piece of gear holds its name inside" + (out.length ? " — not " + out.join(", ") : ""));
  }
}

/* ---- 20. the printed page, measured in a browser ---- *
 * Page count comes from rendered height, so node alone cannot see it.
 * print-check.js drives a real browser and exits 2 when there is none. */
{
  const r = require("child_process").spawnSync(process.execPath, [path.join(__dirname, "print-check.js")], { encoding:"utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  process.stdout.write(out.replace(/^/gm, "  ").replace(/\s*$/, "\n"));
  if (r.status === 2) say("page fit and the printed contact were not measured — see above");
  else ok(r.status === 0, "print-check.js: every plot prints on the pages it printed on before, with the contact on each");
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
