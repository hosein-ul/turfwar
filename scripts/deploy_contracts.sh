#!/usr/bin/env bash
set -e

echo "=== TURFWAR Smart Contract Deployment & Initialization ==="

CONTRACT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../contracts/near" && pwd)"
WASM_PATH="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/turfwar_contracts.wasm"

if [ ! -f "$WASM_PATH" ]; then
    echo "Building smart contract wasm..."
    RUSTFLAGS="--cfg near" cargo build --manifest-path "$CONTRACT_DIR/Cargo.toml" --target wasm32-unknown-unknown --release
fi

echo "Contract binary verified at: $WASM_PATH (Size: $(du -h "$WASM_PATH" | cut -f1))"

ACCOUNT_ID="${NEAR_CONTRACT_ID:-turfwar.testnet}"
NETWORK="${NEAR_NETWORK:-testnet}"

echo "Target Account: $ACCOUNT_ID"
echo "Network: $NETWORK"

cat <<EOF

To deploy to NEAR Testnet using near-cli or near-cli-rs:

1. near contract deploy $ACCOUNT_ID use-file $WASM_PATH without-init-call network-config $NETWORK sign-with-keychain send

2. Initialize contract state:
   near contract call-function as-transaction $ACCOUNT_ID new json-args '{"admin_id":"'$ACCOUNT_ID'"}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-as $ACCOUNT_ID network-config $NETWORK sign-with-keychain send

3. Mint Business Deed #1 (Blacksmith Forge):
   near contract call-function as-transaction $ACCOUNT_ID nft_mint json-args '{"token_id":"deed-blacksmith-01","receiver_id":"garrick.testnet","token_type":"BusinessDeed","metadata":{"title":"Blacksmith Forge Deed #1","description":"Town square forge and asset vault","media":"icon_deed_forge.png","issued_at":1700000000}}' prepaid-gas '100.0 Tgas' attached-deposit '0.01 NEAR' sign-as $ACCOUNT_ID network-config $NETWORK sign-with-keychain send

4. Mint Caravan Wagon #1 (Merchant Caravan):
   near contract call-function as-transaction $ACCOUNT_ID nft_mint json-args '{"token_id":"caravan-wagon-01","receiver_id":"saffron.testnet","token_type":"Caravan","metadata":{"title":"Merchant Wagon #1","description":"Tier 1 transport wagon with 50 capacity","media":"prop_wagon_caravan.png","issued_at":1700000000}}' prepaid-gas '100.0 Tgas' attached-deposit '0.01 NEAR' sign-as $ACCOUNT_ID network-config $NETWORK sign-with-keychain send

=== Contract Ready for Verification ===
EOF
