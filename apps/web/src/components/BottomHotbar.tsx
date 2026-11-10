import React from 'react';
import { soundEngine } from '../audio/sounds.ts';

interface BottomHotbarProps {
  activeModal: string | null;
  onToggleModal: (modal: string) => void;
}

export const BottomHotbar: React.FC<BottomHotbarProps> = ({
  activeModal,
  onToggleModal
}) => {
  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: '🎒', badge: null },
    { id: 'crafting', label: 'Forge', icon: '⚒️', badge: null },
    { id: 'bounties', label: 'Bounties', icon: '📜', badge: '1' },
    { id: 'market', label: 'Market', icon: '⚖️', badge: null },
    { id: 'deeds', label: 'NFT Deeds', icon: '🏰', badge: null },
    { id: 'agents', label: 'AI Swarm', icon: '🤖', badge: '3' },
  ];

  return (
    <div className="bottom-hotbar interactive">
      {tabs.map((tab) => {
        const isActive = activeModal === tab.id;
        return (
          <button
            key={tab.id}
            className={`hotbar-btn ${isActive ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              onToggleModal(tab.id);
            }}
            title={tab.label}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
