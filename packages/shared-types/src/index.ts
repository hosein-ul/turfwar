/**
 * TURFWAR — Canonical Shared TypeScript Definitions
 */

export type ResourceId = 
  | 'wood' 
  | 'iron_ore' 
  | 'herbs' 
  | 'iron_ingot' 
  | 'sword_iron' 
  | 'shield_iron' 
  | 'repair_kit';

export type BusinessType = 'BLACKSMITH' | 'MERCHANT_STALL' | 'ALCHEMIST_WORKSHOP';

export type OperatingStatus = 'ACTIVE' | 'DEGRADED' | 'PAUSED';

export interface ResourceItemDef {
  id: ResourceId;
  name: string;
  tier: 1 | 2 | 3;
  category: 'raw' | 'refined' | 'equipment' | 'consumable';
  description: string;
  icon: string;
  baseRefPriceNear: number;
  maxDurability?: number;
  weight: number;
}

export interface BusinessPolicy {
  reserveFloorNear: number;
  maxDailyProcurementNear: number;
  targetStock: Partial<Record<ResourceId, number>>;
  autoCraftThreshold: number;
  feeBasisPoints: number; // e.g. 500 = 5%
}

export interface BusinessVault {
  tokenId: string; // Keyed by NEP-171 Deed Token ID
  businessType: BusinessType;
  treasuryBalanceNear: number;
  inventory: Partial<Record<ResourceId, number>>;
  managerAccountId: string | null; // e.g. 'garrick.testnet'
  operatingStatus: OperatingStatus;
  policy: BusinessPolicy;
  accruedFeesNear: number;
  totalVolumeNear: number;
  lastUpkeepTimestamp: number;
  upkeepCostNear: number;
}

export interface BusinessDeedNFT {
  tokenId: string;
  ownerId: string;
  title: string;
  businessType: BusinessType;
  metadata: {
    title: string;
    description: string;
    media: string;
    issuedAt: string;
  };
  vault: BusinessVault;
}

export interface CaravanNFT {
  tokenId: string;
  ownerId: string;
  name: string;
  cargoCapacity: number; // In weight units
  speedFactor: number; // 1.0 = base speed
  armor: number; // 0-100
  durability: number;
  maxDurability: number;
  status: 'IDLE' | 'ON_MISSION' | 'DAMAGED' | 'COOLDOWN';
  successfulMissions: number;
  losses: number;
  metadata: {
    title: string;
    description: string;
    media: string;
  };
}

export interface SignedQuote {
  quoteId: string;
  sellerId: string;
  buyerId: string;
  resourceId: ResourceId;
  quantity: number;
  unitPriceNear: number;
  totalPriceNear: number;
  nonce: number;
  expiresAt: number; // Unix timestamp ms
  signature: string;
}

export type MissionRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type MissionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'AMBUSHED' | 'EXPIRED';

export interface CargoItem {
  resourceId: ResourceId;
  quantity: number;
}

export interface EscrowBounty {
  bountyId: string;
  issuerId: string;
  issuerRole: 'agent' | 'player';
  caravanTokenId: string;
  cargo: CargoItem[];
  rewardNear: number;
  collateralNear: number;
  risk: MissionRisk;
  status: MissionStatus;
  assignedGuardId: string | null;
  startedAt?: number;
  completedAt?: number;
  routeId: 'darkwood_escort' | 'frontier_supply';
}

export interface PlayerProfile {
  id: string;
  handle: string;
  accountType: 'guest' | 'near_testnet';
  nearAccountId?: string;
  balanceNear: number;
  inventory: Partial<Record<ResourceId, number>>;
  equipment: {
    weapon?: ResourceId;
    shield?: ResourceId;
  };
  durability: Partial<Record<ResourceId, number>>;
  reputation: number; // 0-100
  position: { x: number; y: number; zone: 'town_square' | 'darkwood_edge' | 'forest_road' };
  portraitUrl?: string;
  spriteKey?: string;
}

export interface AgentProfile {
  id: 'garrick' | 'saffron' | 'vex';
  name: string;
  role: string;
  personality: string;
  walletAccountId: string;
  balanceNear: number;
  reserveFloorNear: number;
  assignedBusinessTokenId?: string;
  assignedCaravanTokenId?: string;
  status: 'ACTIVE' | 'TRADING' | 'PATROLLING' | 'PAUSED';
  recentDecisions: Array<{
    timestamp: number;
    action: string;
    rationale: string;
    details: string;
  }>;
}

export interface MarketQuoteRequest {
  resourceId: ResourceId;
  quantity: number;
  action: 'buy' | 'sell';
  buyerId: string;
  merchantId: string;
}

export interface MarketStateSnapshot {
  timestamp: number;
  stocks: Record<string, Partial<Record<ResourceId, number>>>;
  prices: Record<string, Record<ResourceId, { buyPrice: number; sellPrice: number }>>;
  recentTrades: Array<{
    id: string;
    timestamp: number;
    resourceId: ResourceId;
    quantity: number;
    priceNear: number;
    buyer: string;
    seller: string;
  }>;
}

export interface EconomicSimulationResult {
  daysSimulated: number;
  startSnapshot: MarketStateSnapshot;
  endSnapshot: MarketStateSnapshot;
  totalVolumeNear: number;
  totalFeesBurnedNear: number;
  tradesExecuted: number;
  businessHealth: Record<string, {
    treasuryBefore: number;
    treasuryAfter: number;
    netProfitNear: number;
    status: OperatingStatus;
  }>;
  agentActionsCount: Record<string, number>;
}

export type WorldActionType = 
  | 'move_to'
  | 'gather_resource'
  | 'buy_item'
  | 'sell_item'
  | 'craft_item'
  | 'repair_item'
  | 'post_bounty'
  | 'accept_bounty'
  | 'complete_mission'
  | 'transfer_nft'
  | 'configure_business';

export interface WorldActionPayload<T = unknown> {
  actionType: WorldActionType;
  actorId: string;
  timestamp: number;
  data: T;
}
