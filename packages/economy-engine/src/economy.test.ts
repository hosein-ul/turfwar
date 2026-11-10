import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateQuote,
  simulateEconomicDays,
  RESOURCE_DEFS
} from './index.js';
import { BusinessVault } from '@turfwar/shared-types';

describe('TURFWAR Economy Engine Tests', () => {
  const mockVault: BusinessVault = {
    tokenId: 'deed-blacksmith-01',
    businessType: 'BLACKSMITH',
    treasuryBalanceNear: 25.0,
    inventory: {
      iron_ore: 10,
      wood: 20,
      iron_ingot: 5,
      sword_iron: 2
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
        sword_iron: 10
      },
      autoCraftThreshold: 5,
      feeBasisPoints: 500
    },
    accruedFeesNear: 1.25,
    totalVolumeNear: 45.0,
    lastUpkeepTimestamp: Date.now(),
    upkeepCostNear: 1.5
  };

  it('calculates deterministic quotes within 0.5x to 2.0x reference bounds', () => {
    // Low stock (10 vs 40 target) -> High buy price from player
    const quoteLowStock = calculateQuote(mockVault, 'iron_ore', 5, false);
    assert.strictEqual(quoteLowStock.canExecute, true);
    assert.ok(quoteLowStock.multiplier >= 1.0, 'Multiplier should be elevated when stock is scarce');
    assert.ok(quoteLowStock.multiplier <= 2.0, 'Multiplier should never exceed 2.0');

    // High stock simulated
    const highStockVault = {
      ...mockVault,
      inventory: { ...mockVault.inventory, iron_ore: 100 }
    };
    const quoteHighStock = calculateQuote(highStockVault, 'iron_ore', 5, false);
    assert.ok(quoteHighStock.multiplier < quoteLowStock.multiplier, 'High stock must result in lower multiplier');
    assert.ok(quoteHighStock.multiplier >= 0.5, 'Multiplier must never drop below 0.5');
  });

  it('strictly enforces minimum reserve floor policy', () => {
    const poorVault: BusinessVault = {
      ...mockVault,
      treasuryBalanceNear: 5.5, // Only 0.5 above 5.0 floor
      policy: {
        ...mockVault.policy,
        reserveFloorNear: 5.0
      }
    };

    // Attempt to sell a high-value batch that would drop balance below 5.0
    const quote = calculateQuote(poorVault, 'sword_iron', 2, false);
    assert.strictEqual(quote.canExecute, false);
    assert.ok(quote.rejectionReason?.includes('reserve policy'));
  });

  it('runs 7-day economic simulation deterministically', () => {
    const vaults: Record<string, BusinessVault> = {
      'deed-blacksmith-01': mockVault
    };

    const result = simulateEconomicDays(vaults, 7);
    assert.strictEqual(result.daysSimulated, 7);
    assert.ok(result.tradesExecuted > 0, 'Trades should have executed over 7 days');
    assert.ok(result.totalFeesBurnedNear > 0, 'Upkeep fees should have burned');
    assert.ok(result.businessHealth['deed-blacksmith-01'], 'Business health should be logged');
  });
});
