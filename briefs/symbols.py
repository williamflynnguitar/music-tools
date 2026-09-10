from engine import *
ALT={1:'♭9',3:'♯9',6:'♭5',8:'♭13'}
def label(bass,pcs):
    d=set((p-bass)%12 for p in pcs); d.discard(0)
    H=lambda *xs: all(x in d for x in xs)
    A=lambda *xs: any(x in d for x in xs)
    b9,n9,s9,M3,p11,b5,p5,b13,s13,b7,M7=[(x in d) for x in (1,2,3,4,5,6,7,8,9,10,11)]
    m3=s9
    if b7 and M7: return '—'
    if b9 and n9: return '—'
    if M3 and m3 and not b7:
        if s13: return 'Δ13(♯9)'
        return '—'
    alts=[x for x in (1,3,6,8) if x in d]
    nats=[x for x in (2,5,7,9) if x in d]
    # dominant / altered
    if M3 and b7:
        if p11 and not alts and not n9 and not s13: return '7sus'
        if alts and not nats: return '7alt.' if len(alts)>=2 else '7('+ALT[alts[0]]+')'
        if alts:
            names=dict(ALT); 
            if p5: names[6]='♯11'
            base='13' if s13 else ('9' if n9 else '7')
            return base+'('+''.join(names[x] for x in alts)+')'
        if s13: return '13'
        if n9: return '9'
        return '7'
    if alts and not nats and not M3 and not b7 and not M7 and len(alts)>=3: return '7alt.'
    if M3:  # major w/o b7
        if M7:
            if b9 and b5: return 'Δ7(♭9♭5)'
            if b9: return '—'
            if s13: return 'Δ13'
            if b5: return 'Δ7(♯11)'
            if p11: return 'Δ7(sus4)'
            if n9: return 'Δ9'
            return 'Δ7'
        if s13 and n9: return '6/9'
        if b13 and s13: return 'Δ7(♯5)'   # source: E♭Δ7(♯5) w/ 13,9,♯5
        if b13 and n9: return 'Δ7(♯5)'
        if b5 and M7: return 'Δ7(♯11)'
        if b5: return 'Δ7(♯11)'
        if s13: return '6'
        if n9: return 'Δ9'
        return '—'
    if m3 and not M3:
        if b9: return '—'
        if b5:
            if b7: return 'ø11' if p11 else 'ø7'
            if s13 and b13: return '°7(♭13)'
            if s13: return '°7'
            if p11: return 'ø11'
            if b13: return 'ø(♭13)'
            return 'ø'
        if b7:
            if s13: return 'm13'
            if b13: return 'm7(♭6)'
            if p11: return 'm11'
            if n9: return 'm9'
            return 'm7'
        if M7: return 'm(Δ11)' if p11 else ('m(Δ9)' if n9 else 'm(Δ7)')
        if s13 and b13: return '°7(♭13)'
        if s13 and n9: return 'm6/9'
        if s13: return 'm6'
        if b13 and n9: return 'm9(♭6)'
        if b13: return 'm(♭6)'
        if p11 and n9: return 'm(9,11)'
        return '—'
    # no third
    if M7 and b9 and b5: return 'Δ7(♭9♭5)'
    if b13 and n9 and s13: return 'Δ7(♯5)'
    if b13 and n9 and not b7: return 'm9(♭6)'  # source: Am9(♭6)
    if b13 and b7: return 'm7(♭6)'
    if b5 and p11 and not M7: return 'ø11'
    if b7 and (p11 or p5): return '9sus' if n9 else '7sus'
    if M7 and b5 and p11: return 'Δ7(♭5sus4)'
    if M7 and p11: return 'm(Δ11)'
    if M7 and b5: return 'Δ7(♯11)'
    if M7 and s13: return 'Δ13'
    if M7 and n9: return 'Δ9'
    if p11 and p5: return '7sus'
    if b9 and p5 and b5: return '7(♭9♯11)'
    if b9 and p5: return '7(♭9♭13)' if b13 else '7(♭9)'
    if b9 and b5: return '7(♭9♭5)'
    if s13 and n9: return '6/9'
    if n9 and p5: return 'Δ9'
    if b5 and p5: return 'Δ7(♯11)'  # source: FΔ7(♯11) w/ 1,5,♯11
    if b5: return 'Δ7(♯11)'
    return '—'
N=NOTES
def table(v):
    return [(N[(4-k)%12],label((4-k)%12,v)) for k in range(12)]
def check(v,src):
    bad=0
    for (b,l),s in zip(table(v),src):
        if b+l!=s: bad+=1; print('   MISMATCH',b+l,'vs',s)
    return bad
if __name__=='__main__':
    src5=['Em11','EbΔ7(♯11)','D7sus','Db7alt.','C6/9','Bm7(♭6)','BbΔ13','A7sus','AbΔ7(♭9♭5)','GΔ9','Gb7alt.','F6/9']
    src10=['E7(♭9♭13)','EbΔ7(♯5)','Dm13','Db—','Cm(Δ11)','B7(♭9♭5)','Bb—','Am9(♭6)','AbΔ13(♯9)','G7sus','GbΔ7(♭5sus4)','FΔ7(♯11)']
    src11=['E7(♭9)','Eb—','Dm6/9','Db7(♯9)','CΔ7(sus4)','Bø11','Bb7(♭9♯11)','Am9(♭6)','Ab°7(♭13)','G13','Gb—','FΔ7(♯11)']
    for name,v,src in [('P4/P4',[9,2,7],src5),('P4/TT',[0,5,11],src10),('TT/P4',[5,11,4],src11)]:
        print(name, check(v,src),'mismatches')
