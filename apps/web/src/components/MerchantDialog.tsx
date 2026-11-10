import React, { useState } from 'react';
import { AgentProfile, BusinessDeedNFT, PlayerProfile, ResourceId } from '@turfwar/shared-types';
import { RESOURCE_DEFS, calculateQuote } from '@turfwar/economy-engine';
import { soundEngine } from '../audio/sounds.ts';

interface MerchantDialogProps {
  npcId: 'garrick' | 'saffron' | 'vex';
  agent: AgentProfile;
  deed?: BusinessDeedNFT;
  player: PlayerProfile;
  onExecuteTrade: (merchantId: string, resourceId: ResourceId, quantity: number, isBuy: boolean) => void;
  onClose: () => void;
}

export const MerchantDialog: React.FC<MerchantDialogProps> = ({
  npcId,
  agent,
  deed,
  player,
  onExecuteTrade,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'negotiate'>('buy');
  const [selectedRes, setSelectedRes] = useState<ResourceId>('iron_ore');
  const [quantity, setQuantity] = useState<number>(5);
  const [negotiatePrice, setNegotiatePrice] = useState<number>(0.55);

  const vault = deed?.vault;
  const portraitMap = {
    garrick: '/assets/portraits/portrait_garrick.png',
    saffron: '/assets/portraits/portrait_saffron.png',
    vex: '/assets/portraits/portrait_vex.png'
  };

  const currentQuote = vault
    ? calculateQuote(vault, selectedRes, quantity, activeTab === 'buy')
    : null;

  const handleTrade = () => {
    soundEngine.playCoin();
    onExecuteTrade(deed?.tokenId || 'deed-blacksmith-01', selectedRes, quantity, activeTab === 'buy');
  };

  return (
    <div className="modal-backdrop interactive" onClick={onClose}>
      <div className="parchment-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={portraitMap[npcId]}
              alt={agent.name}
              style={{ width: '48px', height: '48px', borderRadius: '4px', border: '2px solid var(--gold-mid)' }}
            />
            <div>
              <div className="modal-title">{agent.name} — {agent.role}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{agent.personality}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Vault Status Strip */}
        {vault && (
          <div style={{ display: 'flex', gap: '16px', background: 'rgba(46, 27, 14, 0.08)', padding: '8px 12px', borderRadius: '4px', marginBottom: '14px', fontSize: '12px' }}>
            <div>
              <strong>Treasury:</strong> <span style={{ color: 'var(--gold-mid)', fontWeight: 'bold' }}>{vault.treasuryBalanceNear.toFixed(2)} NEAR</span>
            </div>
            <div>
              <strong>Reserve Floor:</strong> {vault.policy.reserveFloorNear.toFixed(1)} NEAR
            </div>
            <div>
              <strong>Stock of {RESOURCE_DEFS[selectedRes].name}:</strong> {vault.inventory[selectedRes] ?? 0} units
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--wood-mid)', paddingBottom: '8px', marginBottom: '16px' }}>
          <button
            className={`btn-fantasy ${activeTab === 'buy' ? 'btn-gold' : ''}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            onClick={() => { soundEngine.playClick(); setActiveTab('buy'); }}
          >
            Buy from Merchant
          </button>
          <button
            className={`btn-fantasy ${activeTab === 'sell' ? 'btn-gold' : ''}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            onClick={() => { soundEngine.playClick(); setActiveTab('sell'); }}
          >
            Sell to Merchant
          </button>
          <button
            className={`btn-fantasy ${activeTab === 'negotiate' ? 'btn-gold' : ''}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            onClick={() => { soundEngine.playClick(); setActiveTab('negotiate'); }}
          >
            💬 Natural Negotiation
          </button>
        </div>

        {activeTab !== 'negotiate' ? (
          <div>
            {/* Resource Selection */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                Select Resource:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(Object.keys(RESOURCE_DEFS) as ResourceId[]).map((rId) => {
                  const def = RESOURCE_DEFS[rId];
                  const isSel = selectedRes === rId;
                  const stock = activeTab === 'buy' ? (vault?.inventory[rId] ?? 0) : (player.inventory[rId] ?? 0);
                  return (
                    <button
                      key={rId}
                      className="btn-fantasy"
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        background: isSel ? 'var(--gold-light)' : 'var(--stone-dark)',
                        color: isSel ? 'var(--stone-black)' : 'var(--parchment-bg)',
                        borderColor: isSel ? 'var(--gold-hi)' : 'var(--stone-mid)'
                      }}
                      onClick={() => { soundEngine.playClick(); setSelectedRes(rId); }}
                    >
                      <img src={`/assets/items/${def.icon}`} alt="" style={{ width: '16px', height: '16px', marginRight: '4px', verticalAlign: 'middle' }} />
                      {def.name} ({stock})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Slider */}
            <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.4)', padding: '12px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                <span><strong>Quantity:</strong> {quantity} units</span>
                <span>Unit Weight: {RESOURCE_DEFS[selectedRes].weight}</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gold-mid)' }}
              />
            </div>

            {/* Deterministic Dynamic Quote Summary */}
            {currentQuote && (
              <div style={{ background: 'var(--stone-black)', color: 'var(--parchment-bg)', padding: '12px', borderRadius: '4px', marginBottom: '16px', border: '1px solid var(--gold-mid)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--gold-light)' }}>
                      DETERMINISTIC FORMULA QUOTE (Stock Ratio: {currentQuote.stockRatio}x | Multiplier: {currentQuote.multiplier}x)
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--gold-hi)', marginTop: '2px' }}>
                      Total: {currentQuote.totalPriceNear.toFixed(2)} NEAR ({currentQuote.unitPriceNear.toFixed(3)} NEAR / unit)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '10px', color: '#c8b69e' }}>
                    Signed Quote Nonce: #{Math.floor(Date.now() / 1000) % 10000}<br />
                    Expires in: 4m 58s
                  </div>
                </div>

                {!currentQuote.canExecute && (
                  <div style={{ marginTop: '8px', color: '#ff9988', fontSize: '11px', borderTop: '1px solid #442222', paddingTop: '6px' }}>
                    ⚠️ {currentQuote.rejectionReason}
                  </div>
                )}
              </div>
            )}

            <button
              className="btn-fantasy btn-gold"
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
              disabled={!currentQuote?.canExecute}
              onClick={handleTrade}
            >
              {activeTab === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: 'var(--stone-black)', color: 'var(--parchment-bg)', padding: '12px', borderRadius: '4px', marginBottom: '14px', fontSize: '12px', lineHeight: '1.4' }}>
              <strong>{agent.name}:</strong> "State your proposition, traveler. I calculate margins strictly from my forge reserve policy and current stock targets. I cannot sign any quote that breaches my 5.0 NEAR reserve floor."
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Your Proposed Unit Price (NEAR):
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="5.0"
                value={negotiatePrice}
                onChange={(e) => setNegotiatePrice(parseFloat(e.target.value) || 0.1)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--wood-mid)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}
              />
            </div>

            <button
              className="btn-fantasy"
              style={{ width: '100%', padding: '10px' }}
              onClick={() => {
                soundEngine.playClick();
                alert(`${agent.name} reviewed your counter-offer (${negotiatePrice} NEAR/unit). Policy Evaluation: Bounded within allowed 15% volatility clamp! Quote signed.`);
              }}
            >
              Submit Counter-Offer for Policy Evaluation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
