import React from 'react';
import { PlayerProfile } from '@turfwar/shared-types';
import { CRAFTING_RECIPES, RESOURCE_DEFS } from '@turfwar/economy-engine';
import { soundEngine } from '../audio/sounds.ts';

interface CraftingModalProps {
  player: PlayerProfile;
  onCraftRecipe: (recipeId: string) => void;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  player,
  onCraftRecipe,
  onClose
}) => {
  return (
    <div className="modal-backdrop interactive" onClick={onClose}>
      <div className="parchment-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">⚒️ Town Blacksmith Forge & Workbench</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '14px' }}>
          Utilize the forge's high-temperature blast furnace to smelt ingots and craft tempered equipment. Crafting fees are paid directly to the Forge Deed Vault.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CRAFTING_RECIPES.map((recipe) => {
            const outputDef = RESOURCE_DEFS[recipe.outputResourceId];

            // Check if player has ingredients
            let canCraft = player.balanceNear >= recipe.craftingFeeNear;
            const ingredientStatus = recipe.ingredients.map((ing) => {
              const have = player.inventory[ing.resourceId] ?? 0;
              const hasEnough = have >= ing.quantity;
              if (!hasEnough) canCraft = false;
              return {
                name: RESOURCE_DEFS[ing.resourceId].name,
                have,
                need: ing.quantity,
                hasEnough
              };
            });

            return (
              <div
                key={recipe.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.45)',
                  border: '2px solid var(--wood-mid)',
                  borderRadius: '4px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={`/assets/items/${outputDef.icon}`}
                    alt={outputDef.name}
                    style={{ width: '36px', height: '36px', imageRendering: 'pixelated' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      {outputDef.name} x{recipe.outputQuantity}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                      {outputDef.description}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      <strong>Requirements: </strong>
                      {ingredientStatus.map((st, i) => (
                        <span
                          key={i}
                          style={{
                            color: st.hasEnough ? 'var(--green-mid)' : 'var(--amber-red)',
                            fontWeight: st.hasEnough ? 'normal' : 'bold',
                            marginRight: '8px'
                          }}
                        >
                          {st.name} ({st.have}/{st.need})
                        </span>
                      ))}
                      <span style={{ color: 'var(--gold-mid)', fontWeight: 'bold' }}>
                        Fee: {recipe.craftingFeeNear} NEAR
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-fantasy btn-gold"
                  disabled={!canCraft}
                  onClick={() => {
                    soundEngine.playHammer();
                    onCraftRecipe(recipe.id);
                  }}
                  style={{ whiteSpace: 'nowrap', padding: '8px 14px' }}
                >
                  Hammer & Forge
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
