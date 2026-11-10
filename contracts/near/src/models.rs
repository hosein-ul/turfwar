use near_sdk::json_types::U128;
use near_sdk::{near, AccountId};
use std::collections::HashMap;

pub type TokenId = String;

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub enum TokenType {
    BusinessDeed,
    Caravan,
    Equipment,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct TokenMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub media: Option<String>,
    pub issued_at: Option<u64>,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Token {
    pub token_id: TokenId,
    pub owner_id: AccountId,
    pub token_type: TokenType,
    pub metadata: TokenMetadata,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct BusinessVault {
    pub token_id: TokenId,
    pub business_type: String, // "BLACKSMITH", "MERCHANT_STALL"
    pub treasury_balance: U128, // In yoctoNEAR
    pub inventory: HashMap<String, u32>,
    pub manager_account: Option<AccountId>,
    pub operating_status: String, // "ACTIVE", "DEGRADED", "PAUSED"
    pub reserve_floor: U128,
    pub max_daily_procurement: U128,
    pub fee_basis_points: u16,
    pub accrued_fees: U128,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct CaravanStats {
    pub token_id: TokenId,
    pub cargo_capacity: u32,
    pub speed: u32,
    pub armor: u32,
    pub durability: u32,
    pub max_durability: u32,
    pub status: String, // "IDLE", "ON_MISSION", "DAMAGED"
    pub successful_missions: u32,
    pub losses: u32,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct MarketListing {
    pub listing_id: String,
    pub token_id: TokenId,
    pub seller_id: AccountId,
    pub price: U128,
    pub created_at: u64,
    pub is_active: bool,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct EscrowBounty {
    pub bounty_id: String,
    pub issuer_id: AccountId,
    pub caravan_token_id: TokenId,
    pub reward_amount: U128,
    pub collateral_amount: U128,
    pub status: String, // "OPEN", "IN_PROGRESS", "COMPLETED", "FAILED"
    pub assigned_guard: Option<AccountId>,
    pub created_at: u64,
}
