# TURFWAR — Hackathon Track Alignment & Verification (HACKATHON_TRACKS.md)

**Target Hackathon:** NEAR Horizon Hackathon  
**Project:** TURFWAR  
**Status:** Feature-Verified Matrix  

---

## 1. Primary Tracks

### Track 09 / GAM — Games With Real Economies
- **Requirement:** Dynamic prices driven by supply/demand/stock/liquidity; player-owned businesses; NPCs/AI merchants with contract-managed capital; meaningful sinks and a repeatable loop.
- **Implemented & Proven in TURFWAR:**
  1. *Dynamic Market Formula:* Authoritative deterministic pricing engine based on stock vs. target ratio, recent trade velocity, and business liquidity. No arbitrary price hallucinations.
  2. *Autonomous Capital:* Garrick (Blacksmith) operates an on-chain / contract-verified vault with strict reserve floors and working capital in NEAR.
  3. *Economic Sinks:* Raw resource gathering (Ore, Wood, Herbs) -> Blacksmith refinement -> Equipment crafting (Sword, Shield, Wagon parts) -> Durability degradation & repair fees -> Daily business upkeep.
  4. *Chain Settlement:* Seamless background settlement that does not interrupt real-time player movement or conversation.

### Track 10 / NFT — NFTs That Do Something
- **Requirement:** NFTs that control an economic vault, hold inventory/capital, earn protocol-enforced fees, carry stats/history, transfer permissions atomically upon ownership change, and list on an in-game market.
- **Implemented & Proven in TURFWAR:**
  1. *Business Deed NFTs (NEP-171):* Forges and Merchant Stalls minted on NEAR Testnet. Each deed ID maps to a smart-contract vault with treasury & multi-token inventory.
  2. *Dynamic Permission Hand-off:* Smart contract method `assert_owner_or_operator(token_id)` resolves the live NEP-171 `owner_of(token_id)`. When an NFT is sold or transferred, the previous owner is instantly locked out, and the buyer gains complete managerial control over treasury withdrawals, pricing policies, and manager assignment.
  3. *Caravan NFTs (NEP-171):* Wagons with on-chain attributes (cargo capacity, speed, durability, defense). Assigned to escrowed trade missions.
  4. *In-Game Marketplace:* Native listing and atomic settlement for deeds and caravans.

---

## 2. Secondary Tracks

### Track 07 / AGT — Agent Economy
- **Implemented:** Three autonomous agents (Garrick, Saffron, Vex) trade from bounded budgets, calculate deterministic quotes, sign typed offers with cryptographic nonces/expiries, hire player guards for caravan escort missions, and pay bounties.

### Track 04 / BUS — Autonomous Business
- **Implemented:** Blacksmith Forge Deed #1 runs autonomously with Garrick as designated manager under owner-configured policy parameters: minimum reserve floor (5.0 NEAR), maximum daily procurement spend (10.0 NEAR), target stock ratios, and auto-crafting thresholds.

### Track 05 / SWM — AI Swarms
- **Implemented:** Multi-agent interaction loop where Garrick's demand for iron ore triggers Saffron's logistics procurement caravan, while Vex attempts to undercut the market or fund competing ambush opportunities, reacting to price imbalances in real time.

### Track 06 / SEC — AI Security & Defense
- **Implemented:** Rigorous policy-governed agent wallets:
  - Methods scoped to permitted function calls.
  - Per-transaction and per-epoch spend caps.
  - Cryptographic quote nonces with expiration to prevent replay attacks.
  - Immutable audit logs recording prompt input, deterministic calculation, policy validation, and on-chain transaction hash.
  - Instant owner emergency pause / revocation switch.

---

## 3. Deliberately Deferred Tracks (Honesty Policy)

- **11 / MEM — Memecoins With Mechanics:** We intentionally do not launch a speculative `$TURF` memecoin for MVP. Game mechanics are settled directly in testnet NEAR and verified NEP-171/multi-token inventory balances.
- **01 / DFI — Unstoppable DeFi:** Cross-chain intent liquidity bridges are deferred to post-hackathon mainnet roadmap to ensure rock-solid stability and zero simulated illusions.
