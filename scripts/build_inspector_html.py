#!/usr/bin/env python3
"""
scripts/build_inspector_html.py
Generates the self-contained Generative UI HTML artifact for TurfWar with:
- 6 Characters + 360 Turnaround Sheets
- 16 Isometric Ground Tiles (3D Isometric Block + Seamless 2:1 Diamond)
- 7 World Props & Harvest Nodes
- 12 Inventory Item Icons
"""

import base64
import json
import os

ARTIFACT_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/3fd50577-88b0-48fa-a993-fa28e5ea2e53"
ASSETS_DIR = "/home/antigravity/apps/web/public/assets"
TARGET_HTML = f"{ARTIFACT_DIR}/turfwar_inspector.html"

def b64(rel_path):
    p = os.path.join(ASSETS_DIR, rel_path)
    if not os.path.exists(p):
        return ''
    with open(p, 'rb') as f:
        ext = 'png' if p.endswith('.png') else 'jpg'
        return f'data:image/{ext};base64,' + base64.b64encode(f.read()).decode('utf-8')

chars = [
    {
        'id': 'player',
        'name': 'Frontier Traveler',
        'role': 'Trader & Explorer',
        'desc': 'Resourceful adventurer seeking trade routes and ancient iron mines.',
        'bonus': '+5 Wood, +8 Iron Ore, +3 Herbs',
        'portrait': b64('portraits/portrait_player.png'),
        'turnaround': b64('turnarounds/turnaround_player.png'),
    },
    {
        'id': 'garrick',
        'name': 'Garrick the Smith',
        'role': 'Master Blacksmith',
        'desc': 'Forge master crafting iron broadswords and buckler shields.',
        'bonus': 'Forge Deed #1 Vault Owner, 25 NEAR Reserve',
        'portrait': b64('portraits/portrait_garrick.png'),
        'turnaround': b64('turnarounds/turnaround_garrick.png'),
    },
    {
        'id': 'saffron',
        'name': 'Saffron the Broker',
        'role': 'Caravan Broker',
        'desc': 'Logistics entrepreneur running armed caravans between frontier hubs.',
        'bonus': 'Caravan Wagon NFT Owner, Escrow Bounties',
        'portrait': b64('portraits/portrait_saffron.png'),
        'turnaround': b64('turnarounds/turnaround_saffron.png'),
    },
    {
        'id': 'vex',
        'name': 'Vex the Rival',
        'role': 'Shadow Trader',
        'desc': 'Cunning competitor constantly undercutting town market quotes.',
        'bonus': 'Dynamic Pricing AI, Autonomous Policy',
        'portrait': b64('portraits/portrait_vex.png'),
        'turnaround': b64('turnarounds/turnaround_vex.png'),
    },
    {
        'id': 'guard',
        'name': 'Iron Sentinel',
        'role': 'Caravan Escort Guard',
        'desc': 'Armored soldier protecting trading convoys from forest ambushes.',
        'bonus': '+1 Shield, High Armor Resilience',
        'portrait': b64('portraits/portrait_guard.png'),
        'turnaround': b64('turnarounds/turnaround_guard.png'),
    },
    {
        'id': 'bandit',
        'name': 'Shadow Scout',
        'role': 'Outlaw & Scavenger',
        'desc': 'Wilderness highwayman lurking at the borders of Darkwood Edge.',
        'bonus': '+2 Iron Ingots, Stealth Speed',
        'portrait': b64('portraits/portrait_bandit.png'),
        'turnaround': b64('turnarounds/turnaround_bandit.png'),
    }
]

tiles = [
    {'id': 'tile_plaza_mosaic', 'name': 'Plaza Mosaic', 'zone': 'Central Plaza', 'img': b64('tiles/block_tile_plaza_mosaic.png')},
    {'id': 'tile_cobble_moss', 'name': 'Mossy Cobble', 'zone': 'Town Streets', 'img': b64('tiles/block_tile_cobble_moss.png')},
    {'id': 'tile_marble_gold', 'name': 'Royal Marble', 'zone': 'Grand Square', 'img': b64('tiles/block_tile_marble_gold.png')},
    {'id': 'tile_stone_border', 'name': 'Stone Curb', 'zone': 'Perimeter', 'img': b64('tiles/block_tile_stone_border.png')},
    {'id': 'tile_grass', 'name': 'Emerald Grass', 'zone': 'Meadows', 'img': b64('tiles/block_tile_grass.png')},
    {'id': 'tile_grass_flowers', 'name': 'Wildflowers', 'zone': 'Floral Meadow', 'img': b64('tiles/block_tile_grass_flowers.png')},
    {'id': 'tile_forest', 'name': 'Autumn Roots', 'zone': 'Darkwood Edge', 'img': b64('tiles/block_tile_forest.png')},
    {'id': 'tile_forest_mushroom', 'name': 'Mystic Spores', 'zone': 'Deep Woods', 'img': b64('tiles/block_tile_forest_mushroom.png')},
    {'id': 'tile_dirt', 'name': 'Wagon Rut Road', 'zone': 'Trade Route', 'img': b64('tiles/block_tile_dirt.png')},
    {'id': 'tile_dirt_pebbles', 'name': 'Gravel Trail', 'zone': 'Frontier Path', 'img': b64('tiles/block_tile_dirt_pebbles.png')},
    {'id': 'tile_bridge_wood', 'name': 'Plank Bridge', 'zone': 'River Crossing', 'img': b64('tiles/block_tile_bridge_wood.png')},
    {'id': 'tile_mud_swamp', 'name': 'Swamp Marsh', 'zone': 'Boglands', 'img': b64('tiles/block_tile_mud_swamp.png')},
    {'id': 'tile_water', 'name': 'Crystal Stream', 'zone': 'River', 'img': b64('tiles/block_tile_water.png')},
    {'id': 'tile_water_pond', 'name': 'Lotus Pond', 'zone': 'Town Pool', 'img': b64('tiles/block_tile_water_pond.png')},
    {'id': 'tile_stone_flagstone', 'name': 'Silver Ore Vein', 'zone': 'Quarry Cliff', 'img': b64('tiles/block_tile_stone_flagstone.png')},
    {'id': 'tile_forge_lava', 'name': 'Forge Ember Floor', 'zone': 'Blacksmith', 'img': b64('tiles/block_tile_forge_lava.png')},
]

props = [
    {'name': 'Caravan Wagon', 'img': b64('props/prop_wagon_caravan.png')},
    {'name': 'Ancient Oak', 'img': b64('props/prop_tree_oak.png')},
    {'name': 'Iron Ore Vein', 'img': b64('props/prop_iron_rock.png')},
    {'name': 'Silverleaf Bush', 'img': b64('props/prop_herb_patch.png')},
    {'name': 'Trade Crates', 'img': b64('props/prop_crates.png')},
    {'name': 'Street Lantern', 'img': b64('props/prop_lantern.png')},
    {'name': 'Forge Anvil', 'img': b64('props/prop_anvil.png')},
]

items = [
    {'name': 'Timber Logs', 'img': b64('items/icon_wood.png')},
    {'name': 'Raw Iron Ore', 'img': b64('items/icon_iron_ore.png')},
    {'name': 'Silverleaf Herb', 'img': b64('items/icon_herbs.png')},
    {'name': 'Iron Ingots', 'img': b64('items/icon_iron_ingot.png')},
    {'name': 'Steel Sword', 'img': b64('items/icon_sword_iron.png')},
    {'name': 'Buckler Shield', 'img': b64('items/icon_shield_iron.png')},
    {'name': 'Repair Kit', 'img': b64('items/icon_repair_kit.png')},
    {'name': 'NEAR Coins', 'img': b64('items/icon_near_coin.png')},
    {'name': 'Forge Deed NFT', 'img': b64('items/icon_deed_forge.png')},
    {'name': 'Caravan NFT', 'img': b64('items/icon_wagon_nft.png')},
    {'name': 'Health Potion', 'img': b64('items/icon_potion.png')},
    {'name': 'Treasure Chest', 'img': b64('items/icon_chest.png')},
]

char_buttons_html = []
for idx, c in enumerate(chars):
    sel = "border-amber-400 bg-amber-950/40 text-amber-200 font-bold" if idx == 0 else "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted-foreground)]"
    short_name = c['name'].split()[0]
    char_buttons_html.append(f"""
        <button id="cbtn-{c['id']}" onclick="selectChar('{c['id']}')" class="c-btn flex items-center justify-center gap-1.5 py-1 px-1.5 rounded border {sel} text-[11px] truncate transition hover:border-amber-500">
          <img src="{c['portrait']}" class="w-4 h-4 rounded-sm pixelated flex-shrink-0" />
          <span class="truncate">{short_name}</span>
        </button>
""")

tiles_html = []
for t in tiles:
    tiles_html.append(f"""
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded p-1 text-center space-y-0.5 hover:border-amber-500/60 transition">
          <div class="h-11 flex items-center justify-center bg-black/40 rounded p-0.5">
            <img src="{t['img']}" class="max-h-10 pixelated drop-shadow" />
          </div>
          <div class="font-semibold text-[10px] text-amber-200 truncate">{t['name']}</div>
          <div class="text-[8px] text-[var(--muted-foreground)] truncate">{t['zone']}</div>
        </div>
""")

props_items_html = []
for p in props:
    props_items_html.append(f"""
        <div class="bg-[var(--card)] border border-amber-800/40 rounded p-1 text-center space-y-0.5">
          <div class="h-11 flex items-center justify-center bg-black/40 rounded p-0.5">
            <img src="{p['img']}" class="max-h-10 pixelated" />
          </div>
          <div class="font-semibold text-[9px] text-amber-300 truncate">{p['name']}</div>
        </div>
""")
for it in items:
    props_items_html.append(f"""
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded p-1 text-center space-y-0.5">
          <div class="h-11 flex items-center justify-center bg-black/40 rounded p-0.5">
            <img src="{it['img']}" class="max-h-9 pixelated" />
          </div>
          <div class="font-medium text-[9px] text-[var(--foreground)] truncate">{it['name']}</div>
        </div>
""")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    .pixelated {{ image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; }}
    .gold-glow {{ box-shadow: 0 0 12px rgba(212, 162, 50, 0.35); }}
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-0 m-0">
  <div class="space-y-2.5 py-1 font-sans text-xs">
    
    <!-- Top Nav / Mode Selector -->
    <div class="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold tracking-wide text-amber-400">⚔️ TURFWAR</span>
        <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/50">100% Image-Model Assets</span>
      </div>
      <div class="flex gap-1">
        <button id="tab-tiles" onclick="switchTab('tiles')" class="px-2 py-1 rounded font-medium transition bg-amber-600/30 text-amber-200 border border-amber-500/50">
          🗺️ 16 Model Tiles
        </button>
        <button id="tab-chars" onclick="switchTab('chars')" class="px-2 py-1 rounded font-medium transition bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)]">
          👥 6 Characters & Turnarounds
        </button>
        <button id="tab-props" onclick="switchTab('props')" class="px-2 py-1 rounded font-medium transition bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)]">
          🌲 Props & Items (19)
        </button>
      </div>
    </div>

    <!-- TAB 1: 16 ISOMETRIC TILES (DEFAULT OPEN) -->
    <div id="view-tiles" class="space-y-1.5">
      <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
        {''.join(tiles_html)}
      </div>
      <div class="text-[10px] text-[var(--muted-foreground)] text-center pt-1 border-t border-[var(--card-border)]">
        All 16 isometric ground tiles generated in a 4×4 mega-sheet via Gemini Flash Image & sliced into seamless 2:1 diamonds.
      </div>
    </div>

    <!-- TAB 2: CHARACTERS & TURNAROUNDS -->
    <div id="view-chars" class="hidden space-y-2">
      <div class="grid grid-cols-6 gap-1">
        {''.join(char_buttons_html)}
      </div>

      <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-2.5 flex gap-3 items-center">
        <div class="w-48 flex-shrink-0 space-y-1.5 pr-3 border-r border-[var(--card-border)]">
          <div class="flex items-center gap-2.5">
            <img id="char-portrait" src="{chars[0]['portrait']}" class="w-12 h-12 rounded border-2 border-amber-500 pixelated gold-glow flex-shrink-0" />
            <div>
              <div id="char-name" class="font-bold text-amber-200 text-sm leading-tight">{chars[0]['name']}</div>
              <div id="char-role" class="text-[10px] text-amber-400/90 font-medium">{chars[0]['role']}</div>
            </div>
          </div>
          <p id="char-desc" class="text-[11px] text-[var(--muted-foreground)] leading-snug">{chars[0]['desc']}</p>
          <div class="text-[10px] bg-black/40 rounded px-2 py-1 border border-amber-900/40 text-amber-300">
            <span class="font-semibold text-amber-400">Bonus:</span> <span id="char-bonus">{chars[0]['bonus']}</span>
          </div>
        </div>

        <div class="flex-1 space-y-1">
          <div class="flex justify-between items-center text-[10px] text-[var(--muted-foreground)]">
            <span class="font-semibold uppercase tracking-wider text-amber-300">Studio Turnaround (SE • SW • NE • NW)</span>
            <span>4 Directions • 16-Bit Handcrafted Pixels</span>
          </div>
          <div class="bg-black/60 rounded border border-amber-950/60 p-1 flex justify-center items-center overflow-hidden">
            <img id="char-turnaround" src="{chars[0]['turnaround']}" class="max-h-36 w-auto pixelated object-contain rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: PROPS & ITEMS -->
    <div id="view-props" class="hidden space-y-1.5">
      <div class="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
        {''.join(props_items_html[:14])}
      </div>
      <div class="text-[10px] text-[var(--muted-foreground)] text-center pt-1 border-t border-[var(--card-border)]">
        Model-generated interactive harvest nodes, caravan wagons, street lanterns, and RPG inventory icons.
      </div>
    </div>

  </div>

  <script>
    const CHAR_DATA = {json.dumps({c['id']: c for c in chars})};

    function switchTab(tab) {{
      ['tiles', 'chars', 'props'].forEach(t => {{
        const v = document.getElementById('view-' + t);
        const b = document.getElementById('tab-' + t);
        if (t === tab) {{
          v.classList.remove('hidden');
          b.className = 'px-2 py-1 rounded font-medium transition bg-amber-600/30 text-amber-200 border border-amber-500/50';
        }} else {{
          v.classList.add('hidden');
          b.className = 'px-2 py-1 rounded font-medium transition bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)]';
        }}
      }});
    }}

    function selectChar(id) {{
      const c = CHAR_DATA[id];
      if (!c) return;

      document.querySelectorAll('.c-btn').forEach(btn => {{
        btn.className = 'c-btn flex items-center justify-center gap-1.5 py-1 px-1.5 rounded border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted-foreground)] text-[11px] truncate transition hover:border-amber-500';
      }});
      const activeBtn = document.getElementById('cbtn-' + id);
      if (activeBtn) {{
        activeBtn.className = 'c-btn flex items-center justify-center gap-1.5 py-1 px-1.5 rounded border border-amber-400 bg-amber-950/40 text-amber-200 font-bold text-[11px] truncate transition';
      }}

      document.getElementById('char-portrait').src = c.portrait;
      document.getElementById('char-name').textContent = c.name;
      document.getElementById('char-role').textContent = c.role;
      document.getElementById('char-desc').textContent = c.desc;
      document.getElementById('char-bonus').textContent = c.bonus;
      document.getElementById('char-turnaround').src = c.turnaround;
    }}
  </script>
</body>
</html>
"""

with open(TARGET_HTML, 'w') as f:
    f.write(html_content)

print(f"Generated {TARGET_HTML}, size: {len(html_content)} bytes")
