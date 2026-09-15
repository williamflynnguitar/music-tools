/* Measures the printed page in a real browser, which node alone cannot do:
   page count comes from the rendered height of .sheet, exactly the way
   renderSheet() draws its page rules (10in of a US Letter page at 96dpi).
   Run on its own, or let check.js run it:

     node print-check.js                 measure and check
     node print-check.js --shots <dir>   also write print-preview PNGs

   Needs Playwright and a Chromium. It has none of check.js's guarantees of
   running anywhere, so it exits 2 — "skipped", not "failed" — when there is
   no browser to drive. */
const fs = require("fs"), path = require("path"), cp = require("child_process");

function loadPlaywright(){
  const tries = ["playwright", "playwright-core"];
  try { tries.push(path.join(cp.execSync("npm root -g", { encoding:"utf8" }).trim(), "playwright")); } catch (e) {}
  for (const t of tries){ try { return require(t); } catch (e) {} }
  return null;
}
const pw = loadPlaywright();
if (!pw){
  console.log("print-check: no Playwright here — skipped (the page-fit and contact checks need a browser)");
  process.exit(2);
}

const PAGE_H = 10 * 96;                        // US Letter minus the .5in print margins
const shotDir = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
let fails = 0, checks = 0;
const ok = (cond, m) => { checks++; if (!cond){ fails++; console.log("FAIL " + m); } };

(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport:{ width:1400, height:1100 }, deviceScaleFactor:2 });
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  await page.goto("file://" + path.join(__dirname, "index.html"));
  await page.waitForFunction(() => typeof window.sheetHTML === "function" && typeof window.makeFromTemplate === "function");
  const v1 = JSON.parse(fs.readFileSync(path.join(__dirname, "samples", "v1", "example-v1.json"), "utf8"));

  /* Page counts measured on main on 2026-09-15, so a plot is allowed to stay
     where it was and nothing more. The templates all sat around 900px of the
     960 a page holds; the migrated v1 example was already two pages at 1109px,
     because it is a fully miked band with names. */
  const WANT = [
    { name:"Jazz combo",            was:897,  maxPages:1 },
    { name:"Big band (17)",         was:913,  maxPages:1 },
    { name:"Rock / pop band",       was:913,  maxPages:1 },
    { name:"Vocal-led group",       was:913,  maxPages:1 },
    { name:"Duo",                   was:763,  maxPages:1 },
    { name:"Combo, two guitarists", was:913,  maxPages:1 },
    { name:"…with a long director name", was:927, maxPages:1 },
    { name:"example-v1 migrated",   was:1109, maxPages:2 },
  ];
  const plots = await page.evaluate(v1file => {
    const build = {
      "Jazz combo": () => makeFromTemplate("combo"),
      "Big band (17)": () => makeFromTemplate("bigband"),
      "Rock / pop band": () => makeFromTemplate("rock"),
      "Vocal-led group": () => makeFromTemplate("vocals"),
      "Duo": () => makeFromTemplate("duo"),
      "Combo, two guitarists": () => makeFromParts([["voice",1],["guitar",2],["keys",1],["bass",1],["drums",1]], null, "Two guitars"),
      "\u2026with a long director name": () => {
        const p = makeFromParts([["voice",1],["guitar",2],["keys",1],["bass",1],["drums",1]], null, "Two guitars");
        p.director = "Dr. Wilberforce Hammersmith-Jones";   // long enough to wrap the meta row
        p.date = "2026-11-14";
        return p;
      },
      "example-v1 migrated": () => migratePlot(JSON.parse(JSON.stringify(v1file))),
    };
    const out = [], sheet = document.getElementById("sheet");
    for (const name of Object.keys(build)){
      const p = build[name]();
      sheet.innerHTML = sheetHTML(p);
      out.push({ name, h:sheet.scrollHeight, pages:Math.max(1, Math.ceil((sheet.scrollHeight - 4) / (10 * 96))),
                 deliverLine:/Please deliver to timothy\.shade@wichita\.edu as far in advance as possible\./.test(sheet.textContent),
                 noContactLine:!/Contact:|Ensemble director/.test(sheet.textContent + emailText(p)) });
      sheet.innerHTML = "";
    }
    return out;
  }, v1);

  for (const r of plots){
    const want = WANT.find(w => w.name === r.name) || { maxPages:1 };
    ok(r.pages <= want.maxPages, r.name + " prints on " + want.maxPages + " page" + (want.maxPages > 1 ? "s" : "") +
       " as it did before (" + r.h + "px of " + PAGE_H + (want.was ? ", was " + want.was + "px" : "") + ", " + r.pages + " pages)");
    ok(r.deliverLine, r.name + ": the page ends with the delivery line to Tim Shade");
    ok(r.noContactLine, r.name + ": no contact line at the top, no \"Ensemble director\"");
  }
  const singles = plots.filter(r => (WANT.find(w => w.name === r.name) || {}).maxPages === 1);
  const tallest = singles.reduce((a, b) => (a.h > b.h ? a : b), singles[0]);
  if (tallest) console.log("      closest to a second page: " + tallest.name + " at " + tallest.h +
                           "px of " + PAGE_H + " (" + (PAGE_H - tallest.h) + "px spare)");
  ok(!errs.length, "the page loads with no script errors" + (errs.length ? ": " + errs[0] : ""));

  if (shotDir){
    fs.mkdirSync(shotDir, { recursive:true });
    const shots = {
      "combo-two-guitarists": `makeFromParts([["voice",1],["guitar",2],["keys",1],["bass",1],["drums",1]], null, "Two guitars")`,
      "bigband": `makeFromTemplate("bigband")`,
    };
    for (const name of Object.keys(shots)){
      await page.evaluate(expr => {
        const p = eval(expr);
        p.director = "W. Flynn";
        p.date = "2026-11-14";
        document.getElementById("sheet").innerHTML = sheetHTML(p);
        /* strip the app chrome so the shot is the paper, not the editor */
        for (const id of ["startDlg", "coDlg"]) document.getElementById(id).hidden = true;
        document.body.style.background = "#fff";
        const box = document.getElementById("sheetbox");
        box.style.cssText = "overflow:visible;height:auto;padding:0;background:#fff";
        const scale = document.getElementById("sheetScale");
        scale.style.cssText = "transform:none;width:7.5in;height:auto";
        const rail = document.querySelector(".pagerail");
        rail.style.cssText = "border:0;padding:0;overflow:visible;max-width:none";
        document.querySelector(".app").style.cssText = "display:block;padding:0";
      }, shots[name]);
      await page.waitForTimeout(80);
      const el = await page.$("#sheet");
      await el.screenshot({ path:path.join(shotDir, name + ".png") });
      console.log("      wrote " + path.join(shotDir, name + ".png"));
    }
  }

  await browser.close();
  console.log(fails ? fails + " FAILED of " + checks + " print checks" : "all " + checks + " print checks pass");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log("print-check: " + e.message); process.exit(1); });
