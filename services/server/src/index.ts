import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { worldState } from './state.js';
import { agentRuntime } from './agents.js';
import { actionDispatcher } from './actions.js';
import {
  calculateQuote,
  createSignedQuote,
  simulateEconomicDays,
  RESOURCE_DEFS,
  CRAFTING_RECIPES
} from '@turfwar/economy-engine';
import { ResourceId, WorldActionPayload } from '@turfwar/shared-types';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// WEBSOCKET PRESENCE & SYNC
// -------------------------------------------------------------
const connectedClients: Set<WebSocket> = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);

  // Send initial full state snapshot
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    payload: {
      players: Array.from(worldState.players.values()),
      deeds: Array.from(worldState.deeds.values()),
      caravans: Array.from(worldState.caravans.values()),
      agents: Array.from(worldState.agents.values()),
      bounties: Array.from(worldState.bounties.values()),
      harvestNodes: Array.from(worldState.harvestNodes.values()),
      events: worldState.verifiedEvents.slice(0, 15)
    }
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'ACTION') {
        const result = actionDispatcher.execute(parsed.payload as WorldActionPayload);
        ws.send(JSON.stringify({
          type: 'ACTION_RESULT',
          actionId: parsed.actionId,
          result
        }));
        // Broadcast state update to all clients
        broadcastStateUpdate();
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'ERROR', message: err.message }));
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

function broadcastStateUpdate() {
  const updatePayload = JSON.stringify({
    type: 'STATE_UPDATE',
    payload: {
      players: Array.from(worldState.players.values()),
      deeds: Array.from(worldState.deeds.values()),
      caravans: Array.from(worldState.caravans.values()),
      agents: Array.from(worldState.agents.values()),
      bounties: Array.from(worldState.bounties.values()),
      harvestNodes: Array.from(worldState.harvestNodes.values()),
      events: worldState.verifiedEvents.slice(0, 15),
      recentTrades: worldState.tradeHistory.slice(0, 10)
    }
  });

  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(updatePayload);
    }
  }
}

// -------------------------------------------------------------
// PERIODIC AGENT TICK
// -------------------------------------------------------------
setInterval(() => {
  agentRuntime.tick();
  broadcastStateUpdate();
}, 4000);

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    game: 'TURFWAR',
    version: '1.0.0',
    network: 'near_testnet',
    timestamp: Date.now(),
    connectedSockets: connectedClients.size
  });
});

app.get('/api/world/state', (req, res) => {
  res.json({
    players: Array.from(worldState.players.values()),
    deeds: Array.from(worldState.deeds.values()),
    caravans: Array.from(worldState.caravans.values()),
    agents: Array.from(worldState.agents.values()),
    bounties: Array.from(worldState.bounties.values()),
    harvestNodes: Array.from(worldState.harvestNodes.values()),
    events: worldState.verifiedEvents.slice(0, 20),
    recentTrades: worldState.tradeHistory.slice(0, 15),
    resourceDefs: RESOURCE_DEFS,
    craftingRecipes: CRAFTING_RECIPES
  });
});

app.post('/api/player/init', (req, res) => {
  const { id, nearAccountId } = req.body;
  const player = worldState.getOrCreatePlayer(id || 'player_demo', nearAccountId);
  res.json({ success: true, player });
});

app.post('/api/market/quote', (req, res) => {
  const { merchantId, resourceId, quantity, isPlayerBuying } = req.body;
  const deed = worldState.deeds.get(merchantId);
  if (!deed) {
    return res.status(404).json({ success: false, message: 'Merchant not found' });
  }

  try {
    const quote = calculateQuote(deed.vault, resourceId as ResourceId, quantity || 1, isPlayerBuying);
    const signed = quote.canExecute 
      ? createSignedQuote(deed.vault, 'player_current', resourceId as ResourceId, quantity || 1, isPlayerBuying)
      : null;

    res.json({ success: true, quote, signed });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/actions/execute', (req, res) => {
  const payload = req.body as WorldActionPayload;
  const result = actionDispatcher.execute(payload);
  broadcastStateUpdate();
  res.json(result);
});

// Deterministic 7-Day Economic Simulation Endpoint ("Judge Mode / Time Machine")
app.post('/api/economy/simulate', (req, res) => {
  const days = req.body.days || 7;
  const vaultsMap: Record<string, any> = {};
  for (const [id, deed] of worldState.deeds.entries()) {
    vaultsMap[id] = deed.vault;
  }

  const result = simulateEconomicDays(vaultsMap, days);
  res.json({
    success: true,
    result,
    explanation: 'Reproducible 7-day economic simulation using canonical pricing, stock-target management, and upkeep formulas. No simulated transactions were committed on-chain.'
  });
});

// Demo Scenario Reset Endpoint
app.post('/api/demo/reset', (req, res) => {
  worldState.players.clear();
  worldState.deeds.clear();
  worldState.caravans.clear();
  worldState.agents.clear();
  worldState.bounties.clear();
  worldState.harvestNodes.clear();
  worldState.tradeHistory = [];
  worldState.verifiedEvents = [];
  worldState.seedInitialState();

  broadcastStateUpdate();
  res.json({ success: true, message: 'Demo scenario reset to initial clean state.' });
});

server.listen(PORT, () => {
  console.log(`[TURFWAR] Server listening on port ${PORT}`);
});
