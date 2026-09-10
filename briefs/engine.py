NOTES=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
MAJ=[0,2,4,5,7,9,11]
TUNING={6:4,5:9,4:2,3:7,2:11,1:4}  # pitch classes E A D G B E
def scale(tonic): return [(tonic+i)%12 for i in MAJ]
def deg_index(sc,pc): return sc.index(pc)
def stack(sc,i,n,intervals):  # intervals: list of scale steps (3 = a 4th)
    out=[sc[i]]; j=i
    for st in intervals:
        j=(j+st)%7; out.append(sc[j])
    return out
def fret(string,pc,lo=0,hi=15):
    f=(pc-TUNING[string])%12
    return [x for x in (f,f+12) if lo<=x<=hi]
def ivl(a,b): return (b-a)%12
def kind3(v):
    a,b=ivl(v[0],v[1]),ivl(v[1],v[2])
    names={5:'P4',6:'TT',2:'M2',1:'m2',4:'M3',3:'m3'}
    return names.get(a,str(a))+'/'+names.get(b,str(b))
def place(voicing,strings):
    # strings low->high; pick frets in a compact hand position; return list of options
    opts=[]
    import itertools
    cands=[fret(s,pc) for s,pc in zip(strings,voicing)]
    for combo in itertools.product(*cands):
        span=max(combo)-min(combo)
        if span<=4: opts.append(combo)
    return sorted(opts,key=lambda c:min(c))
def invert(v,k):
    v=list(v)
    for _ in range(k): v=v[1:]+[v[0]]
    return v
