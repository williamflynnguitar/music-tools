# post.py <in_dir> <out_dir>: LilyPond cropped SVG → lean SVG that inherits color from the page (currentColor)
import re, glob, os, sys
src, dst = sys.argv[1:3]; os.makedirs(dst, exist_ok=True); n = 0
for f in glob.glob(os.path.join(src, "*.cropped.svg")):
    s = open(f).read()
    s = re.sub(r"<style.*?</style>\s*", "", s, flags=re.S)
    s = re.sub(r' width="[\d.]+mm" height="[\d.]+mm"', "", s)
    s = re.sub(r'<g color="rgb\(100\.0000%, 100\.0000%, 100\.0000%\)">\s*<g transform="[^"]*">\s*<rect[^>]*/>\s*</g>\s*</g>', "", s)  # whiteout boxes
    s = re.sub(r"(-?\d+\.\d{3,})", lambda m: "%.4g" % float(m.group(1)), s)
    s = s.replace(' xmlns:xlink="http://www.w3.org/1999/xlink"', "").replace(' version="1.2"', "")
    s = s.replace("<svg ", '<svg preserveAspectRatio="xMidYMid meet" ', 1)
    s = re.sub(r"\s+", " ", s).strip(); s = re.sub(r">\s+<", "><", s)
    open(os.path.join(dst, os.path.basename(f).replace(".cropped.svg", ".svg")), "w").write(s); n += 1
print(n, "svg written to", dst)
