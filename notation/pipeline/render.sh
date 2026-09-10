#!/usr/bin/env bash
# Renders every .ly under ly/<set>/ to its SVG cell store, in parallel, skipping cells
# that already exist. arpeggios/fretboard cells go to notation/svg/<set>/; quartal cells
# go to quartal-voicings/notation/ (per-app store, per that app's build brief).
# Usage: ./render.sh arpeggios   |   ./render.sh fretboard   |   ./render.sh quartal   |   ./render.sh all
set -e
cd "$(dirname "$0")"
JOBS=${JOBS:-$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)}
for set in $( [ "$1" = all ] && echo "arpeggios fretboard quartal" || echo "$1" ); do
  out="../svg/$set"; [ "$set" = quartal ] && out="../../quartal-voicings/notation"
  mkdir -p "build/$set" "$out"
  # -n1 + positional arg, not -I{}: BSD xargs caps -I substitution at 255
  # bytes per command, which the longer fretboard filenames exceed.
  find "ly/$set" -name '*.ly' | while read f; do b=$(basename "$f" .ly); [ -f "$out/$b.svg" ] || echo "$f"; done \
    | xargs -P "$JOBS" -n 1 sh -c '[ -n "$1" ] || exit 0; b=$(basename "$1" .ly); lilypond -dno-point-and-click -dbackend=svg -dcrop -o "build/'"$set"'/$b" "$1" >/dev/null 2>&1 || echo "FAILED $1"' sh
  python3 post.py "build/$set" "$out"
done
