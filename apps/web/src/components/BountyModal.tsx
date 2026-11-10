import React from 'react';
import { EscrowBounty, PlayerProfile } from '@turfwar/shared-types';
import { soundEngine } from '../audio/sounds.ts';

interface BountyModalProps {
  bounties: EscrowBounty[];
  player: PlayerProfile;
  onAcceptBounty: (bountyId: string) => void;
  onCompleteMission: (bountyId: string, outcome: 'COMPLETED' | 'AMBUSHED') => void;
  onClose: () => void;
}

export const BountyModal: React.FC<BountyModalProps> = ({
  bounties,
  player,
  onAcceptBounty,
  onCompleteMission,
  onClose
}) => {
  return (
    <div className="modal-backdrop interactive" onClick={onClose}>
      <div className="parchment-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">📜 Town Notice Board — Caravan Escort Bounties</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '14px' }}>
          Autonomous brokers lock NEAR in contract escrow to hire guards for dangerous cargo transport. Defend the convoy against forest bandits to claim escrowed rewards.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bounties.map((bounty) => {
            const isAssignedToPlayer = bounty.assignedGuardId === player.id;
            const isOpen = bounty.status === 'OPEN';
            const isInProgress = bounty.status === 'IN_PROGRESS';

            return (
              <div
                key={bounty.bountyId}
                style={{
                  background: 'rgba(255, 255, 255, 0.45)',
                  border: '2px solid var(--wood-mid)',
                  borderRadius: '4px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--ink-highlight)' }}>
                      🛡️ Darkwood Escort Contract (#{bounty.bountyId})
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                      Posted by Autonomous Agent: <strong>{bounty.issuerId}</strong>
                    </div>
                  </div>

                  <span
                    className="hud-net-badge"
                    style={{
                      background: isOpen ? 'var(--green-deep)' : isInProgress ? 'var(--amber-dark)' : 'var(--stone-dark)',
                      color: isOpen ? 'var(--green-hi)' : isInProgress ? 'var(--amber-light)' : 'var(--stone-light)'
                    }}
                  >
                    STATUS: {bounty.status}
                  </span>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', gap: '20px', fontSize: '12px', background: 'rgba(0,0,0,0.06)', padding: '8px', borderRadius: '4px' }}>
                  <div>
                    <strong>Escrow Reward:</strong> <span style={{ color: 'var(--gold-mid)', fontWeight: 'bold' }}>{bounty.rewardNear.toFixed(2)} NEAR</span>
                  </div>
                  <div>
                    <strong>Locked Collateral:</strong> {bounty.collateralNear.toFixed(2)} NEAR
                  </div>
                  <div>
                    <strong>Risk Rating:</strong> <span style={{ color: 'var(--amber-red)', fontWeight: 'bold' }}>{bounty.risk}</span>
                  </div>
                </div>

                {/* Cargo breakdown */}
                <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--ink-muted)' }}>
                  <strong>Caravan Cargo: </strong>
                  {bounty.cargo.map((c, i) => (
                    <span key={i} style={{ marginRight: '8px' }}>
                      {c.resourceId} x{c.quantity}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  {isOpen && (
                    <button
                      className="btn-fantasy btn-gold"
                      onClick={() => {
                        soundEngine.playClick();
                        onAcceptBounty(bounty.bountyId);
                      }}
                    >
                      ⚔️ Accept Escort Contract
                    </button>
                  )}

                  {isInProgress && isAssignedToPlayer && (
                    <>
                      <button
                        className="btn-fantasy"
                        style={{ background: 'var(--amber-dark)' }}
                        onClick={() => {
                          soundEngine.playClick();
                          onCompleteMission(bounty.bountyId, 'AMBUSHED');
                        }}
                      >
                        Simulate Ambush
                      </button>

                      <button
                        className="btn-fantasy btn-gold"
                        onClick={() => {
                          soundEngine.playMissionSuccess();
                          onCompleteMission(bounty.bountyId, 'COMPLETED');
                        }}
                      >
                        ⭐ Complete Escort & Claim Escrow
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
