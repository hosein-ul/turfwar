import Phaser from 'phaser';

export interface SceneInteractionCallback {
  onTalkToNpc: (npcId: 'garrick' | 'saffron' | 'vex') => void;
  onGatherNode: (nodeId: string) => void;
  onPlayerPosition: (x: number, y: number, zone: string) => void;
}

export class IsometricScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };
  private promptText!: Phaser.GameObjects.Text;
  private nearEntity: { type: 'npc' | 'node'; id: string; name: string } | null = null;
  private callbacks!: SceneInteractionCallback;
  private npcs: Map<string, { sprite: Phaser.GameObjects.Sprite; nameplate: Phaser.GameObjects.Text }> = new Map();
  private harvestNodes: Map<string, { sprite: Phaser.GameObjects.Image; id: string; name: string; resId: string }> = new Map();
  private caravanSprite?: Phaser.GameObjects.Image;
  private isMoving = false;
  private currentDir = 'se';
  private playerSpriteKey = 'char_player';

  constructor() {
    super({ key: 'IsometricScene' });
  }

  public init(data: { callbacks: SceneInteractionCallback; playerSprite?: string }) {
    this.callbacks = data.callbacks;
    if (data.playerSprite) {
      this.playerSpriteKey = data.playerSprite;
    }
  }

  public preload() {
    // Load 2:1 ground tiles
    this.load.image('tile_cobble', '/assets/tiles/tile_cobblestone.png');
    this.load.image('tile_grass', '/assets/tiles/tile_grass.png');
    this.load.image('tile_dirt', '/assets/tiles/tile_dirt.png');
    this.load.image('tile_water', '/assets/tiles/tile_water.png');
    this.load.image('tile_forest', '/assets/tiles/tile_forest.png');
    this.load.image('tile_stone_border', '/assets/tiles/tile_stone_border.png');

    // Load buildings & props
    this.load.image('bldg_blacksmith', '/assets/buildings/blacksmith_256.png');
    this.load.image('bldg_market', '/assets/buildings/market_stall_256.png');
    this.load.image('prop_wagon', '/assets/props/prop_wagon_caravan.png');
    this.load.image('prop_iron_rock', '/assets/props/prop_iron_rock.png');
    this.load.image('prop_tree_oak', '/assets/props/prop_tree_oak.png');
    this.load.image('prop_herb_patch', '/assets/props/prop_herb_patch.png');
    this.load.image('prop_crates', '/assets/props/prop_crates.png');
    this.load.image('prop_anvil', '/assets/props/prop_anvil.png');
    this.load.image('prop_lantern', '/assets/props/prop_lantern.png');

    // Load characters (spritesheets: 144x288, 48x72 frames)
    this.load.spritesheet('char_player', '/assets/characters/char_player.png', { frameWidth: 48, frameHeight: 72 });
    this.load.spritesheet('char_garrick', '/assets/characters/char_garrick.png', { frameWidth: 48, frameHeight: 72 });
    this.load.spritesheet('char_saffron', '/assets/characters/char_saffron.png', { frameWidth: 48, frameHeight: 72 });
    this.load.spritesheet('char_vex', '/assets/characters/char_vex.png', { frameWidth: 48, frameHeight: 72 });
    this.load.spritesheet('char_guard', '/assets/characters/char_guard.png', { frameWidth: 48, frameHeight: 72 });
    this.load.spritesheet('char_bandit', '/assets/characters/char_bandit.png', { frameWidth: 48, frameHeight: 72 });
  }

  public create() {
    this.createIsometricMap();
    this.createAnimations();
    this.spawnEntities();
    this.setupControls();
    this.setupCamera();

    // Contextual interaction prompt
    this.promptText = this.add.text(0, 0, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#FFF3B0',
      backgroundColor: '#1E1B18',
      padding: { x: 8, y: 4 }
    });
    this.promptText.setStroke('#D4A232', 2);
    this.promptText.setOrigin(0.5, 1);
    this.promptText.setVisible(false);
    this.promptText.setDepth(99999);
  }

  // Convert (isoX, isoY) grid coordinates to screen pixel coordinates
  private isoToScreen(gx: number, gy: number): { x: number; y: number } {
    const tileW = 64;
    const tileH = 32;
    const originX = 600;
    const originY = 200;
    const sx = originX + (gx - gy) * (tileW / 2);
    const sy = originY + (gx + gy) * (tileH / 2);
    return { x: sx, y: sy };
  }

  private createIsometricMap() {
    const mapGridSize = 24;

    // Build layered 2:1 isometric ground
    for (let gx = -4; gx < mapGridSize; gx++) {
      for (let gy = -4; gy < mapGridSize; gy++) {
        const pos = this.isoToScreen(gx, gy);
        let tileKey = 'tile_cobble';

        // Zone 1: Town Square (-2..10, -2..10) -> Cobblestone
        // Zone 2: Forest Trade Road (11..16, 0..8) -> Dirt Road
        // Zone 3: Darkwood Edge (10..22, 10..22) -> Lush Grass & Forest Undergrowth
        if (gx > 8 || gy > 8) {
          tileKey = 'tile_grass';
          if ((gx >= 9 && gx <= 13) || (gy >= 9 && gy <= 13)) {
            tileKey = 'tile_dirt';
          } else if ((gx + gy) % 3 === 0) {
            tileKey = 'tile_forest';
          }
        }

        const tile = this.add.image(pos.x, pos.y, tileKey);
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(-1000 + pos.y * 0.001); // Ground tiles stay behind
      }
    }

    // Town Square Decorative Props & Buildings
    const bsPos = this.isoToScreen(2, 2);
    const bsBuilding = this.add.image(bsPos.x, bsPos.y - 40, 'bldg_blacksmith');
    bsBuilding.setOrigin(0.5, 0.85); // Center-bottom ground contact anchor
    bsBuilding.setDepth(bsPos.y);

    // Street Lanterns
    const lantern1Pos = this.isoToScreen(1, 6);
    const l1 = this.add.image(lantern1Pos.x, lantern1Pos.y, 'prop_lantern');
    l1.setOrigin(0.5, 0.9);
    l1.setDepth(lantern1Pos.y);

    const lantern2Pos = this.isoToScreen(7, 2);
    const l2 = this.add.image(lantern2Pos.x, lantern2Pos.y, 'prop_lantern');
    l2.setOrigin(0.5, 0.9);
    l2.setDepth(lantern2Pos.y);

    // Trade Crates Stack
    const cratePos = this.isoToScreen(6, 6);
    const crates = this.add.image(cratePos.x, cratePos.y, 'prop_crates');
    crates.setOrigin(0.5, 0.8);
    crates.setDepth(cratePos.y);

    // Market Stall
    const stallPos = this.isoToScreen(5, 3);
    const stall = this.add.image(stallPos.x, stallPos.y - 30, 'bldg_market');
    stall.setOrigin(0.5, 0.85);
    stall.setDepth(stallPos.y);

    // Caravan Wagon
    const wagonPos = this.isoToScreen(7, 4);
    this.caravanSprite = this.add.image(wagonPos.x, wagonPos.y, 'prop_wagon');
    this.caravanSprite.setOrigin(0.5, 0.8);
    this.caravanSprite.setDepth(wagonPos.y);

    // Darkwood Edge Harvest Nodes
    this.createHarvestNode('node-ore-1', 'Iron Ore Cliff Vein', 'iron_ore', 12, 10, 'prop_iron_rock');
    this.createHarvestNode('node-ore-2', 'Hematite Boulder', 'iron_ore', 15, 13, 'prop_iron_rock');
    this.createHarvestNode('node-wood-1', 'Darkwood Pine Tree', 'wood', 10, 14, 'prop_tree_oak');
    this.createHarvestNode('node-wood-2', 'Ancient Oak', 'wood', 14, 9, 'prop_tree_oak');
    this.createHarvestNode('node-herb-1', 'Silverleaf Bush', 'herbs', 11, 12, 'prop_herb_patch');
    this.createHarvestNode('node-herb-2', 'Dew Herb Patch', 'herbs', 13, 14, 'prop_herb_patch');
  }

  private createHarvestNode(id: string, name: string, resId: string, gx: number, gy: number, texture: string) {
    const pos = this.isoToScreen(gx, gy);
    const sprite = this.add.image(pos.x, pos.y, texture);
    sprite.setOrigin(0.5, 0.85);
    sprite.setDepth(pos.y);
    sprite.setInteractive({ useHandCursor: true });

    sprite.on('pointerdown', () => {
      this.callbacks.onGatherNode(id);
    });

    this.harvestNodes.set(id, { sprite, id, name, resId });
  }

  private createAnimations() {
    const chars = ['player', 'garrick', 'saffron', 'vex', 'guard', 'bandit'];
    chars.forEach(c => {
      // 4 directions: 0=se, 1=sw, 2=ne, 3=nw
      ['se', 'sw', 'ne', 'nw'].forEach((dir, dirIdx) => {
        const start = dirIdx * 3;
        this.anims.create({
          key: `${c}_walk_${dir}`,
          frames: this.anims.generateFrameNumbers(`char_${c}`, { start, end: start + 2 }),
          frameRate: 6,
          repeat: -1
        });
        this.anims.create({
          key: `${c}_idle_${dir}`,
          frames: [{ key: `char_${c}`, frame: start }],
          frameRate: 1
        });
      });
    });
  }

  private spawnEntities() {
    // 1. Player Spawn (Town Square Center)
    const pPos = this.isoToScreen(4, 4);
    this.player = this.add.sprite(pPos.x, pPos.y, this.playerSpriteKey, 0);
    this.player.setOrigin(0.5, 0.95);
    this.player.setDepth(pPos.y);

    // 2. Spawn Garrick (Blacksmith) near Forge
    const gPos = this.isoToScreen(3, 4);
    const garrick = this.add.sprite(gPos.x, gPos.y, 'char_garrick', 0);
    garrick.setOrigin(0.5, 0.95);
    garrick.setDepth(gPos.y);
    garrick.play('garrick_idle_se');
    garrick.setInteractive({ useHandCursor: true });
    garrick.on('pointerdown', () => this.callbacks.onTalkToNpc('garrick'));

    const gName = this.add.text(gPos.x, gPos.y - 56, 'Garrick (Forge)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#F8DE7E',
      backgroundColor: '#1E1B18',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(gPos.y + 10);
    this.npcs.set('garrick', { sprite: garrick, nameplate: gName });

    // 3. Spawn Saffron (Caravan Broker) near Market Stall
    const sPos = this.isoToScreen(6, 4);
    const saffron = this.add.sprite(sPos.x, sPos.y, 'char_saffron', 3); // SW
    saffron.setOrigin(0.5, 0.95);
    saffron.setDepth(sPos.y);
    saffron.play('saffron_idle_sw');
    saffron.setInteractive({ useHandCursor: true });
    saffron.on('pointerdown', () => this.callbacks.onTalkToNpc('saffron'));

    const sName = this.add.text(sPos.x, sPos.y - 56, 'Saffron (Broker)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#8CB9D1',
      backgroundColor: '#1E1B18',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(sPos.y + 10);
    this.npcs.set('saffron', { sprite: saffron, nameplate: sName });

    // 4. Spawn Vex (Rival) near Town Boundary
    const vPos = this.isoToScreen(8, 7);
    const vex = this.add.sprite(vPos.x, vPos.y, 'char_vex', 3);
    vex.setOrigin(0.5, 0.95);
    vex.setDepth(vPos.y);
    vex.play('vex_idle_sw');
    vex.setInteractive({ useHandCursor: true });
    vex.on('pointerdown', () => this.callbacks.onTalkToNpc('vex'));

    const vName = this.add.text(vPos.x, vPos.y - 56, 'Vex (Rival)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#E87A18',
      backgroundColor: '#1E1B18',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(vPos.y + 10);
    this.npcs.set('vex', { sprite: vex, nameplate: vName });

    // 5. Spawn Town Guard near Town Entrance
    const guardPos = this.isoToScreen(9, 3);
    const guard = this.add.sprite(guardPos.x, guardPos.y, 'char_guard', 0);
    guard.setOrigin(0.5, 0.95);
    guard.setDepth(guardPos.y);
    guard.play('guard_idle_se');
    this.add.text(guardPos.x, guardPos.y - 56, 'Watchman (Guard)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '10px',
      color: '#C0C0C0',
      backgroundColor: '#1E1B18',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(guardPos.y + 10);

    // 6. Spawn Forest Bandit scouting near wilderness border
    const banditPos = this.isoToScreen(13, 8);
    const bandit = this.add.sprite(banditPos.x, banditPos.y, 'char_bandit', 3);
    bandit.setOrigin(0.5, 0.95);
    bandit.setDepth(banditPos.y);
    bandit.play('bandit_idle_sw');
    this.add.text(banditPos.x, banditPos.y - 56, 'Outlaw Scout', {
      fontFamily: 'Cinzel, serif',
      fontSize: '10px',
      color: '#E06C75',
      backgroundColor: '#1E1B18',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(banditPos.y + 10);
  }

  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      E: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    // E key handler
    this.wasd.E.on('down', () => {
      if (this.nearEntity) {
        if (this.nearEntity.type === 'npc') {
          this.callbacks.onTalkToNpc(this.nearEntity.id as any);
        } else if (this.nearEntity.type === 'node') {
          this.callbacks.onGatherNode(this.nearEntity.id);
        }
      }
    });
  }

  private setupCamera() {
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.75); // Authentic 16-bit pixel integer scale
  }

  public update() {
    const speed = 2.2;
    let dx = 0;
    let dy = 0;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left) dx -= speed;
    if (right) dx += speed;
    if (up) dy -= speed;
    if (down) dy += speed;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      this.player.x += dx;
      this.player.y += dy;
      this.player.setDepth(this.player.y);
      this.isMoving = true;

      // Determine isometric direction
      if (dx >= 0 && dy >= 0) this.currentDir = 'se';
      else if (dx < 0 && dy >= 0) this.currentDir = 'sw';
      else if (dx >= 0 && dy < 0) this.currentDir = 'ne';
      else if (dx < 0 && dy < 0) this.currentDir = 'nw';

      const animPrefix = this.playerSpriteKey.replace('char_', '');
      this.player.play(`${animPrefix}_walk_${this.currentDir}`, true);

      // Determine active world zone
      let zone = 'town_square';
      if (this.player.x > 800 || this.player.y > 450) {
        zone = 'darkwood_edge';
      }
      this.callbacks.onPlayerPosition(this.player.x, this.player.y, zone);
    } else {
      if (this.isMoving) {
        const animPrefix = this.playerSpriteKey.replace('char_', '');
        this.player.play(`${animPrefix}_idle_${this.currentDir}`);
        this.isMoving = false;
      }
    }

    // Check entity proximity for interaction prompts
    this.checkProximity();
  }

  private checkProximity() {
    const interactDist = 45;
    let closest: { type: 'npc' | 'node'; id: string; name: string; x: number; y: number } | null = null;
    let minDist = interactDist;

    // Check NPCs
    for (const [id, npc] of this.npcs.entries()) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.sprite.x, npc.sprite.y);
      if (dist < minDist) {
        minDist = dist;
        const name = id === 'garrick' ? 'Garrick (Blacksmith)' : id === 'saffron' ? 'Saffron (Caravan Broker)' : 'Vex (Rival)';
        closest = { type: 'npc', id, name, x: npc.sprite.x, y: npc.sprite.y };
      }
    }

    // Check Harvest Nodes
    for (const [id, node] of this.harvestNodes.entries()) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, node.sprite.x, node.sprite.y);
      if (dist < minDist) {
        minDist = dist;
        closest = { type: 'node', id, name: node.name, x: node.sprite.x, y: node.sprite.y };
      }
    }

    if (closest) {
      this.nearEntity = { type: closest.type, id: closest.id, name: closest.name };
      this.promptText.setText(`[E] ${closest.name}`);
      this.promptText.setPosition(closest.x, closest.y - 58);
      this.promptText.setVisible(true);
    } else {
      this.nearEntity = null;
      this.promptText.setVisible(false);
    }
  }

  // Visual floating feedback for gathering / trade
  public showFloatingText(text: string, color: string = '#F8DE7E') {
    const floatText = this.add.text(this.player.x, this.player.y - 30, text, {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color,
      backgroundColor: '#1E1B18',
      padding: { x: 6, y: 3 }
    });
    floatText.setStroke('#000000', 2);
    floatText.setOrigin(0.5);
    floatText.setDepth(999999);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 35,
      alpha: 0,
      duration: 1400,
      ease: 'Power1',
      onComplete: () => floatText.destroy()
    });
  }

  public animateCaravanMission() {
    if (!this.caravanSprite) return;
    const startX = this.caravanSprite.x;
    const startY = this.caravanSprite.y;
    const dest = this.isoToScreen(14, 11);

    this.tweens.add({
      targets: this.caravanSprite,
      x: dest.x,
      y: dest.y,
      duration: 4000,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }
}
