\version "2.24.0"
\paper { indent = 0 ragged-right = ##t }
\header { tagline = ##f }
#(set-global-staff-size 20)
\score { \new RhythmicStaff \with { \remove "Time_signature_engraver" \remove "Bar_number_engraver" \override StaffSymbol.thickness = #1.2 }
  { \time 4/4 R1 \bar "|" }
  \layout { \context { \Score \remove "Bar_number_engraver" } } }
