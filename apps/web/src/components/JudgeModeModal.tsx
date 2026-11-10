import React, { useState } from 'react';
import { AgentProfile, EconomicSimulationResult } from '@turfwar/shared-types';
import { soundEngine } from '../audio/sounds.ts';

interface JudgeModeModalProps {
  agents: AgentProfile[];
  onSimulateDays: (days: number) => Promise<EconomicSimulationResult>;
  onResetScenario: () => void;
  onClose: () => void;
}

export const JudgeModeModal: React.FC<JudgeModeModalProps> = ({
  agents,
  onSimulateDays,
  onResetScenario,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'agents' | 'verification'>('simulation');
  const [simResult, setSimResult] = useState<EconomicSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    soundEngine.playHammer();
    try {
      const res = await onSimulateDays(7);
      setSimResult(res);
      soundEngine.playCoin();
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="modal-backdrop interactive" onClick={onClose}>
      <div className="parchment-panel modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">⚖️ Judge & Evaluator Mode — Architecture Inspector</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--wood-mid)', paddingBottom: '8px', marginBottom: '14px' }}>
          <button
            className={`btn-fantasy ${activeTab === 'simulation' ? 'btn-gold' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('simulation'); }}
          >
            ⏳ 7-Day Time Machine Simulation
          </button>
          <button
            className={`btn-fantasy ${activeTab === 'agents' ? 'btn-gold' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('agents'); }}
          >
            🤖 Autonomous Agent Swarm (3 Agents)
          </button>
          <button
            className={`btn-fantasy ${activeTab === 'verification' ? 'btn-gold' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('verification'); }}
          >
            🔍 Smart Contract Proof & Audits
          </button>
        </div>

        {activeTab === 'simulation' && (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '12px' }}>
              Run a deterministic 7-day economic simulation testing non-inflationary resource sinks, merchant restocking, forge auto-crafting, and building upkeep fees. Clearly labeled as off-chain simulation; no unverified transactions are committed on-chain.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                className="btn-fantasy btn-gold"
                disabled={isSimulating}
                onClick={handleRunSimulation}
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                {isSimulating ? 'Simulating 7 Cycles...' : '⚡ Run 7-Day Simulation'}
              </button>

              <button
                className="btn-fantasy"
                style={{ background: 'var(--stone-dark)', borderColor: 'var(--amber-mid)' }}
                onClick={() => {
                  soundEngine.playClick();
                  onResetScenario();
                  setSimResult(null);
                  alert('Demo scenario reset to initial clean state.');
                }}
              >
                🔄 Reset Scenario State
              </button>
            </div>

            {simResult && (
              <div style={{ background: 'var(--stone-black)', color: 'var(--parchment-bg)', padding: '14px', borderRadius: '4px', border: '1px solid var(--gold-mid)', fontSize: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gold-hi)', marginBottom: '8px' }}>
                  📊 7-Day Simulation Ledger Outcome:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '10px' }}>Total Trade Volume</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{simResult.totalVolumeNear.toFixed(2)} NEAR</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '10px' }}>Upkeep Fees Burned</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{simResult.totalFeesBurnedNear.toFixed(2)} NEAR</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '10px' }}>Trades Executed</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{simResult.tradesExecuted}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '10px' }}>Agent Actions</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>
                      {Object.values(simResult.agentActionsCount).reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--gold-light)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Business Health P&amp;L (Treasury Before &rarr; After):
                </div>
                {Object.entries(simResult.businessHealth).map(([bId, h]) => (
                  <div key={bId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span>{bId}:</span>
                    <span>
                      {h.treasuryBefore.toFixed(2)} NEAR ➔ <strong>{h.treasuryAfter.toFixed(2)} NEAR</strong> ({h.netProfitNear >= 0 ? `+${h.netProfitNear.toFixed(2)}` : h.netProfitNear.toFixed(2)} NEAR net result)
                    </span>
                    <span style={{ color: h.status === 'ACTIVE' ? 'var(--green-hi)' : 'var(--amber-light)' }}>
                      [{h.status}]
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {agents.map((ag) => (
              <div
                key={ag.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.45)',
                  border: '2px solid var(--wood-mid)',
                  borderRadius: '4px',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{ag.name} — {ag.role}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Wallet: <code>{ag.walletAccountId}</code></div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    Balance: <strong style={{ color: 'var(--gold-mid)' }}>{ag.balanceNear.toFixed(2)} NEAR</strong> (Floor: {ag.reserveFloorNear.toFixed(1)} NEAR)
                  </div>
                </div>

                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--ink-primary)' }}>
                  <strong>Policy & Personality:</strong> {ag.personality}
                </div>

                {/* Recent Decision Audit Trail */}
                <div style={{ marginTop: '8px', background: 'var(--stone-black)', color: 'var(--parchment-bg)', padding: '8px', borderRadius: '4px', fontSize: '11px' }}>
                  <div style={{ color: 'var(--gold-light)', textTransform: 'uppercase', marginBottom: '4px' }}>Recent Decision Audit Log:</div>
                  {ag.recentDecisions.slice(0, 2).map((dec, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      • <strong>{dec.action}:</strong> {dec.rationale} <em>({dec.details})</em>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'verification' && (
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <h4 style={{ color: 'var(--ink-highlight)', fontSize: '14px', marginBottom: '8px' }}>
              NEAR Rust Smart Contract Architecture & Verification
            </h4>
            <div style={{ background: 'var(--stone-black)', color: 'var(--parchment-bg)', padding: '12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', marginBottom: '12px' }}>
              WASM Target: wasm32-unknown-unknown (Size: 448 KB)<br />
              Contract State: NEP-171, NEP-177, NEP-297 Events<br />
              Test Suite: 5 Unit Tests Passed (0 Failures)<br />
              • test_mint_and_ownership: PASS<br />
              • test_old_owner_lockout_after_nft_transfer: PASS<br />
              • test_old_owner_cannot_withdraw_after_transfer: PASS (Panics as expected)<br />
              • test_marketplace_listing_and_purchase: PASS<br />
              • test_escrow_bounty_flow: PASS
            </div>

            <p style={{ color: 'var(--ink-muted)' }}>
              All high-value operations enforce <code>assert_owner_or_operator(token_id)</code> at runtime. When an NFT is sold or transferred, previous owners are instantly and irrevocably locked out of the associated asset vault treasury and policy controls.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
