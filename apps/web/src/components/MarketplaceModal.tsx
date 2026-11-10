import React, { useState } from 'react';
import { BusinessDeedNFT, CaravanNFT, PlayerProfile } from '@turfwar/shared-types';
import { soundEngine } from '../audio/sounds.ts';

interface MarketplaceModalProps {
  deeds: BusinessDeedNFT[];
  caravans: CaravanNFT[];
  player: PlayerProfile;
  onTransferNFT: (tokenId: string, receiverId: string) => void;
  onClose: () => void;
}

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  deeds,
  caravans,
  player,
  onTransferNFT,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'deeds' | 'caravans'>('deeds');
  const [transferTarget, setTransferTarget] = useState<string>('player_demo');

  return (
    <div className="modal-backdrop interactive" onClick={onClose}>
      <div className="parchment-panel modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">🏰 In-Game NFT Marketplace & Asset Vaults</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--wood-mid)', paddingBottom: '8px', marginBottom: '14px' }}>
          <button
            className={`btn-fantasy ${activeTab === 'deeds' ? 'btn-gold' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('deeds'); }}
          >
            Business Deed NFTs (NEP-171)
          </button>
          <button
            className={`btn-fantasy ${activeTab === 'caravans' ? 'btn-gold' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('caravans'); }}
          >
            Logistics Caravan NFTs (NEP-171)
          </button>
        </div>

        {activeTab === 'deeds' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {deeds.map((deed) => {
              const isOwner = deed.ownerId === player.id || (player.accountType === 'guest' && deed.ownerId === 'garrick.testnet');
              return (
                <div
                  key={deed.tokenId}
                  style={{
                    background: 'rgba(255, 255, 255, 0.45)',
                    border: '2px solid var(--wood-mid)',
                    borderRadius: '4px',
                    padding: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <img
                        src="/assets/buildings/blacksmith_256.png"
                        alt={deed.title}
                        style={{ width: '64px', height: '64px', objectFit: 'contain', imageRendering: 'pixelated', border: '2px solid var(--gold-mid)', borderRadius: '4px' }}
                      />
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--ink-highlight)' }}>
                          {deed.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                          Token ID: <code style={{ color: 'var(--wood-black)' }}>{deed.tokenId}</code>
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          <strong>Current Owner:</strong> <span style={{ color: 'var(--gold-mid)', fontWeight: 'bold' }}>{deed.ownerId}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="hud-net-badge" style={{ background: 'var(--green-deep)', color: 'var(--green-hi)' }}>
                        VERIFIED ON-CHAIN
                      </span>
                    </div>
                  </div>

                  {/* Linked Asset Vault Overview */}
                  <div style={{ marginTop: '12px', background: 'var(--stone-black)', color: 'var(--parchment-bg)', padding: '10px 14px', borderRadius: '4px', fontSize: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gold-light)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Linked Contract Asset Vault State
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div>
                        <strong>Treasury:</strong> <span style={{ color: 'var(--gold-hi)' }}>{deed.vault.treasuryBalanceNear.toFixed(2)} NEAR</span>
                      </div>
                      <div>
                        <strong>Reserve Floor:</strong> {deed.vault.policy.reserveFloorNear.toFixed(1)} NEAR
                      </div>
                      <div>
                        <strong>Manager:</strong> {deed.vault.managerAccountId || 'None'}
                      </div>
                      <div>
                        <strong>Accrued Fees:</strong> {deed.vault.accruedFeesNear.toFixed(2)} NEAR
                      </div>
                      <div>
                        <strong>Daily Upkeep:</strong> {(deed.vault.upkeepCostNear / 7).toFixed(2)} NEAR
                      </div>
                      <div>
                        <strong>Status:</strong> <span style={{ color: deed.vault.operatingStatus === 'ACTIVE' ? 'var(--green-hi)' : 'var(--amber-light)' }}>{deed.vault.operatingStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Permission Demonstration: Instant Owner Handoff */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                      Transfer Deed to test immediate permission hand-off (old owner loses vault access instantly):
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={transferTarget}
                        onChange={(e) => setTransferTarget(e.target.value)}
                        placeholder="Receiver account..."
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--wood-mid)', fontSize: '11px', width: '130px' }}
                      />
                      <button
                        className="btn-fantasy btn-gold"
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                        onClick={() => {
                          soundEngine.playCoin();
                          onTransferNFT(deed.tokenId, transferTarget);
                        }}
                      >
                        Transfer Deed NFT
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {caravans.map((caravan) => (
              <div
                key={caravan.tokenId}
                style={{
                  background: 'rgba(255, 255, 255, 0.45)',
                  border: '2px solid var(--wood-mid)',
                  borderRadius: '4px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img
                    src="/assets/props/prop_wagon_caravan.png"
                    alt={caravan.name}
                    style={{ width: '64px', height: '64px', objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{caravan.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Owner: {caravan.ownerId}</div>
                    <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', gap: '12px' }}>
                      <span><strong>Cargo Capacity:</strong> {caravan.cargoCapacity} wt</span>
                      <span><strong>Armor:</strong> {caravan.armor}</span>
                      <span><strong>Durability:</strong> {caravan.durability}/{caravan.maxDurability}</span>
                      <span><strong>Deliveries:</strong> {caravan.successfulMissions}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    className="btn-fantasy"
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                    onClick={() => {
                      soundEngine.playClick();
                      alert(`Caravan ${caravan.name} is currently assigned to route logistics.`);
                    }}
                  >
                    Inspect Wagon
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
