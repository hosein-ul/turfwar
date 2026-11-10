import {
  ResourceId,
  ResourceItemDef,
  BusinessVault,
  SignedQuote,
  EconomicSimulationResult,
  MarketStateSnapshot,
  OperatingStatus
} from '@turfwar/shared-types';

export const RESOURCE_DEFS: Record<ResourceId, ResourceItemDef> = {
  wood: {
    id: 'wood',
    name: 'Timber Wood',
    tier: 1,
    category: 'raw',
    description: 'Hewn pine logs from Darkwood Edge. Used for forging and wagon repair.',
    icon: 'icon_wood.png',
    baseRefPriceNear: 0.25,
    weight: 2
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    tier: 1,
    category: 'raw',
    description: 'Raw high-grade hematite mined from the mountain cliffs.',
    icon: 'icon_iron_ore.png',
    baseRefPriceNear: 0.50,
    weight: 3
  },
  herbs: {
    id: 'herbs',
    name: 'Silverleaf Herb',
    tier: 1,
    category: 'raw',
    description: 'Fragrant wild herbs with restorative resin.',
    icon: 'icon_herbs.png',
    baseRefPriceNear: 0.35,
    weight: 1
  },
  iron_ingot: {
    id: 'iron_ingot',
    name: 'Refined Iron Ingot',
    tier: 2,
    category: 'refined',
    description: 'Smelted iron bar ready for weapon and armor smithing.',
    icon: 'icon_iron_ingot.png',
    baseRefPriceNear: 1.40,
    weight: 4
  },
  sword_iron: {
    id: 'sword_iron',
    name: 'Frontier Broadsword',
    tier: 3,
    category: 'equipment',
    description: 'Tempered steel blade providing +15 attack in caravan defense.',
    icon: 'icon_sword_iron.png',
    baseRefPriceNear: 4.50,
    maxDurability: 100,
    weight: 6
  },
  shield_iron: {
    id: 'shield_iron',
    name: 'Reinforced Buckler',
    tier: 3,
    category: 'equipment',
    description: 'Sturdy iron-rimmed shield offering +20 damage absorption.',
    icon: 'icon_shield_iron.png',
    baseRefPriceNear: 4.00,
    maxDurability: 100,
    weight: 8
  },
  repair_kit: {
    id: 'repair_kit',
    name: 'Artisan Repair Kit',
    tier: 2,
    category: 'consumable',
    description: 'Restores 50 durability points to damaged equipment or caravans.',
    icon: 'icon_repair_kit.png',
    baseRefPriceNear: 1.80,
    weight: 3
  }
};

export interface CraftingRecipe {
  id: string;
  outputResourceId: ResourceId;
  outputQuantity: number;
  ingredients: Array<{ resourceId: ResourceId; quantity: number }>;
  craftingFeeNear: number;
  durationSeconds: number;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'smelt_iron_ingot',
    outputResourceId: 'iron_ingot',
    outputQuantity: 1,
    ingredients: [
      { resourceId: 'iron_ore', quantity: 2 },
      { resourceId: 'wood', quantity: 1 }
    ],
    craftingFeeNear: 0.20,
    durationSeconds: 3
  },
  {
    id: 'forge_broadsword',
    outputResourceId: 'sword_iron',
    outputQuantity: 1,
    ingredients: [
      { resourceId: 'iron_ingot', quantity: 2 },
      { resourceId: 'wood', quantity: 1 }
    ],
    craftingFeeNear: 0.50,
    durationSeconds: 5
  },
  {
    id: 'forge_shield',
    outputResourceId: 'shield_iron',
    outputQuantity: 1,
    ingredients: [
      { resourceId: 'iron_ingot', quantity: 2 },
      { resourceId: 'wood', quantity: 2 }
    ],
    craftingFeeNear: 0.40,
    durationSeconds: 5
  },
  {
    id: 'craft_repair_kit',
    outputResourceId: 'repair_kit',
    outputQuantity: 1,
    ingredients: [
      { resourceId: 'wood', quantity: 1 },
      { resourceId: 'herbs', quantity: 1 }
    ],
    craftingFeeNear: 0.25,
    durationSeconds: 3
  }
];

export interface PriceQuote {
  unitPriceNear: number;
  totalPriceNear: number;
  multiplier: number;
  stockRatio: number;
  liquidityRatio: number;
  canExecute: boolean;
  rejectionReason?: string;
}

/**
 * Deterministic pricing engine calculating merchant buy/sell quotes
 * as defined in docs/economy/ECONOMY_MODEL.md
 */
export function calculateQuote(
  vault: BusinessVault,
  resourceId: ResourceId,
  quantity: number,
  isPlayerBuying: boolean,
  tradeVelocity: number = 1.0
): PriceQuote {
  const def = RESOURCE_DEFS[resourceId];
  if (!def) {
    throw new Error(`Unknown resource: ${resourceId}`);
  }

  const currentStock = vault.inventory[resourceId] ?? 0;
  const targetStock = vault.policy.targetStock[resourceId] ?? 30;
  const stockRatio = targetStock > 0 ? currentStock / targetStock : 1.0;

  // Multiplier formula: (1.0 - 0.4 * (stockRatio - 1.0)) * velocity
  let rawMultiplier = (1.0 - 0.4 * (stockRatio - 1.0)) * Math.min(2.0, Math.max(0.5, tradeVelocity));
  // Hard clamp between 0.5x and 2.0x reference price
  const multiplier = Math.min(2.0, Math.max(0.5, rawMultiplier));

  const reserveFloor = vault.policy.reserveFloorNear;
  const liquidityRatio = reserveFloor > 0 
    ? Math.min(1.0, vault.treasuryBalanceNear / reserveFloor)
    : 1.0;

  const marginRate = 0.15; // 15% mark-up on asks
  const spreadRate = 0.15; // 15% discount on bids

  let unitPrice: number;
  let canExecute = true;
  let rejectionReason: string | undefined;

  if (isPlayerBuying) {
    // Player is buying from merchant -> Merchant is SELLING
    if (currentStock < quantity) {
      canExecute = false;
      rejectionReason = `Insufficient merchant stock (available: ${currentStock}, requested: ${quantity})`;
    }
    unitPrice = def.baseRefPriceNear * multiplier * (1.0 + marginRate);
  } else {
    // Player is selling to merchant -> Merchant is BUYING
    unitPrice = def.baseRefPriceNear * multiplier * (1.0 - spreadRate) * liquidityRatio;
    const totalCost = unitPrice * quantity;

    // Check if merchant has enough funds and stays above reserve floor
    if (vault.treasuryBalanceNear - totalCost < reserveFloor) {
      canExecute = false;
      rejectionReason = `Transaction violates merchant minimum reserve policy (floor: ${reserveFloor} NEAR, balance: ${vault.treasuryBalanceNear.toFixed(2)} NEAR)`;
    }

    // Check procurement limit
    if (totalCost > vault.policy.maxDailyProcurementNear) {
      canExecute = false;
      rejectionReason = `Exceeds merchant maximum single procurement cap (${vault.policy.maxDailyProcurementNear} NEAR)`;
    }
  }

  // Round to 3 decimal places for readable currency units
  unitPrice = Math.round(unitPrice * 1000) / 1000;
  const totalPrice = Math.round(unitPrice * quantity * 1000) / 1000;

  return {
    unitPriceNear: unitPrice,
    totalPriceNear: totalPrice,
    multiplier: Math.round(multiplier * 100) / 100,
    stockRatio: Math.round(stockRatio * 100) / 100,
    liquidityRatio: Math.round(liquidityRatio * 100) / 100,
    canExecute,
    rejectionReason
  };
}

/**
 * Creates a signed quote record with nonce and 300-second expiration
 */
let quoteNonceCounter = 1000;
export function createSignedQuote(
  vault: BusinessVault,
  buyerId: string,
  resourceId: ResourceId,
  quantity: number,
  isPlayerBuying: boolean
): SignedQuote {
  const quote = calculateQuote(vault, resourceId, quantity, isPlayerBuying);
  if (!quote.canExecute) {
    throw new Error(quote.rejectionReason ?? 'Cannot execute trade quote');
  }

  quoteNonceCounter++;
  const nonce = quoteNonceCounter;
  const expiresAt = Date.now() + 300 * 1000; // 5 minutes validity
  const quoteId = `quote-${nonce}-${Date.now()}`;

  // Deterministic mock cryptographic signature for testnet / demo validation
  const signature = `SIG_${vault.tokenId}_${nonce}_${quote.totalPriceNear}_VALID`;

  return {
    quoteId,
    sellerId: isPlayerBuying ? vault.tokenId : buyerId,
    buyerId: isPlayerBuying ? buyerId : vault.tokenId,
    resourceId,
    quantity,
    unitPriceNear: quote.unitPriceNear,
    totalPriceNear: quote.totalPriceNear,
    nonce,
    expiresAt,
    signature
  };
}

/**
 * Executes a deterministic 7-game-day economic time-machine simulation
 */
export function simulateEconomicDays(
  initialVaults: Record<string, BusinessVault>,
  daysToSimulate: number = 7
): EconomicSimulationResult {
  // Deep clone initial state
  const vaults: Record<string, BusinessVault> = JSON.parse(JSON.stringify(initialVaults));
  
  const startSnapshot: MarketStateSnapshot = {
    timestamp: Date.now(),
    stocks: {},
    prices: {},
    recentTrades: []
  };

  for (const [id, v] of Object.entries(vaults)) {
    startSnapshot.stocks[id] = { ...v.inventory };
    startSnapshot.prices[id] = {} as any;
    for (const r of Object.keys(RESOURCE_DEFS) as ResourceId[]) {
      const qBuy = calculateQuote(v, r, 1, true);
      const qSell = calculateQuote(v, r, 1, false);
      startSnapshot.prices[id][r] = {
        buyPrice: qBuy.unitPriceNear,
        sellPrice: qSell.unitPriceNear
      };
    }
  }

  let totalVolumeNear = 0;
  let totalFeesBurnedNear = 0;
  let tradesExecuted = 0;
  const agentActionsCount: Record<string, number> = {
    garrick: 0,
    saffron: 0,
    vex: 0
  };

  const businessHealthStart: Record<string, number> = {};
  for (const [id, v] of Object.entries(vaults)) {
    businessHealthStart[id] = v.treasuryBalanceNear;
  }

  // Simulate day cycles
  for (let day = 1; day <= daysToSimulate; day++) {
    // 1. Gatherers bring raw materials to market (Wood, Ore, Herbs)
    for (const vault of Object.values(vaults)) {
      if (vault.operatingStatus === 'PAUSED') continue;

      // Simulated local miners & foragers selling raw materials
      for (const rawRes of ['iron_ore', 'wood', 'herbs'] as ResourceId[]) {
        const supplyBatch = 3 + (day % 3);
        const quote = calculateQuote(vault, rawRes, supplyBatch, false);
        if (quote.canExecute) {
          vault.treasuryBalanceNear -= quote.totalPriceNear;
          vault.inventory[rawRes] = (vault.inventory[rawRes] ?? 0) + supplyBatch;
          totalVolumeNear += quote.totalPriceNear;
          tradesExecuted++;
        }
      }

      // 2. Blacksmith auto-smelting and crafting
      if (vault.businessType === 'BLACKSMITH') {
        const oreCount = vault.inventory.iron_ore ?? 0;
        const woodCount = vault.inventory.wood ?? 0;
        if (oreCount >= 4 && woodCount >= 2) {
          // Smelt 2 ingots
          vault.inventory.iron_ore = oreCount - 4;
          vault.inventory.wood = woodCount - 2;
          vault.inventory.iron_ingot = (vault.inventory.iron_ingot ?? 0) + 2;
          vault.treasuryBalanceNear += 0.40; // Internal crafting margin
          agentActionsCount.garrick += 2;
        }
      }

      // 3. Adventurers & caravan escorts buy equipment
      for (const eqRes of ['sword_iron', 'shield_iron', 'repair_kit'] as ResourceId[]) {
        const available = vault.inventory[eqRes] ?? 0;
        if (available > 0) {
          const buyCount = Math.min(available, 1);
          const quote = calculateQuote(vault, eqRes, buyCount, true);
          if (quote.canExecute) {
            vault.treasuryBalanceNear += quote.totalPriceNear;
            vault.inventory[eqRes] = available - buyCount;
            totalVolumeNear += quote.totalPriceNear;
            tradesExecuted++;
          }
        }
      }

      // 4. Daily business upkeep deduction
      const dailyUpkeep = vault.upkeepCostNear / 7;
      if (vault.treasuryBalanceNear >= dailyUpkeep) {
        vault.treasuryBalanceNear -= dailyUpkeep;
        totalFeesBurnedNear += dailyUpkeep;
        vault.operatingStatus = 'ACTIVE';
      } else {
        vault.operatingStatus = 'DEGRADED';
      }
    }

    // 5. Agent Swarm Actions
    // Saffron organizes a trade run
    agentActionsCount.saffron += 1;
    // Vex attempts a market arbitrage or undercut
    agentActionsCount.vex += 1;
  }

  const endSnapshot: MarketStateSnapshot = {
    timestamp: Date.now() + daysToSimulate * 86400 * 1000,
    stocks: {},
    prices: {},
    recentTrades: []
  };

  const businessHealth: Record<string, {
    treasuryBefore: number;
    treasuryAfter: number;
    netProfitNear: number;
    status: OperatingStatus;
  }> = {};

  for (const [id, v] of Object.entries(vaults)) {
    endSnapshot.stocks[id] = { ...v.inventory };
    endSnapshot.prices[id] = {} as any;
    for (const r of Object.keys(RESOURCE_DEFS) as ResourceId[]) {
      const qBuy = calculateQuote(v, r, 1, true);
      const qSell = calculateQuote(v, r, 1, false);
      endSnapshot.prices[id][r] = {
        buyPrice: qBuy.unitPriceNear,
        sellPrice: qSell.unitPriceNear
      };
    }

    const tBefore = businessHealthStart[id];
    const tAfter = Math.round(v.treasuryBalanceNear * 100) / 100;
    businessHealth[id] = {
      treasuryBefore: tBefore,
      treasuryAfter: tAfter,
      netProfitNear: Math.round((tAfter - tBefore) * 100) / 100,
      status: v.operatingStatus
    };
  }

  return {
    daysSimulated: daysToSimulate,
    startSnapshot,
    endSnapshot,
    totalVolumeNear: Math.round(totalVolumeNear * 100) / 100,
    totalFeesBurnedNear: Math.round(totalFeesBurnedNear * 100) / 100,
    tradesExecuted,
    businessHealth,
    agentActionsCount
  };
}
