# TURFWAR — Judge & Evaluator Guide (docs/demo/JUDGE_GUIDE.md)

**Project:** TURFWAR — Browser-based Isometric Pixel-Art Economic RPG on NEAR  
**Audience:** Hackathon Judges, Evaluators, Reviewers  
**Estimated Review Time:** 2–5 minutes  

---

## 1. Quick Start

1. Open the game in your browser (e.g. `http://localhost:5173` or deployed preview URL).
2. On the **Title Screen**, admire the original 16-bit pixel-art emblem and frontier key art.
3. Click **"Enter Frontier (Demo Mode)"** to immediately enter the game without needing to set up a testnet wallet, OR click **"Connect NEAR Wallet"** to use an active NEAR Testnet account.
4. Use **WASD** or arrow keys to navigate your character through the isometric town square.

---

## 2. 5-Minute Evaluation Walkthrough

Follow these sequential steps to test each core system:

### Step 1: Resource Gathering (The Economic Source)
- Walk south-east out of Town Square into **Darkwood Edge**.
- Approach an **Iron Ore Vein** or **Ancient Oak**.
- Press **E** to interact. You will observe gathering animations, floating text (`+3 Iron Ore`), and immediate HUD inventory updates.

### Step 2: Autonomous AI Negotiation (Agent Economy & Dynamic Pricing)
- Walk to the **Blacksmith Forge** in Town Square.
- Click on **Garrick** (The Pragmatic Blacksmith) or press **E** when near him.
- Inspect his live workshop parameters: Treasury balance, Iron Ore stock vs. target, reserve floor.
- Open the **Negotiate / Sell** tab:
  - Garrick offers a dynamic quote calculated by our deterministic stock ratio formula.
  - Test a counter-offer or accept the trade.
  - Notice the atomic transfer: Iron Ore leaves your inventory, testnet NEAR/coins enter your balance, and Garrick's vault inventory increases.

### Step 3: NFT-Controlled Business Vault (NFTs That Do Something)
- Press **M** or click the **Marketplace** icon on the top navigation bar.
- Switch to the **Business Deeds** tab.
- Click on **"Blacksmith Forge Deed #1"**:
  - Review the deed's on-chain metadata, image, current owner, and linked vault ledger.
  - Note the management options: Configure minimum reserve floor, toggle autonomous manager (Garrick), or withdraw accrued fees.
  - Execute a test ownership transfer to observe the immediate permission hand-off: the new owner gains access while the old owner's control is instantly revoked.

### Step 4: Caravan Logistics & Escrow Mission (Escrow & Autonomous Business)
- Speak with **Saffron** (The Caravan Broker) at the caravan yard.
- Saffron posts a **Funded Escrow Bounty**: 5.0 NEAR reward to escort a Merchant Caravan carrying refined ingots through the bandit-prone Forest Trade Road.
- Accept the escort mission:
  - Watch the caravan wagon traverse the isometric route.
  - Encounter bandit pressure and defend the convoy.
  - Upon successful arrival at the destination outpost, the smart contract / server oracle verifies completion and disburses escrowed funds atomically.

### Step 5: Economy Time Machine (Economic Simulation)
- Click the **"Judge Mode / Simulation"** button in the top-right corner.
- Click **"Simulate 7 Game Days"**:
  - The deterministic economy engine executes 7 full cycles of player gathering, merchant restocking, equipment wear, upkeep deductions, and price adjustments.
  - View the before/after ledger, P&L statements for each AI merchant, and historical price charts proving long-term stability and non-inflationary balance.
