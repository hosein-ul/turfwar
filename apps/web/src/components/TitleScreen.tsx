import React, { useState } from 'react';
import { soundEngine } from '../audio/sounds.ts';

export interface StarterOption {
  id: 'player' | 'guard' | 'bandit';
  name: string;
  role: string;
  portrait: string;
  spriteKey: string;
  desc: string;
  bonus: string;
}

export const STARTERS: StarterOption[] = [
  {
    id: 'player',
    name: 'Frontier Traveler',
    role: 'Trader & Explorer',
    portrait: '/assets/portraits/portrait_player.png',
    spriteKey: 'char_player',
    desc: 'Resourceful voyager seeking trade routes and ancient iron mines.',
    bonus: '+5 Wood, +8 Iron Ore, +3 Herbs'
  },
  {
    id: 'guard',
    name: 'Iron Sentinel',
    role: 'Caravan Escort',
    portrait: '/assets/portraits/portrait_guard.png',
    spriteKey: 'char_guard',
    desc: 'Veteran town watchman armored in chainmail to protect merchant caravans.',
    bonus: '+1 Iron Shield, High Resilience'
  },
  {
    id: 'bandit',
    name: 'Shadow Scout',
    role: 'Outlaw & Scavenger',
    portrait: '/assets/portraits/portrait_bandit.png',
    spriteKey: 'char_bandit',
    desc: 'Stealthy wilderness tracker agile enough to bypass dangerous ambushes.',
    bonus: '+2 Refined Iron Ingots, Swift Agility'
  }
];

interface TitleScreenProps {
  onStartDemo: (starter: StarterOption) => void;
  onConnectWallet: (starter: StarterOption) => void;
  onOpenJudgeGuide: () => void;
  walletConnected: boolean;
  nearAccount?: string;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartDemo,
  onConnectWallet,
  onOpenJudgeGuide,
  walletConnected,
  nearAccount
}) => {
  const [selectedStarterId, setSelectedStarterId] = useState<'player' | 'guard' | 'bandit'>('player');

  const selectedStarter = STARTERS.find((s) => s.id === selectedStarterId) || STARTERS[0];

  return (
    <div className="title-screen">
      <div className="title-card" style={{ maxWidth: '640px', width: '92%' }}>
        <img
          src="/assets/brand/emblem.png"
          alt="TURFWAR Emblem"
          className="title-emblem"
        />
        <h1 className="title-text" style={{ marginBottom: '2px' }}>TURFWAR</h1>
        <p className="title-tagline" style={{ marginBottom: '14px' }}>
          Build your fortune. Shape the frontier.
        </p>

        {/* Character Appearance Selector */}
        <div style={{ margin: '8px 0 16px 0', textAlign: 'left' }}>
          <div style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--gold-light)',
            marginBottom: '8px',
            textAlign: 'center',
            fontFamily: 'Cinzel, serif'
          }}>
            Choose Starter Persona
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {STARTERS.map((s) => {
              const isSelected = s.id === selectedStarterId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedStarterId(s.id);
                  }}
                  style={{
                    background: isSelected ? 'rgba(212, 162, 50, 0.18)' : 'rgba(25, 22, 19, 0.75)',
                    border: isSelected ? '2px solid var(--gold-mid)' : '1px solid var(--wood-mid)',
                    borderRadius: '6px',
                    padding: '8px 6px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 10px rgba(212, 162, 50, 0.35)' : 'none'
                  }}
                >
                  <img
                    src={s.portrait}
                    alt={s.name}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '4px',
                      border: '1px solid ' + (isSelected ? 'var(--gold-mid)' : 'rgba(255,255,255,0.15)'),
                      display: 'block',
                      margin: '0 auto 6px auto',
                      imageRendering: 'pixelated'
                    }}
                  />
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isSelected ? 'var(--gold-light)' : 'var(--parchment-bg)',
                    fontFamily: 'Cinzel, serif'
                  }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginBottom: '4px' }}>
                    {s.role}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: 'var(--gold-mid)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}>
                    {s.bonus}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="title-menu">
          <button
            className="btn-fantasy btn-gold"
            onClick={() => {
              soundEngine.playClick();
              onStartDemo(selectedStarter);
            }}
          >
            ⚔️ Enter Frontier as {selectedStarter.name}
          </button>

          <button
            className="btn-fantasy"
            onClick={() => {
              soundEngine.playClick();
              onConnectWallet(selectedStarter);
            }}
          >
            {walletConnected ? `🔗 Connected: ${nearAccount}` : '🌐 Connect NEAR Wallet'}
          </button>

          <button
            className="btn-fantasy"
            style={{ background: 'var(--stone-dark)', borderColor: 'var(--stone-light)' }}
            onClick={() => {
              soundEngine.playClick();
              onOpenJudgeGuide();
            }}
          >
            ⚖️ Judge & Evaluation Guide
          </button>
        </div>

        <div style={{ marginTop: '14px', fontSize: '11px', color: '#c8b69e', fontFamily: 'var(--font-sans)', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <span>16-bit Isometric Pixel Art</span>
          <span>•</span>
          <span>NEAR Testnet</span>
          <span>•</span>
          <span>Autonomous AI Swarm</span>
        </div>
      </div>
    </div>
  );
};
