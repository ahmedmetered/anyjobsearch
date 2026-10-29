# DESIGN.md — anyjobsearch tracker

The committed visual world of the tracker page (`tracker/index.html`).
Written from the built result, 2026-10-30. The direction contract lives in
the operator's private `job-search/tracker/surface-brief.md`; this file
records only what ships.

## Mode
Operate. One operator, short daily sessions, inline editing of everything.
Scanability and truthful totals outrank expression. Expression lives in one
place: the pipeline bar (see Signature).

## Appearance
**Light default + designed dark, user-toggleable** (Amended 2026-10-30 by
operator decision; the original light-only call is superseded). Light
serves the daytime desk scene; dark uses Apple dark values — ground
`#0A0A0C`, surface `#17171A`, ink `#F5F5F7`, muted `#A1A1A6`, accent
`#0A84FF` — softened surfaces, never an inversion. Toggle: sun/moon button
in the masthead, persisted in localStorage under `am-theme`, first paint
set by an inline head script from `prefers-color-scheme` (no flash).
Inverted-surface elements (hot chip, active pipeline segment) read
background=`--ink` / text=`--surface` so they invert correctly in both
appearances.

## Tokens

### Color (restrained strategy: neutrals + one accent)
| Role | Light value | Contrast vs surface |
|---|---|---|
| Page ground | `#F5F5F7` | — |
| Surface (cards, controls) | `#FFFFFF` | — |
| Ink (primary text) | `#1D1D1F` | 16.1:1 on surface |
| Ink-2 (secondary text, labels, meta) | `#6E6E73` | 4.7:1 on surface |
| Ink-3 (large/disabled only) | `#86868B` | 3.5:1 — never body text |
| Accent (actions, links, role line, focus) | `#0071E3` | 4.6:1 on surface |
| Hairline (control borders) | `#D2D2D7` | — |
| Track (tag chips, pipeline zeros) | `#E9E9EB` | text `#3C3C43` on it |
| Good / tint | `#1D7A36` / `#E6F4EA` | Easy Apply active |
| Star / tint | `#946A00` / `#FFF3C9` | top-pick active |
| Danger | `#D70015` | delete, destructive copy |
| Hot chip (inverted) | `#1D1D1F` bg, white text | Applications count |

Rules: separation of cards comes from surface-vs-ground contrast alone —
no card borders, no card shadows. Elevation is declared exactly once (the
add-application sheet: `0 12px 32px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06)`).
No colored left/right borders. Accent never becomes decoration.

### Type
System stack (`-apple-system, "SF Pro Text", "Segoe UI", Roboto, …`) — the
committed Apple voice for an Operate surface; hierarchy is carried by
weight and size, never by a second family. Scale: h1 26/700 (-0.022em);
company 16.5/600; role 13.5/500 in accent; meta 12.5/400 ink-2; body/inputs
13–13.5; field labels 11/600 uppercase (+0.07em) — the one uppercase voice,
short labels only; long copy never uppercases. All counts and dates:
`font-variant-numeric: tabular-nums`. Minimum functional text 11px.

### Layout & spacing
Single column, max-width 1060px. Vertical rhythm: masthead → summary chips
→ pipeline bar → filter row → cards (10px gaps) → hint. Cards: 14px radius,
15/17/12px padding, inner grid `auto-fit minmax(150px, 1fr)` (2-col under
640px). More space above headings than below. The toolbar wraps freely.

## Signature
**The pipeline bar is the status filter.** Ten pills (All + nine stages);
each shows its count in bold tabular numerals; the active stage fills ink;
zero-count stages go dashed and dimmed. Structure encodes the data — the
filter is the visualization. It replaced a dropdown and a separate stats
row (the old world's arrangement).

## Motion
One authored moment: cards rise 8px with a staggered 16ms cascade
(`cubic-bezier(.16,1,.3,1)`, capped at 18 steps) on every render, plus
150ms background/border transitions on controls. `prefers-reduced-motion`
disables both. No other motion.

## Browser surfaces (themed, not defaulted)
`::selection` accent-soft; `:focus-visible` 2px accent ring, offset 2px;
inputs get a 3px accent-soft ring on focus; caret accent; scrollbar thin
`#C7C7CC` thumb on transparent track.

## Component conventions
Controls are pills (`border-radius: 980px`) for actions and filters; fields
are 8px-rounded rectangles with hairline borders. Primary action = filled
accent pill, top-right. Toggles speak with `aria-pressed` + filled-ink
state (`.on`). Icons: text glyphs only where a label ships beside them (★
carries `aria-label="Top pick"`). Copy names actions ("Add application",
"Import", "Export backup"); the empty state names the recovery.

## Non-goals
No dark variant (see Appearance). No framework, build step, or external
fonts (offline-friendly single file). No nested cards; separators stay
hairline-soft inside cards.
