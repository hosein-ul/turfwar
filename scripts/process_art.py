#!/usr/bin/env python3
"""
TURFWAR — Asset Processing & 16-Bit Pixel Art Synthesis Engine
Processes generated assets and synthesizes game-ready 2:1 isometric pixel-art assets
strictly adhering to the 32-color palette and rules in art/ART_BIBLE.md.
"""

import os
import sys
import math
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART_GEN = os.path.join(BASE_DIR, "art", "generated")
ART_PROC = os.path.join(BASE_DIR, "art", "processed")
PROMPT_CATALOG = os.path.join(BASE_DIR, "art", "prompts")

# Ensure target directories exist
for sub in ["brand", "tiles", "buildings", "props", "characters", "portraits", "items", "ui"]:
    os.makedirs(os.path.join(ART_PROC, sub), exist_ok=True)

# -------------------------------------------------------------
# PALETTE DEFINITIONS (from art/ART_BIBLE.md)
# -------------------------------------------------------------
PALETTE = {
    # Stone & Cobble
    "stone_black": (30, 27, 24, 255),
    "stone_dark": (61, 53, 46, 255),
    "stone_mid": (107, 94, 79, 255),
    "stone_light": (158, 140, 118, 255),
    "stone_hi": (200, 182, 158, 255),

    # Timber & Leather
    "wood_black": (20, 12, 7, 255),
    "wood_dark": (46, 27, 14, 255),
    "wood_mid": (84, 54, 28, 255),
    "wood_light": (133, 87, 46, 255),
    "wood_hi": (181, 126, 74, 255),

    # Metals & Gold
    "iron_dark": (26, 29, 32, 255),
    "iron_mid": (58, 65, 72, 255),
    "iron_light": (106, 115, 125, 255),
    "iron_hi": (176, 184, 192, 255),
    "gold_dark": (74, 53, 16, 255),
    "gold_mid": (138, 103, 28, 255),
    "gold_light": (212, 162, 50, 255),
    "gold_hi": (248, 222, 126, 255),

    # Foliage & Nature
    "green_deep": (13, 31, 18, 255),
    "green_dark": (28, 59, 36, 255),
    "green_mid": (52, 99, 61, 255),
    "green_light": (91, 150, 96, 255),
    "green_hi": (147, 199, 139, 255),

    # Light & Fire
    "fire_dark": (64, 18, 5, 255),
    "fire_red": (168, 53, 10, 255),
    "amber_mid": (232, 122, 24, 255),
    "amber_light": (247, 189, 54, 255),
    "amber_hi": (255, 243, 176, 255),

    # Water & Stream
    "water_deep": (19, 37, 51, 255),
    "water_mid": (36, 75, 102, 255),
    "water_light": (72, 125, 156, 255),
    "water_hi": (140, 185, 209, 255),

    # Fabric / Leather
    "cloth_red": (140, 35, 30, 255),
    "cloth_blue": (35, 60, 120, 255),
    "cloth_linen": (215, 205, 180, 255),

    "trans": (0, 0, 0, 0)
}

# -------------------------------------------------------------
# 1. PROCESS GENERATED ASSETS
# -------------------------------------------------------------
def process_generated():
    print("Processing generated image assets...")
    
    # 1.1 TurfWar Emblem
    emblem_path = os.path.join(ART_GEN, "turfwar_emblem_1794352868542.jpg")
    if os.path.exists(emblem_path):
        img = Image.open(emblem_path).convert("RGBA")
        # Save master brand copy
        img.save(os.path.join(ART_PROC, "brand", "emblem_full.png"))
        
        # Transparent cutout: Dark background removal
        datas = img.getdata()
        newData = []
        for item in datas:
            # Check if nearly black background
            if item[0] < 28 and item[1] < 28 and item[2] < 28:
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        
        # Trim transparent bounds
        bbox = img.getbbox()
        if bbox:
            cropped = img.crop(bbox)
        else:
            cropped = img
            
        cropped.save(os.path.join(ART_PROC, "brand", "emblem.png"))
        
        # Generate resized icons (256, 128, 64)
        cropped.resize((256, 256), Image.Resampling.NEAREST).save(os.path.join(ART_PROC, "brand", "emblem_256.png"))
        cropped.resize((128, 128), Image.Resampling.NEAREST).save(os.path.join(ART_PROC, "brand", "emblem_128.png"))
        cropped.resize((64, 64), Image.Resampling.NEAREST).save(os.path.join(ART_PROC, "brand", "emblem_64.png"))
        print("  -> Saved processed brand emblem & icon sizes.")

    # 1.2 Title Screen BG
    title_path = os.path.join(ART_GEN, "turfwar_title_bg_1794353070837.jpg")
    if os.path.exists(title_path):
        img = Image.open(title_path)
        img.save(os.path.join(ART_PROC, "brand", "title_bg.jpg"), quality=95)
        # Create web-optimized version
        img.resize((1280, 720), Image.Resampling.BILINEAR).save(os.path.join(ART_PROC, "brand", "title_bg_720p.jpg"), quality=90)
        print("  -> Saved processed title screen key art.")

    # 1.3 Blacksmith Building
    bs_path = os.path.join(ART_GEN, "building_blacksmith_1794353090375.jpg")
    if os.path.exists(bs_path):
        img = Image.open(bs_path).convert("RGBA")
        datas = img.getdata()
        newData = []
        for item in datas:
            # Check for pure white or near-white background
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        bbox = img.getbbox()
        if bbox:
            cropped = img.crop(bbox)
        else:
            cropped = img
        cropped.save(os.path.join(ART_PROC, "buildings", "blacksmith.png"))
        # Also create a crisp 256px game-scale version
        ratio = 256 / cropped.width
        scaled = cropped.resize((256, int(cropped.height * ratio)), Image.Resampling.NEAREST)
        scaled.save(os.path.join(ART_PROC, "buildings", "blacksmith_256.png"))
        print("  -> Saved processed transparent blacksmith building.")

# -------------------------------------------------------------
# 2. ISOMETRIC TILE ENGINE (64x32 Logical 2:1 Tiles)
# -------------------------------------------------------------
def make_iso_diamond(w=64, h=32, fill=PALETTE["stone_mid"], outline=PALETTE["stone_dark"]):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # 2:1 isometric diamond vertices
    pts = [
        (w // 2, 0),
        (w - 1, h // 2),
        (w // 2, h - 1),
        (0, h // 2)
    ]
    draw.polygon(pts, fill=fill, outline=outline)
    return img, draw

def generate_tiles():
    print("Generating 64x32 2:1 isometric ground tiles...")
    w, h = 64, 32

    # 2.1 Cobblestone Tile
    cobble, d = make_iso_diamond(w, h, fill=PALETTE["stone_mid"], outline=PALETTE["stone_dark"])
    # Add rounded cobblestone pavers inside
    pavers = [
        # (cx, cy, rx, ry, col)
        (32, 10, 8, 4, PALETTE["stone_light"]),
        (22, 16, 7, 4, PALETTE["stone_hi"]),
        (42, 16, 7, 4, PALETTE["stone_dark"]),
        (32, 22, 8, 4, PALETTE["stone_light"]),
        (14, 16, 5, 3, PALETTE["stone_mid"]),
        (50, 16, 5, 3, PALETTE["stone_hi"]),
    ]
    for cx, cy, rx, ry, col in pavers:
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=col, outline=PALETTE["stone_black"])
    cobble.save(os.path.join(ART_PROC, "tiles", "tile_cobblestone.png"))

    # 2.2 Lush Meadow Grass Tile
    grass, d = make_iso_diamond(w, h, fill=PALETTE["green_mid"], outline=PALETTE["green_dark"])
    # Blade clusters & highlights
    blades = [
        (28, 12, PALETTE["green_hi"]),
        (36, 14, PALETTE["green_light"]),
        (24, 18, PALETTE["green_hi"]),
        (40, 20, PALETTE["green_light"]),
        (32, 24, PALETTE["green_deep"]),
        (18, 15, PALETTE["green_light"]),
        (46, 17, PALETTE["green_hi"]),
    ]
    for bx, by, col in blades:
        d.line([(bx, by), (bx + 1, by - 2)], fill=col)
        d.point((bx, by), fill=PALETTE["green_deep"])
    grass.save(os.path.join(ART_PROC, "tiles", "tile_grass.png"))

    # 2.3 Forest Dirt Road Tile
    dirt, d = make_iso_diamond(w, h, fill=PALETTE["wood_dark"], outline=PALETTE["wood_black"])
    # Worn ruts
    d.line([(10, 14), (54, 18)], fill=PALETTE["wood_mid"], width=2)
    d.line([(12, 18), (52, 22)], fill=PALETTE["wood_black"], width=1)
    pebbles = [(25, 11), (38, 22), (20, 21), (45, 13)]
    for px, py in pebbles:
        d.point((px, py), fill=PALETTE["stone_light"])
    dirt.save(os.path.join(ART_PROC, "tiles", "tile_dirt.png"))

    # 2.4 Flowing Water Tile
    water, d = make_iso_diamond(w, h, fill=PALETTE["water_mid"], outline=PALETTE["water_deep"])
    # Wave crests
    d.line([(20, 10), (35, 12)], fill=PALETTE["water_hi"], width=1)
    d.line([(28, 18), (48, 17)], fill=PALETTE["water_light"], width=1)
    d.line([(16, 22), (32, 24)], fill=PALETTE["water_hi"], width=1)
    water.save(os.path.join(ART_PROC, "tiles", "tile_water.png"))

    # 2.5 Forest Floor Tile
    forest, d = make_iso_diamond(w, h, fill=PALETTE["green_dark"], outline=PALETTE["green_deep"])
    d.ellipse([26, 12, 38, 18], fill=PALETTE["green_deep"])
    d.point((30, 14), fill=PALETTE["amber_mid"])  # fallen leaf
    d.point((34, 16), fill=PALETTE["stone_light"])  # tiny stone
    forest.save(os.path.join(ART_PROC, "tiles", "tile_forest.png"))

    # 2.6 Stone Border / Curb
    curb, d = make_iso_diamond(w, h, fill=PALETTE["stone_dark"], outline=PALETTE["stone_black"])
    d.line([(16, 8), (48, 24)], fill=PALETTE["stone_hi"], width=2)
    curb.save(os.path.join(ART_PROC, "tiles", "tile_stone_border.png"))
    print("  -> Saved 6 ground tiles.")

# -------------------------------------------------------------
# 3. WORLD PROPS & HARVEST NODES
# -------------------------------------------------------------
def generate_props():
    print("Generating isometric world props & harvestable nodes...")

    # 3.1 Iron Ore Mine Rock Node (48x48)
    img = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Drop shadow
    d.ellipse([8, 30, 40, 44], fill=(10, 10, 10, 110))
    # Rock shape (isometric faceted boulder)
    rock_pts = [(24, 8), (38, 18), (42, 32), (32, 40), (16, 38), (8, 26), (14, 14)]
    d.polygon(rock_pts, fill=PALETTE["stone_dark"], outline=PALETTE["stone_black"])
    # Facets
    d.polygon([(24, 8), (38, 18), (28, 26), (14, 14)], fill=PALETTE["stone_mid"])
    d.polygon([(14, 14), (28, 26), (16, 38), (8, 26)], fill=PALETTE["stone_light"])
    # Embedded gleaming Iron Ore Crystals
    crystals = [
        ([(20, 18), (26, 16), (28, 22), (22, 24)], PALETTE["iron_hi"]),
        ([(30, 24), (36, 22), (38, 28), (32, 30)], PALETTE["iron_light"]),
        ([(16, 26), (20, 24), (21, 30), (17, 31)], PALETTE["iron_hi"])
    ]
    for pts, col in crystals:
        d.polygon(pts, fill=col, outline=PALETTE["iron_dark"])
        # Specular glint
        d.point(pts[0], fill=(255, 255, 255, 255))
    img.save(os.path.join(ART_PROC, "props", "prop_iron_rock.png"))

    # 3.2 Darkwood Oak Tree (64x80)
    tree = Image.new("RGBA", (64, 80), (0, 0, 0, 0))
    td = ImageDraw.Draw(tree)
    # Shadow
    td.ellipse([14, 62, 50, 76], fill=(10, 10, 10, 110))
    # Trunk
    td.polygon([(28, 48), (36, 48), (40, 70), (24, 70)], fill=PALETTE["wood_dark"], outline=PALETTE["wood_black"])
    td.line([(32, 50), (32, 68)], fill=PALETTE["wood_mid"], width=2)
    # Foliage Canopy Clusters (Layered 16-bit spheres)
    canopies = [
        (32, 24, 22, PALETTE["green_deep"]),
        (24, 34, 16, PALETTE["green_dark"]),
        (40, 34, 16, PALETTE["green_dark"]),
        (32, 20, 18, PALETTE["green_mid"]),
        (26, 18, 12, PALETTE["green_light"]),
        (34, 14, 10, PALETTE["green_hi"]),
    ]
    for cx, cy, r, col in canopies:
        td.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    tree.save(os.path.join(ART_PROC, "props", "prop_tree_oak.png"))

    # 3.3 Silverleaf Herb Sprout (32x32)
    herb = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    hd = ImageDraw.Draw(herb)
    hd.ellipse([8, 22, 24, 30], fill=(10, 10, 10, 90))
    # Stems
    hd.line([(16, 26), (16, 14)], fill=PALETTE["green_dark"], width=2)
    hd.line([(16, 20), (10, 16)], fill=PALETTE["green_mid"], width=1)
    hd.line([(16, 18), (22, 14)], fill=PALETTE["green_mid"], width=1)
    # Silvery leaves
    hd.ellipse([7, 13, 12, 17], fill=PALETTE["green_hi"], outline=PALETTE["green_dark"])
    hd.ellipse([20, 11, 25, 15], fill=PALETTE["green_hi"], outline=PALETTE["green_dark"])
    hd.ellipse([14, 10, 18, 14], fill=(220, 245, 230, 255), outline=PALETTE["green_deep"])
    herb.save(os.path.join(ART_PROC, "props", "prop_herb_patch.png"))

    # 3.4 Wooden Barrel & Trade Crates (48x48)
    crate = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    cd = ImageDraw.Draw(crate)
    cd.ellipse([6, 32, 42, 44], fill=(10, 10, 10, 100))
    # Barrel (left)
    cd.ellipse([10, 20, 24, 28], fill=PALETTE["wood_mid"], outline=PALETTE["wood_black"])
    cd.polygon([(10, 24), (24, 24), (25, 38), (9, 38)], fill=PALETTE["wood_dark"], outline=PALETTE["wood_black"])
    cd.line([(9, 29), (25, 29)], fill=PALETTE["iron_light"], width=1)
    cd.line([(9, 34), (25, 34)], fill=PALETTE["iron_light"], width=1)
    # Crate (right)
    # Iso cube
    cd.polygon([(26, 18), (38, 12), (46, 17), (34, 23)], fill=PALETTE["wood_light"], outline=PALETTE["wood_black"])
    cd.polygon([(26, 18), (34, 23), (34, 38), (26, 33)], fill=PALETTE["wood_dark"], outline=PALETTE["wood_black"])
    cd.polygon([(34, 23), (46, 17), (46, 32), (34, 38)], fill=PALETTE["wood_mid"], outline=PALETTE["wood_black"])
    # Cross brace on crate face
    cd.line([(26, 18), (34, 38)], fill=PALETTE["wood_black"], width=1)
    crate.save(os.path.join(ART_PROC, "props", "prop_crates.png"))

    # 3.5 Blacksmith Anvil on Wooden Stump (36x36)
    anvil = Image.new("RGBA", (36, 36), (0, 0, 0, 0))
    ad = ImageDraw.Draw(anvil)
    ad.ellipse([6, 24, 30, 34], fill=(10, 10, 10, 110))
    # Stump
    ad.polygon([(12, 18), (24, 18), (26, 28), (10, 28)], fill=PALETTE["wood_dark"], outline=PALETTE["wood_black"])
    # Anvil top & horn
    ad.polygon([(8, 12), (28, 12), (26, 18), (12, 18)], fill=PALETTE["iron_hi"], outline=PALETTE["iron_dark"])
    ad.polygon([(6, 12), (10, 15), (10, 12)], fill=PALETTE["iron_light"])  # Horn
    anvil.save(os.path.join(ART_PROC, "props", "prop_anvil.png"))

    # 3.6 Street Lantern Post with Glow (32x56)
    lantern = Image.new("RGBA", (32, 56), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lantern)
    ld.ellipse([10, 48, 22, 54], fill=(10, 10, 10, 100))
    # Iron post
    ld.line([(16, 50), (16, 18)], fill=PALETTE["iron_mid"], width=3)
    ld.line([(16, 18), (24, 14)], fill=PALETTE["iron_dark"], width=2)
    # Glass lantern cage
    ld.rectangle([21, 15, 27, 23], fill=PALETTE["amber_mid"], outline=PALETTE["iron_dark"])
    ld.point((24, 19), fill=PALETTE["amber_hi"])
    # Ambient warm glow halo
    lantern.save(os.path.join(ART_PROC, "props", "prop_lantern.png"))

    # 3.7 Covered Merchant Wagon / Caravan (80x64)
    wagon = Image.new("RGBA", (80, 64), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wagon)
    # Ground shadow
    wd.ellipse([10, 42, 70, 60], fill=(10, 10, 10, 120))
    # Wooden Chassis
    wd.polygon([(18, 38), (56, 24), (66, 32), (28, 46)], fill=PALETTE["wood_dark"], outline=PALETTE["wood_black"])
    # Heavy Spoke Wheels (Front & Rear)
    wd.ellipse([16, 38, 30, 52], fill=PALETTE["wood_mid"], outline=PALETTE["iron_dark"])
    wd.ellipse([20, 42, 26, 48], fill=PALETTE["iron_dark"])
    wd.ellipse([50, 26, 64, 40], fill=PALETTE["wood_mid"], outline=PALETTE["iron_dark"])
    # Arched Canvas Hood (Cloth canopy)
    wd.polygon([(24, 16), (56, 8), (62, 22), (30, 30)], fill=PALETTE["cloth_linen"], outline=PALETTE["wood_black"])
    wd.arc([24, 10, 44, 30], 180, 0, fill=PALETTE["wood_mid"], width=2)
    wd.arc([42, 6, 62, 26], 180, 0, fill=PALETTE["wood_mid"], width=2)
    # Brass Lantern on side
    wd.rectangle([60, 22, 64, 28], fill=PALETTE["gold_light"], outline=PALETTE["gold_dark"])
    wd.point((62, 25), fill=PALETTE["amber_hi"])
    wagon.save(os.path.join(ART_PROC, "props", "prop_wagon_caravan.png"))
    print("  -> Saved 7 world props including Covered Merchant Wagon.")

# -------------------------------------------------------------
# 4. CHARACTER SPRITES & PORTRAITS
# -------------------------------------------------------------
def make_character_sprite(name, body_color, hair_color, hat_color=None, acc_color=None):
    """Generates a 32x48 isometric 16-bit RPG character sprite sheet (4 directions, 3 frames each: 96x192)"""
    sheet = Image.new("RGBA", (32 * 3, 48 * 4), (0, 0, 0, 0))
    
    # 4 directions: 0=SE (down-right), 1=SW (down-left), 2=NE (up-right), 3=NW (up-left)
    for dir_idx in range(4):
        for frame in range(3):
            fx = frame * 32
            fy = dir_idx * 48
            img = Image.new("RGBA", (32, 48), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            
            # Ground shadow
            d.ellipse([8, 40, 24, 46], fill=(10, 10, 10, 110))
            
            # Walk bob offset
            bob = 1 if frame == 1 else 0
            leg_swing = (frame - 1) * 2
            
            # Boots / Legs
            if dir_idx in [0, 1]:  # Facing forward
                d.line([(13, 34 - bob), (13 + leg_swing, 42)], fill=PALETTE["stone_dark"], width=3)
                d.line([(19, 34 - bob), (19 - leg_swing, 42)], fill=PALETTE["stone_dark"], width=3)
            else:  # Facing back
                d.line([(13, 34 - bob), (13 - leg_swing, 42)], fill=PALETTE["stone_dark"], width=3)
                d.line([(19, 34 - bob), (19 + leg_swing, 42)], fill=PALETTE["stone_dark"], width=3)
                
            # Torso / Jerkin / Apron
            d.rectangle([11, 20 - bob, 21, 34 - bob], fill=body_color, outline=PALETTE["wood_black"])
            
            # Belt & Buckle
            d.line([(11, 28 - bob), (21, 28 - bob)], fill=PALETTE["wood_black"], width=2)
            d.point((16, 28 - bob), fill=PALETTE["gold_hi"])
            
            # Head & Skin
            skin = (235, 195, 155, 255)
            d.ellipse([11, 8 - bob, 21, 19 - bob], fill=skin, outline=PALETTE["stone_black"])
            
            # Hair / Beard / Hat
            if dir_idx in [0, 1]:  # Eyes visible
                eye_x = 18 if dir_idx == 0 else 14
                d.point((eye_x, 13 - bob), fill=PALETTE["stone_black"])
                # Hair on top
                d.arc([11, 7 - bob, 21, 15 - bob], 180, 0, fill=hair_color, width=2)
            else:
                # Full back of head hair
                d.ellipse([11, 7 - bob, 21, 16 - bob], fill=hair_color)
                
            if hat_color:
                # Cap / Cowl
                d.polygon([(9, 10 - bob), (23, 10 - bob), (16, 4 - bob)], fill=hat_color, outline=PALETTE["wood_black"])
                
            # Accessory (Hammer for blacksmith, ledger for merchant, dagger for rogue)
            if acc_color:
                if dir_idx == 0:  # SE
                    d.line([(22, 24 - bob), (26, 32 - bob)], fill=acc_color, width=2)
                elif dir_idx == 1:  # SW
                    d.line([(10, 24 - bob), (6, 32 - bob)], fill=acc_color, width=2)
                    
            sheet.paste(img, (fx, fy))
            
    sheet.save(os.path.join(ART_PROC, "characters", f"char_{name}.png"))
    # Save standalone 1st frame preview
    preview = sheet.crop((0, 0, 32, 48))
    preview.save(os.path.join(ART_PROC, "characters", f"preview_{name}.png"))

def make_portrait(name, bg_color, hair_color, hat_color=None, beard=False):
    """Generates a 64x64 pixel-art dialogue portrait avatar with decorative frame"""
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Outer wood & brass frame
    d.rectangle([0, 0, 63, 63], fill=PALETTE["wood_dark"], outline=PALETTE["gold_dark"])
    d.rectangle([3, 3, 60, 60], fill=bg_color, outline=PALETTE["wood_black"])
    # Rivets
    for cx, cy in [(2, 2), (61, 2), (2, 61), (61, 61)]:
        d.point((cx, cy), fill=PALETTE["gold_hi"])
        
    skin = (235, 195, 155, 255)
    # Shoulders
    d.polygon([(12, 60), (52, 60), (44, 46), (20, 46)], fill=PALETTE["wood_mid"], outline=PALETTE["wood_black"])
    # Neck
    d.rectangle([28, 40, 36, 48], fill=(215, 175, 135, 255))
    # Head
    d.ellipse([20, 16, 44, 44], fill=skin, outline=PALETTE["wood_black"])
    
    # Eyes & Eyebrows
    d.rectangle([26, 26, 28, 28], fill=PALETTE["stone_black"])
    d.rectangle([36, 26, 38, 28], fill=PALETTE["stone_black"])
    d.line([(25, 24), (29, 24)], fill=hair_color, width=1)
    d.line([(35, 24), (39, 24)], fill=hair_color, width=1)
    
    # Nose & Mouth
    d.line([(32, 27), (32, 33)], fill=(200, 150, 110, 255), width=2)
    d.line([(29, 36), (35, 36)], fill=PALETTE["wood_dark"], width=1)
    
    if beard:
        d.polygon([(22, 34), (42, 34), (36, 48), (28, 48)], fill=hair_color, outline=PALETTE["wood_black"])
        
    if hat_color:
        d.polygon([(16, 18), (48, 18), (32, 6)], fill=hat_color, outline=PALETTE["wood_black"])
        d.line([(14, 18), (50, 18)], fill=PALETTE["gold_light"], width=2)
    else:
        d.arc([20, 12, 44, 30], 180, 0, fill=hair_color, width=4)
        
    img.save(os.path.join(ART_PROC, "portraits", f"portrait_{name}.png"))

def generate_characters():
    print("Generating character sprite sheets & dialogue portraits...")
    # Player
    make_character_sprite("player", PALETTE["green_mid"], PALETTE["wood_dark"], hat_color=None, acc_color=PALETTE["iron_light"])
    make_portrait("player", PALETTE["green_deep"], PALETTE["wood_dark"], hat_color=None, beard=False)
    
    # Garrick (Blacksmith)
    make_character_sprite("garrick", PALETTE["wood_dark"], PALETTE["stone_black"], hat_color=None, acc_color=PALETTE["iron_hi"])
    make_portrait("garrick", PALETTE["fire_dark"], PALETTE["stone_black"], hat_color=None, beard=True)
    
    # Saffron (Broker)
    make_character_sprite("saffron", PALETTE["cloth_blue"], PALETTE["gold_light"], hat_color=PALETTE["cloth_blue"], acc_color=PALETTE["gold_mid"])
    make_portrait("saffron", PALETTE["water_deep"], PALETTE["gold_light"], hat_color=PALETTE["cloth_blue"], beard=False)
    
    # Vex (Rival)
    make_character_sprite("vex", PALETTE["stone_dark"], PALETTE["wood_black"], hat_color=PALETTE["stone_dark"], acc_color=PALETTE["cloth_red"])
    make_portrait("vex", PALETTE["stone_black"], PALETTE["wood_black"], hat_color=PALETTE["stone_dark"], beard=False)
    
    # Guard & Bandit
    make_character_sprite("guard", PALETTE["iron_mid"], PALETTE["stone_dark"], hat_color=PALETTE["iron_light"], acc_color=PALETTE["iron_hi"])
    make_character_sprite("bandit", PALETTE["wood_dark"], PALETTE["stone_black"], hat_color=PALETTE["cloth_red"], acc_color=PALETTE["iron_dark"])
    print("  -> Saved 6 character spritesheets and 4 dialogue portraits.")

# -------------------------------------------------------------
# 5. ITEM ICONS & UI SKINS (32x32 Icons, UI Frames)
# -------------------------------------------------------------
def generate_items_and_ui():
    print("Generating 32x32 item icons and retro UI skin kit...")

    def make_icon_base():
        img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        # Inset dark slot background
        d.rectangle([1, 1, 30, 30], fill=PALETTE["stone_black"], outline=PALETTE["wood_dark"])
        return img, d

    # 5.1 Wood Bundle
    img, d = make_icon_base()
    d.polygon([(6, 12), (24, 6), (26, 14), (8, 20)], fill=PALETTE["wood_mid"], outline=PALETTE["wood_black"])
    d.polygon([(8, 18), (26, 12), (28, 20), (10, 26)], fill=PALETTE["wood_light"], outline=PALETTE["wood_black"])
    d.line([(15, 8), (17, 24)], fill=PALETTE["gold_dark"], width=2)  # Rope binding
    img.save(os.path.join(ART_PROC, "items", "icon_wood.png"))

    # 5.2 Iron Ore
    img, d = make_icon_base()
    d.polygon([(10, 10), (22, 6), (26, 18), (18, 26), (8, 20)], fill=PALETTE["stone_dark"], outline=PALETTE["stone_black"])
    d.polygon([(14, 12), (20, 10), (22, 16), (16, 18)], fill=PALETTE["iron_hi"])
    d.point((15, 13), fill=(255, 255, 255, 255))
    img.save(os.path.join(ART_PROC, "items", "icon_iron_ore.png"))

    # 5.3 Silverleaf Herbs
    img, d = make_icon_base()
    d.line([(16, 26), (16, 10)], fill=PALETTE["green_dark"], width=2)
    d.ellipse([8, 12, 16, 18], fill=PALETTE["green_hi"], outline=PALETTE["green_deep"])
    d.ellipse([16, 8, 24, 14], fill=PALETTE["green_light"], outline=PALETTE["green_deep"])
    img.save(os.path.join(ART_PROC, "items", "icon_herbs.png"))

    # 5.4 Refined Iron Ingot
    img, d = make_icon_base()
    d.polygon([(6, 18), (14, 10), (26, 10), (18, 18)], fill=PALETTE["iron_hi"], outline=PALETTE["iron_dark"])
    d.polygon([(6, 18), (18, 18), (18, 24), (6, 24)], fill=PALETTE["iron_mid"], outline=PALETTE["iron_dark"])
    d.polygon([(18, 18), (26, 10), (26, 16), (18, 24)], fill=PALETTE["iron_light"], outline=PALETTE["iron_dark"])
    img.save(os.path.join(ART_PROC, "items", "icon_iron_ingot.png"))

    # 5.5 Frontier Broadsword
    img, d = make_icon_base()
    # Blade
    d.line([(8, 24), (24, 8)], fill=PALETTE["iron_hi"], width=3)
    d.point((25, 7), fill=(255, 255, 255, 255))  # Tip
    # Crossguard & Hilt
    d.line([(6, 20), (12, 26)], fill=PALETTE["gold_light"], width=2)
    d.line([(7, 25), (4, 28)], fill=PALETTE["wood_dark"], width=2)
    d.point((3, 29), fill=PALETTE["gold_hi"])  # Pommel
    img.save(os.path.join(ART_PROC, "items", "icon_sword_iron.png"))

    # 5.6 Reinforced Buckler Shield
    img, d = make_icon_base()
    d.polygon([(16, 6), (26, 10), (24, 22), (16, 27), (8, 22), (6, 10)], fill=PALETTE["wood_dark"], outline=PALETTE["iron_light"])
    d.ellipse([12, 13, 20, 20], fill=PALETTE["iron_hi"], outline=PALETTE["iron_dark"])
    d.point((16, 16), fill=PALETTE["gold_hi"])
    img.save(os.path.join(ART_PROC, "items", "icon_shield_iron.png"))

    # 5.7 Artisan Repair Kit
    img, d = make_icon_base()
    d.rectangle([8, 14, 24, 24], fill=PALETTE["wood_mid"], outline=PALETTE["wood_black"])
    d.line([(8, 18), (24, 18)], fill=PALETTE["iron_light"], width=1)
    d.line([(16, 14), (16, 8)], fill=PALETTE["gold_dark"], width=2)  # Handle
    img.save(os.path.join(ART_PROC, "items", "icon_repair_kit.png"))

    # 5.8 NEAR Token / Coin
    img, d = make_icon_base()
    d.ellipse([6, 6, 26, 26], fill=PALETTE["gold_light"], outline=PALETTE["gold_dark"])
    d.ellipse([9, 9, 23, 23], fill=PALETTE["gold_hi"])
    # Near 'N' stylized letter
    d.polygon([(11, 21), (11, 11), (14, 11), (19, 18), (19, 11), (21, 11), (21, 21), (18, 21), (13, 14), (13, 21)], fill=PALETTE["gold_dark"])
    img.save(os.path.join(ART_PROC, "items", "icon_near_coin.png"))

    # 5.9 Business Deed NFT Badge
    img, d = make_icon_base()
    # Scroll deed parchment
    d.polygon([(8, 6), (24, 6), (22, 26), (6, 26)], fill=PALETTE["cloth_linen"], outline=PALETTE["wood_black"])
    d.line([(10, 11), (20, 11)], fill=PALETTE["stone_dark"], width=1)
    d.line([(10, 15), (18, 15)], fill=PALETTE["stone_dark"], width=1)
    # Wax seal
    d.ellipse([16, 20, 24, 28], fill=PALETTE["cloth_red"], outline=PALETTE["stone_black"])
    img.save(os.path.join(ART_PROC, "items", "icon_deed_forge.png"))

    # 5.10 Caravan Wagon NFT Badge
    img, d = make_icon_base()
    d.polygon([(6, 12), (22, 8), (26, 18), (10, 22)], fill=PALETTE["cloth_linen"], outline=PALETTE["wood_black"])
    d.ellipse([7, 20, 13, 26], fill=PALETTE["wood_mid"], outline=PALETTE["iron_dark"])
    d.ellipse([19, 16, 25, 22], fill=PALETTE["wood_mid"], outline=PALETTE["iron_dark"])
    img.save(os.path.join(ART_PROC, "items", "icon_wagon_nft.png"))

    # 5.11 UI Skin: Parchment Panel Texture (128x128 seamless)
    parch = Image.new("RGBA", (128, 128), (228, 216, 190, 255))
    pd = ImageDraw.Draw(parch)
    # Subtle fibers & aging
    for i in range(120):
        px = (i * 37) % 128
        py = (i * 73) % 128
        pd.point((px, py), fill=(215, 200, 170, 255))
    parch.save(os.path.join(ART_PROC, "ui", "ui_parchment.png"))

    # 5.12 UI Skin: Slot Frame (44x44)
    slot = Image.new("RGBA", (44, 44), (0, 0, 0, 0))
    sd = ImageDraw.Draw(slot)
    sd.rectangle([0, 0, 43, 43], fill=PALETTE["wood_dark"], outline=PALETTE["wood_black"])
    sd.rectangle([3, 3, 40, 40], fill=PALETTE["stone_black"], outline=PALETTE["iron_dark"])
    sd.rectangle([4, 4, 39, 39], outline=(15, 15, 15, 255))
    slot.save(os.path.join(ART_PROC, "ui", "ui_slot_frame.png"))
    print("  -> Saved 10 item icons and UI panel textures.")

# -------------------------------------------------------------
# MAIN DISPATCH
# -------------------------------------------------------------
if __name__ == "__main__":
    process_generated()
    generate_tiles()
    generate_props()
    generate_characters()
    generate_items_and_ui()
    print("=== TURFWAR Asset Processing & Generation Complete ===")
