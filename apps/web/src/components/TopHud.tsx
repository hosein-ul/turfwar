import React from 'react';
import { PlayerProfile } from '@turfwar/shared-types';
import { soundEngine } from '../audio/sounds.ts';

interface TopHudProps {
  player: PlayerProfile;
  currentZone: string;
  onOpenSettings: () => void;
  onOpenJudgeMode: () => void;
  onReturnToTitle: () => void;
}

export const TopHud: React.FC<TopHudProps> = ({
  player,
  currentZone,
  onOpenSettings,
  onOpenJudgeMode,
  onReturnToTitle
}) => {
  const isMuted = soundEngine.getMuted();

  const formatZone = (zone: string) => {
    switch (zone) {
      case 'darkwood_edge': return 'Darkwood Edge (Wilderness)';
      case 'forest_road': return 'Forest Trade Road';
      default: return 'Town Square (Safe Hub)';
    }
  };

  return (
    <div className="top-hud interactive">
      {/* Left: Player Profile & Balances */}
      <div className="hud-pill">
        <img
          src={player.portraitUrl || '/assets/portraits/portrait_player.png'}
          alt="Avatar"
          style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid var(--gold-mid)', imageRendering: 'pixelated' }}
        />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--parchment-bg)' }}>
            {player.handle}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--gold-light)' }}>
            Reputation: {player.reputation}/100
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--wood-mid)', margin: '0 4px' }} />

        <div className="hud-balance">
          <img src="/assets/items/icon_near_coin.png" alt="NEAR" style={{ width: '20px', height: '20px' }} />
          <span>{player.balanceNear.toFixed(2)} NEAR</span>
        </div>

        <span className={`hud-net-badge ${player.accountType === 'guest' ? 'demo' : ''}`}>
          {player.accountType === 'guest' ? 'DEMO TESTNET' : 'NEAR TESTNET'}
        </span>
      </div>

      {/* Center: Zone Banner */}
      <div className="hud-pill" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
        <span>📍 {formatZone(currentZone)}</span>
      </div>

      {/* Right: Quick Controls */}
      <div className="hud-pill" style={{ gap: '8px' }}>
        <button
          className="btn-fantasy"
          style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--amber-dark)', borderColor: 'var(--amber-mid)' }}
          onClick={() => {
            soundEngine.playClick();
            onOpenJudgeMode();
          }}
        >
          ⚖️ Judge Mode
        </button>

        <button
          className="btn-fantasy"
          style={{ padding: '4px 8px', fontSize: '12px' }}
          onClick={() => {
            soundEngine.toggleMute();
            soundEngine.playClick();
            onOpenSettings();
          }}
          title="Toggle Audio"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <button
          className="btn-fantasy"
          style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--stone-dark)' }}
          onClick={() => {
            soundEngine.playClick();
            onReturnToTitle();
          }}
          title="Return to Title"
        >
          🚪
        </button>
      </div>
    </div>
  );
};
