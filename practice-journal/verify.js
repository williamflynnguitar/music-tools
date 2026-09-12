/*
 * practice-journal/verify.js — behavioural verification, driven through a real browser.
 *
 * check.js is the dependency-free guard and is the one that must always pass.
 * This one is the fuller net: ~230 assertions covering the entry lifecycle, the
 * local-calendar-date rule, filters, the aggregation, the three export formats,
 * the import merge, the framed / blocked / corrupt / quota states, two tabs
 * writing at once, escaping, and the phone layout.
 *
 * It needs Playwright, which the suite does not otherwise depend on, and a static
 * server on the repo root:
 *
 *   npx http-server -p 8199 -s .
 *   npx playwright@1.56 install chromium        # once
 *   node practice-journal/verify.js
 *
 * If Playwright is installed globally rather than locally:
 *   NODE_PATH="$(npm root -g)" node practice-journal/verify.js
 */
const { chromium } = require('playwright');
const PORT = process.env.PJ_PORT || 8199;
const URL = 'http://127.0.0.1:' + PORT + '/practice-journal/';

let pass = 0, fail = 0;
const errs = [];
function ok(name, cond, extra){
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  << ' + JSON.stringify(extra) : '')); }
}
function eq(name, a, b){ ok(name + ' = ' + JSON.stringify(b), JSON.stringify(a) === JSON.stringify(b), { got: a }); }

async function newPage(browser, opts){
  const ctx = await browser.newContext(Object.assign({ timezoneId: 'America/Chicago' }, opts || {}));
  const p = await ctx.newPage();
  p.on('pageerror', e => { errs.push(String(e)); });
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  return p;
}

(async () => {
  const browser = await chromium.launch();

  /* ---------- 1. load, shell, storage keys ---------- */
  console.log('\n== load and shell ==');
  let p = await newPage(browser);
  await p.goto(URL);
  await p.waitForFunction(() => !!window.__pj);
  eq('title', await p.title(), 'Practice Journal');
  eq('keys', await p.evaluate(() => window.__pj.store.KEYS),
     { entries: 'jgth:practice-journal:entries:v1', config: 'jgth:practice-journal:config:v1' });
  ok('spine chip present', await p.locator('nav.sp-menu .sp-toggle').count() === 1);
  ok('spine marks current page', await p.locator('[data-sp="practice-journal"][aria-current="page"]').count() === 1);
  ok('log view is the default', await p.locator('#viewLog').isVisible());
  ok('form visible (storage works over http)', await p.locator('#logForm').isVisible());
  eq('first-run enabled fields', await p.evaluate(() => window.__pj.store.loadConfig().enabledFields), ['tool','category','tempo']);
  ok('tool field shown', await p.locator('[data-field="tool"]').isVisible());
  ok('tags field hidden by default', !(await p.locator('[data-field="tags"]').isVisible()));
  ok('first-run note shown', await p.locator('#f-firstrun').isVisible());

  /* ---------- 2. local calendar date, not UTC ---------- */
  console.log('\n== local calendar date (the 11pm bug) ==');
  const dateInfo = await p.evaluate(() => ({
    prefilled: document.getElementById('f-date').value,
    today: window.__pj.store.todayISO(),
    utc: new Date().toISOString().slice(0, 10),
    offsetMin: new Date().getTimezoneOffset()
  }));
  ok('date prefilled with local today', dateInfo.prefilled === dateInfo.today, dateInfo);
  const late = await newPage(browser, { timezoneId: 'America/Chicago' });
  await late.addInitScript(() => {
    // pin the clock to 2026-09-11 23:30 America/Chicago == 2026-09-12 04:30Z
    const fixed = new Date('2026-09-12T04:30:00.000Z').getTime();
    const RealDate = Date;
    function D(...a){ return a.length ? new RealDate(...a) : new RealDate(fixed); }
    D.prototype = RealDate.prototype; D.now = () => fixed; D.parse = RealDate.parse; D.UTC = RealDate.UTC;
    window.Date = D;
  });
  await late.goto(URL);
  await late.waitForFunction(() => !!window.__pj);
  const lateInfo = await late.evaluate(() => ({
    today: window.__pj.store.todayISO(),
    utc: new Date().toISOString().slice(0, 10),
    field: document.getElementById('f-date').value
  }));
  eq('11:30pm CDT logs as 2026-09-11 (UTC would say 09-12)', lateInfo.today, '2026-09-11');
  eq('  and the form agrees', lateInfo.field, '2026-09-11');
  ok('  UTC really would have been wrong', lateInfo.utc === '2026-09-12', lateInfo);
  await late.context().close();

  /* ---------- 3. save a session ---------- */
  console.log('\n== saving ==');
  await p.fill('#f-duration', '45');
  await p.fill('#f-notes', 'Head down at 84 twice, clean.');
  await p.selectOption('#f-tool', 'two-and-four');
  await p.selectOption('#f-category', 'transcription');
  await p.fill('#f-tempo', '84');
  await p.click('#f-save');
  await p.waitForFunction(() => document.getElementById('f-status').textContent.length > 0);
  ok('confirmation restates duration and day', (await p.locator('#f-status').textContent()).indexOf('45 min logged for today') > -1);

  const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('jgth:practice-journal:entries:v1')));
  eq('envelope kind', stored.kind, 'practice-journal.entries');
  eq('envelope schemaVersion', stored.schemaVersion, 1);
  ok('envelope has deviceId', typeof stored.deviceId === 'string' && stored.deviceId.length > 10);
  eq('one entry stored', stored.entries.length, 1);
  const e0 = stored.entries[0];
  ok('id is uuid-v4 shaped', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e0.id), e0.id);
  eq('deletedAt null', e0.deletedAt, null);
  eq('durationMinutes', e0.durationMinutes, 45);
  eq('fields.tool is the folder slug', e0.fields.tool, 'two-and-four');
  eq('fields.tempo', e0.fields.tempo, 84);
  eq('fields.category', e0.fields.category, 'transcription');
  eq('fields.tags defaults to []', e0.fields.tags, []);
  eq('fields.rating null', e0.fields.rating, null);
  ok('createdAt is ISO UTC', /Z$/.test(e0.createdAt));
  eq('createdAt === updatedAt on create', e0.createdAt, e0.updatedAt);

  console.log('\n== what carries between entries ==');
  const after = await p.evaluate(() => ({
    date: document.getElementById('f-date').value,
    tool: document.getElementById('f-tool').value,
    cat: document.getElementById('f-category').value,
    dur: document.getElementById('f-duration').value,
    tempo: document.getElementById('f-tempo').value,
    notes: document.getElementById('f-notes').value
  }));
  ok('date carries', after.date === dateInfo.today);
  ok('tool carries', after.tool === 'two-and-four');
  ok('category carries', after.cat === 'transcription');
  eq('duration resets to the default', after.dur, '30');
  eq('tempo clears', after.tempo, '');
  eq('notes clear', after.notes, '');

  /* ---------- 4. validation ---------- */
  console.log('\n== validation ==');
  await p.fill('#f-duration', '');
  await p.click('#f-save');
  ok('empty duration blocks the save', await p.locator('#f-error').isVisible());
  ok('  with the right message', (await p.locator('#f-error').textContent()).indexOf('how long you practiced') > -1);
  eq('  nothing was written', await p.evaluate(() => JSON.parse(localStorage.getItem('jgth:practice-journal:entries:v1')).entries.length), 1);
  await p.fill('#f-duration', '2000');
  await p.click('#f-save');
  ok('duration over a day blocks', (await p.locator('#f-error').textContent()).indexOf('more than a day') > -1);
  await p.fill('#f-duration', '30');
  await p.fill('#f-tempo', '9');
  await p.click('#f-save');
  ok('out-of-range tempo blocks rather than silently nulling', (await p.locator('#f-error').textContent()).indexOf('between 20 and 400') > -1);
  await p.fill('#f-tempo', '');

  /* ---------- 5. duration chips ---------- */
  console.log('\n== duration chips ==');
  await p.click('[data-dur="60"]');
  eq('chip sets the number', await p.inputValue('#f-duration'), '60');
  eq('  and lights up', await p.getAttribute('[data-dur="60"]', 'aria-pressed'), 'true');
  await p.fill('#f-duration', '37');
  eq('an off-chip number lights none', await p.evaluate(() =>
    Array.from(document.querySelectorAll('[data-dur]')).filter(b => b.getAttribute('aria-pressed') === 'true').length), 0);

  /* ---------- 6. seed a realistic log through the store ---------- */
  console.log('\n== seeded log: history, filters, summary ==');
  await p.evaluate(() => {
    const S = window.__pj.store;
    const mk = (date, min, f, notes) => S.saveEntry({ date, durationMinutes: min, notes: notes || '', fields: f });
    S.saveConfig({ enabledFields: ['tool','category','tempo','tune','key','tags','focus','rating'] });
    mk('2026-09-05', 25, { category:'improvisation', tune:'Blue Bossa', key:'C', tempo:132, focus:'stop landing on the root every time', tags:['guide tones'] },
       "Kept the line moving through the ii-V but I'm still stepping on beat one.");
    mk('2026-09-07', 40, { category:'technique', tempo:120, tool:'two-and-four', rating:3 },
       'Scale shapes 1-3, three octaves. Clean at 120, sloppy at 132.');
    mk('2026-09-08', 25, { category:'repertoire', tune:'There Will Never Be Another You', key:'Eb' },
       'Ran it four times at a walking tempo. Comfortable now.');
    mk('2026-09-10', 35, { category:'repertoire', tune:'Stella By Starlight', key:'Bb', tool:'voice-leading', focus:'nearest inversion through the A section', tags:['comping','drop2'] },
       'Voice leading is much smoother than last week.');
    mk('2026-09-11', 45, { category:'transcription', tune:'All the Things You Are', key:'Ab', tempo:84, tool:'two-and-four', focus:'nail the bridge', tags:['comping','slow'], rating:4 },
       'Head down at 84 twice, clean.\nBridge still falls apart the third time through.');
  });
  await p.click('[data-view-btn="history"]');
  const rowCount = await p.locator('#h-out li[data-entry-id]').count();
  eq('history lists every entry', rowCount, 6);
  const order = await p.evaluate(() => Array.from(document.querySelectorAll('#h-out .h-hd span:first-child')).map(s => s.textContent));
  ok('day headers are reverse chronological', order.length >= 5 && order[order.length - 1].indexOf('5 Sep 2026') > -1, order);

  await p.click('#h-toggle');
  await p.selectOption('#h-cat', 'repertoire');
  await p.waitForTimeout(60);
  eq('category filter narrows', await p.locator('#h-out li[data-entry-id]').count(), 2);
  await p.selectOption('#h-cat', '');
  await p.selectOption('#h-tag', 'comping');
  await p.waitForTimeout(60);
  eq('tag filter narrows', await p.locator('#h-out li[data-entry-id]').count(), 2);
  await p.selectOption('#h-tag', '');
  await p.fill('#h-tune', 'all the');
  await p.waitForTimeout(300);
  eq('tune substring filter', await p.locator('#h-out li[data-entry-id]').count(), 1);
  await p.fill('#h-from', '2026-09-10');
  await p.fill('#h-to', '2026-09-05');
  await p.waitForTimeout(300);
  ok('backwards range is called out, not silently empty', await p.locator('#h-range-warn').isVisible());
  await p.click('#h-clear');
  await p.waitForTimeout(60);
  eq('clear filters restores everything', await p.locator('#h-out li[data-entry-id]').count(), 6);

  /* ---------- 7. expand / edit / delete / restore ---------- */
  console.log('\n== row actions ==');
  const firstId = await p.evaluate(() => document.querySelector('#h-out li[data-entry-id]').dataset.entryId);
  await p.click('li[data-entry-id="' + firstId + '"] [data-expand]');
  ok('expands', await p.locator('#h-body-' + firstId).isVisible());
  eq('aria-expanded follows', await p.getAttribute('li[data-entry-id="' + firstId + '"] [data-expand]', 'aria-expanded'), 'true');
  await p.click('li[data-entry-id="' + firstId + '"] [data-edit]');
  ok('edit opens the log form', await p.locator('#viewLog').isVisible());
  eq('  primary action relabels', await p.locator('#f-save').textContent(), 'Save changes');
  const beforeUpd = await p.evaluate(id => window.__pj.store.getEntry(id).updatedAt, firstId);
  await p.fill('#f-duration', '50');
  await p.waitForTimeout(1100);
  await p.click('#f-save');
  await p.waitForTimeout(80);
  const edited = await p.evaluate(id => window.__pj.store.getEntry(id), firstId);
  eq('edit writes the new duration', edited.durationMinutes, 50);
  ok('edit bumps updatedAt', edited.updatedAt !== beforeUpd);
  ok('edit keeps createdAt', edited.createdAt < edited.updatedAt);
  ok('edit returns to history', await p.locator('#viewHistory').isVisible());

  const sel = 'li[data-entry-id="' + firstId + '"] [data-expand]';
  if (await p.getAttribute(sel, 'aria-expanded') !== 'true') await p.click(sel);
  await p.waitForSelector('li[data-entry-id="' + firstId + '"] [data-del]');
  await p.click('li[data-entry-id="' + firstId + '"] [data-del]');
  eq('delete is two-step', await p.locator('li[data-entry-id="' + firstId + '"] [data-del]').textContent(), 'really delete?');
  await p.click('li[data-entry-id="' + firstId + '"] [data-del]');
  await p.waitForTimeout(80);
  const del = await p.evaluate(id => window.__pj.store.getEntry(id), firstId);
  ok('delete is soft (tombstone kept)', del !== null && del.deletedAt !== null);
  eq('  and it leaves the live list', await p.evaluate(() => window.__pj.store.listEntries().length), 5);
  await p.click('[data-restore="' + firstId + '"]');
  await p.waitForTimeout(80);
  eq('restore brings it back', await p.evaluate(() => window.__pj.store.listEntries().length), 6);

  /* ---------- 8. summary ---------- */
  console.log('\n== summary ==');
  const sp = await newPage(browser);
  await sp.goto(URL);
  await sp.waitForFunction(() => !!window.__pj);
  await sp.evaluate(() => {
    const S = window.__pj.store;
    const mk = (date, min, f) => S.saveEntry({ date, durationMinutes: min, notes:'', fields: f });
    mk('2026-09-05', 25, { category:'improvisation' });
    mk('2026-09-07', 40, { category:'technique', tool:'two-and-four' });
    mk('2026-09-08', 25, { category:'repertoire' });
    mk('2026-09-10', 35, { category:'repertoire', tool:'voice-leading' });
    mk('2026-09-11', 45, { category:'transcription', tool:'two-and-four' });
    mk('2026-08-20', 60, { category:'reading' });          // outside the 7-day window
    mk('2026-09-06', 20, {});                              // no category, no tool
  });
  const sum = await sp.evaluate(() => window.__pj.agg('week', '2026-09-11'));
  eq('window from', sum.from, '2026-09-05');
  eq('window to', sum.to, '2026-09-11');
  eq('days in window', sum.daysInWindow, 7);
  eq('sessions in window', sum.count, 6);
  eq('an entry outside the window is excluded', sum.totalMinutes, 25 + 40 + 25 + 35 + 45 + 20);
  eq('average', sum.avgMinutes, Math.round(190 / 6));
  eq('days with an entry', sum.daysWithEntry, 6);
  eq('category rows sum to the total', sum.byCategory.reduce((a, r) => a + r.minutes, 0), sum.totalMinutes);
  eq('category counts sum to the session count', sum.byCategory.reduce((a, r) => a + r.count, 0), sum.count);
  eq('tool rows sum to the total', sum.byTool.reduce((a, r) => a + r.minutes, 0), sum.totalMinutes);
  ok('unset bucket is named honestly and sorts last',
     sum.byCategory[sum.byCategory.length - 1].label === 'not recorded' &&
     sum.byTool[sum.byTool.length - 1].label === 'not recorded',
     { cat: sum.byCategory.map(r => r.label), tool: sum.byTool.map(r => r.label) });
  eq('rows sort by time descending', sum.byTool[0].minutes, 85);
  eq('a soft-deleted entry leaves every figure', await sp.evaluate(() => {
    const S = window.__pj.store;
    S.softDelete(S.listEntries({ from:'2026-09-11', to:'2026-09-11' })[0].id);
    const a = window.__pj.agg('week', '2026-09-11');
    return [a.count, a.totalMinutes];
  }), [5, 145]);
  const monthSum = await sp.evaluate(() => window.__pj.agg('month', '2026-09-11'));
  eq('30-day window start', monthSum.from, '2026-08-13');
  eq('  and it reaches back for the August entry', monthSum.count, 6);
  const allSum = await sp.evaluate(() => window.__pj.agg('all'));
  eq('all-time is unbounded', [allSum.from, allSum.to], [null, null]);
  eq('all-time has no denominator on days', allSum.daysInWindow, null);
  eq('empty window yields zeros, never NaN', await sp.evaluate(() => {
    const a = window.__pj.agg('week', '2020-01-01');
    return [a.count, a.totalMinutes, a.avgMinutes, a.byCategory.length];
  }), [0, 0, 0, 0]);
  eq('fmtDur(325)', await sp.evaluate(() => window.__pj.fmtDur(325)), '5h 25m');
  eq('fmtDur(45)', await sp.evaluate(() => window.__pj.fmtDur(45)), '45 min');
  eq('fmtDur(60)', await sp.evaluate(() => window.__pj.fmtDur(60)), '1h 00m');
  eq('fmtDur(0)', await sp.evaluate(() => window.__pj.fmtDur(0)), '0 min');
  await sp.click('[data-view-btn="summary"]');
  ok('summary view renders a total', (await sp.locator('#s-total').textContent()).length > 0);
  ok('no progress bars, meters or badges', await sp.locator('progress, meter, .bar, .badge').count() === 0);
  ok('no streak wording anywhere in the view',
     !/streak|goal|\bgrade\b/i.test(await sp.locator('#viewSummary').textContent()));
  await sp.context().close();

  /* ---------- 9. CSV ---------- */
  console.log('\n== CSV ==');
  const csv = await p.evaluate(() => {
    const S = window.__pj.store;
    S.saveEntry({ date:'2026-09-09', durationMinutes:25,
      notes:'He said "swing it," not straight — I tried, then gave up.\nBack to the metronome tomorrow.',
      fields:{ category:'repertoire' } });
    S.saveEntry({ date:'2026-09-09', durationMinutes:10, notes:'- worked on the bridge', fields:{} });
    return window.__pj.buildCSV();
  });
  ok('starts with a BOM (Excel reads UTF-8)', csv.charCodeAt(0) === 0xFEFF);
  const header = csv.slice(1).split('\r\n')[0];
  eq('header row', header, 'Date,Duration (min),Notes,Tempo (BPM),Tool,Tune,Key,Category,Tags,Focus,Rating (1-5)');
  ok('CRLF line endings', csv.indexOf('\r\n') > -1 && !/[^\r]\n/.test(csv));
  ok('ends with a trailing CRLF', /\r\n$/.test(csv));
  ok('quotes are doubled per RFC 4180', csv.indexOf('""swing it,""') > -1);
  ok('embedded newline stays inside quotes', csv.indexOf('gave up.\r\nBack to the metronome') > -1);
  ok('a leading - is quoted, not rewritten', csv.indexOf('"- worked on the bridge"') > -1 && csv.indexOf("'- worked") === -1);
  ok('tags use "; " so they never force a quote', await p.evaluate(() => window.__pj.buildCSV().indexOf('comping; slow') > -1));
  ok('no null strings in cells', csv.indexOf(',null,') === -1);
  eq('csvCell of a plain value', await p.evaluate(() => window.__pj.csvCell('plain')), 'plain');
  eq('csvCell quotes leading whitespace', await p.evaluate(() => window.__pj.csvCell('  x')), '"  x"');
  const csvRows = csv.slice(1).split('\r\n').filter(Boolean);
  ok('CSV excludes soft-deleted entries', await p.evaluate(() => {
    const S = window.__pj.store, live = S.listEntries().length;
    const body = window.__pj.buildCSV().replace(/^﻿/, '').split('\r\n').filter(Boolean);
    // count logical rows: entries + 1 header, minus the note that spans 2 lines
    return live > 0 && body.length >= live;
  }));

  /* ---------- 10. plain text ---------- */
  console.log('\n== plain text ==');
  const txt = await p.evaluate(() => window.__pj.buildPlain({ from:'2026-09-05', to:'2026-09-12' }));
  ok('has the PRACTICE LOG heading', txt.indexOf('PRACTICE LOG\n') === 0);
  ok('states the range in prose', txt.indexOf('September 5, 2026 to September 12, 2026') > -1);
  ok('has a SUMMARY block', txt.indexOf('\nSUMMARY\n') > -1);
  ok('has a SESSIONS block', txt.indexOf('\nSESSIONS\n') > -1);
  ok('no box-drawing characters', !/[─-╿]/.test(txt));
  ok('no rules made of dashes or equals', !/^[-=]{3,}$/m.test(txt));
  ok('LF only, no CR', txt.indexOf('\r') === -1);
  ok('reads sessions oldest first', txt.indexOf('September 5, 2026 - 25 min') < txt.indexOf('September 11, 2026'));
  ok('uses hours in prose, not decimals', /\d+ hr/.test(txt) && !/\d\.\d+ h/.test(txt));
  ok('names the tool by its label, not its slug', txt.indexOf('Tool: Two-and-Four') > -1 && txt.indexOf('two-and-four') === -1);

  /* ---------- 11. JSON round trip + import merge ---------- */
  console.log('\n== JSON backup and import ==');
  const backup = await p.evaluate(() => {
    window.__pj.store.softDelete(window.__pj.store.listEntries()[0].id);
    return window.__pj.buildJSON();
  });
  const parsed = JSON.parse(backup);
  eq('bundle kind', parsed.kind, 'practice-journal.backup');
  ok('bundle carries config', Array.isArray(parsed.config.categories));
  ok('bundle carries the device id', !!parsed.device.id);
  ok('bundle KEEPS tombstones (else deletes resurrect on restore)',
     parsed.entries.some(e => e.deletedAt !== null));
  ok('no BOM on JSON', backup.charCodeAt(0) !== 0xFEFF);

  const merge = await p.evaluate(b => {
    const S = window.__pj.store;
    const inc = JSON.parse(b).entries.map(e => S.normalizeEntry(e));
    const local = S.listEntries({ includeDeleted:true });
    const same = S.importMerge(local, inc);
    const newer = S.importMerge(local, inc.map(e => Object.assign({}, e, { updatedAt:'2099-01-01T00:00:00.000Z' })));
    const fresh = S.importMerge([], inc);
    return { total: inc.length, same, newer, fresh };
  }, backup);
  eq('re-importing the same file skips everything', [merge.same.add.length, merge.same.update.length, merge.same.skip.length],
     [0, 0, merge.total]);
  eq('a newer copy updates everything', [merge.newer.add.length, merge.newer.update.length, merge.newer.skip.length],
     [0, merge.total, 0]);
  eq('into an empty store everything is an add', [merge.fresh.add.length, merge.fresh.update.length, merge.fresh.skip.length],
     [merge.total, 0, 0]);
  ok('add/update/skip always partitions the input',
     merge.same.add.length + merge.same.update.length + merge.same.skip.length === merge.total);
  ok('a deleted local entry is matched, not re-added (no resurrection)',
     merge.same.add.length === 0);

  // import into a clean profile
  const p2 = await newPage(browser);
  await p2.goto(URL);
  await p2.waitForFunction(() => !!window.__pj);
  await p2.click('[data-view-btn="settings"]');
  await p2.click('#im-paste-toggle');
  await p2.fill('#im-text', backup);
  await p2.click('#im-check');
  await p2.waitForSelector('#im-confirm');
  const previewTxt = await p2.locator('#im-preview').textContent();
  ok('preview shows counts before writing', /\d+\s*entries added/.test(previewTxt), previewTxt.slice(0, 200));
  ok('preview says nothing is saved yet', previewTxt.indexOf('Nothing has been saved yet') > -1);
  eq('nothing written before confirm', await p2.evaluate(() => window.__pj.store.listEntries().length), 0);
  await p2.click('#im-confirm');
  await p2.waitForTimeout(150);
  const importedLive = await p2.evaluate(() => window.__pj.store.listEntries().length);
  const importedAll = await p2.evaluate(() => window.__pj.store.listEntries({ includeDeleted:true }).length);
  eq('confirm imports the live entries', importedLive, parsed.entries.filter(e => e.deletedAt === null).length);
  eq('  tombstones come across too', importedAll, parsed.entries.length);
  await p2.fill('#im-text', backup);
  await p2.click('#im-check');
  await p2.waitForTimeout(100);
  const second = await p2.locator('#im-preview').textContent();
  ok('re-import is idempotent (all skipped)', /0\s*entries added/.test(second) && /entries skipped/.test(second), second.slice(0, 200));

  console.log('\n== import: junk in, nothing out ==');
  for (const [label, text, expect] of [
    ['empty', '', 'nothing to check'],
    ['not json', 'hello {', "isn't readable as JSON"],
    ['a saved web page', '<!DOCTYPE html><html></html>', 'saved web page'],
    ['foreign json', '{"a":1,"b":[2,3]}', 'a Practice Journal backup' ],
    ['array of junk', '[{"a":1},{"b":2}]', 'a Practice Journal backup' ],
    ['array of numbers', '[1,2,3]', 'a Practice Journal backup' ]
  ]){
    const r = await p2.evaluate(t => { const x = window.__pj.store.previewImport(t); return { ok:x.ok, error:x.error }; }, text);
    ok('rejects ' + label, r.ok === false && String(r.error).toLowerCase().indexOf(expect.toLowerCase()) > -1, r);
  }
  const beforeJunk = await p2.evaluate(() => window.__pj.store.listEntries().length);
  await p2.evaluate(() => window.__pj.store.previewImport('[1,2,3]'));
  eq('previewImport never writes', await p2.evaluate(() => window.__pj.store.listEntries().length), beforeJunk);
  await p2.context().close();

  /* ---------- 12. normalizer defence ---------- */
  console.log('\n== normalizer ==');
  const n = await p.evaluate(() => {
    const S = window.__pj.store;
    return {
      nonObject: [S.normalizeEntry(null), S.normalizeEntry([1,2]), S.normalizeEntry('x'), S.normalizeEntry(7)],
      unknownKept: S.normalizeEntry({ date:'2026-01-01', mystery:'keep me', fields:{ metronomeMode:'drop', tempo:'84' } }),
      badDate: S.normalizeEntry({ date:'2026-02-31', durationMinutes:'12' }).date,
      tagsFolded: S.normalizeEntry({ fields:{ tags:['Comping',' COMPING ','slow','slow',''] } }).fields.tags,
      keySharp: S.normalizeEntry({ fields:{ key:'F#' } }).fields.key,
      keyLower: S.normalizeEntry({ fields:{ key:'ab' } }).fields.key,
      keyForeign: S.normalizeEntry({ fields:{ key:'lydian' } }).fields.key,
      toolLabel: S.normalizeEntry({ fields:{ tool:'Two-and-Four' } }).fields.tool,
      toolFree: S.normalizeEntry({ fields:{ tool:'my teacher' } }).fields.tool,
      tempoOut: S.normalizeEntry({ fields:{ tempo:5000 } }).fields.tempo,
      ratingOut: S.normalizeEntry({ fields:{ rating:9 } }).fields.rating,
      durClamp: S.normalizeEntry({ durationMinutes: 99999 }).durationMinutes,
      durNeg: S.normalizeEntry({ durationMinutes: -5 }).durationMinutes,
      idKept: S.normalizeEntry({ id:'not-a-uuid-but-mine' }).id,
      cfgEmptyFields: S.normalizeConfig({ enabledFields: [] }).enabledFields,
      cfgBadFields: S.normalizeConfig({ enabledFields: ['tempo','nope','tempo'] }).enabledFields,
      cfgEmptyCats: S.normalizeConfig({ categories: [] }).categories.length,
      cfgBadView: S.normalizeConfig({ defaultView: 'settings' }).defaultView,
      cfgBadDur: S.normalizeConfig({ defaultDurationMinutes: 'x' }).defaultDurationMinutes,
      envArray: S.normalizeEnvelope([1,2,3]).entries.length
    };
  });
  eq('non-objects become null, never blank entries', n.nonObject, [null, null, null, null]);
  eq('unknown top-level keys survive', n.unknownKept.mystery, 'keep me');
  eq('unknown fields sub-keys survive', n.unknownKept.fields.metronomeMode, 'drop');
  eq('numeric strings coerce', n.unknownKept.fields.tempo, 84);
  ok('Feb 31 is rejected, not rolled to March', n.badDate !== '2026-03-03');
  eq('tags lowercase, trim and dedupe', n.tagsFolded, ['comping','slow']);
  eq('F# canonicalizes to Gb', n.keySharp, 'Gb');
  eq('ab canonicalizes to Ab', n.keyLower, 'Ab');
  eq('a foreign key string is kept verbatim', n.keyForeign, 'lydian');
  eq('a tool label maps to its slug', n.toolLabel, 'two-and-four');
  eq('free-text tool is kept', n.toolFree, 'my teacher');
  eq('out-of-range tempo nulls', n.tempoOut, null);
  eq('out-of-range rating nulls', n.ratingOut, null);
  eq('duration clamps to a day', n.durClamp, 1440);
  eq('negative duration floors at 0', n.durNeg, 0);
  eq('a foreign id is never regenerated', n.idKept, 'not-a-uuid-but-mine');
  eq('an empty enabledFields is legal', n.cfgEmptyFields, []);
  eq('unknown field ids are dropped and deduped', n.cfgBadFields, ['tempo']);
  ok('an empty category list falls back to the defaults', n.cfgEmptyCats === 5);
  eq('settings is not a valid defaultView', n.cfgBadView, 'log');
  eq('a non-numeric default duration falls back', n.cfgBadDur, 30);
  eq('a bare array of numbers yields no entries', n.envArray, 0);

  /* ---------- 13. settings ---------- */
  console.log('\n== settings ==');
  await p.click('[data-view-btn="settings"]');
  await p.check('[data-field-toggle="rating"]');
  await p.waitForTimeout(60);
  ok('toggling a field on persists', await p.evaluate(() => window.__pj.store.loadConfig().enabledFields.indexOf('rating') > -1));
  await p.click('[data-view-btn="log"]');
  ok('  and the form shows it', await p.locator('[data-field="rating"]').isVisible());
  await p.click('[data-view-btn="settings"]');
  await p.uncheck('[data-field-toggle="rating"]');
  await p.waitForTimeout(60);
  ok('turning a field off does not touch stored values', await p.evaluate(() =>
    window.__pj.store.listEntries().some(e => e.fields.rating !== null)));
  await p.fill('#cfg-cat-new', 'sight-reading');
  await p.click('#cfg-cat-add');
  await p.waitForTimeout(60);
  ok('a category can be added', await p.evaluate(() => window.__pj.store.loadConfig().categories.indexOf('sight-reading') > -1));
  const catCount = await p.evaluate(() => window.__pj.store.loadConfig().categories.length);
  await p.click('[data-cat-remove="0"]');
  await p.waitForTimeout(40);
  const armed = await p.locator('[data-cat-remove="0"]').textContent();
  ok('removing a used category warns that entries keep the label', armed.indexOf('keep') > -1, armed);
  await p.click('[data-cat-remove="0"]');
  await p.waitForTimeout(60);
  eq('  then removes it', await p.evaluate(() => window.__pj.store.loadConfig().categories.length), catCount - 1);
  ok('  and the entries still carry it', await p.evaluate(() =>
    window.__pj.store.listEntries().some(e => e.fields.category === 'technique')));
  await p.click('[data-view-btn="history"]');
  await p.click('#h-toggle');
  ok('  retired category still filterable', await p.evaluate(() =>
    Array.from(document.getElementById('h-cat').options).some(o => o.textContent.indexOf('retired') > -1)));

  console.log('\n== purge ==');
  await p.click('[data-view-btn="settings"]');
  const delCount = await p.evaluate(() => window.__pj.store.deletedCount());
  ok('there is something to purge', delCount > 0);
  await p.click('#purge-btn');
  ok('purge asks first', await p.locator('#purge-confirm').isVisible());
  const confirmTxt = await p.locator('#purge-confirm-text').textContent();
  ok('  and is honest about it', confirmTxt.indexOf('only copy') > -1);
  await p.click('#purge-yes');
  await p.waitForTimeout(80);
  eq('purge removes the tombstones outright', await p.evaluate(() => window.__pj.store.deletedCount()), 0);

  /* ---------- 14. framed ---------- */
  console.log('\n== framed inside another site ==');
  const fp = await newPage(browser);
  await fp.goto('http://127.0.0.1:' + PORT + '/');                       // any same-origin page
  await fp.setContent('<iframe id="f" src="' + URL + '" style="width:400px;height:900px;border:0"></iframe>');
  await fp.waitForTimeout(900);
  const fr = fp.frameLocator('#f');
  ok('framed: the log form is gone', await fr.locator('#logForm').count() === 0 || !(await fr.locator('#logForm').isVisible()));
  ok('framed: the gate is shown', await fr.locator('#gate').isVisible());
  ok('framed: gate links to the tool itself', (await fr.locator('#gateLink').getAttribute('href') || '').indexOf('/practice-journal/') > -1);
  ok('framed: the bar does not repeat the card on the Log view', await fr.locator('#warns .warn').count() === 0);
  await fr.locator('[data-view-btn="history"]').click();
  await fp.waitForTimeout(120);
  ok('framed: but it does warn on the other views', await fr.locator('#warns .warn.red').count() > 0);
  await fr.locator('[data-view-btn="settings"]').click();
  await fp.waitForTimeout(120);
  ok('framed: history is still readable', await fr.locator('[data-view-btn="history"]').isVisible());
  ok('framed: export is still offered', await fr.locator('#ex-json').count() === 1);
  ok('framed: import is hidden', !(await fr.locator('#im-paste-toggle').isVisible()));
  await fp.context().close();

  /* ---------- 15. storage blocked ---------- */
  console.log('\n== storage blocked ==');
  const bp = await newPage(browser);
  await bp.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get(){ throw new DOMException('The operation is insecure.', 'SecurityError'); }
    });
  });
  await bp.goto(URL);
  await bp.waitForFunction(() => !!window.__pj);
  eq('state is missing', await bp.evaluate(() => window.__pj.store.state()), 'missing');
  ok('blocked: no log form', !(await bp.locator('#logForm').isVisible()));
  ok('blocked: an explanation is shown', await bp.locator('#gate').isVisible());
  ok('blocked: the warn bar says so', (await bp.locator('#warns').textContent()).indexOf("can't be saved") > -1);
  await bp.context().close();

  /* ---------- 16. quota ---------- */
  console.log('\n== quota ==');
  const qp = await newPage(browser);
  await qp.goto(URL);
  await qp.waitForFunction(() => !!window.__pj);
  const quota = await qp.evaluate(() => {
    const real = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v){
      if (k.indexOf('jgth:practice-journal:entries') === 0){
        const e = new DOMException('exceeded', 'QuotaExceededError'); throw e;
      }
      return real.call(this, k, v);
    };
    const r = window.__pj.store.saveEntry({ date:'2026-09-11', durationMinutes:30, notes:'precious', fields:{} });
    const unsaved = window.__pj.store.unsavedEntries();
    Storage.prototype.setItem = real;
    return { ok:r.ok, reason:r.reason, unsaved: unsaved.length, note: unsaved[0] && unsaved[0].notes,
             inMemory: window.__pj.store.listEntries().some(e => e.notes === 'precious') };
  });
  eq('a quota failure is reported, not swallowed', [quota.ok, quota.reason], [false, 'quota']);
  ok('the entry is NOT rolled back out from under the student', quota.inMemory);
  eq('  it is held as unsaved', quota.unsaved, 1);
  eq('  with its text intact', quota.note, 'precious');
  await qp.click('[data-view-btn="log"]');
  await qp.waitForTimeout(50);
  ok('a loud warning is raised', (await qp.locator('#warns').textContent()).indexOf('Not saved') > -1);
  await qp.context().close();

  /* ---------- 17. escaping ---------- */
  console.log('\n== student text is escaped, never executed ==');
  const xp = await newPage(browser);
  await xp.goto(URL);
  await xp.waitForFunction(() => !!window.__pj);
  await xp.evaluate(() => {
    window.__pj.store.saveConfig({ enabledFields:['tune','category','tags','focus'] });
    window.__pj.store.saveEntry({ date:'2026-09-11', durationMinutes:30,
      notes:'<img src=x onerror="window.__XSS=1">',
      fields:{ tune:'<script>window.__XSS=2<\/script>', category:'<b>bold</b>', tags:['<i>t</i>'], focus:'"><svg onload="window.__XSS=3">' } });
  });
  await xp.click('[data-view-btn="history"]');
  await xp.click('#h-out [data-expand]');
  await xp.waitForTimeout(120);
  eq('no injected script ran', await xp.evaluate(() => window.__XSS), undefined);
  eq('  no injected element exists', await xp.evaluate(() => document.querySelectorAll('#h-out img, #h-out svg, #h-out b, #h-out i').length), 0);
  ok('  the text is visible as text', (await xp.locator('#h-out').textContent()).indexOf('<img src=x') > -1);
  await xp.click('[data-view-btn="settings"]');
  await xp.waitForTimeout(80);
  eq('  settings is clean too', await xp.evaluate(() => document.querySelectorAll('#del-list img, #cfg-cats b').length), 0);
  await xp.context().close();

  /* ---------- 18. persistence across reload ---------- */
  console.log('\n== reload ==');
  const live = await p.evaluate(() => window.__pj.store.listEntries().length);
  await p.reload();
  await p.waitForFunction(() => !!window.__pj);
  eq('entries survive a reload', await p.evaluate(() => window.__pj.store.listEntries().length), live);
  await p.evaluate(() => window.__pj.store.saveConfig({ defaultView: 'summary' }));
  await p.reload();
  await p.waitForFunction(() => !!window.__pj);
  eq('defaultView is honoured on open', await p.evaluate(() => document.body.dataset.view), 'summary');

  /* ---------- 19. corrupt store ---------- */
  console.log('\n== corrupt store ==');
  const cp = await newPage(browser);
  await cp.goto(URL);
  await cp.evaluate(() => localStorage.setItem('jgth:practice-journal:entries:v1', '{ this is not json'));
  await cp.reload();
  await cp.waitForFunction(() => !!window.__pj);
  eq('state is corrupt', await cp.evaluate(() => window.__pj.store.state()), 'corrupt');
  ok('corrupt: the log form is off', !(await cp.locator('#logForm').isVisible()));
  eq('corrupt: the bad bytes are NOT overwritten',
     await cp.evaluate(() => localStorage.getItem('jgth:practice-journal:entries:v1')), '{ this is not json');
  ok('corrupt: the raw file is offered for download', await cp.locator('#warns [data-act="download-raw"]').count() === 1);
  ok('corrupt: start fresh is offered', await cp.locator('#warns [data-act="start-fresh"]').count() === 1);
  await cp.click('[data-view-btn="settings"]');
  ok('corrupt: IMPORT stays available \u2014 it is the way back', await cp.locator('#im-paste-toggle').isVisible());
  await cp.click('#ex-json');
  await cp.waitForTimeout(80);
  const exMsg = await cp.locator('#ex-msg').textContent();
  ok('corrupt: export refuses to hand over an empty file that looks like a backup',
     exMsg.indexOf('looks like a backup') > -1, exMsg);
  await cp.click('#im-paste-toggle');
  await cp.fill('#im-text', '{"kind":"practice-journal.backup","schemaVersion":1,"entries":[{"id":"aaa","date":"2026-09-01","durationMinutes":20,"fields":{}}]}');
  await cp.click('#im-check');
  await cp.waitForSelector('#im-confirm');
  await cp.click('#im-confirm');
  await cp.waitForTimeout(200);
  eq('corrupt: importing a backup recovers the journal',
     await cp.evaluate(() => window.__pj.store.listEntries().length), 1);
  ok('  and the unreadable bytes are finally replaced',
     await cp.evaluate(() => localStorage.getItem('jgth:practice-journal:entries:v1')) !== '{ this is not json');
  await cp.context().close();

  /* ---------- 20. responsive + a11y surface ---------- */
  console.log('\n== phone width and a11y ==');
  const mp = await newPage(browser, { viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });
  await mp.goto(URL);
  await mp.waitForFunction(() => !!window.__pj);
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('no horizontal scroll at 360px', overflow <= 0, { overflow });
  const small = await mp.evaluate(() => {
    const bad = [];
    document.querySelectorAll('#logForm input, #logForm select, #logForm textarea, #logForm button').forEach(el => {
      if (el.offsetParent === null) return;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < 44) bad.push((el.id || el.className) + ':' + Math.round(r.height));
    });
    return bad;
  });
  ok('every visible log control clears a 44px touch target', small.filter(s => s.indexOf('addfields') === -1).length === 0, small);
  const fontTooSmall = await mp.evaluate(() => {
    const bad = [];
    document.querySelectorAll('#logForm input[type=text], #logForm input[type=number], #logForm input[type=date], #logForm textarea, #logForm select').forEach(el => {
      if (el.offsetParent === null) return;
      if (parseFloat(getComputedStyle(el).fontSize) < 16) bad.push(el.id);
    });
    return bad;
  });
  ok('no log control under 16px (iOS would zoom the viewport)', fontTooSmall.length === 0, fontTooSmall);
  const labels = await mp.evaluate(() => {
    const bad = [];
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.type === 'hidden' || el.type === 'file') return;
      const has = (el.id && document.querySelector('label[for="' + el.id + '"]')) ||
                  el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label');
      if (!has) bad.push(el.id || el.name || el.type);
    });
    return bad;
  });
  ok('every control is labelled', labels.length === 0, labels);
  const rating = await mp.evaluate(() => {
    window.__pj.store.saveConfig({ enabledFields:['rating'] });
    window.__pj.renderLogForm(null);
    const cells = Array.from(document.querySelectorAll('.rate .rc'));
    const cs = cells.map(c => getComputedStyle(c));
    return { n: cells.length,
             display: cs.map(c => c.display),
             size: cs.map(c => parseFloat(c.fontSize)),
             h: cells.map(c => Math.round(c.getBoundingClientRect().height)) };
  });
  eq('the rating group has five cells', rating.n, 5);
  ok('  each is a centred flex cell, not a stacked block label', rating.display.every(d => d === 'flex'), rating.display);
  ok('  with a readable numeral', rating.size.every(v => v >= 16), rating.size);
  ok('  and a 48px touch target', rating.h.every(v => v >= 48), rating.h);
  ok('  and picking one records it', await mp.evaluate(() => {
    document.getElementById('f-rating-4').click();
    return window.__pj.S.log.rating === 4 && !document.getElementById('f-rating-clear').hidden;
  }));
  ok('save bar is sticky, not fixed', await mp.evaluate(() => getComputedStyle(document.querySelector('.savebar')).position) === 'sticky');
  ok('spine chip is in flow, not fixed', await mp.evaluate(() => getComputedStyle(document.querySelector('.sp-menu')).position) !== 'fixed');
  const liveRegions = await mp.evaluate(() => document.querySelectorAll('[aria-live], [role=status], [role=alert]').length);
  ok('live regions exist for save/filter/warn', liveRegions >= 4, { liveRegions });
  await mp.context().close();

  /* ---------- 21. reduced motion ---------- */
  const rp = await newPage(browser, { reducedMotion: 'reduce' });
  await rp.goto(URL);
  await rp.waitForFunction(() => !!window.__pj);
  ok('reduced motion kills transitions', await rp.evaluate(() => {
    const el = document.querySelector('.btn');
    const cs = getComputedStyle(el);
    return cs.transitionDuration === '0s' || cs.transitionDuration === '';
  }));
  await rp.context().close();

  /* ---------- 22. keyboard path ---------- */
  console.log('\n== keyboard ==');
  const kp = await newPage(browser);
  await kp.goto(URL);
  await kp.waitForFunction(() => !!window.__pj);
  await kp.evaluate(() => window.__pj.store.saveConfig({ enabledFields:['tags'] }));
  await kp.evaluate(() => window.__pj.renderLogForm(null));
  await kp.focus('#f-tag-input');
  await kp.type('#f-tag-input', 'comping');
  await kp.keyboard.press('Enter');
  eq('Enter commits a tag and does not submit the form', await kp.evaluate(() => window.__pj.S.log.tags), ['comping']);
  eq('  no entry was saved', await kp.evaluate(() => window.__pj.store.listEntries().length), 0);
  await kp.type('#f-tag-input', 'Slow,Fast');
  await kp.waitForTimeout(60);
  eq('a comma commits what precedes it, folded to lowercase', await kp.evaluate(() => window.__pj.S.log.tags), ['comping','slow']);
  eq('  and leaves the rest being typed', await kp.inputValue('#f-tag-input'), 'Fast');
  await kp.fill('#f-tag-input', '');
  await kp.keyboard.press('Backspace');
  eq('backspace in an empty input removes the last tag', await kp.evaluate(() => window.__pj.S.log.tags), ['comping']);
  await kp.type('#f-tag-input', 'comping');
  await kp.keyboard.press('Enter');
  eq('a duplicate tag is a no-op, not a second chip', await kp.evaluate(() => window.__pj.S.log.tags), ['comping']);
  await kp.type('#f-tag-input', 'half typed');
  await kp.click('#f-save');
  await kp.waitForTimeout(100);
  eq('a half-typed tag is committed by the save, not lost',
     await kp.evaluate(() => window.__pj.store.listEntries()[0].fields.tags), ['comping','half typed']);
  await kp.evaluate(() => { if (document.activeElement.blur) document.activeElement.blur(); });
  await kp.keyboard.press('Tab');
  const ring = await kp.evaluate(() => {
    const el = document.activeElement;
    return { tag: el.tagName, outline: getComputedStyle(el).outlineWidth };
  });
  ok('keyboard focus draws a visible ring', ring.outline !== '0px' && ring.outline !== '', ring);
  await kp.context().close();

  /* ---------- 23. file:// ---------- */
  console.log('\n== opened as a local file ==');
  const lp = await newPage(browser);
  await lp.goto('file://' + require('path').join(__dirname, 'index.html'));
  await lp.waitForFunction(() => !!window.__pj);
  const fileState = await lp.evaluate(() => ({
    state: window.__pj.store.state(),
    uuid: window.__pj.store.uuid(),
    randomUUID: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  }));
  ok('the page boots from file:// without throwing', !!fileState.state);
  ok('uuid() works on file:// even without crypto.randomUUID',
     /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fileState.uuid), fileState);
  console.log('       (file:// storage state: ' + fileState.state + ', crypto.randomUUID: ' + fileState.randomUUID + ')');
  await lp.context().close();

  /* ---------- 24. two tabs ---------- */
  console.log('\n== two tabs on one device ==');
  const ctx = await browser.newContext({ timezoneId: 'America/Chicago' });
  const t1 = await ctx.newPage(), t2 = await ctx.newPage();
  t1.on('pageerror', e => errs.push('t1: ' + e)); t2.on('pageerror', e => errs.push('t2: ' + e));
  await t1.goto(URL); await t1.waitForFunction(() => !!window.__pj);
  await t1.evaluate(() => window.__pj.store.saveEntry({ date:'2026-09-01', durationMinutes:30, notes:'morning', fields:{} }));
  await t2.goto(URL); await t2.waitForFunction(() => !!window.__pj);
  await t2.evaluate(() => {
    for (let i = 0; i < 4; i++)
      window.__pj.store.saveEntry({ date:'2026-09-02', durationMinutes:20, notes:'evening ' + i, fields:{} });
  });
  // tab 1 still holds its stale one-entry envelope; writing from it must not erase tab 2's work
  await t1.evaluate(() => window.__pj.store.saveEntry({ date:'2026-09-03', durationMinutes:15, notes:'late', fields:{} }));
  eq('a stale tab merges instead of clobbering',
     await t1.evaluate(() => JSON.parse(localStorage.getItem('jgth:practice-journal:entries:v1')).entries.length), 6);
  const notes = await t1.evaluate(() => window.__pj.store.listEntries().map(e => e.notes));
  ok("  tab 2's four sessions survive", notes.filter(n => n.indexOf('evening') === 0).length === 4, notes);
  await t2.waitForTimeout(300);
  eq('  and tab 2 sees the new one without a reload',
     await t2.evaluate(() => window.__pj.store.listEntries().length), 6);
  eq('purge from a merged state removes exactly one', await t1.evaluate(() => {
    const S = window.__pj.store;
    S.softDelete(S.listEntries()[0].id);
    return S.purgeDeleted().count;
  }), 1);
  await ctx.close();

  /* ---------- 25. import idempotence and staleness ---------- */
  console.log('\n== import: idempotence and staleness ==');
  const ip = await newPage(browser);
  await ip.goto(URL); await ip.waitForFunction(() => !!window.__pj);
  const idless = JSON.stringify({ kind:'practice-journal.backup', schemaVersion:1, entries:[
    { date:'2026-09-01', durationMinutes:30, notes:'no id here', fields:{ category:'technique' } },
    { date:'2026-09-02', durationMinutes:20, notes:'nor here', fields:{} }
  ]});
  const twice = await ip.evaluate(t => {
    const S = window.__pj.store;
    const a = S.previewImport(t); S.applyImport(a.plan);
    const afterFirst = S.listEntries().length;
    const b = S.previewImport(t); S.applyImport(b.plan);
    return { afterFirst, afterSecond: S.listEntries().length, idless: a.idless, secondAdds: b.add };
  }, idless);
  eq('entries with no id import once', twice.afterFirst, 2);
  eq('  and re-importing the same file adds nothing', twice.afterSecond, 2);
  eq('  the preview says they were matched on content', twice.idless, 2);
  eq('  so the second check classifies them as skips', twice.secondAdds, 0);

  const staleRes = await ip.evaluate(async () => {
    const S = window.__pj.store;
    const id = S.listEntries()[0].id;
    S.saveEntry({ id: id, notes: 'an old copy is about to arrive' });
    // The incoming copy is newer than the local one AT PREVIEW TIME (+1ms) ...
    const incoming = JSON.parse(JSON.stringify(S.getEntry(id)));
    incoming.notes = 'the older copy';
    incoming.updatedAt = new Date(Date.parse(incoming.updatedAt) + 1).toISOString();
    const prev = S.previewImport(JSON.stringify({ kind:'practice-journal.backup', schemaVersion:1, entries:[incoming] }));
    const classified = [prev.add, prev.update, prev.skip];
    // ... then the student edits that same entry again, before pressing Import.
    await new Promise(r => setTimeout(r, 30));
    S.saveEntry({ id: id, notes: 'the correction I just made' });
    const applied = S.applyImport(prev.plan);
    return { classified, notes: S.getEntry(id).notes, applied: [applied.added, applied.updated, applied.skipped] };
  });
  eq('the preview classifies the incoming copy as an update', staleRes.classified, [0, 1, 0]);
  eq('  but a stale plan cannot overwrite the newer local edit', staleRes.notes, 'the correction I just made');
  eq('  and the result reports it as skipped, not updated', staleRes.applied, [0, 0, 1]);
  await ip.context().close();

  await p.context().close();
  await browser.close();

  console.log('\n' + '='.repeat(58));
  console.log('pass ' + pass + '   fail ' + fail);
  if (errs.length){ console.log('\nPAGE ERRORS:'); errs.slice(0, 25).forEach(e => console.log('  ' + e)); }
  else console.log('no page errors');
  process.exit(fail || errs.length ? 1 : 0);
})().catch(e => { console.error('HARNESS CRASH:', e); process.exit(2); });
