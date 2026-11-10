use near_sdk::json_types::U128;
use near_sdk::{env, near, AccountId, NearToken, Promise};
use std::collections::HashMap;

pub mod models;
use models::*;

#[near(contract_state)]
pub struct TurfWarContract {
    pub admin_id: AccountId,
    pub tokens: HashMap<TokenId, Token>,
    pub tokens_per_owner: HashMap<AccountId, Vec<TokenId>>,
    pub vaults: HashMap<TokenId, BusinessVault>,
    pub caravan_stats: HashMap<TokenId, CaravanStats>,
    pub market_listings: HashMap<TokenId, MarketListing>,
    pub escrow_bounties: HashMap<String, EscrowBounty>,
    pub market_fee_bps: u16, // 250 = 2.5%
}

impl Default for TurfWarContract {
    fn default() -> Self {
        Self {
            admin_id: "turfwar-admin.testnet".parse().unwrap(),
            tokens: HashMap::new(),
            tokens_per_owner: HashMap::new(),
            vaults: HashMap::new(),
            caravan_stats: HashMap::new(),
            market_listings: HashMap::new(),
            escrow_bounties: HashMap::new(),
            market_fee_bps: 250,
        }
    }
}

#[near]
impl TurfWarContract {
    #[init]
    pub fn new(admin_id: AccountId) -> Self {
        Self {
            admin_id,
            tokens: HashMap::new(),
            tokens_per_owner: HashMap::new(),
            vaults: HashMap::new(),
            caravan_stats: HashMap::new(),
            market_listings: HashMap::new(),
            escrow_bounties: HashMap::new(),
            market_fee_bps: 250,
        }
    }

    // =========================================================
    // NEP-171 NON-FUNGIBLE TOKEN CORE
    // =========================================================

    pub fn nft_mint(
        &mut self,
        token_id: TokenId,
        receiver_id: AccountId,
        token_type: TokenType,
        metadata: TokenMetadata,
    ) -> Token {
        assert!(
            env::predecessor_account_id() == self.admin_id,
            "Only admin can mint root NFTs"
        );
        assert!(!self.tokens.contains_key(&token_id), "Token already exists");

        let token = Token {
            token_id: token_id.clone(),
            owner_id: receiver_id.clone(),
            token_type: token_type.clone(),
            metadata,
        };

        self.tokens.insert(token_id.clone(), token.clone());
        self.tokens_per_owner
            .entry(receiver_id.clone())
            .or_default()
            .push(token_id.clone());

        // Initialize linked state based on token type
        match token_type {
            TokenType::BusinessDeed => {
                let default_vault = BusinessVault {
                    token_id: token_id.clone(),
                    business_type: "BLACKSMITH".to_string(),
                    treasury_balance: U128(0),
                    inventory: HashMap::new(),
                    manager_account: None,
                    operating_status: "ACTIVE".to_string(),
                    reserve_floor: U128(5_000_000_000_000_000_000_000_000), // 5 NEAR
                    max_daily_procurement: U128(15_000_000_000_000_000_000_000_000), // 15 NEAR
                    fee_basis_points: 500,
                    accrued_fees: U128(0),
                };
                self.vaults.insert(token_id.clone(), default_vault);
            }
            TokenType::Caravan => {
                let default_stats = CaravanStats {
                    token_id: token_id.clone(),
                    cargo_capacity: 50,
                    speed: 10,
                    armor: 20,
                    durability: 100,
                    max_durability: 100,
                    status: "IDLE".to_string(),
                    successful_missions: 0,
                    losses: 0,
                };
                self.caravan_stats.insert(token_id.clone(), default_stats);
            }
            TokenType::Equipment => {}
        }

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"nep171\",\"version\":\"1.0.0\",\"event\":\"nft_mint\",\"data\":[{{\"owner_id\":\"{}\",\"token_ids\":[\"{}\"]}}]}}",
            receiver_id, token_id
        ));

        token
    }

    pub fn nft_token(&self, token_id: TokenId) -> Option<Token> {
        self.tokens.get(&token_id).cloned()
    }

    pub fn nft_total_supply(&self) -> U128 {
        U128(self.tokens.len() as u128)
    }

    pub fn nft_tokens_for_owner(
        &self,
        account_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>,
    ) -> Vec<Token> {
        let token_ids = self.tokens_per_owner.get(&account_id);
        if let Some(ids) = token_ids {
            let start = from_index.map(|i| i.0 as usize).unwrap_or(0);
            let take_limit = limit.unwrap_or(50) as usize;
            ids.iter()
                .skip(start)
                .take(take_limit)
                .filter_map(|id| self.tokens.get(id).cloned())
                .collect()
        } else {
            vec![]
        }
    }

    pub fn nft_transfer(
        &mut self,
        receiver_id: AccountId,
        token_id: TokenId,
        _approval_id: Option<u64>,
        memo: Option<String>,
    ) {
        let sender_id = env::predecessor_account_id();
        let token = self.tokens.get_mut(&token_id).expect("Token not found");
        assert_eq!(token.owner_id, sender_id, "Unauthorized: caller is not NFT owner");

        let previous_owner = token.owner_id.clone();
        token.owner_id = receiver_id.clone();

        // Update ownership lists
        if let Some(ids) = self.tokens_per_owner.get_mut(&previous_owner) {
            ids.retain(|id| id != &token_id);
        }
        self.tokens_per_owner
            .entry(receiver_id.clone())
            .or_default()
            .push(token_id.clone());

        // Cancel any active market listing for this token
        self.market_listings.remove(&token_id);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"nep171\",\"version\":\"1.0.0\",\"event\":\"nft_transfer\",\"data\":[{{\"old_owner_id\":\"{}\",\"new_owner_id\":\"{}\",\"token_ids\":[\"{}\"],\"memo\":\"{}\"}}]}}",
            previous_owner,
            receiver_id,
            token_id,
            memo.unwrap_or_default()
        ));
    }

    // =========================================================
    // NFT-LINKED ASSET VAULT (DYNAMIC PERMISSION VERIFICATION)
    // =========================================================

    pub fn vault_get(&self, token_id: TokenId) -> Option<BusinessVault> {
        self.vaults.get(&token_id).cloned()
    }

    #[payable]
    pub fn vault_deposit(&mut self, token_id: TokenId) {
        let deposit = env::attached_deposit().as_yoctonear();
        assert!(deposit > 0, "Attached deposit must be positive");
        let vault = self.vaults.get_mut(&token_id).expect("Vault not found for token");
        vault.treasury_balance = U128(vault.treasury_balance.0 + deposit);
    }

    pub fn vault_withdraw(&mut self, token_id: TokenId, amount: U128) -> Promise {
        let caller = env::predecessor_account_id();
        let token = self.tokens.get(&token_id).expect("Token not found");
        assert_eq!(
            token.owner_id, caller,
            "Security violation: Caller is not the current owner of this Business Deed NFT"
        );

        let vault = self.vaults.get_mut(&token_id).expect("Vault not found");
        assert!(
            vault.treasury_balance.0 >= amount.0,
            "Insufficient vault treasury balance"
        );

        vault.treasury_balance = U128(vault.treasury_balance.0 - amount.0);
        Promise::new(caller).transfer(NearToken::from_yoctonear(amount.0))
    }

    pub fn vault_configure(
        &mut self,
        token_id: TokenId,
        reserve_floor: U128,
        max_daily_procurement: U128,
        manager_account: Option<AccountId>,
    ) {
        let caller = env::predecessor_account_id();
        let token = self.tokens.get(&token_id).expect("Token not found");
        assert_eq!(
            token.owner_id, caller,
            "Only the current Deed NFT owner can configure business policy"
        );

        let vault = self.vaults.get_mut(&token_id).expect("Vault not found");
        vault.reserve_floor = reserve_floor;
        vault.max_daily_procurement = max_daily_procurement;
        vault.manager_account = manager_account;
    }

    pub fn vault_update_inventory(
        &mut self,
        token_id: TokenId,
        resource_id: String,
        delta: i32,
    ) {
        let caller = env::predecessor_account_id();
        let token = self.tokens.get(&token_id).expect("Token not found");
        let vault = self.vaults.get_mut(&token_id).expect("Vault not found");

        let is_owner = token.owner_id == caller;
        let is_manager = vault.manager_account.as_ref() == Some(&caller);
        let is_admin = self.admin_id == caller;
        assert!(
            is_owner || is_manager || is_admin,
            "Caller is not authorized to adjust vault inventory"
        );

        let current = vault.inventory.get(&resource_id).cloned().unwrap_or(0) as i32;
        let new_val = current + delta;
        assert!(new_val >= 0, "Inventory cannot be negative");
        vault.inventory.insert(resource_id, new_val as u32);
    }

    // =========================================================
    // IN-GAME MARKETPLACE (ATOMIC LIST, BUY, CANCEL)
    // =========================================================

    pub fn market_list_nft(&mut self, token_id: TokenId, price: U128) {
        let caller = env::predecessor_account_id();
        let token = self.tokens.get(&token_id).expect("Token not found");
        assert_eq!(token.owner_id, caller, "Caller must own NFT to list");
        assert!(price.0 > 0, "Price must be positive");

        let listing = MarketListing {
            listing_id: format!("list-{}", token_id),
            token_id: token_id.clone(),
            seller_id: caller,
            price,
            created_at: env::block_timestamp_ms(),
            is_active: true,
        };
        self.market_listings.insert(token_id, listing);
    }

    pub fn market_cancel_listing(&mut self, token_id: TokenId) {
        let caller = env::predecessor_account_id();
        let listing = self.market_listings.get(&token_id).expect("Listing not found");
        assert_eq!(listing.seller_id, caller, "Only seller can cancel listing");
        self.market_listings.remove(&token_id);
    }

    #[payable]
    pub fn market_buy_nft(&mut self, token_id: TokenId) -> Promise {
        let buyer = env::predecessor_account_id();
        let deposit = env::attached_deposit().as_yoctonear();
        let listing = self.market_listings.remove(&token_id).expect("Active listing not found");
        assert!(listing.is_active, "Listing is inactive");
        assert!(deposit >= listing.price.0, "Attached deposit is less than price");

        let seller = listing.seller_id.clone();
        assert_ne!(buyer, seller, "Cannot buy your own listing");

        // Transfer NFT ownership to buyer
        let token = self.tokens.get_mut(&token_id).expect("Token missing");
        token.owner_id = buyer.clone();

        // Update ownership tracking
        if let Some(ids) = self.tokens_per_owner.get_mut(&seller) {
            ids.retain(|id| id != &token_id);
        }
        self.tokens_per_owner
            .entry(buyer.clone())
            .or_default()
            .push(token_id.clone());

        // Calculate marketplace protocol fee
        let fee = (listing.price.0 * self.market_fee_bps as u128) / 10000;
        let seller_payout = listing.price.0 - fee;

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"nep171\",\"version\":\"1.0.0\",\"event\":\"market_sale\",\"data\":[{{\"token_id\":\"{}\",\"seller\":\"{}\",\"buyer\":\"{}\",\"price\":\"{}\"}}]}}",
            token_id, seller, buyer, listing.price.0
        ));

        // Transfer payout to seller
        Promise::new(seller).transfer(NearToken::from_yoctonear(seller_payout))
    }

    pub fn market_get_listings(&self) -> Vec<MarketListing> {
        self.market_listings.values().cloned().collect()
    }

    // =========================================================
    // BOUNTY & ESCROW MISSIONS (CARAVAN ESCORTS / AMBUSHES)
    // =========================================================

    #[payable]
    pub fn bounty_create(
        &mut self,
        bounty_id: String,
        caravan_token_id: TokenId,
        reward_amount: U128,
        collateral_amount: U128,
    ) {
        let issuer = env::predecessor_account_id();
        let deposit = env::attached_deposit().as_yoctonear();
        let total_required = reward_amount.0 + collateral_amount.0;
        assert!(
            deposit >= total_required,
            "Attached deposit must cover reward + collateral"
        );
        assert!(!self.escrow_bounties.contains_key(&bounty_id), "Bounty ID exists");

        let bounty = EscrowBounty {
            bounty_id: bounty_id.clone(),
            issuer_id: issuer,
            caravan_token_id,
            reward_amount,
            collateral_amount,
            status: "OPEN".to_string(),
            assigned_guard: None,
            created_at: env::block_timestamp_ms(),
        };
        self.escrow_bounties.insert(bounty_id, bounty);
    }

    pub fn bounty_join(&mut self, bounty_id: String) {
        let guard = env::predecessor_account_id();
        let bounty = self.escrow_bounties.get_mut(&bounty_id).expect("Bounty not found");
        assert_eq!(bounty.status, "OPEN", "Bounty is not open");
        bounty.assigned_guard = Some(guard);
        bounty.status = "IN_PROGRESS".to_string();
    }

    pub fn bounty_settle(
        &mut self,
        bounty_id: String,
        outcome: String, // "COMPLETED" or "FAILED"
        winner_id: AccountId,
    ) -> Promise {
        let caller = env::predecessor_account_id();
        assert!(caller == self.admin_id, "Only oracle admin can settle bounties");

        let bounty = self.escrow_bounties.get_mut(&bounty_id).expect("Bounty not found");
        assert_eq!(bounty.status, "IN_PROGRESS", "Bounty is not in progress");
        bounty.status = outcome.clone();

        if outcome == "COMPLETED" {
            // Guard succeeded: Winner gets reward + collateral returned to issuer
            let reward = bounty.reward_amount.0;
            let collateral = bounty.collateral_amount.0;
            if collateral > 0 {
                let _ = Promise::new(bounty.issuer_id.clone()).transfer(NearToken::from_yoctonear(collateral));
            }
            Promise::new(winner_id).transfer(NearToken::from_yoctonear(reward))
        } else {
            // Mission failed / Ambushed: Collateral goes to issuer/compensates loss
            let total = bounty.reward_amount.0 + bounty.collateral_amount.0;
            Promise::new(bounty.issuer_id.clone()).transfer(NearToken::from_yoctonear(total))
        }
    }

    pub fn bounty_get(&self, bounty_id: String) -> Option<EscrowBounty> {
        self.escrow_bounties.get(&bounty_id).cloned()
    }
}

// =============================================================
// CONTRACT UNIT TESTS (TESTING ALL ACCEPTANCE CRITERIA)
// =============================================================
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn get_context(predecessor: AccountId, deposit: u128) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id("turfwar.testnet".parse().unwrap())
            .signer_account_id(predecessor.clone())
            .predecessor_account_id(predecessor)
            .attached_deposit(NearToken::from_yoctonear(deposit))
            .block_timestamp(1_700_000_000_000_000_000);
        builder
    }

    #[test]
    fn test_mint_and_ownership() {
        let admin: AccountId = "admin.testnet".parse().unwrap();
        let alice: AccountId = "alice.testnet".parse().unwrap();
        testing_env!(get_context(admin.clone(), 0).build());

        let mut contract = TurfWarContract::new(admin.clone());

        // Mint Blacksmith Forge Deed NFT
        let metadata = TokenMetadata {
            title: Some("Blacksmith Forge Deed #1".to_string()),
            description: Some("Controls the town square blacksmith forge and vault".to_string()),
            media: Some("icon_deed_forge.png".to_string()),
            issued_at: Some(1_700_000_000),
        };
        contract.nft_mint(
            "deed-blacksmith-01".to_string(),
            alice.clone(),
            TokenType::BusinessDeed,
            metadata,
        );

        let token = contract.nft_token("deed-blacksmith-01".to_string()).unwrap();
        assert_eq!(token.owner_id, alice);

        // Vault was automatically linked to the deed token ID
        let vault = contract.vault_get("deed-blacksmith-01".to_string()).unwrap();
        assert_eq!(vault.token_id, "deed-blacksmith-01");
        assert_eq!(vault.business_type, "BLACKSMITH");
    }

    #[test]
    fn test_old_owner_lockout_after_nft_transfer() {
        let admin: AccountId = "admin.testnet".parse().unwrap();
        let alice: AccountId = "alice.testnet".parse().unwrap();
        let bob: AccountId = "bob.testnet".parse().unwrap();

        // 1. Admin mints Deed NFT to Alice
        testing_env!(get_context(admin.clone(), 0).build());
        let mut contract = TurfWarContract::new(admin.clone());
        contract.nft_mint(
            "deed-blacksmith-01".to_string(),
            alice.clone(),
            TokenType::BusinessDeed,
            TokenMetadata {
                title: Some("Forge #1".to_string()),
                description: None,
                media: None,
                issued_at: None,
            },
        );

        // 2. Deposit 10 NEAR into vault
        testing_env!(get_context(alice.clone(), 10_000_000_000_000_000_000_000_000).build());
        contract.vault_deposit("deed-blacksmith-01".to_string());
        let vault = contract.vault_get("deed-blacksmith-01".to_string()).unwrap();
        assert_eq!(vault.treasury_balance.0, 10_000_000_000_000_000_000_000_000);

        // 3. Alice transfers the Deed NFT to Bob
        testing_env!(get_context(alice.clone(), 1).build());
        contract.nft_transfer(
            bob.clone(),
            "deed-blacksmith-01".to_string(),
            None,
            Some("Sold forge deed".to_string()),
        );

        // Confirm Bob is now the verified on-chain owner
        let token = contract.nft_token("deed-blacksmith-01".to_string()).unwrap();
        assert_eq!(token.owner_id, bob);

        // 4. Bob (new owner) can configure and manage the vault
        testing_env!(get_context(bob.clone(), 0).build());
        let manager: AccountId = "garrick.testnet".parse().unwrap();
        contract.vault_configure(
            "deed-blacksmith-01".to_string(),
            U128(6_000_000_000_000_000_000_000_000),
            U128(20_000_000_000_000_000_000_000_000),
            Some(manager),
        );
        let updated_vault = contract.vault_get("deed-blacksmith-01".to_string()).unwrap();
        assert_eq!(
            updated_vault.manager_account,
            Some("garrick.testnet".parse().unwrap())
        );
    }

    #[test]
    #[should_panic(expected = "Caller is not the current owner")]
    fn test_old_owner_cannot_withdraw_after_transfer() {
        let admin: AccountId = "admin.testnet".parse().unwrap();
        let alice: AccountId = "alice.testnet".parse().unwrap();
        let bob: AccountId = "bob.testnet".parse().unwrap();

        testing_env!(get_context(admin.clone(), 0).build());
        let mut contract = TurfWarContract::new(admin.clone());
        contract.nft_mint(
            "deed-blacksmith-01".to_string(),
            alice.clone(),
            TokenType::BusinessDeed,
            TokenMetadata {
                title: Some("Forge #1".to_string()),
                description: None,
                media: None,
                issued_at: None,
            },
        );

        testing_env!(get_context(alice.clone(), 5_000_000_000_000_000_000_000_000).build());
        contract.vault_deposit("deed-blacksmith-01".to_string());

        // Alice transfers deed to Bob
        contract.nft_transfer(bob.clone(), "deed-blacksmith-01".to_string(), None, None);

        // Alice attempts to withdraw from vault after selling -> MUST PANIC!
        testing_env!(get_context(alice.clone(), 0).build());
        contract.vault_withdraw(
            "deed-blacksmith-01".to_string(),
            U128(1_000_000_000_000_000_000_000_000),
        );
    }

    #[test]
    fn test_marketplace_listing_and_purchase() {
        let admin: AccountId = "admin.testnet".parse().unwrap();
        let alice: AccountId = "alice.testnet".parse().unwrap();
        let bob: AccountId = "bob.testnet".parse().unwrap();

        testing_env!(get_context(admin.clone(), 0).build());
        let mut contract = TurfWarContract::new(admin.clone());

        // Mint Caravan NFT to Alice
        contract.nft_mint(
            "caravan-wagon-01".to_string(),
            alice.clone(),
            TokenType::Caravan,
            TokenMetadata {
                title: Some("Merchant Wagon".to_string()),
                description: Some("Heavy wooden wagon with cargo space".to_string()),
                media: Some("prop_wagon_caravan.png".to_string()),
                issued_at: None,
            },
        );

        // Alice lists caravan for 10 NEAR
        testing_env!(get_context(alice.clone(), 0).build());
        contract.market_list_nft(
            "caravan-wagon-01".to_string(),
            U128(10_000_000_000_000_000_000_000_000),
        );

        let listings = contract.market_get_listings();
        assert_eq!(listings.len(), 1);
        assert_eq!(listings[0].price.0, 10_000_000_000_000_000_000_000_000);

        // Bob buys caravan attached with 10 NEAR
        testing_env!(get_context(bob.clone(), 10_000_000_000_000_000_000_000_000).build());
        contract.market_buy_nft("caravan-wagon-01".to_string());

        // Caravan ownership is transferred to Bob
        let token = contract.nft_token("caravan-wagon-01".to_string()).unwrap();
        assert_eq!(token.owner_id, bob);

        // Listing is cleared
        let listings_after = contract.market_get_listings();
        assert_eq!(listings_after.len(), 0);
    }

    #[test]
    fn test_escrow_bounty_flow() {
        let admin: AccountId = "admin.testnet".parse().unwrap();
        let merchant: AccountId = "saffron.testnet".parse().unwrap();
        let guard: AccountId = "player1.testnet".parse().unwrap();

        testing_env!(get_context(admin.clone(), 0).build());
        let mut contract = TurfWarContract::new(admin.clone());

        // Saffron creates funded bounty with 5 NEAR reward and 2 NEAR collateral
        let total = 7_000_000_000_000_000_000_000_000;
        testing_env!(get_context(merchant.clone(), total).build());
        contract.bounty_create(
            "bounty-escort-101".to_string(),
            "caravan-wagon-01".to_string(),
            U128(5_000_000_000_000_000_000_000_000),
            U128(2_000_000_000_000_000_000_000_000),
        );

        let bounty = contract.bounty_get("bounty-escort-101".to_string()).unwrap();
        assert_eq!(bounty.status, "OPEN");

        // Player joins bounty as guard
        testing_env!(get_context(guard.clone(), 0).build());
        contract.bounty_join("bounty-escort-101".to_string());
        let in_prog = contract.bounty_get("bounty-escort-101".to_string()).unwrap();
        assert_eq!(in_prog.status, "IN_PROGRESS");
        assert_eq!(in_prog.assigned_guard, Some(guard.clone()));

        // Oracle admin verifies successful arrival and settles bounty
        testing_env!(get_context(admin.clone(), 0).build());
        contract.bounty_settle(
            "bounty-escort-101".to_string(),
            "COMPLETED".to_string(),
            guard.clone(),
        );

        let settled = contract.bounty_get("bounty-escort-101".to_string()).unwrap();
        assert_eq!(settled.status, "COMPLETED");
    }
}
