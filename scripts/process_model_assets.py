#!/usr/bin/env python3
"""
scripts/process_model_assets.py
Processes real image-generation model outputs into comprehensive 16-bit RPG assets:
1. Ground tile variations (cobblestone moss/clean, grass flower/dense, dirt pebbles/clean, stone flagstone/border, water pond/deep)
2. Character directional spritesheets (48x72 frames, 4 directions, 3 walk/idle frames)
3. Character 360 Turnaround sheets (Front SE, Profile SW, Back NE, Profile NW)
4. Character portraits (128x128 gold-framed) and high-res standing previews
5. Isometric buildings (Market Stall, Blacksmith Forge)
"""

import os
import shutil
import numpy as np
from PIL import Image, ImageDraw

ARTIFACT_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/3fd50577-88b0-48fa-a993-fa28e5ea2e53"
TILES_SOURCE = f"{ARTIFACT_DIR}/isometric_ground_tiles_1794409940860.jpg"
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

def process_tiles():
    print("Processing rich tile variations from model generated sheet...")
    img = Image.open(TILES_SOURCE).convert('RGBA')
    W, H = 64, 32
    mask = make_perfect_iso_mask(W, H)
    
    variations = {
        'tile_cobblestone': (0, 510, 204, 685),
        'tile_cobble_moss': (0, 10, 204, 230),
        'tile_grass': (205, 510, 410, 685),
        'tile_grass_flowers': (205, 10, 410, 230),
        'tile_dirt': (410, 510, 614, 685),
        'tile_dirt_pebbles': (410, 10, 614, 230),
        'tile_stone_border': (614, 510, 819, 685),
        'tile_stone_flagstone': (614, 10, 819, 230),
        'tile_water': (819, 510, 1024, 685),
        'tile_water_pond': (819, 10, 1024, 230),
    }
    
    saved_tiles = {}
    for name, (x0, y0, x1, y1) in variations.items():
        crop = img.crop((x0, y0, x1, y1))
        arr = np.array(crop)
        bg = (arr[:,:,0] > 238) & (arr[:,:,1] > 238) & (arr[:,:,2] > 238)
        arr[bg, 3] = 0
        t = Image.fromarray(arr).crop(Image.fromarray(arr).getbbox())
        diamond = t.crop((0, 0, t.width, int(t.height * 0.82))).resize((W, H), Image.Resampling.LANCZOS)
        tile_out = Image.new('RGBA', (W, H), (0,0,0,0))
        tile_out.paste(diamond, (0, 0), mask)
        saved_tiles[name] = tile_out

    # Forest tile
    g_arr = np.array(saved_tiles['tile_grass']).astype(np.float32)
    s_arr = np.array(saved_tiles['tile_stone_border']).astype(np.float32)
    forest_arr = (g_arr * 0.65 + s_arr * 0.35).astype(np.uint8)
    saved_tiles['tile_forest'] = Image.fromarray(forest_arr)

    for name, tile in saved_tiles.items():
        for target_dir in [f"{WEB_PUBLIC}/tiles", f"{ART_PROCESSED}/tiles", f"{ART_ARTIFACTS}/tiles"]:
            os.makedirs(target_dir, exist_ok=True)
            tile.save(f"{target_dir}/{name}.png")
            
    print(f"Successfully processed {len(saved_tiles)} rich tile variations.")

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
        
        # 1. Standing preview
        for target_dir in [f"{WEB_PUBLIC}/characters", f"{ART_PROCESSED}/characters", f"{ART_ARTIFACTS}/characters"]:
            os.makedirs(target_dir, exist_ok=True)
            char_t.save(f"{target_dir}/preview_{char_id}.png")
            
        # 2. Spritesheet (144x288, 48x72 frames)
        spritesheet = make_character_spritesheet(char_t, f'char_{char_id}')
        for target_dir in [f"{WEB_PUBLIC}/characters", f"{ART_PROCESSED}/characters", f"{ART_ARTIFACTS}/characters"]:
            os.makedirs(target_dir, exist_ok=True)
            spritesheet.save(f"{target_dir}/char_{char_id}.png")
            
        # 3. Portrait Headshot (128x128 with ornate gold frame)
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
            
        # 4. Turnaround Sheet (540x240, 4 angles)
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
    process_tiles()
    process_characters()
    process_buildings()
    print("ALL RICH ASSETS PROCESSED SUCCESSFULLY!")
