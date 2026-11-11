import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { IsometricScene } from './game/IsometricScene.ts';
import { TitleScreen, StarterOption } from './components/TitleScreen.tsx';
import { TopHud } from './components/TopHud.tsx';
import { LiveFeed } from './components/LiveFeed.tsx';
import { BottomHotbar } from './components/BottomHotbar.tsx';
import { MerchantDialog } from './components/MerchantDialog.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { CraftingModal } from './components/CraftingModal.tsx';
import { MarketplaceModal } from './components/MarketplaceModal.tsx';
import { BountyModal } from './components/BountyModal.tsx';
import { JudgeModeModal } from './components/JudgeModeModal.tsx';
import { soundEngine } from './audio/sounds.ts';
import {
  PlayerProfile,
  BusinessDeedNFT,
  CaravanNFT,
  AgentProfile,
  EscrowBounty,
  ResourceId
} from '@turfwar/shared-types';

const API_BASE = 'http://localhost:3001';

export const App: React.FC = () => {
  const [inGame, setInGame] = useState<boolean>(false);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [nearAccount, setNearAccount] = useState<string | undefined>(undefined);

  // Core Game State
  const [player, setPlayer] = useState<PlayerProfile>({
    id: 'player_demo',
    handle: 'FrontierTraveler',
    accountType: 'guest',
    balanceNear: 10.0,
    inventory: { wood: 5, iron_ore: 8, herbs: 3, sword_iron: 1 },
    equipment: { weapon: 'sword_iron' },
    durability: { sword_iron: 90 },
    reputation: 50,
    position: { x: 320, y: 320, zone: 'town_square' }
  });

  const [deeds, setDeeds] = useState<BusinessDeedNFT[]>([]);
  const [caravans, setCaravans] = useState<CaravanNFT[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [bounties, setBounties] = useState<EscrowBounty[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [currentZone, setCurrentZone] = useState<string>('town_square');

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [talkingNpc, setTalkingNpc] = useState<'garrick' | 'saffron' | 'vex' | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; text: string; type: 'success' | 'error' | 'info' }>>([]);

  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<IsometricScene | null>(null);
  const selectedSpriteRef = useRef<string>('char_player');

  const handleStartGame = (starter: StarterOption, isWallet: boolean = false) => {
    selectedSpriteRef.current = starter.spriteKey;
    setPlayer((prev) => ({
      ...prev,
      handle: starter.name,
      portraitUrl: starter.portrait,
      spriteKey: starter.spriteKey,
      accountType: isWallet ? 'near_testnet' : 'guest',
      nearAccountId: isWallet ? 'turfwar-player.testnet' : undefined
    }));
    if (isWallet) {
      setWalletConnected(true);
      setNearAccount('turfwar-player.testnet');
      addToast('Connected to NEAR Testnet (turfwar-player.testnet)', 'success');
    }
    setInGame(true);
  };

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch initial world snapshot from backend server
  const fetchWorldState = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/world/state`);
      if (res.ok) {
        const data = await res.json();
        setDeeds(data.deeds || []);
        setCaravans(data.caravans || []);
        setAgents(data.agents || []);
        setBounties(data.bounties || []);
        setEvents(data.events || []);
      }
    } catch {
      // Backend not running yet or fallback
    }
  };

  useEffect(() => {
    fetchWorldState();
    const interval = setInterval(fetchWorldState, 4000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Phaser canvas when entering game
  useEffect(() => {
    if (!inGame || phaserGameRef.current) return;

    const scene = new IsometricScene();
    sceneRef.current = scene;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      backgroundColor: '#1E1B18',
      scene: [scene],
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 } }
      }
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Pass callbacks to Scene
    scene.init({
      callbacks: {
        onTalkToNpc: (npcId) => {
          soundEngine.playClick();
          setTalkingNpc(npcId);
        },
        onGatherNode: async (nodeId) => {
          soundEngine.playPickup();
          try {
            const res = await fetch(`${API_BASE}/api/actions/execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                actionType: 'gather_resource',
                actorId: player.id,
                timestamp: Date.now(),
                data: { nodeId }
              })
            });
            const data = await res.json();
            if (data.success) {
              setPlayer((prev) => ({
                ...prev,
                inventory: {
                  ...prev.inventory,
                  [data.data.resourceId]: data.data.newInventoryCount
                }
              }));
              scene.showFloatingText(`+1 ${data.data.resourceId.replace('_', ' ')}!`, '#93C78B');
              addToast(data.message, 'success');
              fetchWorldState();
            } else {
              addToast(data.message, 'error');
            }
          } catch {
            // Local fallback
            scene.showFloatingText('+1 Resource!', '#93C78B');
          }
        },
        onPlayerPosition: (x, y, zone) => {
          setCurrentZone(zone);
        }
      },
      playerSprite: selectedSpriteRef.current
    });

    const handleResize = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      game.destroy(true);
      phaserGameRef.current = null;
      sceneRef.current = null;
    };
  }, [inGame, player.id]);

  // Execute Trade action (Buy or Sell)
  const handleExecuteTrade = async (merchantId: string, resourceId: ResourceId, quantity: number, isBuy: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: isBuy ? 'buy_item' : 'sell_item',
          actorId: player.id,
          timestamp: Date.now(),
          data: { merchantId, resourceId, quantity }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayer((prev) => ({
          ...prev,
          balanceNear: data.data.newBalance,
          inventory: data.data.newInventory
        }));
        soundEngine.playCoin();
        sceneRef.current?.showFloatingText(
          isBuy ? `-${data.data.totalPriceNear.toFixed(2)} NEAR` : `+${data.data.payoutNear.toFixed(2)} NEAR`,
          '#F8DE7E'
        );
        addToast(data.message, 'success');
        setTalkingNpc(null);
        fetchWorldState();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Crafting action
  const handleCraftRecipe = async (recipeId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'craft_item',
          actorId: player.id,
          timestamp: Date.now(),
          data: { recipeId }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayer((prev) => ({
          ...prev,
          balanceNear: data.data.newBalance,
          inventory: data.data.newInventory
        }));
        sceneRef.current?.showFloatingText(`Forged ${data.data.output}!`, '#E87A18');
        addToast(data.message, 'success');
        fetchWorldState();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Accept Escrow Bounty
  const handleAcceptBounty = async (bountyId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'accept_bounty',
          actorId: player.id,
          timestamp: Date.now(),
          data: { bountyId }
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        sceneRef.current?.animateCaravanMission();
        fetchWorldState();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Complete Escrow Mission
  const handleCompleteMission = async (bountyId: string, outcome: 'COMPLETED' | 'AMBUSHED') => {
    try {
      const res = await fetch(`${API_BASE}/api/actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'complete_mission',
          actorId: player.id,
          timestamp: Date.now(),
          data: { bountyId, outcome }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayer((prev) => ({
          ...prev,
          balanceNear: data.data.newBalance,
          reputation: data.data.newReputation
        }));
        sceneRef.current?.showFloatingText(`+${data.data.payoutNear.toFixed(2)} NEAR Payout!`, '#F8DE7E');
        addToast(data.message, 'success');
        fetchWorldState();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Transfer NFT (Deed or Caravan)
  const handleTransferNFT = async (tokenId: string, receiverId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'transfer_nft',
          actorId: player.id,
          timestamp: Date.now(),
          data: { tokenId, receiverId }
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        fetchWorldState();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Simulate 7 Days (Judge Mode)
  const handleSimulateDays = async (days: number) => {
    const res = await fetch(`${API_BASE}/api/economy/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days })
    });
    const data = await res.json();
    fetchWorldState();
    return data.result;
  };

  // Reset Demo Scenario
  const handleResetScenario = async () => {
    await fetch(`${API_BASE}/api/demo/reset`, { method: 'POST' });
    fetchWorldState();
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Title Screen Overlay */}
      {!inGame && (
        <TitleScreen
          onStartDemo={(starter) => handleStartGame(starter, false)}
          onConnectWallet={(starter) => handleStartGame(starter, true)}
          onOpenJudgeGuide={() => setActiveModal('judge_mode')}
          walletConnected={walletConnected}
          nearAccount={nearAccount}
        />
      )}

      {/* Phaser 2:1 Isometric Game Viewport */}
      <div id="phaser-container" />

      {/* In-Game HUD Overlays */}
      {inGame && (
        <div className="ui-layer">
          <TopHud
            player={player}
            currentZone={currentZone}
            onOpenSettings={() => {}}
            onOpenJudgeMode={() => setActiveModal('judge_mode')}
            onReturnToTitle={() => setInGame(false)}
          />

          <LiveFeed events={events} />

          <BottomHotbar
            activeModal={activeModal}
            onToggleModal={(modal) => setActiveModal(activeModal === modal ? null : modal)}
          />
        </div>
      )}

      {/* Toast Notification Stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.text}
          </div>
        ))}
      </div>

      {/* Interactive Modals */}
      {talkingNpc && (
        <MerchantDialog
          npcId={talkingNpc}
          agent={agents.find((a) => a.id === talkingNpc) || {
            id: talkingNpc,
            name: talkingNpc === 'garrick' ? 'Garrick' : talkingNpc === 'saffron' ? 'Saffron' : 'Vex',
            role: talkingNpc === 'garrick' ? 'Master Blacksmith' : 'Caravan Broker',
            personality: 'Pragmatic frontier trader.',
            walletAccountId: `${talkingNpc}.testnet`,
            balanceNear: 25.0,
            reserveFloorNear: 5.0,
            status: 'ACTIVE',
            recentDecisions: []
          }}
          deed={deeds.find((d) => d.tokenId === (talkingNpc === 'garrick' ? 'deed-blacksmith-01' : 'deed-merchant-01'))}
          player={player}
          onExecuteTrade={handleExecuteTrade}
          onClose={() => setTalkingNpc(null)}
        />
      )}

      {activeModal === 'inventory' && (
        <InventoryModal player={player} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'crafting' && (
        <CraftingModal player={player} onCraftRecipe={handleCraftRecipe} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'market' && (
        <MarketplaceModal
          deeds={deeds}
          caravans={caravans}
          player={player}
          onTransferNFT={handleTransferNFT}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'deeds' && (
        <MarketplaceModal
          deeds={deeds}
          caravans={caravans}
          player={player}
          onTransferNFT={handleTransferNFT}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'bounties' && (
        <BountyModal
          bounties={bounties}
          player={player}
          onAcceptBounty={handleAcceptBounty}
          onCompleteMission={handleCompleteMission}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'judge_mode' && (
        <JudgeModeModal
          agents={agents}
          onSimulateDays={handleSimulateDays}
          onResetScenario={handleResetScenario}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};
