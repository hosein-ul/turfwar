# TURFWAR — Security Architecture & Threat Model (docs/security/THREAT_MODEL.md)

**Project:** TURFWAR  
**Status:** Implemented Mitigations  

---

## 1. Security Principles

1. **Least-Privilege Execution:** Keys stored server-side never have full account access keys when function-call keys with bounded allowances suffice.
2. **Zero Client Trust:** The frontend web client is treated as an untrusted presentation layer. Hitboxes, inventory counts, gathering rate-limits, and trading prices are strictly computed and verified on the authoritative server or smart contract.
3. **Dynamic Ownership Verification:** Any contract interaction attempting to administer a vault or transfer assets resolves the current NFT owner at runtime.

---

## 2. Threat Analysis Matrix

| Threat Actor / Vector | Specific Hazard | Mitigation in TURFWAR | Test / Verification Method |
|---|---|---|---|
| **Malicious Player** | Tampering with client memory or WebSocket packets to send fake inventory or high scores. | Server-authoritative action engine; client only submits signed intents (`gather_resource`, `buy_item`). Server validates inventory and node proximity. | Unit tests in `packages/game-rules` verifying illegal action rejection. |
| **Old NFT Owner** | User sells or transfers a Business Deed NFT on the marketplace, then attempts to withdraw funds from the linked vault. | Contract method `assert_owner_or_operator(token_id)` queries `nft_token.owner_id`. Transfer immediately updates this mapping. Previous owner call reverts. | Contract integration test: `test_old_owner_cannot_withdraw_after_transfer`. |
| **Hallucinating / Rogued AI Agent** | LLM planner attempts to spend unlimited funds or sell inventory at 0 NEAR. | **Deterministic Policy Firewall:** All agent actions must pass through `agent-policy` validation before reaching the execution layer. Spend caps, minimum reserve floor, and price multiplier clamps prevent rogue actions. | Agent policy test: `test_agent_policy_rejects_below_reserve`. |
| **Replay Attack on Quotes** | Player intercepts an advantageous merchant quote and resubmits it repeatedly after market conditions shift. | Every signed merchant quote contains a `nonce`, a short `expiry_timestamp` (300 seconds), buyer account ID, and specific quantity. Quotes are marked spent atomically upon execution. | Contract & backend test: `test_quote_replay_rejected`. |
| **Race Condition / Double Purchase** | Two buyers attempt to purchase the same listed Caravan NFT simultaneously. | Smart contract executes atomic status transition: `status: Active -> Sold`. The second transaction fails atomically with `ERR_LISTING_ALREADY_SOLD`. | Concurrent purchase simulation test. |
| **Front-Running / MEV on Bounties** | An eavesdropper observes a caravan mission completion and attempts to claim the payout without escorting. | Only registered mission participants stored in the escrow record at creation/join time are eligible for disbursement upon oracle validation. | Escrow test: `test_unregistered_claim_fails`. |
| **Key Exposure Hazard** | Private keys embedded in frontend bundle or client localStorage. | Zero private keys in frontend bundles. Client uses standard NEAR wallet popup/extension or ephemeral session keys. Agent keys are stored in secure environment secrets server-side. | Frontend bundle inspection & linter checks. |

---

## 3. Pause & Circuit Breaker Mechanisms

- Each agent can be placed in `PAUSED` state by the contract administrator or assigned deed owner.
- Marketplace listings feature an emergency pause function restricting new purchases during contract upgrades while protecting escrowed capital.
