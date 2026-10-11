---
name: The Cut
description: iPhone-first fat-loss and training tracker that looks and moves like a native iOS 26 app.
colors:
  bg: "#F2F2F7"
  card: "#FFFFFF"
  ink: "#000000"
  mute: "#666670"
  line: "#D8D8DC"
  accent: "#1D7333"
  accent-ink: "#FFFFFF"
  soft: "#E6F4EA"
  fill: "rgba(118,118,128,.12)"
  material: "rgba(249,249,249,.8)"
  glass: "rgba(250,250,252,.72)"
  glass-edge: "rgba(255,255,255,.7)"
  grabber: "#C7C7CC"
  seg-on: "#FFFFFF"
  red: "#FF3B30"
  orange: "#FF9500"
  red-text: "#D70015"
  orange-text: "#B84A00"
  tick: "#8E8E93"
  ring1: "#28CD41"
  ring2: "#0A84FF"
  ring3: "#FF9500"
  dark-bg: "#000000"
  dark-card: "#1C1C1E"
  dark-ink: "#FFFFFF"
  dark-mute: "#8E8E93"
  dark-line: "#38383A"
  dark-accent: "#30D158"
  dark-accent-ink: "#00230C"
  dark-soft: "#1B3022"
  dark-red-text: "#FF6961"
  dark-orange-text: "#FF9F0A"
  dark-tick: "#7C7C80"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: ".01em"
  title1:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "1.6471rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.02em"
  title2:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "1.2941rem"
    fontWeight: 700
    lineHeight: 1.15
  title3:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "1.1765rem"
    fontWeight: 600
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-.01em"
  subhead:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "0.8824rem"
    fontWeight: 400
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "0.7647rem"
    fontWeight: 400
  section-header:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "0.7647rem"
    fontWeight: 400
    letterSpacing: ".02em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "0.7059rem"
    fontWeight: 600
  numeral:
    fontFamily: "ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "1.6471rem"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "tnum"
rounded:
  hairline-chip: "7px"
  control: "10px"
  tile: "12px"
  kpi: "16px"
  card: "22px"
  sheet: "32px"
  actionsheet: "34px"
  capsule: "999px"
spacing:
  page: "16px"
  row-y: "11px"
  card: "16px"
  gap-sm: "6px"
  gap-md: "12px"
  section: "16px"
  hit: "44px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.capsule}"
    height: "50px"
    padding: "0 20px"
  button-tinted:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.accent}"
    rounded: "{rounded.capsule}"
    height: "50px"
  icon-button:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.accent}"
    rounded: "{rounded.capsule}"
    height: "36px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "16px"
  kpi-tile:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.kpi}"
    padding: "12px"
  segmented:
    backgroundColor: "{colors.fill}"
    rounded: "9px"
    padding: "2px"
  segmented-on:
    backgroundColor: "{colors.seg-on}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline-chip}"
  chip:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.capsule}"
    padding: "5px 12px"
  chip-on:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.capsule}"
  input:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  sheet:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.sheet}"
    padding: "22px 16px 12px"
  tabbar:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.capsule}"
    padding: "5px"
  recovery-chip-ok:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.capsule}"
    padding: "2px 9px"
  toast:
    backgroundColor: "{colors.material}"
    rounded: "18px"
    padding: "12px 16px"
---

# Design System: The Cut

## Overview

**Creative North Star: "A First-Party Apple App"**

The Cut should be indistinguishable from something Apple shipped next to Fitness and Reminders. It borrows iOS 26 wholesale rather than interpreting it: system SF faces, the grouped-list surface model (grey ground, white rounded cards, hairline separators), Reminders round ticks, Activity-style rings, a floating glass tab bar, bottom sheets with a grabber, spring motion and haptics. One green accent carries every interactive and "done" state; everything else is system grey.

Density is phone-native: 16px page margins, 44pt targets, one column capped at 560px. At 900px and up (MacBook Air) the same content gets a 220px sidebar in place of the tab bar, a 680px column and centred sheets. All CSS lives in the single `<style>` in `index.html`, appended in layers; later blocks override earlier ones, so read the whole cascade before changing a selector.

**Key Characteristics:**
- System fonts only; numerals in SF Rounded with tabular figures.
- Grouped lists: `bg` ground, `card` surfaces at 22px, 0.5px `line` separators.
- One accent (green); Apple system hues used as fills and status, never as small text.
- Glass (blur + saturate) only on floating chrome: tab bar, coach pill, compact nav bar, toast.
- Spring easing, press-scale feedback, haptic on completion; all of it off under reduced motion.
- Every size in rem (1rem = 17px) so the app follows iOS Text Size.

## Colors

Apple's grouped-list neutrals with a single deep-green accent and the system status hues, fully re-tokened for dark mode (`prefers-color-scheme: dark` unless `data-theme="light"`).

### Primary
- **Fitness Green** (`accent`, dark `dark-accent`): primary buttons, selected day disc, ticks, links, tab tint, chart lines, sparkline, progress fills, focus rings, `accent-color`, caret and selection tint. Light value is darkened from system green so it passes 4.5:1 as text on white and on `bg`.
- **Accent Ink** (`accent-ink`): text and glyphs on an accent fill.
- **Mint Wash** (`soft`): tinted backgrounds for positive state (good minutes, selected option, recovered chip, AI notes, row flash).

### Secondary
- **System Orange / Red** (`orange`, `red`): fills only: sync-busy/err dots, recovery body-map regions, demo arrows, sick-day dots, tinted chip backgrounds via `color-mix`.
- **Burnt Orange Text / Deep Red Text** (`orange-text`, `red-text`): the text-safe partners: weight gain deltas, PR labels, skipped tags, "no work" notes, sync errors, video link glyph.

### Tertiary
- **Activity Rings** (`ring1` green, `ring2` blue, `ring3` orange): ring strokes, heatmap and muscle-map intensity (mixed into `fill` at 25/50/78% and 40/65/80%), muscle bars, the on state of switches.

### Neutral
- **Grouped Background** (`bg`): page ground; also the inner surface of KPI tiles, badges and pct cells sitting on a card.
- **Card** (`card`): cards, sheets, strip, library chips at rest.
- **Ink** (`ink`): primary text. Inverted (`ink` ground, `bg` text) for the rest timer and selected library filter.
- **Secondary Label** (`mute`): metadata, captions, section headers, chart labels. Light value is tuned to 4.5:1.
- **Separator** (`line`): 0.5px row rules, 1px table rules.
- **Tertiary Fill** (`fill`): every neutral control fill: inputs, segmented track, chips, icon buttons, tools, steppers, tracks, inactive heat cells.
- **Tick Outline** (`tick`): the 3:1 non-text outline for unchecked round ticks and set checks.
- **Grabber** (`grabber`): sheet grabber and the disclosure chevron.
- **Material / Glass / Glass Edge** (`material`, `glass`, `glass-edge`): translucent chrome backgrounds; `glass-edge` is drawn as a 0.5px inset ring.

### Named Rules
**The Fill-Not-Text Rule.** Apple system hues (`orange`, `red`, `ring*`) are fills. Any text or icon glyph in that hue uses `orange-text`, `red-text`, `accent` or `mute`, which hold 4.5:1 in light mode. Outlines that carry meaning use `tick` (3:1).

**The One Accent Rule.** Green is the only interactive colour. Status uses orange and red; nothing else gets a hue.

**The Token-Both-Modes Rule.** A new colour is a new custom property in `:root` and in the dark override block, never a literal in a component.

## Typography

**Display Font:** SF Pro Display via `-apple-system` (`--display`), falling back to system-ui, Segoe UI, Roboto.
**Body Font:** SF Pro Text via `-apple-system` (`--body`).
**Numeral Font:** SF Pro Rounded via `ui-rounded` (`--rounded`).

**Character:** Pure system type, so it reads as the OS. Rounded figures give the numbers (weights, minutes, sets, dates, counts) the friendly Fitness-app voice.

### Hierarchy
The scale is the iOS Dynamic Type ladder expressed as rem over a 17px root.
- **Large Title** (700, 2rem = 34px): the page title in `.top`; fades out as the compact nav bar fades in.
- **Title 1** (700, 1.6471rem = 28px): day title, modal heading; tile and KPI numerals use the same size in Rounded.
- **Title 2** (700, 1.2941rem = 22px): section titles, sheet headings.
- **Title 3** (600, 1.1765rem = 20px): chart headings, stepper glyphs, numeric inputs.
- **Body** (400, 1rem = 17px, 1.35): row names, buttons, summary rows.
- **Callout / Subhead** (0.9412rem / 0.8824rem): secondary rows, toasts, notes, meta.
- **Footnote** (0.7647rem = 13px): captions, row meta, grouped-list section headers (uppercase, +.02em, `mute`).
- **Caption** (0.7059 / 0.6471rem): KPI captions, tags, chip text.
- **SVG chart text** stays in px (10-11px) because SVG scales with its viewBox.

### Named Rules
**The Follow-Text-Size Rule.** All type is rem. `html` is 17px; on iOS it is `font: -apple-system-body`, so the whole app tracks Settings > Text Size. Never set a px font size outside SVG.

**The Capped-Chrome Rule.** Fixed chrome caps its growth with `min(rem, px)`: tab bar labels `min(.5882rem, 12px)`, week pills (`min(.6471rem,13px)`, `min(1.1176rem,21px)`, `min(.5882rem,12px)`), nav bar (`min(1rem,20px)`, `min(.7059rem,14px)`), heatmap months `min(.5882rem,12px)`.

**The Rounded-Numbers Rule.** Figures that are data use `--rounded`, weight 600-700, `tabular-nums`.

## Layout

Single column, `main` max 560px, 16px page padding plus safe-area insets; bottom padding 140px on phone clears the floating tab bar. Cards stack with 14px top margin; collapsible sections sit 16px apart. Two-up grids (Home tap cards, KPIs, quick-log, body maps) use 1fr 1fr with 10-12px gaps. Rows are full-bleed within the card with 11px vertical padding and a 0.5px separator; the press highlight extends 16px past the row to the card edge.

Breakpoint at 900px: the tab bar becomes a 220px left sidebar (Settings joins it as a fifth item, the gear disappears), body padding becomes 28/32/48/252px, `main` widens to 680px, sheets centre at max 520px with all corners at 14px and no grabber, and drag-to-dismiss turns off. Below 900px the library search bar sticks under the nav bar.

Touch: every control has a 44pt hit area. Where the drawn control is smaller, a transparent `::before`/`::after` extends it (tools, gear, sync dot, segmented buttons), or the control is 44px and draws a smaller shape inside (the row tick is a 44px input painting a 24px ring with a radial gradient; set checks are 44px circles; week arrows are 44px).

## Elevation & Depth

Content is flat: cards, rows and tiles separate by tone (`card` on `bg`, `bg` or `fill` tiles on `card`), never by shadow. Depth is reserved for things that float over content, and those get translucency plus a soft ambient shadow.

### Shadow Vocabulary
- **Lift** (`--lift`: `0 12px 36px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06)`; heavier in dark): floating tab bar and coach pill, paired with an inset `glass-edge` 0.5px ring.
- **Toast** (`0 8px 28px rgba(0,0,0,.16)`) and **rest timer** (`0 8px 24px rgba(0,0,0,.25)`).
- **Segment thumb** (`0 3px 8px rgba(0,0,0,.12), 0 1px 1px rgba(0,0,0,.04)`): the selected segment only.
- **Start disc glow** (`0 4px 12px` accent at 45%).
- **Inset rings** (`inset 0 0 0 1.5-2px`): selection outlines on tiles, pills and heat cells; these are borders, not elevation.

### Named Rules
**The Glass-Is-Chrome Rule.** `backdrop-filter` (blur 20-24px, saturate 180-190%) belongs only to floating chrome: tab bar, coach pill, compact nav bar, toast. Content surfaces are opaque.

**The Scrim Rule.** Sheets dim the page with `rgba(0,0,0,.4 * --dim)`; dragging the sheet lowers `--dim` in step.

## Shapes

Continuous, generous rounding throughout. Capsules (999px) for buttons, icon buttons, chips, the tab bar, its indicator, the coach pill and the rest timer. Cards, the week strip, details groups and Home tap cards are 22px. Sheets are 32px on top only; short action sheets on phone float inset 8px from the edges at 34px all round. Smaller nested surfaces step down: KPI 16px, media and how-to panels 14px, option tiles, thumbnails and inputs 12px or 10px, tools 9px, segment thumb 7px. Ticks, set checks, day discs and set numbers are circles. Strokes are 0.5px hairlines for separators; icons are 1.7-2.1px round-capped line SVGs.

## Components

### Buttons
- **Shape:** capsule (999px), 50px tall, 600 weight body size.
- **Primary:** `accent` fill, `accent-ink` text. Hover (pointer devices) brightness 1.07; press scale .97 with brightness .92 on the spring.
- **Tinted / Cancel:** `fill` background with `accent` text, full width in sheets.
- **Icon button:** 36px `fill` capsule, `accent` glyph; in sheet headers a 30px `mute` circle. Week arrows are 44px.
- **Link button:** `accent` text, no fill, 44px min height.
- **Tool:** 32px (28px small) `fill` square at 9px with an 18px line icon, hit area extended to 44pt.

### Segmented Control
`fill` track, 9px radius, 2px inset; segments 7px radius, footnote 500. Selected segment is a `seg-on` thumb with the segment shadow. Full-width mode segments are 44px tall.

### Chips
- **Neutral:** `fill` capsule, `ink` caption, 5px 12px.
- **On / hit:** `accent` fill, `accent-ink`.
- **Ask chips (coach):** `fill` with `accent` text.
- **Library filters:** `card` at rest, inverted `ink`/`bg` when selected, horizontally scrolling with no scrollbar.
- **Minutes and recovery chips:** capsule captions in Rounded; tiers go `fill`/`mute` (short), `soft`/`accent` (good), plus inset ring (solid), solid `accent` (superb). Recovery uses `soft`/`accent`, orange 14% mix with `orange-text`, red 12% mix with `red-text`.

### Cards / Containers
- **Corner Style:** 22px.
- **Background:** `card` on `bg`.
- **Shadow Strategy:** none (see Elevation).
- **Border:** none.
- **Internal Padding:** 16px; tap cards 14px with press scale .97.
- **KPI tile:** `bg` on card, 16px radius, 12px padding, Rounded 1.6471rem numeral over a caption; good/bad numerals use `accent` / `orange-text`.

### Sections
Collapsible blocks with a full-width header button: uppercase footnote label in `mute`, a Rounded `ink` count, and a chevron that rotates -90deg when shut. The body collapses via `grid-template-rows` 1fr to 0fr over .3s. Settings uses native `details` as grouped rows with a `grabber`-coloured "›" that rotates 90deg open.

### Lists and Rows
- **Plan rows (Reminders):** 24px round tick + name/prescription, 11px padding, 0.5px separator. Unchecked tick is a `tick` ring; checked is a solid `accent` disc with a drawn `accent-ink` check and the name goes `mute` (no strikethrough). Press highlights `fill` after a 70ms delay so scrolling never flashes. Skipped rows sit at 55% with a strikethrough.
- **Workout rows:** 44px date tile (`fill`, 12px), title 600 + meta footnote, PR label in `orange-text`; press opacity .6.
- **Library rows:** 52px thumbnail (12px, white for photos, `fill` + Rounded initial when none), name/meta, Rounded `accent` best on the right.

### Inputs / Fields
- **Style:** borderless `fill`, 10-12px radius, 44-48px tall; numeric entries in Rounded 600 at 1.1765-1.2941rem. Chat input is a 23px-radius capsule.
- **Stepper:** 44px `fill` bar with `accent` +/- buttons and a centred Rounded value.
- **Set check:** 44px circle, `tick` outline, fills `accent` when done (row number disc fills too).
- **Switch:** iOS 51x31, `fill` track, white knob, `ring1` when on.
- **Focus:** 2px `accent` outline, 2px offset, everywhere; rows reset by `all: unset` get it back explicitly.

### Navigation
- **Phone tab bar:** floating glass capsule, 16px from the sides, max 440px, 54px items, five slots. A `fill` capsule indicator slides between slots on the spring (`--i`); active item is `accent` with heavier stroke and a small bump. The centre slot is the **Start disc**: a 50px conic-gradient progress ring (`--p`%) around a 42px `accent` disc with a play glyph, switching to a check when all is done. Hides (slides down) while typing.
- **Mac sidebar:** 220px material column, rows 8px radius, active row `fill` with `accent` text.
- **Large title + compact nav bar:** the 34px title scrolls away and a 48px material nav bar fades in with the title and a Rounded subtitle; tapping it scrolls to top.
- **Week strip:** seven pills in a 22px card; 36px day discs in Rounded, selected = `accent` disc, today = `accent` numeral, good day = inset `accent` ring, 3px progress bar beneath.

### Sheets
- **Sheet card:** `card`, 32px top radius, 36x5 grabber, height `min(85dvh, 680px)`; exercise sheet `min(92dvh, 820px)` with a sticky gradient footer.
- **Action sheet:** auto height; on phone floats inset with 34px corners above the home indicator.
- **Motion:** slides up from 100% over .5s on `--spring`, closes in .26s ease-in; drag down from anywhere once content is at scroll top, dismiss past 28% of height or a fast flick (>0.5px/ms, >30px), otherwise springs back.
- **Accessibility:** on open the card takes focus (tabindex -1, no ring, no keyboard pop); `.top, .view, .tabbar, .coachpill, .navbar` become `inert`; on close focus returns to the opener if it is still connected and not inert.

### Toast
Top-centred, `min(92vw, 420px)`, `material` glass, 18px radius, 0.5px `line` border, toast shadow; bold subhead line over a `mute` footnote. Drops in on an overshoot curve; tap to dismiss.

### Rest Timer
Inverted capsule (`ink` background, `bg` text) centred above the tab bar, Rounded 1.1765rem countdown, translucent grey capsule buttons. Vibrates on finish.

### Rings, Sparkline, Charts
- **Rings:** 88px Activity-style, 9px round-capped strokes in `ring1-3` over 18% tracks, offsets animate .7s.
- **Sparkline:** 38px, 2.2px `accent` polyline with end dot.
- **Line chart:** `line` grid, dashed `accent` milestone, raw points `mute` at 55%, 2.5px `accent` average, 12% `accent` area.
- **Heatmap:** 26-week grid of 3px-radius cells in `fill` mixed with `ring1`; today gets an inset `ink` ring.

### Motion
`--spring` (`cubic-bezier(.32,.72,0,1)`) drives sheets, the tab indicator, tab bar show/hide and button press. Content entrances use `cubic-bezier(.2,.8,.2,1)` (view rise with 40ms stagger, week slide, bar widths, rings). Overshoot curves are for small confirmations (tick pop, tab bump, modal pop, toast drop). Press feedback: scale .96 (.92 tab, .97 primary/tap card). CSS animations sit inside `prefers-reduced-motion: no-preference`; JS checks `calm()` and skips replays, bar/ring tweens, smooth scrolls, swipe animations and close animations. `haptic()` fires on completions (light) and on closing a day (strong): `navigator.vibrate` where present, the hidden iOS `switch` input tap otherwise.

## Do's and Don'ts

### Do:
- **Do** put new colours in `:root` and the dark block, and use `orange-text`/`red-text`/`mute`/`accent` for any coloured text.
- **Do** size type in rem against the 17px root, and cap fixed chrome with `min(rem, px)`.
- **Do** give every control a 44pt hit area; extend with a transparent pseudo-element rather than enlarging the drawn shape.
- **Do** use `fill` for neutral control backgrounds and `soft` for positive tints.
- **Do** use `--spring` for anything that moves in space, and gate every animation behind `prefers-reduced-motion` in CSS and `calm()` in JS.
- **Do** open new sheets through `showSheet()` and close through `fadeOut()` so focus, inert and drag reset stay correct.
- **Do** draw icons as inline line SVGs (24 viewBox, round caps, `currentColor`).
- **Do** bump `VERSION` in `sw.js` whenever `index.html` changes.

### Don't:
- **Don't** set text in `orange`, `red` or `ring*`; they fail contrast in light mode.
- **Don't** add shadows to cards or rows; elevation is for floating chrome only.
- **Don't** add another `backdrop-filter` surface on phone; four (tab bar, coach pill, nav bar, toast) is already the budget.
- **Don't** introduce a font beyond the three system stacks or a second accent hue.
- **Don't** use emoji as icons in new UI.

<!-- Known debts (not part of the system): emoji used as icons in places (🔥 streak, 🗓️, 🔒 locked, 🏆 badges, ✨ AI); four blur layers on phone; .warn uses literal hex instead of tokens; disclosure chevron is a text glyph. -->
