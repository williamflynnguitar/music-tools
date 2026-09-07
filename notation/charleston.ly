\version "2.24.0"
\paper {
  #(set-paper-size "letter")
  top-margin = 12.5\mm bottom-margin = 12.5\mm left-margin = 12.5\mm right-margin = 12.5\mm
  indent = 0 ragged-right = ##f ragged-last = ##t
  system-system-spacing.basic-distance = #16
  markup-system-spacing.basic-distance = #10
  print-page-number = ##f
  bookTitleMarkup = \markup {
    \column {
      \fill-line { \fontsize #0 "Guitar" \fontsize #0 \column { \line { "Flynn," \italic "Jazz Guitar Technique Handbook" } \line { "p. 83, Ex. 9–11" } } }
      \vspace #2.2
      \fill-line { \fontsize #6 \bold "THE CHARLESTON RHYTHM" }
      \vspace #0.5
    }
  }
}
#(set-global-staff-size 21)
\header { tagline = ##f }

rhy = { \improvisationOn \override Staff.TimeSignature.style = #'default }

\layout {
  \context { \Score
    \override BarNumber.break-visibility = #end-of-line-invisible
    \override BarNumber.Y-offset = #-4.5
    \override BarNumber.self-alignment-X = #LEFT
    \override BarNumber.font-size = #-2
    \override BarNumber.outside-staff-priority = ##f
    \override RehearsalMark.self-alignment-X = #LEFT
    barNumberVisibility = #all-bar-numbers-visible
  }
}

\score {
  \new Staff {
    \clef treble \time 4/4 \key c \major
    \tempo \markup { \concat { \general-align #Y #DOWN \smaller \note {4} #1 " = 140  " \bold "Swing" } }
    \rhy
    % —— A: Prime — beat 1 and the "and" of 2 ——
    \mark \default
    \once \override TextScript.font-size = #-1
    b'4.^\markup \italic "long–short" b'8 r2 \bar "||"
    b'4.^\markup \italic "long–long" b'8~ b'2 \bar "||"
    b'4-.^\markup \italic "short–short" r8 b'8 r2 \bar "||"
    b'4-.^\markup \italic "short–long" r8 b'8~ b'2 \break
    % —— B: Delayed — an eighth later ——
    \bar "||" \mark \default
    r8 b'4.^\markup \italic "long–short" b'4-. r4 \bar "||"
    r8 b'4.^\markup \italic "long–long" b'2 \bar "||"
    r8 b'8^\markup \italic "short–short" r4 b'4-. r4 \bar "||"
    r8 b'8^\markup \italic "short–long" r4 b'2 \break
    % —— C: Anticipated — an eighth earlier; the first hit is the "and" of 4 of the bar before ——
    \bar "||" \mark \default
    r2^\markup \italic "pickup" r4 r8 b'8~ |
    b'4.^\markup \italic "long–short" b'8 r4 r8 b'8~ \bar "||"
    b'4.^\markup \italic "long–long" b'8~ b'4 r8 b'8 \bar "||"
    r4^\markup \italic "short–short" r8 b'8 r4 r8 b'8 \bar "||"
    r4^\markup \italic "short–long" r8 b'8~ b'2 \bar "||" \break
    % —— D: Bossa nova, one-bar pattern ——
    \mark \default
    \tempo \markup { \concat { \general-align #Y #DOWN \smaller \note {4} #1 " = 120  " \bold "Straight 8ths" } }
    b'4.^\markup \italic "beat 1 long" b'8 r4 b'4-. \bar "||"
    b'4-.^\markup \italic "beat 1 short" r8 b'8 r4 b'4-. \bar "|."
  }
}
