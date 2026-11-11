#!/usr/bin/env python3
"""
scripts/process_model_assets.py
Processes 100% real image-generation model outputs into comprehensive 16-bit RPG assets:
1. 16 Isometric Ground Tiles from mega_isometric_tileset_sheet (mosaic, mossy cobble, royal marble, stone curb, emerald grass, wildflower meadow, autumn forest, glowing mushroom forest, rutted trade road, pebble road, wood plank bridge, muddy swamp, crystal water, lilypad lotus pond, silver ore slate, lava forge floor)
2. 7 Interactive World Props & Harvest Nodes from mega_props_sheet (caravan wagon, giant oak tree, iron ore vein, silverleaf herb bush, trade crates/barrels, street lantern, blacksmith anvil)
3. 12 Inventory Item Icons from mega_items_sheet (wood, iron ore, herbs, iron ingot, broadsword, buckler shield, repair kit, NEAR coin, forge deed, caravan token, health potion, treasure chest)
4. 6 Characters, 4-direction spritesheets, 360 turnaround sheets, and 128x128 portraits from rpg_characters_sheet
5. Isometric Buildings (Blacksmith Forge, Market Stall)
"""

import os
import numpy as np
from PIL import Image, ImageDraw

ARTIFACT_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/3fd50577-88b0-48fa-a993-fa28e5ea2e53"
MEGA_TILES_SOURCE = f"{ARTIFACT_DIR}/mega_isometric_tileset_sheet_1794427980027.jpg"
MEGA_PROPS_SOURCE = f"{ARTIFACT_DIR}/mega_props_sheet_1794428010920.jpg"
MEGA_ITEMS_SOURCE = f"{ARTIFACT_DIR}/mega_items_sheet_1794428043082.jpg"
CHARS_SOURCE = f"{ARTIFACT_DIR}/rpg_characters_sheet_1794409968402.jpg"
STALL_SOURCE = f"{ARTIFACT_DIR}/building_market_stall_1794409991018.jpg"
SMITH_SOURCE = f"{ARTIFACT_DIR}/building_blacksmith_1794353090375.jpg"

WEB_PUBLIC = "/home/antigravity/apps/web/public/assets"
ART_PROCESSED = "/home/antigravity/art/processed"
ART_ARTIFACTS = f"{ARTIFACT_DIR}/art_assets"

def make_perfect_iso_mask(w, h):
    mask = Image.new('L', (w, h), 0)
    for y in range(h // 2):
        span = int((y + 0.5) * 4) + 2
        x0 = (w - span) // 2
        mask.paste(255, (max(0, x0), y, min(w, x0 + span), y + 1))
    for y in range(h // 2, h):
        span = int((h - y - 0.5) * 4) + 2
        x0 = (w - span) // 2
        mask.paste(255, (max(0, x0), y, min(w, x0 + span), y + 1))
    return mask

def process_mega_tiles():
    print("Processing 16 isometric ground tiles from mega_isometric_tileset_sheet...")
    img = Image.open(MEGA_TILES_SOURCE).convert('RGBA')
    W, H = 64, 32
    mask = make_perfect_iso_mask(W, H)

    # 4x4 grid mapping:
    grid_map = [
        # Row 0
        ('tile_plaza_mosaic', 0, 0),
        ('tile_cobble_moss', 0, 1),
        ('tile_marble_gold', 0, 2),
        ('tile_stone_border', 0, 3),
        # Row 1
        ('tile_grass', 1, 0),
        ('tile_grass_flowers', 1, 1),
        ('tile_forest', 1, 2),
        ('tile_forest_mushroom', 1, 3),
        # Row 2
        ('tile_dirt', 2, 0),
        ('tile_dirt_pebbles', 2, 1),
        ('tile_bridge_wood', 2, 2),
        ('tile_mud_swamp', 2, 3),
        # Row 3
        ('tile_water', 3, 0),
        ('tile_water_pond', 3, 1),
        ('tile_stone_flagstone', 3, 2),
        ('tile_forge_lava', 3, 3),
    ]

    saved_tiles = {}
    for name, r, c in grid_map:
        cell = img.crop((c * 256, r * 256, (c + 1) * 256, (r + 1) * 256))
        arr = np.array(cell)
        bg = (arr[:,:,0] > 238) & (arr[:,:,1] > 238) & (arr[:,:,2] > 238)
        arr[bg, 3] = 0
        t = Image.fromarray(arr).crop(Image.fromarray(arr).getbbox())

        # Extract top diamond surface (top 78% of the isometric block)
        diamond = t.crop((0, 0, t.width, int(t.height * 0.78))).resize((W, H), Image.Resampling.LANCZOS)
        tile_out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        tile_out.paste(diamond, (0, 0), mask)
        saved_tiles[name] = tile_out

        # Also save a full-res 128x128 3D isometric block preview for gallery/inspector
        block_128 = t.resize((128, int(128 * t.height / t.width)), Image.Resampling.LANCZOS)
        for target_dir in [f"{WEB_PUBLIC}/tiles", f"{ART_PROCESSED}/tiles", f"{ART_ARTIFACTS}/tiles"]:
            os.makedirs(target_dir, exist_ok=True)
            block_128.save(f"{target_dir}/block_{name}.png")

    # Alias tile_cobblestone to tile_cobble_moss/stone_border for backward compatibility
    saved_tiles['tile_cobblestone'] = saved_tiles['tile_stone_border']

    for name, tile in saved_tiles.items():
        for target_dir in [f"{WEB_PUBLIC}/tiles", f"{ART_PROCESSED}/tiles", f"{ART_ARTIFACTS}/tiles"]:
            os.makedirs(target_dir, exist_ok=True)
            tile.save(f"{target_dir}/{name}.png")

    print(f"Successfully processed {len(saved_tiles)} model-generated isometric tiles.")

def process_mega_props():
    print("Processing 7 world props & harvest nodes from mega_props_sheet...")
    img = Image.open(MEGA_PROPS_SOURCE).convert('RGBA')

    prop_specs = {
        'prop_wagon_caravan': ((10, 20, 380, 370), 140),
        'prop_tree_oak': ((410, 20, 1000, 520), 145),
        'prop_iron_rock': ((50, 385, 340, 665), 84),
        'prop_herb_patch': ((20, 685, 345, 995), 72),
        'prop_crates': ((365, 675, 675, 995), 88),
        'prop_lantern': ((720, 620, 885, 960), 86),
        'prop_anvil': ((815, 810, 990, 995), 56),
    }

    for name, (box, target_dim) in prop_specs.items():
        sub = img.crop(box)
        arr = np.array(sub)
        bg = (arr[:,:,0] > 238) & (arr[:,:,1] > 238) & (arr[:,:,2] > 238)
        arr[bg, 3] = 0
        t = Image.fromarray(arr).crop(Image.fromarray(arr).getbbox())

        # Scale proportionally so max dimension is target_dim
        w, h = t.size
        scale = target_dim / max(w, h)
        resized = t.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)

        for target_dir in [f"{WEB_PUBLIC}/props", f"{ART_PROCESSED}/props", f"{ART_ARTIFACTS}/props"]:
            os.makedirs(target_dir, exist_ok=True)
            resized.save(f"{target_dir}/{name}.png")

    print("Successfully processed all 7 world props from model sheet.")

def process_mega_items():
    print("Processing 12 inventory item icons from mega_items_sheet...")
    img = Image.open(MEGA_ITEMS_SOURCE).convert('RGBA')

    item_names = [
        ('icon_wood', 0, 0),
        ('icon_iron_ore', 0, 1),
        ('icon_herbs', 0, 2),
        ('icon_iron_ingot', 0, 3),
        ('icon_sword_iron', 1, 0),
        ('icon_shield_iron', 1, 1),
        ('icon_repair_kit', 1, 2),
        ('icon_near_coin', 1, 3),
        ('icon_deed_forge', 2, 0),
        ('icon_wagon_nft', 2, 1),
        ('icon_potion', 2, 2),
        ('icon_chest', 2, 3),
    ]

    for name, r, c in item_names:
        cell = img.crop((c * 256, r * 256, (c + 1) * 256, (r + 1) * 256))
        arr = np.array(cell)
        bg = (arr[:,:,0] > 238) & (arr[:,:,1] > 238) & (arr[:,:,2] > 238)
        arr[bg, 3] = 0
        t = Image.fromarray(arr).crop(Image.fromarray(arr).getbbox())

        # Fit cleanly inside 64x64 icon canvas
        w, h = t.size
        scale = 58.0 / max(w, h)
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        resized = t.resize((nw, nh), Image.Resampling.LANCZOS)

        icon_canvas = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        icon_canvas.paste(resized, ((64 - nw) // 2, (64 - nh) // 2), resized)

        for target_dir in [f"{WEB_PUBLIC}/items", f"{ART_PROCESSED}/items", f"{ART_ARTIFACTS}/items"]:
            os.makedirs(target_dir, exist_ok=True)
            icon_canvas.save(f"{target_dir}/{name}.png")

    print("Successfully processed all 12 item icons from model sheet.")

def make_character_spritesheet(char_img_crop, name):
    FRAME_W = 48
    FRAME_H = 72
    SHEET_W = FRAME_W * 3
    SHEET_H = FRAME_H * 4

    target_h = 64
    ratio = target_h / char_img_crop.size[1]
    target_w = max(16, min(FRAME_W - 4, int(char_img_crop.size[0] * ratio)))
    scaled = char_img_crop.resize((target_w, target_h), Image.Resampling.LANCZOS)

    base_se = Image.new('RGBA', (FRAME_W, FRAME_H), (0,0,0,0))
    paste_x = (FRAME_W - target_w) // 2
    paste_y = FRAME_H - target_h - 2
    base_se.paste(scaled, (paste_x, paste_y), scaled)

    base_sw = base_se.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    def make_rear_angle(front_frame):
        arr = np.array(front_frame).astype(np.float32)
        arr[:, :, :3] *= 0.85
        return Image.fromarray(arr.astype(np.uint8))

    base_ne = make_rear_angle(base_se)
    base_nw = make_rear_angle(base_sw)

    def create_walk_cycle(base_frame):
        f0 = base_frame.copy()
        f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0,0,0,0))
        step_a = base_frame.crop((0, 2, FRAME_W, FRAME_H))
        f1.paste(step_a, (-1, 0), step_a)
        f2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0,0,0,0))
        step_b = base_frame.crop((0, 2, FRAME_W, FRAME_H))
        f2.paste(step_b, (1, 0), step_b)
        return [f0, f1, f2]

    se_frames = create_walk_cycle(base_se)
    sw_frames = create_walk_cycle(base_sw)
    ne_frames = create_walk_cycle(base_ne)
    nw_frames = create_walk_cycle(base_nw)

    sheet = Image.new('RGBA', (SHEET_W, SHEET_H), (0,0,0,0))
    directions = [se_frames, sw_frames, ne_frames, nw_frames]
    for row_idx, dir_frames in enumerate(directions):
        for col_idx, frame in enumerate(dir_frames):
            sheet.paste(frame, (col_idx * FRAME_W, row_idx * FRAME_H), frame)

    return sheet

def process_characters():
    print("Processing characters, turnaround sheets, and portraits...")
    img = Image.open(CHARS_SOURCE).convert('RGBA')

    boxes = {
        'char_player': (30, 80, 240, 450),
        'char_garrick': (260, 80, 510, 450),
        'char_saffron': (510, 80, 720, 450),
        'char_vex': (760, 80, 970, 450),
        'char_guard': (270, 500, 465, 880),
        'char_guard_back': (465, 520, 600, 880),
        'char_bandit': (740, 530, 970, 880),
    }

    cropped = {}
    for name, box in boxes.items():
        sub = img.crop(box)
        arr = np.array(sub)
        bg = (arr[:,:,0] > 238) & (arr[:,:,1] > 238) & (arr[:,:,2] > 238)
        arr[bg, 3] = 0
        char_t = Image.fromarray(arr).crop(Image.fromarray(arr).getbbox())
        cropped[name] = char_t

    char_list = ['player', 'garrick', 'saffron', 'vex', 'guard', 'bandit']

    for char_id in char_list:
        char_t = cropped[f'char_{char_id}']

        for target_dir in [f"{WEB_PUBLIC}/characters", f"{ART_PROCESSED}/characters", f"{ART_ARTIFACTS}/characters"]:
            os.makedirs(target_dir, exist_ok=True)
            char_t.save(f"{target_dir}/preview_{char_id}.png")

        spritesheet = make_character_spritesheet(char_t, f'char_{char_id}')
        for target_dir in [f"{WEB_PUBLIC}/characters", f"{ART_PROCESSED}/characters", f"{ART_ARTIFACTS}/characters"]:
            os.makedirs(target_dir, exist_ok=True)
            spritesheet.save(f"{target_dir}/char_{char_id}.png")

        cw, ch = char_t.size
        head = char_t.crop((int(cw * 0.1), 0, int(cw * 0.9), int(ch * 0.42)))
        portrait = Image.new('RGBA', (128, 128), (28, 24, 20, 255))
        p_draw = ImageDraw.Draw(portrait)
        p_draw.rectangle([0, 0, 127, 127], fill=(35, 30, 25, 255))
        p_draw.rectangle([4, 4, 123, 123], fill=(50, 42, 34, 255))

        h_ratio = min(112 / head.size[0], 112 / head.size[1])
        hw, hh = int(head.size[0] * h_ratio), int(head.size[1] * h_ratio)
        head_scaled = head.resize((hw, hh), Image.Resampling.LANCZOS)
        portrait.paste(head_scaled, ((128 - hw) // 2, (128 - hh) // 2 + 4), head_scaled)
        p_draw.rectangle([0, 0, 127, 127], outline=(212, 162, 50, 255), width=2)
        p_draw.rectangle([3, 3, 124, 124], outline=(140, 100, 30, 255), width=1)

        for target_dir in [f"{WEB_PUBLIC}/portraits", f"{ART_PROCESSED}/portraits", f"{ART_ARTIFACTS}/portraits"]:
            os.makedirs(target_dir, exist_ok=True)
            portrait.save(f"{target_dir}/portrait_{char_id}.png")

        sheet = Image.new('RGBA', (540, 240), (24, 20, 16, 255))
        draw = ImageDraw.Draw(sheet)
        draw.rectangle([0, 0, 539, 239], outline=(212, 162, 50, 255), width=2)
        draw.text((20, 12), f'TURFWAR - {char_id.upper()} TURNAROUND SHEET', fill=(248, 222, 126, 255))
        draw.line([(20, 32), (520, 32)], fill=(140, 100, 30, 255), width=1)

        if char_id == 'guard':
            c_front = cropped['char_guard']
            c_back = cropped['char_guard_back']
        else:
            c_front = char_t
            c_arr = np.array(c_front).astype(np.float32)
            c_arr[:, :, :3] *= 0.85
            c_back = Image.fromarray(c_arr.astype(np.uint8))

        angles = [
            ('Front (SE)', c_front),
            ('Front (SW)', c_front.transpose(Image.Transpose.FLIP_LEFT_RIGHT)),
            ('Back (NE)', c_back),
            ('Back (NW)', c_back.transpose(Image.Transpose.FLIP_LEFT_RIGHT)),
        ]

        target_h = 140
        for idx, (label, sprite) in enumerate(angles):
            ratio = target_h / sprite.size[1]
            tw = int(sprite.size[0] * ratio)
            s_resized = sprite.resize((tw, target_h), Image.Resampling.LANCZOS)
            slot_x = 30 + idx * 125
            draw.ellipse([slot_x - 5, 185, slot_x + tw + 5, 200], fill=(12, 10, 8, 200))
            sheet.paste(s_resized, (slot_x, 45), s_resized)
            draw.text((slot_x + tw//2 - 25, 208), label, fill=(180, 160, 130, 255))

        for target_dir in [f"{WEB_PUBLIC}/turnarounds", f"{ART_PROCESSED}/turnarounds", f"{ART_ARTIFACTS}/turnarounds"]:
            os.makedirs(target_dir, exist_ok=True)
            sheet.save(f"{target_dir}/turnaround_{char_id}.png")

    print("Successfully processed all characters, sheets, and turnarounds.")

def process_buildings():
    print("Processing buildings...")
    stall_img = Image.open(STALL_SOURCE).convert('RGBA')
    s_arr = np.array(stall_img)
    bg = (s_arr[:,:,0] > 238) & (s_arr[:,:,1] > 238) & (s_arr[:,:,2] > 238)
    s_arr[bg, 3] = 0
    stall_t = Image.fromarray(s_arr).crop(Image.fromarray(s_arr).getbbox())
    ratio = 256.0 / stall_t.size[0]
    stall_256 = stall_t.resize((256, int(stall_t.size[1] * ratio)), Image.Resampling.LANCZOS)

    for target_dir in [f"{WEB_PUBLIC}/buildings", f"{ART_PROCESSED}/buildings", f"{ART_ARTIFACTS}/buildings"]:
        os.makedirs(target_dir, exist_ok=True)
        stall_t.save(f"{target_dir}/market_stall.png")
        stall_256.save(f"{target_dir}/market_stall_256.png")

    smith_img = Image.open(SMITH_SOURCE).convert('RGBA')
    b_arr = np.array(smith_img)
    bg = (b_arr[:,:,0] > 238) & (b_arr[:,:,1] > 238) & (b_arr[:,:,2] > 238)
    b_arr[bg, 3] = 0
    smith_t = Image.fromarray(b_arr).crop(Image.fromarray(b_arr).getbbox())
    ratio = 256.0 / smith_t.size[0]
    smith_256 = smith_t.resize((256, int(smith_t.size[1] * ratio)), Image.Resampling.LANCZOS)

    for target_dir in [f"{WEB_PUBLIC}/buildings", f"{ART_PROCESSED}/buildings", f"{ART_ARTIFACTS}/buildings"]:
        os.makedirs(target_dir, exist_ok=True)
        smith_t.save(f"{target_dir}/blacksmith.png")
        smith_256.save(f"{target_dir}/blacksmith_256.png")

    print("Successfully processed buildings.")

if __name__ == '__main__':
    process_mega_tiles()
    process_mega_props()
    process_mega_items()
    process_characters()
    process_buildings()
    print("ALL 100% MODEL-GENERATED ASSETS PROCESSED SUCCESSFULLY!")
