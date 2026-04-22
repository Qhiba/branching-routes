# Phase 7 Self-Review

## AR Compliance

| Rule | Result |
|---|---|
| AR-03 | No graph data in local state — PASS |
| AR-04 | No direct store mutations — PASS |
| AR-08 | Sidebars/banner read only `isCampaignActive`, never touching simulation internals — PASS |
| AR-14 | `flag ?? {}` is outside the selector (component body), not inside — PASS |
| AR-21 | `CampaignBanner.css` explicitly listed in execution report — PASS |
| AR-23 | Every new subscription uses a per-slice selector — PASS |

## Functional Correctness

- **StatusStrip field names fixed** — `s.flag`, `s.status`, `s.path`, `s.chapter` now match actual `narrativeStore` initial state. Counts display correctly. PASS
- **`visitedCount` logic** — `seenCount + 1` during campaign correctly accounts for active node not yet in `seenNodeIds`. PASS
- **`endingsReachedCount`** — Filters `seenNodeIds` for ending-collection membership, adds 1 if active node is an ending. PASS
- **`detectDeadEnds` memo** — Dependencies are store references; only re-runs on topology change. PASS

## Visual Layering

- CampaignBanner: `z-index: 30`, `position: absolute`, `top: 0`, `height: 32px`
- FloatingMiddleBar: `z-index: 40`, `position: absolute`, `top: var(--space-4)` (~16px)
- Pill floats on top of banner (z-index 40 > 30). Matches vision file intent — banner is background context indicator, pill is foreground control. INTENTIONAL.

## Sidebar Dimming

`pointer-events: none` on root div correctly blocks all interaction (tab clicks, panel scrolling, CRUD buttons) without needing to target sub-elements. PASS

## Preserved Items

- All stores: untouched PASS
- GraphCanvas: untouched PASS
- FloatingMiddleBar: untouched PASS
- All panels: untouched PASS

## Pre-Existing Notes (Outside Phase Scope)

- `w-3.5 h-3.5` Tailwind class strings on StatusStrip icons have no effect (no Tailwind in project). Icons correctly sized by `.ui-v2-status-item svg` CSS rule. No visual regression.
- StatusStrip has redundant `s => s.seenNodeIds.length` and `s => s.seenNodeIds` subscriptions. Not harmful.

## Human Notes (Issues to Fix)

1. **Campaign panel edit/delete buttons not visible on hover** — `nodes-panel__item-actions` is inside `.campaign-panel__item` but the hover rule targets `.nodes-panel__item:hover`, not `.campaign-panel__item:hover`. Buttons exist but are always opacity:0.
2. **Move Overlay toggle from StatusStrip to FloatingMiddleBar** — Place to the left of Undo button in campaign mode pill.
3. **Move autosave toggle + save + load from SandboxPanel to FloatingMiddleBar** — Place to the right of Reset button in campaign mode pill.
4. **Remove CampaignBanner** — FloatingMiddleBar blinking pulse already communicates campaign-active state. Banner not needed.

## Verdict

Passes all AR checks. Four human-noted issues to fix in 0306_fix.
