import React from 'react';
import { soundEngine } from '../audio/sounds.ts';

interface TitleScreenProps {
  onStartDemo: () => void;
  onConnectWallet: () => void;
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
  return (
    <div className="title-screen">
      <div className="title-card">
        <img
          src="/assets/brand/emblem.png"
          alt="TURFWAR Emblem"
          className="title-emblem"
        />
        <h1 className="title-text">TURFWAR</h1>
        <p className="title-tagline">
          Build your fortune. Shape the frontier.
        </p>

        <div className="title-menu">
          <button
            className="btn-fantasy btn-gold"
            onClick={() => {
              soundEngine.playClick();
              onStartDemo();
            }}
          >
            ⚔️ Enter Frontier (Guest Demo)
          </button>

          <button
            className="btn-fantasy"
            onClick={() => {
              soundEngine.playClick();
              onConnectWallet();
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

        <div style={{ marginTop: '12px', fontSize: '11px', color: '#c8b69e', fontFamily: 'var(--font-sans)', display: 'flex', gap: '16px' }}>
          <span>Isometric 2:1 Pixel Art</span>
          <span>•</span>
          <span>NEAR Testnet</span>
          <span>•</span>
          <span>Autonomous AI Swarm</span>
        </div>
      </div>
    </div>
  );
};
