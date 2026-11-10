import React from 'react';
import { PlayerProfile, ResourceId } from '@turfwar/shared-types';
import { RESOURCE_DEFS } from '@turfwar/economy-engine';
import { soundEngine } from '../audio/sounds.ts';

interface InventoryModalProps {
  player: PlayerProfile;
  onClose: () => void;
  onEquipItem?: (resId: ResourceId) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  onClose,
  onEquipItem
}) => {
  const invEntries = Object.entries(player.inventory) as [ResourceId, number][];

  return (
    <div className="modal-backdrop interactive" onClick={onClose}>
      <div className="parchment-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">🎒 Adventurer's Pack & Equipment</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Equipment Loadout */}
        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--ink-highlight)', marginBottom: '8px' }}>
            Equipped Gear
          </h4>
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Weapon Slot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.4)', padding: '8px 12px', borderRadius: '4px', flex: 1 }}>
              <div className="inv-slot" style={{ width: '48px', height: '48px' }}>
                <img src="/assets/items/icon_sword_iron.png" alt="Sword" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Frontier Broadsword</div>
                <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>+15 Attack Rating</div>
                <div style={{ fontSize: '10px', color: 'var(--green-mid)', fontWeight: 'bold' }}>
                  Durability: {player.durability.sword_iron ?? 90}/100
                </div>
              </div>
            </div>

            {/* Shield Slot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.4)', padding: '8px 12px', borderRadius: '4px', flex: 1 }}>
              <div className="inv-slot" style={{ width: '48px', height: '48px' }}>
                <img src="/assets/items/icon_shield_iron.png" alt="Shield" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Reinforced Buckler</div>
                <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>+20 Absorption</div>
                <div style={{ fontSize: '10px', color: 'var(--green-mid)', fontWeight: 'bold' }}>
                  Durability: 100/100
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Inventory Grid */}
        <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--ink-highlight)', marginBottom: '8px' }}>
          Backpack Inventory
        </h4>
        <div className="inventory-grid">
          {invEntries.map(([resId, count]) => {
            const def = RESOURCE_DEFS[resId];
            if (!def || count <= 0) return null;
            return (
              <div
                key={resId}
                className="inv-slot"
                title={`${def.name}: ${def.description}`}
                onClick={() => soundEngine.playClick()}
              >
                <img src={`/assets/items/${def.icon}`} alt={def.name} />
                <span className="inv-count">{count}</span>
              </div>
            );
          })}

          {/* Empty slot fillers */}
          {Array.from({ length: Math.max(0, 12 - invEntries.length) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="inv-slot inv-slot-empty" />
          ))}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-muted)' }}>
          <span>Tip: Gather raw Ore & Wood in Darkwood Edge or craft gear at Town Forge.</span>
          <span>Encumbrance: OK</span>
        </div>
      </div>
    </div>
  );
};
