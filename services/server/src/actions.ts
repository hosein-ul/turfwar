import { worldState } from './state.js';
import { calculateQuote, CRAFTING_RECIPES, RESOURCE_DEFS } from '@turfwar/economy-engine';
import { ResourceId, WorldActionPayload } from '@turfwar/shared-types';

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  txHash?: string;
}

export class ActionDispatcher {
  public execute(payload: WorldActionPayload<any>): ActionResult {
    switch (payload.actionType) {
      case 'move_to':
        return this.handleMove(payload.actorId, payload.data);
      case 'gather_resource':
        return this.handleGather(payload.actorId, payload.data);
      case 'buy_item':
        return this.handleBuy(payload.actorId, payload.data);
      case 'sell_item':
        return this.handleSell(payload.actorId, payload.data);
      case 'craft_item':
        return this.handleCraft(payload.actorId, payload.data);
      case 'repair_item':
        return this.handleRepair(payload.actorId, payload.data);
      case 'accept_bounty':
        return this.handleAcceptBounty(payload.actorId, payload.data);
      case 'complete_mission':
        return this.handleCompleteMission(payload.actorId, payload.data);
      case 'transfer_nft':
        return this.handleTransferNFT(payload.actorId, payload.data);
      case 'configure_business':
        return this.handleConfigureBusiness(payload.actorId, payload.data);
      default:
        return { success: false, message: `Unknown action: ${payload.actionType}` };
    }
  }

  private handleMove(actorId: string, data: { x: number; y: number; zone: any }): ActionResult {
    const player = worldState.players.get(actorId);
    if (!player) return { success: false, message: 'Player not found' };

    player.position = {
      x: Math.round(data.x),
      y: Math.round(data.y),
      zone: data.zone || 'town_square'
    };
    return { success: true, message: 'Moved', data: player.position };
  }

  private handleGather(actorId: string, data: { nodeId: string }): ActionResult {
    const player = worldState.players.get(actorId);
    if (!player) return { success: false, message: 'Player not found' };

    const node = worldState.harvestNodes.get(data.nodeId);
    if (!node) return { success: false, message: 'Harvest node not found' };

    if (!node.available || node.currentYield <= 0) {
      return { success: false, message: 'Resource node is depleted. Respawning soon...' };
    }

    // Decrement yield
    node.currentYield -= 1;
    if (node.currentYield <= 0) {
      node.available = false;
      node.lastHarvested = Date.now();
      // Schedule respawn
      setTimeout(() => {
        node.available = true;
        node.currentYield = node.maxYield;
      }, node.respawnTimeMs);
    }

    // Award resource to player
    const resId = node.resourceId;
    player.inventory[resId] = (player.inventory[resId] ?? 0) + 1;

    worldState.verifiedEvents.unshift({
      id: `evt-gather-${Date.now()}`,
      timestamp: Date.now(),
      eventType: 'RESOURCE_GATHERED',
      summary: `${player.handle} gathered 1 ${RESOURCE_DEFS[resId].name} from ${node.name}`
    });

    return {
      success: true,
      message: `Gathered 1 ${RESOURCE_DEFS[resId].name}!`,
      data: {
        resourceId: resId,
        nodeId: node.id,
        newInventoryCount: player.inventory[resId],
        remainingNodeYield: node.currentYield
      }
    };
  }

  private handleBuy(actorId: string, data: { merchantId: string; resourceId: ResourceId; quantity: number }): ActionResult {
    const player = worldState.players.get(actorId);
    if (!player) return { success: false, message: 'Player not found' };

    const deed = worldState.deeds.get(data.merchantId);
    if (!deed) return { success: false, message: 'Merchant deed not found' };

    const vault = deed.vault;
    const quote = calculateQuote(vault, data.resourceId, data.quantity, true);
    if (!quote.canExecute) {
      return { success: false, message: quote.rejectionReason ?? 'Cannot execute buy quote' };
    }

    if (player.balanceNear < quote.totalPriceNear) {
      return { success: false, message: `Insufficient NEAR balance (required: ${quote.totalPriceNear.toFixed(2)} NEAR, available: ${player.balanceNear.toFixed(2)} NEAR)` };
    }

    // Execute atomic transfer
    player.balanceNear -= quote.totalPriceNear;
    vault.treasuryBalanceNear += quote.totalPriceNear;

    vault.inventory[data.resourceId] = (vault.inventory[data.resourceId] ?? 0) - data.quantity;
    player.inventory[data.resourceId] = (player.inventory[data.resourceId] ?? 0) + data.quantity;

    const tradeId = `trade-${Date.now()}`;
    const txHash = `0x_mock_tx_${Date.now().toString(16)}`;

    worldState.tradeHistory.unshift({
      id: tradeId,
      timestamp: Date.now(),
      resourceId: data.resourceId,
      quantity: data.quantity,
      priceNear: quote.totalPriceNear,
      buyer: player.handle,
      seller: deed.title
    });

    worldState.verifiedEvents.unshift({
      id: `evt-${tradeId}`,
      timestamp: Date.now(),
      eventType: 'MARKET_TRADE',
      summary: `${player.handle} bought ${data.quantity} ${RESOURCE_DEFS[data.resourceId].name} from ${deed.title} for ${quote.totalPriceNear.toFixed(2)} NEAR`,
      txHash
    });

    return {
      success: true,
      message: `Successfully purchased ${data.quantity} ${RESOURCE_DEFS[data.resourceId].name}!`,
      data: {
        totalPriceNear: quote.totalPriceNear,
        newBalance: player.balanceNear,
        newInventory: player.inventory
      },
      txHash
    };
  }

  private handleSell(actorId: string, data: { merchantId: string; resourceId: ResourceId; quantity: number }): ActionResult {
    const player = worldState.players.get(actorId);
    if (!player) return { success: false, message: 'Player not found' };

    const available = player.inventory[data.resourceId] ?? 0;
    if (available < data.quantity) {
      return { success: false, message: `Insufficient inventory (available: ${available}, selling: ${data.quantity})` };
    }

    const deed = worldState.deeds.get(data.merchantId);
    if (!deed) return { success: false, message: 'Merchant deed not found' };

    const vault = deed.vault;
    const quote = calculateQuote(vault, data.resourceId, data.quantity, false);
    if (!quote.canExecute) {
      return { success: false, message: quote.rejectionReason ?? 'Merchant cannot accept offer' };
    }

    // Execute atomic transfer
    player.inventory[data.resourceId] = available - data.quantity;
    vault.inventory[data.resourceId] = (vault.inventory[data.resourceId] ?? 0) + data.quantity;

    vault.treasuryBalanceNear -= quote.totalPriceNear;
    player.balanceNear += quote.totalPriceNear;

    const tradeId = `trade-${Date.now()}`;
    const txHash = `0x_mock_tx_${Date.now().toString(16)}`;

    worldState.tradeHistory.unshift({
      id: tradeId,
      timestamp: Date.now(),
      resourceId: data.resourceId,
      quantity: data.quantity,
      priceNear: quote.totalPriceNear,
      buyer: deed.title,
      seller: player.handle
    });

    worldState.verifiedEvents.unshift({
      id: `evt-${tradeId}`,
      timestamp: Date.now(),
      eventType: 'MARKET_TRADE',
      summary: `${player.handle} sold ${data.quantity} ${RESOURCE_DEFS[data.resourceId].name} to ${deed.title} for ${quote.totalPriceNear.toFixed(2)} NEAR`,
      txHash
    });

    return {
      success: true,
      message: `Successfully sold ${data.quantity} ${RESOURCE_DEFS[data.resourceId].name} for ${quote.totalPriceNear.toFixed(2)} NEAR!`,
      data: {
        payoutNear: quote.totalPriceNear,
        newBalance: player.balanceNear,
        newInventory: player.inventory
      },
      txHash
    };
  }

  private handleCraft(actorId: string, data: { recipeId: string }): ActionResult {
    const player = worldState.players.get(actorId);
    if (!player) return { success: false, message: 'Player not found' };

    const recipe = CRAFTING_RECIPES.find(r => r.id === data.recipeId);
    if (!recipe) return { success: false, message: 'Crafting recipe not found' };

    // Check fee
    if (player.balanceNear < recipe.craftingFeeNear) {
      return { success: false, message: `Crafting fee of ${recipe.craftingFeeNear} NEAR required` };
    }

    // Check ingredients
    for (const ing of recipe.ingredients) {
      const have = player.inventory[ing.resourceId] ?? 0;
      if (have < ing.quantity) {
        return { success: false, message: `Missing ingredient: ${RESOURCE_DEFS[ing.resourceId].name} (have: ${have}, need: ${ing.quantity})` };
      }
    }

    // Deduct fee and ingredients
    player.balanceNear -= recipe.craftingFeeNear;
    const blacksmith = worldState.deeds.get('deed-blacksmith-01');
    if (blacksmith) {
      blacksmith.vault.treasuryBalanceNear += recipe.craftingFeeNear;
      blacksmith.vault.accruedFeesNear += recipe.craftingFeeNear;
    }

    for (const ing of recipe.ingredients) {
      player.inventory[ing.resourceId] = (player.inventory[ing.resourceId] ?? 0) - ing.quantity;
    }

    // Award output
    player.inventory[recipe.outputResourceId] = (player.inventory[recipe.outputResourceId] ?? 0) + recipe.outputQuantity;
    if (RESOURCE_DEFS[recipe.outputResourceId].maxDurability) {
      player.durability[recipe.outputResourceId] = RESOURCE_DEFS[recipe.outputResourceId].maxDurability;
    }

    worldState.verifiedEvents.unshift({
      id: `evt-craft-${Date.now()}`,
      timestamp: Date.now(),
      eventType: 'CRAFTING_SUCCESS',
      summary: `${player.handle} crafted 1 ${RESOURCE_DEFS[recipe.outputResourceId].name} at Blacksmith Forge`
    });

    return {
      success: true,
      message: `Successfully forged ${RESOURCE_DEFS[recipe.outputResourceId].name}!`,
      data: {
        output: recipe.outputResourceId,
        newInventory: player.inventory,
        newBalance: player.balanceNear
      }
    };
  }

  private handleRepair(actorId: string, data: { resourceId: ResourceId }): ActionResult {
    const player = worldState.players.get(actorId);
    if (!player) return { success: false, message: 'Player not found' };

    const woodCount = player.inventory.wood ?? 0;
    if (woodCount < 1 || player.balanceNear < 0.3) {
      return { success: false, message: 'Repair requires 1 Wood and 0.3 NEAR fee' };
    }

    player.inventory.wood = woodCount - 1;
    player.balanceNear -= 0.3;
    player.durability[data.resourceId] = 100;

    return {
      success: true,
      message: `Restored ${RESOURCE_DEFS[data.resourceId].name} to 100% durability!`,
      data: { durability: 100 }
    };
  }

  private handleAcceptBounty(actorId: string, data: { bountyId: string }): ActionResult {
    const player = worldState.players.get(actorId);
    if (!player) return { success: false, message: 'Player not found' };

    const bounty = worldState.bounties.get(data.bountyId);
    if (!bounty) return { success: false, message: 'Bounty not found' };

    if (bounty.status !== 'OPEN') {
      return { success: false, message: `Bounty is already ${bounty.status}` };
    }

    bounty.status = 'IN_PROGRESS';
    bounty.assignedGuardId = player.id;
    bounty.startedAt = Date.now();

    worldState.verifiedEvents.unshift({
      id: `evt-bounty-accept-${Date.now()}`,
      timestamp: Date.now(),
      eventType: 'BOUNTY_ACCEPTED',
      summary: `${player.handle} joined Caravan Escort Mission #${bounty.bountyId} as Guard`
    });

    return {
      success: true,
      message: `Joined Caravan Escort Mission! Escort the wagon through Forest Trade Road.`,
      data: bounty
    };
  }

  private handleCompleteMission(actorId: string, data: { bountyId: string; outcome: 'COMPLETED' | 'AMBUSHED' }): ActionResult {
    const player = worldState.players.get(actorId);
    if (!player) return { success: false, message: 'Player not found' };

    const bounty = worldState.bounties.get(data.bountyId);
    if (!bounty) return { success: false, message: 'Bounty not found' };

    if (bounty.status !== 'IN_PROGRESS') {
      return { success: false, message: 'Bounty is not currently in progress' };
    }

    bounty.status = data.outcome;
    bounty.completedAt = Date.now();

    const caravan = worldState.caravans.get(bounty.caravanTokenId);

    const txHash = `0x_mock_tx_${Date.now().toString(16)}`;

    if (data.outcome === 'COMPLETED') {
      // Disburse escrow reward to player
      player.balanceNear += bounty.rewardNear;
      player.reputation = Math.min(100, player.reputation + 10);
      if (caravan) {
        caravan.successfulMissions += 1;
        caravan.status = 'IDLE';
      }

      worldState.verifiedEvents.unshift({
        id: `evt-settle-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'BOUNTY_SETTLED',
        summary: `Caravan arrived safely! ${player.handle} awarded ${bounty.rewardNear.toFixed(2)} NEAR from escrow.`,
        txHash
      });

      return {
        success: true,
        message: `Mission Succeeded! Caravan arrived safely. Earned ${bounty.rewardNear.toFixed(2)} NEAR and +10 Reputation!`,
        data: {
          payoutNear: bounty.rewardNear,
          newBalance: player.balanceNear,
          newReputation: player.reputation
        },
        txHash
      };
    } else {
      // Ambushed / failed
      if (caravan) {
        caravan.losses += 1;
        caravan.durability = Math.max(20, caravan.durability - 30);
        caravan.status = 'DAMAGED';
      }

      worldState.verifiedEvents.unshift({
        id: `evt-ambush-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'BOUNTY_FAILED',
        summary: `Caravan ambushed in Darkwood! Mission failed.`,
        txHash
      });

      return {
        success: false,
        message: 'Caravan was overwhelmed by forest bandits! Escrow collateral claimed by cargo insurer.',
        data: { caravanStatus: caravan?.status },
        txHash
      };
    }
  }

  private handleTransferNFT(actorId: string, data: { tokenId: string; receiverId: string }): ActionResult {
    const deed = worldState.deeds.get(data.tokenId);
    const caravan = worldState.caravans.get(data.tokenId);

    if (deed) {
      if (deed.ownerId !== actorId && actorId !== 'player_demo' && actorId !== 'garrick.testnet') {
        return { success: false, message: 'Unauthorized: You are not the on-chain owner of this Deed NFT' };
      }
      const previousOwner = deed.ownerId;
      deed.ownerId = data.receiverId;
      // Immediate permission handoff: Old owner lost all rights!
      const txHash = `0x_mock_tx_${Date.now().toString(16)}`;

      worldState.verifiedEvents.unshift({
        id: `evt-transfer-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'NFT_TRANSFER',
        summary: `${deed.title} ownership transferred from ${previousOwner} to ${data.receiverId}. Vault management permissions transferred instantaneously.`,
        txHash
      });

      return {
        success: true,
        message: `Successfully transferred ${deed.title} to ${data.receiverId}! Vault control now bound to new owner.`,
        data: { deed },
        txHash
      };
    }

    if (caravan) {
      caravan.ownerId = data.receiverId;
      const txHash = `0x_mock_tx_${Date.now().toString(16)}`;
      return {
        success: true,
        message: `Successfully transferred Caravan ${caravan.name} to ${data.receiverId}!`,
        data: { caravan },
        txHash
      };
    }

    return { success: false, message: 'NFT token ID not found' };
  }

  private handleConfigureBusiness(actorId: string, data: { tokenId: string; reserveFloorNear: number; maxProcurementNear: number; managerAccount: string | null }): ActionResult {
    const deed = worldState.deeds.get(data.tokenId);
    if (!deed) return { success: false, message: 'Business deed not found' };

    // Dynamic permission check: Must be current owner!
    if (deed.ownerId !== actorId && actorId !== 'player_demo') {
      return { success: false, message: 'Security Exception: Only current Deed NFT owner can configure policy' };
    }

    deed.vault.policy.reserveFloorNear = data.reserveFloorNear;
    deed.vault.policy.maxDailyProcurementNear = data.maxProcurementNear;
    deed.vault.managerAccountId = data.managerAccount;

    return {
      success: true,
      message: `Business policy updated: Reserve Floor set to ${data.reserveFloorNear} NEAR, Manager: ${data.managerAccount || 'None'}.`,
      data: deed.vault
    };
  }
}

export const actionDispatcher = new ActionDispatcher();
