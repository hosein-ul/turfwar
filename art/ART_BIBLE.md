# TURFWAR — Pixel Art Bible & Style Guide (art/ART_BIBLE.md)

**Project:** TURFWAR  
**Art Director:** Antigravity  
**Visual Style:** 16-bit Isometric Fantasy Frontier RPG (Original Art Direction)  
**Target Reference:** Classic mid-90s isometric tactical & economic RPGs (Tactics Ogre, Final Fantasy Tactics, Breath of Fire III, Suikoden II) updated with modern crisp rendering.

---

## 1. Camera & Geometry

- **Projection:** Strict 2:1 Dimetric ("Isometric") Projection.
  - Horizontal axis: 2 pixels wide for every 1 pixel vertical step ($\arctan(0.5) \approx 26.565^\circ$).
  - Logical Ground Tile Size: **64 × 32 pixels** (width × height).
  - High-res tile render: 128 × 64 or 256 × 128 downsampled with nearest-neighbor.
- **Lighting Direction:**
  - Primary Key Light: Top-Left at $45^\circ$ elevation.
  - Shadows fall towards the Bottom-Right.
  - Ambient bounce light: Subtle cool slate fill in shadowed recesses.
- **Depth Sorting Anchor:**
  - Every building, prop, and character has its anchor placed at the **exact center-bottom of its ground contact footprint**.
  - Depth sort index $Z = Y_{world} + (X_{world} \times 0.001)$.

---

## 2. Core Color Palette

A cohesive, warm, medieval frontier palette limited to 32 carefully tuned tones across 6 material ramps:

### Stone & Earth (Sandstone / Cobblestone / Dirt)
- `#1E1B18` — Deep Umber Shadow
- `#3D352E` — Weathered Stone Dark
- `#6B5E4F` — Dry Sandstone Midtone
- `#9E8C76` — Frontier Cobble Light
- `#C8B69E` — Sun-Bleached Highlight

### Timber & Leather (Walnut / Oak / Cask)
- `#140C07` — Deep Crevice Black-Brown
- `#2E1B0E` — Dark Walnut Core
- `#54361C` — Hewn Oak Midtone
- `#85572E` — Worn Timber Light
- `#B57E4A` — Polished Wood Edge

### Metals (Aged Iron / Brass / Frontier Gold)
- `#1A1D20` — Wrought Iron Shadow
- `#3A4148` — Cast Iron Midtone
- `#6A737D` — Burnished Steel Edge
- `#B0B8C0` — Blade Highlight
- `#4A3510` — Dark Antique Bronze
- `#8A671C` — Frontier Brass Midtone
- `#D4A232` — Guild Gold Highlight
- `#F8DE7E` — Gleaming Minting Glint

### Nature & Foliage (Darkwood Pine / Herbs / Moss)
- `#0D1F12` — Deep Forest Undergrowth
- `#1C3B24` — Darkwood Pine Needle
- `#34633D` — Temperate Leaf Green
- `#5B9660` — Sunlit Meadow Green
- `#93C78B` — Fresh Herb Sprout

### Light & Atmosphere (Lantern Flame / Forge Glow / Torch)
- `#401205` — Hearth Ember Shadow
- `#A8350A` — Forge Flame Red-Orange
- `#E87A18` — Tavern Lantern Amber
- `#F7BD36` — Warm Candle Glow
- `#FFF3B0` — Incandescent Spark Highlight

### Water & Sky (Mountain Stream / Dusk Glaze)
- `#132533` — Deep River Basin
- `#244B66` — Flowing Stream Blue
- `#487D9C` — Cresting Ripple Cyan
- `#8CB9D1` — Water Surface Reflection

---

## 3. Pixel Clustering & Line Rules

- **Cluster Density:** Broad, deliberate pixel clusters. No single stray floating pixels ("pixel noise" or "confetti"). Every cluster must describe volume, plane transition, or specular highlight.
- **Outlines:**
  - *Selective Outlines (Sel-out):* External silhouettes against different materials have a dark contextual outline (never pure `#000000`, use the darkest ramp tone `#140C07` or `#1A1D20`).
  - *Internal Boundaries:* Lighted edges use color-based contrast rather than black lines.
- **Anti-Aliasing:** Handcrafted anti-aliasing only at critical diagonal transitions (2:1 slopes). Never apply automatic bilinear filtering, FXAA, or blur shaders.
- **Rendering Mode:** Strict nearest-neighbor (`image-rendering: pixelated; crisp-edges`).

---

## 4. Characters & Proportions

- **Scale:** Characters are **32 to 40 pixels tall** (standing idle).
- **Proportions:** Heroic 16-bit RPG proportions (~3.5 to 4 heads tall).
  - Head + Hat/Hair: 10–12 px
  - Torso + Coat: 10–12 px
  - Legs + Boots: 12–14 px
- **Readability:** High-contrast silhouettes. Distinctive hats, cloaks, tools, and accessories so player, Garrick (blacksmith apron + hammer), Saffron (caravan cloak + ledger), and Vex (dark cowl + dagger) are recognizable in a 1-second glance.
- **Directions:** 4 isometric directions: South-East (SE, facing front-right), South-West (SW, facing front-left), North-East (NE, facing rear-right), North-West (NW, facing rear-left).

---

## 5. Architecture & Props

- **Buildings:**
  - Multi-part isometric models with distinct foundations, walls, timber framework, and tiled/thatched roofs.
  - Entrances must align cleanly with the 64×32 ground grid.
  - Footprint boundaries must be clearly flagged for collision polygons.
- **Props:**
  - Barrels, crates, anvils, weapon racks, ore nodes, herb patches, street lanterns.
  - All cast grounded drop-shadows towards bottom-right.

---

## 6. UI Visual Identity

- **Frame Material:** Dark walnut timber bordered with aged iron and brass decorative corner rivets.
- **Content Surface:** High-contrast warm parchment (`#EFE4CD` to `#D8C7A5`) with dark sepia ink text (`#2A1D13`) for maximum legibility.
- **Font Hierarchy:**
  - Header / Banner Titles: Authentic 16-bit serif / display pixel font.
  - Numbers / Labels / Stats: Crisp 8px monospace pixel font (`Silkscreen`, `Press Start 2P`, or custom pixel bitmap).
  - Dialogue / Long Descriptions: Clean high-contrast legible font rendered at integer scales.
- **Interactive Feedback:**
  - Hover: Brass rim glint + 1px vertical lift.
  - Pressed: 1px downward inset + warm amber glow.
  - Disabled: Desaturated charcoal slate with 40% opacity.

---

## 7. Style Comparison Rules

| Characteristic | Accepted (TURFWAR Style) | Rejected (Do Not Use) |
|---|---|---|
| **Projection** | Strict 2:1 isometric grid | Perspective foreshortening or top-down flat |
| **Colors** | 32-color curated warm medieval palette | Harsh neon, rainbow palettes, muddy auto-gradients |
| **Pixels** | Handcrafted clusters, sharp crisp edges | AI smudges, smoothed vector edges, bilinear blur |
| **Outlines** | Colored selective outlines (Sel-out) | Chunky thick cartoon black lines or missing silhouettes |
| **Lighting** | Consistent top-left directional key light | Multi-directional conflicting shadows, ambient occlusion mush |
| **Characters** | 3.5–4 heads tall, strong silhouette | Realistic 8-head proportions (unreadable at scale) or chibi 1.5-head |
