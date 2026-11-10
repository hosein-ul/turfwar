# TURFWAR — NEAR Integration Architecture (docs/architecture/near-integration.md)

**Target Network:** NEAR Testnet  
**Rust Compiler:** rustc 1.99.1 (target: `wasm32-unknown-unknown`)  
**NEAR Rust SDK:** `near-sdk = "5.30.1"`  
**Token Standards Implemented:** NEP-171 (NFT Core), NEP-177 (NFT Metadata), NEP-297 (Events), NEP-145 (Storage Management)

---

## 1. Verified Official Standards & APIs

### 1.1 NEP-171: Non-Fungible Token Standard
Used for unique game assets where provenance, individual attributes, and governance ownership matter:
- **Business Deed NFTs:** Unique land/building titles (`token_id`: `deed-blacksmith-01`, `deed-merchant-01`).
- **Caravan NFTs:** Unique logistics wagons (`token_id`: `caravan-wagon-01`, `caravan-courier-01`).
- **Standard Methods:**
  - `nft_transfer(receiver_id, token_id, approval_id, memo)`
  - `nft_transfer_call(receiver_id, token_id, approval_id, memo, msg)`
  - `nft_token(token_id) -> Option<Token>`
  - `nft_total_supply() -> U128`
  - `nft_tokens(from_index, limit) -> Vec<Token>`
  - `nft_tokens_for_owner(account_id, from_index, limit) -> Vec<Token>`

### 1.2 NFT-Linked Asset Vault Architecture
A core innovation for the "NFTs That Do Something" track:
- In conventional contracts, accounts own vaults. In TURFWAR, **an NFT owns a vault**.
- State representation:
  ```rust
  pub struct BusinessVault {
      pub token_id: TokenId,
      pub business_type: BusinessType,
      pub treasury_balance: Balance, // yoctoNEAR
      pub inventory: HashMap<ResourceId, u32>,
      pub manager_account: Option<AccountId>,
      pub policy: BusinessPolicy,
      pub accrued_fees: Balance,
      pub operational_status: OperatingStatus,
      pub last_upkeep_epoch: u64,
  }
  ```
- **Permission Enforcement:**
  Any call to `manage_business`, `withdraw_treasury`, `set_pricing_policy`, or `assign_manager` invokes `assert_owner_or_authorized(&token_id)`.
  When a deed NFT transfers to an account, `token.owner_id` updates immediately. The previous owner loses all execution privileges instantly.

### 1.3 Escrow & Bounty Contract
Used for Caravan Escort and Trade Ambush missions:
- A merchant (agent or player) locks funds into an escrow record (`bounty_id`, `issuer_id`, `caravan_token_id`, `reward_amount`, `collateral_amount`, `expiry_epoch`, `status`).
- Participants sign onto the mission.
- Upon mission completion, the server oracle / authorized judge calls `settle_mission(bounty_id, outcome, winner_id)`, releasing escrowed NEAR and adjusting inventory automatically.

### 1.4 NEP-297 Standard Event Emits
All contract mutations emit formatted JSON logs:
```json
EVENT_JSON:{"standard":"nep171","version":"1.0.0","event":"nft_transfer","data":[{"old_owner_id":"player1.testnet","new_owner_id":"player2.testnet","token_ids":["deed-blacksmith-01"]}]}
```

---

## 2. Wallet & Client Integration

- **Wallet Connection Strategy:**
  - Support `@near-wallet-selector/core` with standard browser wallets (Meteor, Here Wallet, MyNearWallet) on NEAR Testnet.
  - **Guest / Demo Mode:** For frictionless evaluation, users can explore, trade, gather, and interact with agents in instantaneous local/simulated demo mode without needing testnet gas or setup. The UI makes the active mode explicitly transparent.
- **Agent Server Keys:**
  - Agent accounts (`garrick.testnet`, `saffron.testnet`, `vex.testnet`) use server-managed private keys stored in environment variables, bounded by function-call access key allowances and per-epoch spending caps.
