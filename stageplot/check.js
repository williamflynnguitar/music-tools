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
  roleDef, roleOf, doubleInputs, roleIdFromText, positionLabels, posText2, posShortLines, posNames,
  blankPlot, addPosition, makeFromParts, makeFromTemplate, autoLayout, monitorGroups, resetIds,
  parseNameList, applyNameList, migratePlot, migrateV1, inputUnits, channelRows, channelCount,
  monitorTable, houseNeeds, diSources, byoList, warnings, sectionRows, changeover,
  offDeck, rectOf, footprintOf, deckIn, posText, zoneOf, plotFileName, syncWedgeIds, itemDef,
  diagramGeom, labelBoxes, positionLabelBox, kitInputs,
  PKG_SETS, pkgSet, pkgDef, startPkgId, packageInputs, setPackage,
  inferPackage, notMiked, unmiked,
  addMic, removeMic, ownMics, micSummary, bigBandSeats, legendKeys,
  BACKLINE_CATS, houseCat, backlineCat, refCat, objectRef,
  pickBackline, findBackline, settleBackline, orderNum, ordinal, scheduleLines, fmtDate, labelAngle };`)();

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
/* The page starts every player with no mics. Tests that need a band with
   channels on it mic it up here — this is what the old "fully miked" profile
   gave each role, kept so the channel counts below stay comparable. */
const FULLY_MIKED = { voice:"mic", guitar:"mic", bass:"di-mic", upright:"di-mic", drums:"close", perc:"mic", keys:"stereo", organ:"stereo", dj:"stereo", playback:"stereo", bari:"mic", tenor:"mic", alto:"mic", soprano:"mic", clarinet:"mic", flute:"mic", tuba:"mic", btrombone:"mic", trombone:"mic", hornsection:"two", trumpet:"mic", flugel:"mic", acoustic:"di-mic", violin:"di-mic", cello:"di-mic", harmonica:"mic" };
const mike = p => { for (const x of p.positions){ const id = FULLY_MIKED[x.roleId]; if (id) E.setPackage(p, x, id); } return p; };

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
  eq(chOf(q), before, "…and no channel until someone gives them a mic");
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
  eq(chOf(q), before, "dropping them again leaves the channel count where it was");
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
  ok(E.channelRows(p).every(r => r.who !== undefined), "every channel says which position it is");
  eq(Object.keys(E.sectionRows(p)).sort().join(","), "sax,tbn,tpt", "three horn rows");
}

/* ---- 3b. amplification is a choice: nothing starts miked ---- */
{
  // no template, and no player added later, arrives with a mic (William, 2026-09-14)
  for (const t of E.TEMPLATES){
    const p = T(t.id);
    const mics = p.positions.filter(x => x.inputs.some(i => i.type === "mic"));
    eq(mics.length, 0, t.name + " starts with no mics" + (mics.length ? " (" + mics.map(x => E.positionLabels(p)[x.id].short).join(", ") + ")" : ""));
    ok(Object.values(p.sections).every(sec => !sec.on), t.name + " starts with no section mics");
    ok(!("ampProfile" in p), t.name + " carries no mic profile");
  }
  const blank = E.blankPlot();
  for (const r of E.ROLES.map(r => r.id)) E.addPosition(blank, r);
  eq(blank.positions.filter(x => x.inputs.some(i => i.type === "mic")).length, 0, "no role in the library arrives with a mic (" + E.ROLES.length + " tried)");
  ok(!/pkgDefaults|PROFILES|applyProfile|ampProfile:"/.test(src), "no mic profiles left in the page");

  // DI sources keep their DI
  const combo = T("combo");
  const kit = combo.positions.find(x => x.roleId === "drums"), keys = combo.positions.find(x => x.roleId === "keys");
  eq(keys.pkg, "mono", "keys start on a mono DI");
  eq(combo.positions.find(x => x.roleId === "bass").pkg, "di", "bass starts on its DI");
  eq(chOf(combo), 2, "the jazz combo is 2 channels: keys DI and bass DI");
  eq(chOf(T("bigband")), 2, "so is the big band until someone adds mics");
  const bbSilent = E.notMiked(T("bigband")).map(x => x.label + " (" + x.why + ")");
  ok(["Sax section (acoustic)","Trombone section (acoustic)","Trumpet section (acoustic)"].every(l => bbSilent.includes(l)),
     "an unmiked horn row prints as one line: " + bbSilent.join(", "));
  const secOn = T("bigband"); secOn.sections.sax.on = true;
  ok(E.migratePlot(JSON.parse(JSON.stringify(secOn))).sections.sax.on, "a ticked section on an unmiked row survives save and reload");
  eq(chOf(secOn), 4, "ticking the sax section on an unmiked row gives it its 2 shared mics");
  ok(!E.notMiked(secOn).some(x => /Sax/.test(x.label)), "…and the row leaves Not miked");
  const duo = T("duo");
  eq(duo.positions[0].inputs.map(i => i.type + ":" + i.source).join(","), "di:Acoustic guitar", "the duo's acoustic double brings its DI and nothing else");

  // unmiked is printed, not implied
  eq(kit.inputs.length, 0, "the kit brings no channels");
  const silent = E.notMiked(combo);
  ok(silent.some(x => /Drums/.test(x.label) && x.why === "acoustic"), "…and prints as Drums (acoustic): " + silent.map(x => x.label + " (" + x.why + ")").join(", "));
  ok(E.unmiked(combo, kit), "…and carries the no-mic marker on the diagram");
  const rock = T("rock");
  ok(E.notMiked(rock).some(x => /Vox/.test(x.label)), "a vocalist with no mic prints under Not miked too");
  eq(E.notMiked(mike(T("rock"))).length, 0, "a fully miked plot prints no Not miked section at all");

  // channel warnings: count only, no suggested cuts (William, 2026-09-14)
  const bb = mike(T("bigband"));
  say("big band fully miked: " + chOf(bb) + " channels of " + E.VENUE.consoleChannels);
  eq(E.warnings(bb).filter(w => /channel/.test(w.text)).length, 0, "the big band fully miked raises no channel warning");
  const big = T("bigband");
  for (let i = 0; i < 6; i++) E.addPosition(big, "voice");
  mike(big);
  ok(chOf(big) > E.VENUE.warnChannelsAt, "a 17-piece plus six voices is over the headroom line (" + chOf(big) + " ch)");
  const warn = E.warnings(big).find(w => /channel/.test(w.text));
  ok(warn && warn.level === "amber", "…and the channel warning still fires");
  ok(!("fixes" in warn), "…with no suggested cuts");
  for (let i = 0; i < 4; i++) E.addMic(big, E.addPosition(big, "voice"));
  ok(E.warnings(big).some(w => w.level === "red" && /channel/.test(w.text)), "over the console it turns red (" + chOf(big) + " ch)");
  ok(!/data-cut|function reductions|applyReduction/.test(src), "no channel-warning suggestions left in the page");
}

/* ---- 3b-2. what the review of this change turned up (2026-09-14) ---- */
{
  // a section folds only its own players' mics; a double on someone outside the row keeps its channel
  const p = E.makeFromParts([[{ roleId:"voice", doubles:[{ roleId:"tenor", input:true }] },1],["alto",1],["tenor",1],["keys",1],["bass",1]], null, "Dbl");
  const vox = p.positions.find(x => x.roleId === "voice");
  E.addMic(p, vox);
  const before = E.channelRows(p).map(r => r.source);
  ok(before.includes("Tenor sax"), "the vocalist's tenor double has a channel: " + before.join(", "));
  p.sections.sax.on = true;
  const after = E.channelRows(p);
  ok(after.some(r => r.source === "Tenor sax" && /Vox/.test(r.who || "")), "ticking the sax section keeps the vocalist's tenor channel: " + after.map(r => r.source).join(", "));
  eq(after.filter(r => /Sax section/.test(r.source)).length, 2, "…and adds the two section mics for the sax row");

  // Not miked says "Sax section" only for a real, wholly silent section
  const fc = E.makeFromParts([["flute",1],["clarinet",1],["keys",1]], null, "Woodwinds");
  const fcSilent = E.notMiked(fc).map(x => x.label);
  ok(!fcSilent.includes("Sax section") && fcSilent.some(l => /Fl/.test(l)) && fcSilent.some(l => /Cl/.test(l)),
     "a flute and a clarinet are named, not called a sax section: " + fcSilent.join(", "));
  const mixed = E.makeFromParts([[{ roleId:"alto", doubles:[{ roleId:"flute", input:true }] },1],["tenor",1],["keys",1]], null, "Mixed");
  const mixedSilent = E.notMiked(mixed).map(x => x.label);
  ok(!mixedSilent.includes("Sax section"), "a row with a double's mic on it isn't printed as a silent section: " + mixedSilent.join(", "));

  // an unrecognised instrument starts with nothing either
  const other = E.blankPlot();
  eq(E.addPosition(other, "no-such-role").inputs.length, 0, "an Other player arrives with no mic");

  // a plot saved before sections counted unmiked horns doesn't gain section mics on reload
  const old = T("bigband");
  delete old.sectionsIncludeUnmiked;
  old.ampProfile = "light";
  for (const row of ["sax","tbn","tpt"]) old.sections[row] = { on:true, mics:2, manual:false };
  for (const x of old.positions.filter(x => x.roleId === "alto" || x.roleId === "tenor")) E.addMic(old, x);   // the sax row kept its mics
  const reread = E.migratePlot(JSON.parse(JSON.stringify(old)));
  ok(reread.sections.sax.on && !reread.sections.tbn.on && !reread.sections.tpt.on,
     "old file: the miked sax row keeps its section, the unmiked brass rows don't grow one");
  eq(chOf(reread), 4, "…so it prints the 4 channels it printed before (bass, keys, 2 sax section mics)");
  ok(!("manual" in reread.sections.sax), "…and the profile-era flag is gone");
  ok(reread.sectionsIncludeUnmiked, "…and the file is marked as read under the new rule");
}

/* ---- 3d. the diagram's key lists what the diagram draws ---- */
{
  const ids = p => E.legendKeys(p).map(k => k.id).join(",");
  const combo = T("combo");
  eq(ids(combo), "player,unmiked,wedge,house,drummer,truss", "the jazz combo's key: " + ids(combo));
  ok(!/unmiked/.test(ids(mike(T("rock")))), "a fully miked plot's key doesn't mention not miked");
  const blank = E.blankPlot();
  eq(ids(blank), "truss", "an empty deck's key has only the truss");
  E.addPosition(blank, "keys");
  ok(!/drummer|wedge|byo/.test(ids(blank)), "…and never lists a symbol that isn't drawn: " + ids(blank));
  const byo = T("combo"); byo.items.push({ id:"b1", kind:"byo", ref:"byo-pedals", label:"", x:40, y:40, rot:0, moved:true, ownerPositionIds:[], inputs:[] });
  ok(/byo/.test(ids(byo)), "band-brought gear adds the dashed box to the key");
  ok(E.legendKeys(combo).every(k => k.text && !/⊘/.test(k.text)), "every key entry is words, not another symbol");
  ok(/class="legend"/.test(src) && /id="canvaslegend"/.test(src), "the key is on the printed page and under the canvas");
}

/* ---- 3c. mics by hand ---- */
{
  const combo = T("combo");
  const kit = combo.positions.find(x => x.roleId === "drums"), tpt = combo.positions.find(x => x.roleId === "trumpet");
  const keys = combo.positions.find(x => x.roleId === "keys");
  eq(E.micSummary(combo, kit), "not miked", "an acoustic kit reads as not miked in the list");
  E.addMic(combo, kit); E.addMic(combo, kit);
  eq(kit.inputs.map(i => i.source).join(","), "Kick,Snare", "+ mic on a kit fills in the kit pieces in order");
  eq(E.micSummary(combo, kit), "2 mics", "…and the list says so");
  ok(!E.notMiked(combo).some(x => /Drums/.test(x.label)), "…and the kit leaves the Not miked section");
  eq(chOf(combo), 4, "…two more channels");
  E.removeMic(combo, kit);
  eq(kit.inputs.map(i => i.source).join(","), "Kick", "− mic takes the last one away");
  E.removeMic(combo, kit);
  ok(E.unmiked(combo, kit), "…down to none, and it is not miked again");
  E.removeMic(combo, kit);
  eq(kit.inputs.length, 0, "− mic on a player with no mic does nothing");
  E.addMic(combo, tpt);
  eq(tpt.inputs[0].source, "Trumpet", "a horn's mic is named for the horn");
  eq(tpt.pkg, "mic", "…and reads as its individual-mic setup");
  const before = keys.inputs.length;
  E.removeMic(combo, keys);
  eq(keys.inputs.length, before, "− mic leaves a DI alone");
  const g = E.makeFromParts([["guitar",1],["voice",1]], null, "Duo");
  E.addMic(g, g.positions[0]); E.addMic(g, g.positions[1]);
  eq(g.positions[0].inputs[0].notes, "amp mic", "a guitar's mic is an amp mic");
  eq(g.positions[1].inputs[0].source, "Vocal", "a voice's mic is Vocal");
  ok(!/data-profile|Mic package|full kit \(7\)|jazz minimal \(4\)/.test(src), "no amplification presets left in the page");
}

/* ---- 4. building from an instrumentation list ---- */
{
  const p = mike(E.makeFromParts([["voice",1],["guitar",1],["keys",1],["bass",1],["drums",1]], null, "Five piece"));
  eq(p.positions.length, 5, "a five-piece builds from counts");
  eq(chOf(p), 13, "…and totals 13 channels fully miked");
  eq(p.wedges.length, 5, "…and five mixes");
  const needs = Object.fromEntries(E.houseNeeds(p).map(n => [n.id, n.need]));
  eq(needs.kit, 1, "the drums position implies the house kit");
  eq(needs.gtramp1, 1, "the guitar implies a house amp");
  eq(needs.kb1, 1, "keys implies a house keyboard — SW has no acoustic piano");
  eq(needs.bassamp, 1, "the bass implies the house rig");
  eq(needs.di, 3, "keys stereo DI (2) + bass DI (1); the bass amp mic is a mic, not a DI");
  eq(needs.micstand, 1, "one boom stand: the vocal");
}

/* ---- 5. channel ordering ---- */
{
  const p = mike(E.makeFromParts([["bari",1],["tenor",1],["alto",1],["trombone",1],["trumpet",2],["guitar",1],["keys",1],["bass",1],["drums",1]], null, "Little big band"));
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
  const p = mike(E.makeFromParts([["alto",1],["drums",1]], null, "Doubles"));
  const alto = p.positions.find(x => x.roleId === "alto"), drums = p.positions.find(x => x.roleId === "drums");
  const before = chOf(p);
  alto.doubles = [{ roleId:"flute", input:false }];
  eq(chOf(p), before, "a double with no channel of its own costs nothing");
  ok(/Flute/.test(E.posShortLines(p, alto).map(l => l.text).join(" ")), "…and still prints on the diagram");
  alto.inputs.push(Object.assign({ id:"dbl1", role:"flute" }, E.doubleInputs(E.roleDef(p, "flute"))[0]));
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
  const p = mike(E.makeFromParts([["voice",1],["drums",1]], null, "Custom"));
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
  eq(drums.pkg, "close", "a v1 kit lands on the full close-mic package, not a broken state");
  ok(!("ampProfile" in ex) && !("pkgOverride" in drums), "…with no mic-profile fields on the migrated plot");
  const old = T("combo"); old.ampProfile = "light"; old.positions[0].pkgOverride = true;
  const reread = E.migratePlot(JSON.parse(JSON.stringify(old)));
  ok(!("ampProfile" in reread) && !reread.positions.some(x => "pkgOverride" in x), "a plot saved with the old profile fields loads without them");
  eq(chOf(reread), chOf(old), "…and keeps its inputs exactly");
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
  const g = E.makeFromParts([["guitar",1],["bass",1],["drums",1]], null, "Nothing miked");
  eq(E.channelCount(g), 1, "a guitar trio still opens on one channel — the bass DI");
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
  // a kit laid out against the drape and turned 45° pokes over the edge — the
  // box is honest about that, and the page says so rather than hiding it
  const q = band(), kit = q.positions.find(x => x.roleId === "drums"), kb = q.items.find(i => E.refCat(i.ref) === "keys");
  kit.rot = 45; kit.moved = true;
  ok(E.offDeck(kit, q), "a kit turned 45° where the engine put it hangs over the upstage edge (its box grew from 72×60 to 93×93)");
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
}

/* ---- 19c. the drummer mark and the kick label ---- */
{
  // the kit is drawn outside the engine block, so lift just those two functions
  const K = new Function(src.slice(src.indexOf("function drummerMark("), src.indexOf("function wedgePath(")) + "; return { drummerMark, kitPieces };")();
  const kit = K.kitPieces({ w:72, d:60 }, "#000", "#555", "#eee");
  ok(/>Kick<\/text>/.test(kit), "the kick drum is labelled on the kit");
  const stem = /<path d="M-?[\d.]+,-?[\d.]+v([\d.]+)" stroke="#000" stroke-width="[\d.]+" stroke-linecap="round"/.exec(kit);
  const dot = /<circle cx="-?[\d.]+" cy="-?[\d.]+" r="([\d.]+)" fill="#000"/.exec(kit);
  ok(stem && dot && +stem[1] > +dot[1] * 1.5, "the drummer's stem clears the dot by most of a radius (" + (stem ? stem[1] : "?") + " on r " + (dot ? dot[1] : "?") + ")");
  ok(/drummer: drummerMark\(/.test(src) && /drummerMark\(2 \* kx/.test(src), "the key and the kit draw the drummer with the same function");
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
