# ⚔️ TURFWAR — Browser-Based Isometric Pixel-Art Economic RPG on NEAR

**Version:** 3.0 — Greenfield, Image-Generated Art, NFT-First  
**Target:** Browser-based isometric pixel-art economic RPG on NEAR  
**Tagline:** Build your fortune. Shape the frontier.  

---

## 🌟 Overview

**TURFWAR** is an isometric pixel-art economic RPG where human players and autonomous AI agents inhabit the same persistent-feeling frontier town and participate in a single shared economy.

The economy *is* the gameplay. Autonomous merchants own working capital, quote mathematically bounded dynamic prices, buy raw materials, smelt ingots, craft equipment, hire caravan escorts, and face real risk of insolvency if upkeep exceeds income. Players gather raw materials in the dangerous wilderness of Darkwood Edge, trade with AI merchants, craft equipment at the town forge, escort caravans backed by on-chain escrow, and acquire functional **Business Deed and Caravan NFTs** whose associated asset vaults dynamically follow NFT ownership.

---

## 🏆 Hackathon Track Alignment & Feature Verification

| Track ID | Track Name | Status | Verified Implementation in TURFWAR |
|---|---|---|---|
| **09 / GAM** | **Games With Real Economies** | **PRIMARY** | NPCs/merchants operate on-chain/contract capital; dynamic pricing based on stock ratio and trade velocity; durable sinks (smelting, durability repair, building upkeep). |
| **10 / NFT** | **NFTs That Do Something** | **PRIMARY** | NEP-171 Business Deed NFTs control on-chain asset vaults (treasury yoctoNEAR + multi-token inventory). Transferring the NFT immediately transfers vault control and locks out the previous owner. |
| **07 / AGT** | **Agent Economy** | **SECONDARY** | Three autonomous agents (Garrick, Saffron, Vex) trade from bounded budgets, calculate deterministic quotes, and sign typed offers with nonces and expiries. |
| **04 / BUS** | **Autonomous Business** | **SECONDARY** | Blacksmith Forge Deed #1 operates autonomously with Garrick as manager under owner-configured reserve floors (5.0 NEAR) and daily procurement caps. |
| **05 / SWM** | **AI Swarms** | **SECONDARY** | Multi-agent coordination: Garrick's demand for ore triggers Saffron's logistics caravan bounty, while Vex scouts price spreads and attempts to undercut quotes. |
| **06 / SEC** | **AI Security & Defense** | **SECONDARY** | Policy-controlled agent wallets, runtime ownership verification (`assert_owner_or_operator`), spending limits, and decision audit logs. |

*Detailed track proof available in [HACKATHON_TRACKS.md](file:///home/antigravity/HACKATHON_TRACKS.md).*

---

## 🎨 Visual Identity & Asset Generation

The art direction follows an original 16-bit-inspired fantasy frontier aesthetic with strict 2:1 isometric projection, carefully controlled pixel clusters, and a curated 32-color warm medieval palette.

Key generated and processed visual assets:
- **Brand Emblem Crest:** Handcrafted 16-bit shield, crossed warhammer and pickaxe, gold coin, and frontier wheat motif (`art/processed/brand/emblem.png`).
- **Title Screen Key Art:** Golden hour view of the cobblestone town square, smoking blacksmith forge, market stalls, and mountain forest (`art/processed/brand/title_bg.jpg`).
- **Blacksmith Forge Building:** Standalone transparent isometric workshop with stone masonry, timber framing, and glowing hearth (`art/processed/buildings/blacksmith_256.png`).
- **2:1 Isometric Ground Tiles:** 64×32 tiles for Cobblestone, Meadow Grass, Dirt Road, Flowing Stream, Forest Floor, and Stone Curb (`art/processed/tiles/`).
- **Interactive Harvest Nodes & Props:** Granite Iron Ore Node, Ancient Oak, Silverleaf Herb, Covered Merchant Wagon, Crates, and Anvil (`art/processed/props/`).
- **Character Sprites & Portraits:** 4-directional 16-bit spritesheets and 64×64 dialogue portraits for Player, Garrick, Saffron, and Vex (`art/processed/characters/`, `art/processed/portraits/`).

*Review the complete visual showcase in [art_gallery.md](file:///home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/3fd50577-88b0-48fa-a993-fa28e5ea2e53/art_gallery.md) and style rules in [art/ART_BIBLE.md](file:///home/antigravity/art/ART_BIBLE.md).*

---

## 🏗️ Architecture & Tech Stack

```text
apps/
  web/                     # React 19 + Vite + Phaser 2:1 isometric canvas + Retro RPG UI
services/
  server/                  # Node.js + Express + WebSockets + authoritative game engine
contracts/
  near/                    # Rust NEP-171 NFT & Asset Vault smart contract (wasm32 target)
packages/
  shared-types/            # Canonical TypeScript interfaces
  economy-engine/          # Deterministic dynamic pricing formula & 7-day simulation engine
art/
  generated/               # Raw AI-generated visual outputs
  processed/               # Game-ready cropped, transparent, and scaled pixel-art assets
  ART_BIBLE.md             # Art guidelines, color palette, and cluster standards
docs/
  architecture/            # System overview and NEAR testnet integration docs
  economy/                 # Economic closed-loop model & mathematical pricing formulas
  security/                # Threat model and vulnerability mitigations
  demo/                    # 5-minute judge walkthrough guide
```

---

## ⚡ Quick Start & Local Execution

### 1. Prerequisites
- Node.js v24+
- `pnpm` v12+
- Rust 1.80+ with `wasm32-unknown-unknown` target

### 2. Install & Build
```bash
# Install workspace dependencies
pnpm install

# Build shared types, economy engine, server, and web frontend
pnpm --filter @turfwar/shared-types build
pnpm --filter @turfwar/economy-engine build
pnpm --filter @turfwar/server build
pnpm --filter @turfwar/web build
```

### 3. Run Automated Tests
```bash
# Run economy engine unit tests
pnpm --filter @turfwar/economy-engine test

# Run server authoritative action tests
pnpm --filter @turfwar/server test

# Run Rust NEAR smart contract tests (5 test suites including dynamic owner lockout)
cargo test --manifest-path contracts/near/Cargo.toml
```

### 4. Start Local Development Services
```bash
# Start backend authoritative server (Port 3001)
pnpm --filter @turfwar/server start

# In a separate terminal, start web frontend (Port 5173)
pnpm --filter @turfwar/web preview --port 5173 --host
```

Open `http://localhost:5173` in your browser.

---

## 📜 NEAR Testnet Smart Contracts

The contract is written in Rust using `near-sdk` (v5.x), compiling to WebAssembly (`wasm32-unknown-unknown`):

- **Binary:** `contracts/near/target/wasm32-unknown-unknown/release/turfwar_contracts.wasm` (Size: 448 KB)
- **Deployment Script:** `scripts/deploy_contracts.sh`
- **Features Implemented & Tested:**
  1. `nft_mint`: Mints Business Deeds and Caravan NFTs with NEP-177 metadata.
  2. `nft_transfer`: Transfers NFT ownership and automatically updates linked asset vault permissions.
  3. `vault_deposit`: Credits vault treasury in yoctoNEAR.
  4. `vault_withdraw`: Validates `predecessor_account_id == owner_of(token_id)` at execution time.
  5. `market_list_nft` / `market_buy_nft`: Fixed-price atomic marketplace settlement.
  6. `bounty_create` / `bounty_settle`: Funded escrow contracts for caravan transport missions.

---

## 🎮 5-Minute Judge Walkthrough

1. Open `http://localhost:5173` and click **"Enter Frontier (Guest Demo)"**.
2. **Move & Gather:** Walk south-east with WASD into **Darkwood Edge**. Press **E** near an Iron Ore Cliff Vein or Ancient Oak to harvest resources. Notice the floating text and inventory update.
3. **Trade & Negotiate:** Approach **Garrick** at the Town Forge. Open the trade modal to view dynamic pricing calculated from forge stock targets. Submit a counter-offer or execute a trade.
4. **Inspect Asset Vaults:** Open **NFT Deeds** in the bottom hotbar. View Blacksmith Forge Deed #1. Execute a test transfer to observe immediate permission hand-off: the new owner gains access while the previous owner is instantly locked out.
5. **Caravan Escort:** Open **Bounties**. Accept Saffron's 5.0 NEAR escort contract. Watch the caravan wagon traverse the route and claim the escrow payout upon safe arrival.
6. **Time Machine Simulation:** Click **Judge Mode** in the top-right corner. Click **"Run 7-Day Simulation"** to view a full reproducible ledger breakdown of trade volume, fee burns, and agent P&L statements.

*Full details in [JUDGE_GUIDE.md](file:///home/antigravity/docs/demo/JUDGE_GUIDE.md).*
