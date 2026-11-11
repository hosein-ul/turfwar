#!/usr/bin/env python3
"""
scripts/build_inspector_html.py
Generates the self-contained Generative UI HTML artifact for TurfWar.
"""

import json
import os

ARTIFACT_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/3fd50577-88b0-48fa-a993-fa28e5ea2e53"
BUNDLE_PATH = "/tmp/assets_bundle.json"
TARGET_HTML = f"{ARTIFACT_DIR}/turfwar_inspector.html"

with open(BUNDLE_PATH, 'r') as f:
    bundle = json.load(f)

chars = bundle['chars']
tiles = bundle['tiles']

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
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded p-1.5 text-center space-y-1 hover:border-amber-500/60 transition">
          <div class="h-10 flex items-center justify-center bg-black/40 rounded p-0.5">
            <img src="{t['img']}" class="max-h-8 pixelated drop-shadow" />
          </div>
          <div class="font-semibold text-[10px] text-amber-200 truncate">{t['name']}</div>
          <div class="text-[9px] text-[var(--muted-foreground)] truncate">{t['zone']}</div>
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
  <div class="space-y-3 py-1 font-sans text-xs">
    
    <!-- Top Nav / Mode Selector -->
    <div class="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold tracking-wide text-amber-400">⚔️ TURFWAR</span>
        <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/50">16-Bit Model Assets</span>
      </div>
      <div class="flex gap-1">
        <button id="tab-chars" onclick="switchTab('chars')" class="px-2.5 py-1 rounded font-medium transition bg-amber-600/30 text-amber-200 border border-amber-500/50">
          👥 Characters & Turnarounds
        </button>
        <button id="tab-tiles" onclick="switchTab('tiles')" class="px-2.5 py-1 rounded font-medium transition bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)]">
          🗺️ Model Tiles (11)
        </button>
      </div>
    </div>

    <!-- TAB 1: CHARACTERS & TURNAROUNDS -->
    <div id="view-chars" class="space-y-2">
      <!-- Character Pill Selector -->
      <div class="grid grid-cols-6 gap-1">
        {''.join(char_buttons_html)}
      </div>

      <!-- Character Main View -->
      <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-2.5 flex gap-3 items-center">
        <!-- Left: Portrait & Specs -->
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

        <!-- Right: 4-Angle Turnaround Sheet -->
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

    <!-- TAB 2: ISOMETRIC TILES -->
    <div id="view-tiles" class="hidden space-y-2">
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {''.join(tiles_html)}
      </div>
      <div class="text-[11px] text-[var(--muted-foreground)] text-center pt-1 border-t border-[var(--card-border)]">
        All 11 tiles are generated by Gemini Flash Image, processed with zero-seam 2:1 isometric diamond projection.
      </div>
    </div>

  </div>

  <script>
    const CHAR_DATA = {json.dumps({c['id']: c for c in chars})};

    function switchTab(tab) {{
      const vChars = document.getElementById('view-chars');
      const vTiles = document.getElementById('view-tiles');
      const tChars = document.getElementById('tab-chars');
      const tTiles = document.getElementById('tab-tiles');

      if (tab === 'chars') {{
        vChars.classList.remove('hidden');
        vTiles.classList.add('hidden');
        tChars.className = 'px-2.5 py-1 rounded font-medium transition bg-amber-600/30 text-amber-200 border border-amber-500/50';
        tTiles.className = 'px-2.5 py-1 rounded font-medium transition bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)]';
      }} else {{
        vChars.classList.add('hidden');
        vTiles.classList.remove('hidden');
        tTiles.className = 'px-2.5 py-1 rounded font-medium transition bg-amber-600/30 text-amber-200 border border-amber-500/50';
        tChars.className = 'px-2.5 py-1 rounded font-medium transition bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)]';
      }}
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
