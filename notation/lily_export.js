/* ---------- LilyPond export (shared; keep in sync across apps) ----------
   Produces a .ly file following Argue's Music Preparation Fundamentals:
   part name top left, source top right, title centered, 0.5in margins,
   measure number under every bar, metronome mark before the style word,
   double bar at section ends, guitar on treble_8 clef with TAB beneath. */
const LY_Q = {maj7:'maj7','6':'6','7':'7',sus7:'7sus4',m7:'m7',m6:'m6',m7b5:'m7.5-',dim7:'dim7',mMaj7:'m7+',maj7s5:'maj7.5+'};
const LY_EXT = {'9':'9',b9:'9-','#9':'9+','11':'11','#11':'11+','13':'13',b13:'13-',b5:'5-','#5':'5+'};
const LY_ROOT = {C:'c',D:'d',E:'e',F:'f',G:'g',A:'a',B:'b'};
function lyRoot(rootName){ const l=LY_ROOT[rootName[0]]; const a=rootName.slice(1); return l+(a==='b'?(l==='a'||l==='e'?'es':'es'):(a==='#'?'is':'')); }
function lyPitch(midi, flats){
  const names = flats ? ['c','des','d','ees','e','f','ges','g','aes','a','bes','b'] : ['c','cis','d','dis','e','f','fis','g','gis','a','ais','b'];
  const oct = Math.floor(midi/12)-1;
  return names[midi%12] + (oct>=4 ? "'".repeat(oct-3) : ",".repeat(3-oct));
}
function lyChordName(ch, dur){
  const allowed = (QUAL[ch.quality].allowed||[]);
  const ext = (ch.ext||[]).filter(e=>allowed.includes(e) && LY_EXT[e]).map(e=>'.'+LY_EXT[e]).join('');
  return lyRoot(ch.rootName)+dur+':'+LY_Q[ch.quality]+ext;
}
function lyVoicing(v, ch, dur){
  const flats = !/#/.test(ch.rootName);
  const ns = [...v.notes].sort((a,b)=>b.s-a.s).map(n=>lyPitch(OPEN[n.s]+n.f, flats)+'\\'+n.s);
  return '<'+ns.join(' ')+'>'+dur;
}
function lyFret(v){
  const by = {}; v.notes.forEach(n=>by[n.s]=n.f);
  const items = [];
  for(let s=6;s>=1;s--){ if(by[s]===undefined) items.push('(mute '+s+')'); else if(by[s]===0) items.push('(open '+s+')'); else items.push('(place-fret '+s+' '+by[s]+')'); }
  return "\\markup \\override #'(size . 1.4) \\fret-diagram-verbose #'("+items.join(' ')+')';
}
/* bars: [[{ch, v}], ...]; opts: {title, part, source, style, bpm, chart:true → slash notation + fret diagrams instead of voicings} */
function lyDocument(bars, opts){
  const chords=[], music=[], rhythm=[];
  bars.forEach((bar,i)=>{
    const d = bar.length===2 ? '2' : (bar.length===4 ? '4' : '1');
    const cn=[], mu=[], rh=[];
    bar.forEach((it,j)=>{
      if(!it.ch){ cn.push('r'+d); mu.push('r'+d); rh.push('r'+d); return; }
      cn.push(lyChordName(it.ch, d));
      mu.push(it.v ? lyVoicing(it.v, it.ch, d) : 'r'+d);
      const slashes = bar.length===2 ? "b'4 b'4" : (bar.length===4 ? "b'4" : "b'4 b'4 b'4 b'4");
      rh.push(it.v ? slashes.replace("b'4", "b'4^"+lyFret(it.v)) : slashes);
    });
    const brk = (i+1)%4===0 && i+1<bars.length ? ' \\break' : '';
    chords.push(cn.join(' ')+' |'); music.push(mu.join(' ')+' |'+brk); rhythm.push(rh.join(' ')+' |'+brk);
  });
  const tempo = opts.bpm ? '\\tempo \\markup { \\concat { \\general-align #Y #DOWN \\smaller \\note {4} #1 " = '+opts.bpm+'  " \\bold "'+(opts.style||'Swing')+'" } }' : '';
  const head = `\\version "2.24.0"
\\paper {
  #(set-paper-size "letter")
  top-margin = 12.5\\mm bottom-margin = 12.5\\mm left-margin = 12.5\\mm right-margin = 12.5\\mm
  indent = 0 ragged-right = ##f ragged-last = ${opts.chart?'##f':'##t'} print-page-number = ##f
  system-system-spacing.basic-distance = #18
  bookTitleMarkup = \\markup \\column {
    \\fill-line { "${opts.part||'Guitar'}" \\column { ${(opts.source||'').split('\n').map(l=>'\\line { "'+l.replace(/"/g,'\\"')+'" }').join(' ')} } }
    \\vspace #2.2 \\fill-line { \\fontsize #6 \\bold "${(opts.title||'').replace(/"/g,'\\"')}" } \\vspace #0.5 }
}
\\header { tagline = ##f }
#(set-global-staff-size 20)
\\layout { \\context { \\Score
  \\override BarNumber.break-visibility = #end-of-line-invisible
  \\override BarNumber.direction = #DOWN \\override BarNumber.self-alignment-X = #LEFT
  \\override BarNumber.font-size = #-2
  barNumberVisibility = #all-bar-numbers-visible } }
`;
  const chordCtx = `\\new ChordNames \\with { majorSevenSymbol = \\markup { "Δ7" } } \\chordmode {\n  ${chords.join('\n  ')}\n}`;
  if(opts.chart){
    return head + `\\score { <<
  ${chordCtx}
  \\new Staff { \\clef treble \\time 4/4 ${tempo} \\improvisationOn
  ${rhythm.join('\n  ')} \\bar "|." }
>> }
`;
  }
  return head + `mus = { \\clef "treble_8" \\time 4/4 ${tempo}
  ${music.join('\n  ')} \\bar "|." }
\\score { <<
  ${chordCtx}
  \\new Staff \\with { \\override StringNumber.stencil = ##f } { \\mus }
  \\new TabStaff \\with { \\override Stem.stencil = ##f \\override Beam.stencil = ##f \\override Dots.stencil = ##f } { \\mus }
>> }
`;
}
function lyDownload(text, filename){
  const blob = new Blob([text], {type:'text/plain'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500);
}
