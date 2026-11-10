import { worldState } from './state.js';
import { calculateQuote, RESOURCE_DEFS } from '@turfwar/economy-engine';
import { ResourceId } from '@turfwar/shared-types';

export class AgentRuntime {
  private lastTick: number = Date.now();

  public tick() {
    this.tickGarrick();
    this.tickSaffron();
    this.tickVex();
    this.lastTick = Date.now();
  }

  private tickGarrick() {
    const garrick = worldState.agents.get('garrick');
    const deed = worldState.deeds.get('deed-blacksmith-01');
    if (!garrick || !deed || garrick.status === 'PAUSED') return;

    const vault = deed.vault;
    const oreCount = vault.inventory.iron_ore ?? 0;
    const woodCount = vault.inventory.wood ?? 0;
    const ingotCount = vault.inventory.iron_ingot ?? 0;

    // 1. Production Rule: If sufficient raw materials, auto-smelt ingots
    if (oreCount >= 4 && woodCount >= 2 && ingotCount < (vault.policy.targetStock.iron_ingot ?? 20)) {
      vault.inventory.iron_ore = oreCount - 4;
      vault.inventory.wood = woodCount - 2;
      vault.inventory.iron_ingot = ingotCount + 2;
      vault.treasuryBalanceNear += 0.40; // Internal crafting value added

      garrick.recentDecisions.unshift({
        timestamp: Date.now(),
        action: 'Smelted 2 Refined Ingots',
        rationale: `Raw stock available (Ore: ${oreCount}, Wood: ${woodCount}). Advancing workshop production towards ingot target (${vault.policy.targetStock.iron_ingot}).`,
        details: 'Consumed 4 Iron Ore + 2 Wood; produced 2 Refined Iron Ingots (+0.40 NEAR value)'
      });

      if (garrick.recentDecisions.length > 20) garrick.recentDecisions.pop();

      worldState.verifiedEvents.unshift({
        id: `evt-smelt-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'AGENT_CRAFT',
        summary: 'Garrick smelted 2 Refined Iron Ingots at Town Forge'
      });
      return;
    }

    // 2. Procurement Policy: If stock below target, log procurement intent
    const oreTarget = vault.policy.targetStock.iron_ore ?? 40;
    if (oreCount < oreTarget) {
      const needed = oreTarget - oreCount;
      const quote = calculateQuote(vault, 'iron_ore', Math.min(10, needed), false);
      if (quote.canExecute && Date.now() - (garrick.recentDecisions[0]?.timestamp ?? 0) > 30000) {
        garrick.recentDecisions.unshift({
          timestamp: Date.now(),
          action: 'Standing Buy Bid for Iron Ore',
          rationale: `Forge ore inventory (${oreCount}) is below target (${oreTarget}). Liquidity ratio: ${quote.liquidityRatio}.`,
          details: `Offering ${quote.unitPriceNear} NEAR/unit for up to ${Math.min(10, needed)} units. Guaranteed above 5.0 NEAR reserve floor.`
        });
        if (garrick.recentDecisions.length > 20) garrick.recentDecisions.pop();
      }
    }
  }

  private tickSaffron() {
    const saffron = worldState.agents.get('saffron');
    const caravan = worldState.caravans.get('caravan-wagon-01');
    if (!saffron || !caravan || saffron.status === 'PAUSED') return;

    // Check if open bounty exists
    let hasOpenBounty = false;
    for (const b of worldState.bounties.values()) {
      if (b.status === 'OPEN' || b.status === 'IN_PROGRESS') {
        hasOpenBounty = true;
        break;
      }
    }

    // If no open bounty and caravan is idle, create a funded escort bounty
    if (!hasOpenBounty && caravan.status === 'IDLE' && saffron.balanceNear >= 7.0) {
      const bountyId = `bounty-escort-${Date.now().toString().slice(-4)}`;
      const reward = 5.0;
      const collateral = 2.0;

      saffron.balanceNear -= (reward + collateral);
      caravan.status = 'ON_MISSION';

      worldState.bounties.set(bountyId, {
        bountyId,
        issuerId: saffron.walletAccountId,
        issuerRole: 'agent',
        caravanTokenId: caravan.tokenId,
        cargo: [
          { resourceId: 'iron_ingot', quantity: 4 },
          { resourceId: 'repair_kit', quantity: 2 }
        ],
        rewardNear: reward,
        collateralNear: collateral,
        risk: 'MEDIUM',
        status: 'OPEN',
        assignedGuardId: null,
        routeId: 'darkwood_escort'
      });

      saffron.recentDecisions.unshift({
        timestamp: Date.now(),
        action: `Funded Escort Bounty #${bountyId}`,
        rationale: 'Transporting refined cargo across Darkwood route. Risk premium supported by frontier outpost spread.',
        details: `Escrowed ${reward} NEAR reward + ${collateral} NEAR collateral from autonomous budget.`
      });

      if (saffron.recentDecisions.length > 20) saffron.recentDecisions.pop();

      worldState.verifiedEvents.unshift({
        id: `evt-bounty-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'BOUNTY_POSTED',
        summary: `Saffron funded 5.0 NEAR Caravan Escort Bounty (#${bountyId})`
      });
    }
  }

  private tickVex() {
    const vex = worldState.agents.get('vex');
    if (!vex || vex.status === 'PAUSED') return;

    if (Date.now() - (vex.recentDecisions[0]?.timestamp ?? 0) > 45000) {
      // Vex inspects open market spreads
      const blacksmith = worldState.deeds.get('deed-blacksmith-01');
      if (blacksmith) {
        const oreQuote = calculateQuote(blacksmith.vault, 'iron_ore', 5, false);
        vex.recentDecisions.unshift({
          timestamp: Date.now(),
          action: 'Market Arbitrage Analysis',
          rationale: `Garrick offers ${oreQuote.unitPriceNear} NEAR/ore. Gathering node price is 0.25 NEAR base.`,
          details: 'Ready to front-run supply or offer escort counter-bids.'
        });
        if (vex.recentDecisions.length > 20) vex.recentDecisions.pop();
      }
    }
  }
}

export const agentRuntime = new AgentRuntime();
