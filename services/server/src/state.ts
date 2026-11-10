import {
  PlayerProfile,
  BusinessDeedNFT,
  CaravanNFT,
  AgentProfile,
  EscrowBounty,
  ResourceId,
  SignedQuote
} from '@turfwar/shared-types';

export interface HarvestNodeState {
  id: string;
  resourceId: ResourceId;
  name: string;
  x: number;
  y: number;
  available: boolean;
  maxYield: number;
  currentYield: number;
  respawnTimeMs: number;
  lastHarvested?: number;
}

export class WorldStateManager {
  public players: Map<string, PlayerProfile> = new Map();
  public deeds: Map<string, BusinessDeedNFT> = new Map();
  public caravans: Map<string, CaravanNFT> = new Map();
  public agents: Map<string, AgentProfile> = new Map();
  public bounties: Map<string, EscrowBounty> = new Map();
  public harvestNodes: Map<string, HarvestNodeState> = new Map();
  public tradeHistory: Array<{
    id: string;
    timestamp: number;
    resourceId: ResourceId;
    quantity: number;
    priceNear: number;
    buyer: string;
    seller: string;
  }> = [];
  public verifiedEvents: Array<{
    id: string;
    timestamp: number;
    eventType: string;
    summary: string;
    txHash?: string;
  }> = [];

  constructor() {
    this.seedInitialState();
  }

  public seedInitialState() {
    // 1. Seed Harvest Nodes (Darkwood Edge)
    const nodes: HarvestNodeState[] = [
      {
        id: 'node-ore-1',
        resourceId: 'iron_ore',
        name: 'Iron Ore Cliff Vein',
        x: 680,
        y: 420,
        available: true,
        maxYield: 6,
        currentYield: 6,
        respawnTimeMs: 15000
      },
      {
        id: 'node-ore-2',
        resourceId: 'iron_ore',
        name: 'Hematite Boulder',
        x: 820,
        y: 500,
        available: true,
        maxYield: 6,
        currentYield: 6,
        respawnTimeMs: 15000
      },
      {
        id: 'node-wood-1',
        resourceId: 'wood',
        name: 'Darkwood Pine Tree',
        x: 580,
        y: 380,
        available: true,
        maxYield: 8,
        currentYield: 8,
        respawnTimeMs: 12000
      },
      {
        id: 'node-wood-2',
        resourceId: 'wood',
        name: 'Ancient Oak',
        x: 900,
        y: 460,
        available: true,
        maxYield: 8,
        currentYield: 8,
        respawnTimeMs: 12000
      },
      {
        id: 'node-herb-1',
        resourceId: 'herbs',
        name: 'Silverleaf Bush',
        x: 620,
        y: 520,
        available: true,
        maxYield: 5,
        currentYield: 5,
        respawnTimeMs: 10000
      },
      {
        id: 'node-herb-2',
        resourceId: 'herbs',
        name: 'Dew Herb Patch',
        x: 760,
        y: 580,
        available: true,
        maxYield: 5,
        currentYield: 5,
        respawnTimeMs: 10000
      }
    ];
    nodes.forEach(n => this.harvestNodes.set(n.id, n));

    // 2. Seed Business Deeds & Linked Vaults
    const blacksmithDeed: BusinessDeedNFT = {
      tokenId: 'deed-blacksmith-01',
      ownerId: 'garrick.testnet',
      title: 'Blacksmith Forge Deed #1',
      businessType: 'BLACKSMITH',
      metadata: {
        title: 'Town Square Blacksmith Forge',
        description: 'Primary metallurgical forge with high-heat blast furnace and linked asset vault.',
        media: 'icon_deed_forge.png',
        issuedAt: new Date().toISOString()
      },
      vault: {
        tokenId: 'deed-blacksmith-01',
        businessType: 'BLACKSMITH',
        treasuryBalanceNear: 25.0,
        inventory: {
          iron_ore: 12,
          wood: 18,
          iron_ingot: 6,
          sword_iron: 2,
          shield_iron: 1,
          repair_kit: 3
        },
        managerAccountId: 'garrick.testnet',
        operatingStatus: 'ACTIVE',
        policy: {
          reserveFloorNear: 5.0,
          maxDailyProcurementNear: 15.0,
          targetStock: {
            iron_ore: 40,
            wood: 40,
            iron_ingot: 20,
            sword_iron: 10,
            shield_iron: 8,
            repair_kit: 10
          },
          autoCraftThreshold: 4,
          feeBasisPoints: 500
        },
        accruedFeesNear: 1.45,
        totalVolumeNear: 52.0,
        lastUpkeepTimestamp: Date.now(),
        upkeepCostNear: 1.5
      }
    };
    this.deeds.set(blacksmithDeed.tokenId, blacksmithDeed);

    const merchantDeed: BusinessDeedNFT = {
      tokenId: 'deed-merchant-01',
      ownerId: 'saffron.testnet',
      title: 'Merchant Trading Stall #1',
      businessType: 'MERCHANT_STALL',
      metadata: {
        title: 'Frontier Caravan Trading Post',
        description: 'Logistics and trade outpost managing export shipments and escort contracts.',
        media: 'icon_deed_forge.png',
        issuedAt: new Date().toISOString()
      },
      vault: {
        tokenId: 'deed-merchant-01',
        businessType: 'MERCHANT_STALL',
        treasuryBalanceNear: 35.0,
        inventory: {
          iron_ore: 5,
          wood: 10,
          herbs: 15,
          repair_kit: 4
        },
        managerAccountId: 'saffron.testnet',
        operatingStatus: 'ACTIVE',
        policy: {
          reserveFloorNear: 8.0,
          maxDailyProcurementNear: 20.0,
          targetStock: {
            iron_ore: 20,
            wood: 25,
            herbs: 30,
            repair_kit: 15
          },
          autoCraftThreshold: 0,
          feeBasisPoints: 400
        },
        accruedFeesNear: 2.10,
        totalVolumeNear: 80.0,
        lastUpkeepTimestamp: Date.now(),
        upkeepCostNear: 0.8
      }
    };
    this.deeds.set(merchantDeed.tokenId, merchantDeed);

    // 3. Seed Caravan NFTs
    const caravan1: CaravanNFT = {
      tokenId: 'caravan-wagon-01',
      ownerId: 'saffron.testnet',
      name: 'Swift Courier Wagon #1',
      cargoCapacity: 50,
      speedFactor: 1.2,
      armor: 25,
      durability: 95,
      maxDurability: 100,
      status: 'IDLE',
      successfulMissions: 4,
      losses: 0,
      metadata: {
        title: 'Swift Courier Wagon #1',
        description: 'Lightweight reinforced merchant transport wagon',
        media: 'prop_wagon_caravan.png'
      }
    };
    this.caravans.set(caravan1.tokenId, caravan1);

    // 4. Seed Autonomous Agents
    const garrick: AgentProfile = {
      id: 'garrick',
      name: 'Garrick',
      role: 'Master Blacksmith',
      personality: 'Pragmatic, quality-obsessed, risk-averse craftsman who protects his forge reserve floor.',
      walletAccountId: 'garrick.testnet',
      balanceNear: 25.0,
      reserveFloorNear: 5.0,
      assignedBusinessTokenId: 'deed-blacksmith-01',
      status: 'ACTIVE',
      recentDecisions: [
        {
          timestamp: Date.now() - 360000,
          action: 'Refuse Low-Margin Ingot Offer',
          rationale: 'Quoted bid price 1.1 NEAR was below 1.4 NEAR threshold',
          details: 'Protected forge gross margin'
        },
        {
          timestamp: Date.now() - 120000,
          action: 'Post Buy Quote for 20 Iron Ore',
          rationale: 'Current ore stock (12) is below target (40)',
          details: 'Approved 0.58 NEAR/unit bid'
        }
      ]
    };
    this.agents.set('garrick', garrick);

    const saffron: AgentProfile = {
      id: 'saffron',
      name: 'Saffron',
      role: 'Caravan Broker',
      personality: 'Calculating logistics coordinator seeking high-margin spatial resource arbitrage between town and frontier outposts.',
      walletAccountId: 'saffron.testnet',
      balanceNear: 35.0,
      reserveFloorNear: 8.0,
      assignedBusinessTokenId: 'deed-merchant-01',
      assignedCaravanTokenId: 'caravan-wagon-01',
      status: 'ACTIVE',
      recentDecisions: [
        {
          timestamp: Date.now() - 240000,
          action: 'Fund Caravan Escort Bounty',
          rationale: 'Refined iron supply in town high; mountain pass demand elevated',
          details: 'Locked 5.0 NEAR reward + 2.0 NEAR collateral'
        }
      ]
    };
    this.agents.set('saffron', saffron);

    const vex: AgentProfile = {
      id: 'vex',
      name: 'Vex',
      role: 'Opportunistic Rival',
      personality: 'Sharp-eyed market scout who exploits short-term price spreads, undercuts slow merchants, and sponsors rival routes.',
      walletAccountId: 'vex.testnet',
      balanceNear: 15.0,
      reserveFloorNear: 2.0,
      status: 'ACTIVE',
      recentDecisions: [
        {
          timestamp: Date.now() - 180000,
          action: 'Scout Ore Vein In Darkwood Edge',
          rationale: 'Garrick needs 28 ore to hit target stock',
          details: 'Preparing to buy ore cheap and flip at premium'
        }
      ]
    };
    this.agents.set('vex', vex);

    // 5. Seed Initial Escrow Bounty
    const bounty1: EscrowBounty = {
      bountyId: 'bounty-escort-101',
      issuerId: 'saffron.testnet',
      issuerRole: 'agent',
      caravanTokenId: 'caravan-wagon-01',
      cargo: [
        { resourceId: 'iron_ingot', quantity: 6 },
        { resourceId: 'repair_kit', quantity: 2 }
      ],
      rewardNear: 5.0,
      collateralNear: 2.0,
      risk: 'MEDIUM',
      status: 'OPEN',
      assignedGuardId: null,
      routeId: 'darkwood_escort'
    };
    this.bounties.set(bounty1.bountyId, bounty1);

    // 6. Seed Default Demo Player Profile
    const demoPlayer: PlayerProfile = {
      id: 'player_demo',
      handle: 'FrontierTraveler',
      accountType: 'guest',
      balanceNear: 10.0,
      inventory: {
        wood: 5,
        iron_ore: 8,
        herbs: 3,
        sword_iron: 1
      },
      equipment: {
        weapon: 'sword_iron'
      },
      durability: {
        sword_iron: 90
      },
      reputation: 50,
      position: { x: 320, y: 320, zone: 'town_square' }
    };
    this.players.set('player_demo', demoPlayer);
  }

  public getOrCreatePlayer(id: string, nearAccountId?: string): PlayerProfile {
    let p = this.players.get(id);
    if (!p) {
      p = {
        id,
        handle: nearAccountId ? nearAccountId.replace('.testnet', '') : `Traveler_${id.slice(0, 4)}`,
        accountType: nearAccountId ? 'near_testnet' : 'guest',
        nearAccountId,
        balanceNear: nearAccountId ? 15.0 : 10.0,
        inventory: {
          wood: 4,
          iron_ore: 6,
          herbs: 2
        },
        equipment: {},
        durability: {},
        reputation: 50,
        position: { x: 320, y: 320, zone: 'town_square' }
      };
      this.players.set(id, p);
    }
    return p;
  }
}

export const worldState = new WorldStateManager();
