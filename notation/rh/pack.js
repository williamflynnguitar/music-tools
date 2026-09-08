// Pack cropped LilyPond SVGs into rhy_svg.js: strip fixed size (viewBox only),
// drop the <style> block and textedit <a> wrappers, collapse whitespace.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const cells = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.cropped.svg')).sort()) {
  let s = fs.readFileSync(path.join(dir, f), 'utf8');
  s = s.replace(/<svg /, '<svg preserveAspectRatio="xMidYMid meet" ')
       .replace(/ width="[^"]*mm" height="[^"]*mm"/, '')
       .replace(/<style[\s\S]*?<\/style>/, '')
       .replace(/<a [^>]*>/g, '').replace(/<\/a>/g, '')
       .replace(/\s+/g, ' ').replace(/> </g, '> <').trim();
  cells[f.replace('.cropped.svg', '')] = s;
}
process.stdout.write('const RHY_SVG = ' + JSON.stringify(cells) + ';\n');
