#!/bin/sh
# Render every rhythm cell to a cropped SVG and pack them into rhy_svg.js
# (currentColor SVGs keyed by cell id, inlined into comping-rhythms/index.html
# between the ===== pre-rendered notation ===== markers).
# Usage: sh render.sh   (needs lilypond and node on PATH)
set -e
cd "$(dirname "$0")"
out=$(mktemp -d)
for f in *.ly; do
  lilypond -dbackend=svg -dcrop -o "$out/${f%.ly}" "$f" >/dev/null 2>&1
done
node pack.js "$out" > rhy_svg.js
rm -rf "$out"
echo "packed $(grep -o '"[a-zA-Z0-9-]*":' rhy_svg.js | wc -l | tr -d ' ') cells into rhy_svg.js"
