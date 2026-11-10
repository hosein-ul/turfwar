import { describe, it } from 'node:test';
import assert from 'node:assert';
import { worldState } from './state.js';
import { actionDispatcher } from './actions.js';

describe('TURFWAR Server Action Dispatcher Tests', () => {
  it('initializes world state correctly', () => {
    assert.ok(worldState.deeds.has('deed-blacksmith-01'));
    assert.ok(worldState.agents.has('garrick'));
    assert.ok(worldState.harvestNodes.has('node-ore-1'));
  });

  it('gathers resource from active node and respawns properly', () => {
    const player = worldState.getOrCreatePlayer('test_gatherer');
    const prevOre = player.inventory.iron_ore ?? 0;

    const res = actionDispatcher.execute({
      actionType: 'gather_resource',
      actorId: 'test_gatherer',
      timestamp: Date.now(),
      data: { nodeId: 'node-ore-1' }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(player.inventory.iron_ore, prevOre + 1);
  });

  it('rejects buy trade when player lacks balance', () => {
    const poorPlayer = worldState.getOrCreatePlayer('poor_player');
    poorPlayer.balanceNear = 0.0;

    const res = actionDispatcher.execute({
      actionType: 'buy_item',
      actorId: 'poor_player',
      timestamp: Date.now(),
      data: { merchantId: 'deed-blacksmith-01', resourceId: 'sword_iron', quantity: 1 }
    });

    assert.strictEqual(res.success, false);
    assert.ok(res.message.includes('Insufficient NEAR balance'));
  });

  it('executes valid trade atomically', () => {
    const richPlayer = worldState.getOrCreatePlayer('rich_player');
    richPlayer.balanceNear = 50.0;
    const prevBalance = richPlayer.balanceNear;
    const prevSword = richPlayer.inventory.sword_iron ?? 0;

    const res = actionDispatcher.execute({
      actionType: 'buy_item',
      actorId: 'rich_player',
      timestamp: Date.now(),
      data: { merchantId: 'deed-blacksmith-01', resourceId: 'sword_iron', quantity: 1 }
    });

    assert.strictEqual(res.success, true);
    assert.ok(richPlayer.balanceNear < prevBalance);
    assert.strictEqual(richPlayer.inventory.sword_iron, prevSword + 1);
  });
});
