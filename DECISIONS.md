# TURFWAR — Architecture & Product Decisions (DECISIONS.md)

**Project:** TURFWAR — Browser-based Isometric Pixel-Art Economic RPG on NEAR  
**Date:** 2026-11-10  
**Status:** Living Document  

---

## 1. Engine & Rendering Choice

- **Decision:** Use Phaser (v3.87+ stable canvas/WebGL engine) integrated cleanly with React 19 / Vite.
- **Rationale:** Phaser provides robust 2:1 isometric coordinate math, depth sorting based on foot/anchor points, nearest-neighbor pixel-art scaling without blur (`pixelArt: true`), tilemap layer rendering, and camera pan/zoom. React provides responsive HUD overlays, modal dialogs, marketplace UI, inventory grids, and wallet connection states.
- **Pixel Art Scaling:** Standard 64×32 logical isometric ground grid with integer 2×/3× scaling. Crisp edges, no bilinear filtering.

---

## 2. Smart Contract Architecture (NEAR Testnet)

- **Decision:** Build a cohesive Rust smart contract using `near-sdk` (v5.x) implementing:
  1. **NEP-171 & NEP-177:** Non-Fungible Token standard for Business Deeds (Forge, Stall, Workshop) and Caravans (Merchant Wagon, Courier, Armored).
  2. **NFT-Linked Asset Vaults:** Each Business Deed NFT controls an on-chain/contract-verified vault holding treasury balance (yoctoNEAR) and inventory balances.
  3. **Ownership-Governed Permissions:** Privileged vault methods dynamically resolve `owner_of(token_id)` at execution time. On NFT transfer, vault management permissions transfer instantaneously to the new owner, revoking previous owner access.
  4. **Multi-Asset Ledger:** Multi-token / resource balances (Wood, Iron Ore, Herbs, Refined Ingot, Weapons, Caravan parts) with atomic minting and burning.
  5. **Escrow & Bounty System:** Funded caravan escort/trade bounties where client/agent locks collateral, outcome is validated by server oracle / authorized judge, and funds disburse atomically.
  6. **NEP-297 Standard Events:** Emits structured JSON events (`EVENT_JSON:{"standard":"nep171",...}`) for indexers and game activity feeds.
- **Rationale:** Keeping the core vault and market mechanics closely bound to the NEP-171 token state minimizes cross-contract asynchronous failure hazards and ensures atomic settlement for game loops.

---

## 3. Autonomous AI Agents & Hybrid Cognition

- **Decision:** Implement a three-agent autonomous economy:
  1. **Garrick (Blacksmith):** Margin-focused, raw material buyer, equipment crafter/repairer. Strict reserve floor policy.
  2. **Saffron (Caravan Broker):** Spatial arbitrageur, route planner, escort bounty poster, risk-adjusted employer.
  3. **Vex (Opportunistic Trader / Rival):** Exploits inventory imbalances, undercuts quotes, initiates competing/raid bounties within policy caps.
- **Hybrid Cognition Architecture:**
  - *Perception:* Structured world & market snapshots.
  - *Memory:* Episodic log of player interactions, fulfilled/broken agreements, trade outcomes.
  - *Planning:* Deterministic fallback planner (guarantees 100% uptime and testability) with optional LLM reasoning/natural language negotiation.
  - *Policy & Safety Engine:* Hard-coded spend caps, reserve floors, rate limits, and cryptographic signed quotes (nonce, expiry, counterpart, price).
  - *Audit Trail:* Full decision logging for judge inspection.

---

## 4. Visual Art & Image-Generation Strategy

- **Decision:** Use the native AI image generation tool (`generate_image`) to create original 16-bit isometric pixel-art assets:
  - Brand identity crest & title key art
  - 2:1 isometric ground tiles (grass, cobblestone, dirt, water, road)
  - Standalone town buildings (Blacksmith Forge, Merchant Stall, Tavern/Inn)
  - Interactive world props (ore nodes, wood trees, barrels, crates, lanterns)
  - Character sprites & portraits (Player, Garrick, Saffron, Vex, Guards)
  - Caravan wagons & items
  - Pixel-art UI skins and textures
- **Post-Processing:** Python Pillow pipeline for alpha transparency cleanup, bounding-box cropping, grid alignment, and sprite-sheet atlas assembly.

---

## 5. Persistence & Server Authoritative Model

- **Decision:** Server-authoritative Node.js + TypeScript service with WebSocket real-time broadcast and SQLite / persistent file storage for development & demo portability.
- **Rationale:** Ensures immediate zero-friction startup for judges without requiring external Postgres/Redis daemon setup, while maintaining strict server validation against client tampering.

---

## 6. Demo & Judge Modes

- **Decision:** Provide a one-click "Demo Scenario / Judge Mode" in the web client that enables:
  - Instant scenario reset & deterministic simulation ("Simulate 7 Game Days")
  - Live inspection of agent balances, policies, memory, and reserve floors
  - Step-by-step verified testnet transaction links
  - Toggle between Testnet wallet connection and local verified demo mode

---

## 7. Image Generation Tool Quota & Procedural Pixel Art Pipeline

- **Observation:** `generate_image` tool successfully generated three foundational 16-bit master visual assets (`turfwar_emblem`, `turfwar_title_bg`, `building_blacksmith`) before hitting the upstream API quota (`gemini-3.1-flash-image`).
- **Policy Compliance:** In strict adherence to Section 8.3 of the Master Build Prompt ("Do not pretend that image generation happened... create a complete art/prompts/ directory containing ready-to-run prompts and an asset manifest"), all prompts are fully recorded in `art/prompts/PROMPTS.md`.
- **Synthesis Engine:** Created `scripts/process_art.py` using Python Pillow to crop, achieve alpha transparency on generated assets, and synthesize 2:1 isometric ground tiles (64×32), interactive world props, 4-direction character spritesheets, and 32×32 item icons following the 32-color ramp from `art/ART_BIBLE.md`.

---

## 8. Rust Smart Contract SDK (near-sdk v5.7) & Testing Architecture

- **Toolchain:** `rustc 1.99.1` with `wasm32-unknown-unknown` target.
- **WASM Compilation:** Compiled with `RUSTFLAGS="--cfg near" cargo build --manifest-path contracts/near/Cargo.toml --target wasm32-unknown-unknown --release`, generating an optimized 448 KB WebAssembly binary (`turfwar_contracts.wasm`).
- **Unit Testing:** Utilizes `near-sdk`'s `unit-testing` mockchain feature under `[dev-dependencies]` to execute unit tests on x86_64 host without external testnet dependencies. 5 unit tests passed proving dynamic NFT owner lockout and escrow outcomes.

