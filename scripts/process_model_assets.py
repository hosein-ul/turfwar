#!/usr/bin/env python3
"""
scripts/process_model_assets.py
Processes real image-generation model outputs into game-ready pixel-art assets:
1. Seamless 2:1 isometric ground tiles (cobblestone, grass, dirt, stone, water, forest)
2. Character spritesheets (48x72 frames, 4 directions, 3 walk/idle frames)
3. Character portraits and standing previews
4. Isometric buildings (Market Stall, Blacksmith Forge)
"""

import os
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ARTIFACT_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/3fd50577-88b0-48fa-a993-fa28e5ea2e53"
TILES_SOURCE = f"{ARTIFACT_DIR}/isometric_ground_tiles_1794409940860.jpg"
CHARS_SOURCE = f"{ARTIFACT_DIR}/rpg_characters_sheet_1794409968402.jpg"
STALL_SOURCE = f"{ARTIFACT_DIR}/building_market_stall_1794409991018.jpg"
SMITH_SOURCE = f"{ARTIFACT_DIR}/building_blacksmith_1794353090375.jpg"

WEB_PUBLIC = "/home/antigravity/apps/web/public/assets"
ART_PROCESSED = "/home/antigravity/art/processed"
ART_ARTIFACTS = f"{ARTIFACT_DIR}/art_assets"

def make_perfect_iso_mask(w, h):
    """Generates an exact 2:1 isometric diamond mask that leaves zero gap when tiled."""
    mask = Image.new('L', (w, h), 0)
    for y in range(h // 2):
        span = int((y + 0.5) * 4) + 2
        x0 = (w - span) // 2
        x1 = x0 + span
        mask.paste(255, (max(0, x0), y, min(w, x1), y + 1))
    for y in range(h // 2, h):
        span = int((h - y - 0.5) * 4) + 2
        x0 = (w - span) // 2
        x1 = x0 + span
        mask.paste(255, (max(0, x0), y, min(w, x1), y + 1))
    return mask

def process_tiles():
    print("Processing tiles from model generated sheet...")
    img = Image.open(TILES_SOURCE).convert('RGBA')
    
    # 5 columns: Cobblestone, Grass, Dirt, Dark Stone, Water
    # Segment 3 (y: 510 to 685) has clean isometric tiles
    col_width = 1024 / 5.0
    tile_types = [
        ('tile_cobblestone', 0),
        ('tile_grass', 1),
        ('tile_dirt', 2),
        ('tile_stone_border', 3),
        ('tile_water', 4),
    ]
    
    W, H = 64, 32
    mask = make_perfect_iso_mask(W, H)
    
    saved_tiles = {}
    for name, c_idx in tile_types:
        x0 = int(c_idx * col_width)
        x1 = int((c_idx + 1) * col_width)
        crop = img.crop((x0, 510, x1, 685))
        arr = np.array(crop)
        # Transparent white background
        bg = (arr[:,:,0] > 238) & (arr[:,:,1] > 238) & (arr[:,:,2] > 238)
        arr[bg, 3] = 0
        t_crop = Image.fromarray(arr)
        bbox = t_crop.getbbox()
        t_crop = t_crop.crop(bbox)
        
        # Crop top diamond region (roughly top 80% of tile)
        top_diamond = t_crop.crop((0, 0, t_crop.width, int(t_crop.height * 0.82)))
        resized = top_diamond.resize((W, H), Image.Resampling.LANCZOS)
        
        tile_img = Image.new('RGBA', (W, H), (0,0,0,0))
        tile_img.paste(resized, (0, 0), mask)
        saved_tiles[name] = tile_img
        
    # Create forest tile by blending grass with dark stone undergrowth
    grass_arr = np.array(saved_tiles['tile_grass'])
    stone_arr = np.array(saved_tiles['tile_stone_border'])
    forest_arr = (grass_arr.astype(np.float32) * 0.65 + stone_arr.astype(np.float32) * 0.35).astype(np.uint8)
    forest_tile = Image.fromarray(forest_arr)
    saved_tiles['tile_forest'] = forest_tile
    
    # Save to all target locations
    for name, tile in saved_tiles.items():
        for target_dir in [f"{WEB_PUBLIC}/tiles", f"{ART_PROCESSED}/tiles", f"{ART_ARTIFACTS}/tiles"]:
            os.makedirs(target_dir, exist_ok=True)
            tile.save(f"{target_dir}/{name}.png")
            
    print(f"Successfully processed {len(saved_tiles)} isometric tiles.")

def make_character_spritesheet(char_img_crop, name):
    """
    Takes high-res character image crop, generates a 144x288 spritesheet
    (3 frames wide, 4 directions high; frame size 48x72)
    with idle, walk1, walk2 frames for SE, SW, NE, NW.
    """
    FRAME_W = 48
    FRAME_H = 72
    SHEET_W = FRAME_W * 3
    SHEET_H = FRAME_H * 4
    
    # Scale character into 48x72 box (fit height ~64px to leave grounding headroom)
    target_h = 64
    ratio = target_h / char_img_crop.size[1]
    target_w = max(16, min(FRAME_W - 4, int(char_img_crop.size[0] * ratio)))
    scaled = char_img_crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Base SE frame
    base_se = Image.new('RGBA', (FRAME_W, FRAME_H), (0,0,0,0))
    paste_x = (FRAME_W - target_w) // 2
    paste_y = FRAME_H - target_h - 2
    base_se.paste(scaled, (paste_x, paste_y), scaled)
    
    # SW frame (horizontal flip of SE)
    base_sw = base_se.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    
    # NE and NW frames (rear angles: slightly shaded darker for back perspective)
    def make_rear_angle(front_frame):
        arr = np.array(front_frame).astype(np.float32)
        # Darken slightly to simulate rear lighting
        arr[:, :, :3] *= 0.88
        return Image.fromarray(arr.astype(np.uint8))
        
    base_ne = make_rear_angle(base_se)
    base_nw = make_rear_angle(base_sw)
    
    # Create walk frames:
    # Frame 0: Idle
    # Frame 1: Walk left (bob 2px up, shift 1px left)
    # Frame 2: Walk right (bob 2px up, shift 1px right)
    def create_walk_cycle(base_frame):
        # Frame 0: Idle
        f0 = base_frame.copy()
        
        # Frame 1: Step A (1px up, slight left tilt)
        f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0,0,0,0))
        step_a = base_frame.crop((0, 2, FRAME_W, FRAME_H))
        f1.paste(step_a, (-1, 0), step_a)
        
        # Frame 2: Step B (1px up, slight right tilt)
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
    print("Processing characters from model generated sheet...")
    img = Image.open(CHARS_SOURCE).convert('RGBA')
    
    boxes = {
        'char_player': (30, 80, 240, 450),
        'char_garrick': (260, 80, 510, 450),
        'char_saffron': (510, 80, 720, 450),
        'char_vex': (760, 80, 970, 450),
        'char_guard': (270, 500, 465, 880),
        'char_bandit': (740, 530, 970, 880),
    }
    
    for name, box in boxes.items():
        sub = img.crop(box)
        arr = np.array(sub)
        bg = (arr[:,:,0] > 238) & (arr[:,:,1] > 238) & (arr[:,:,2] > 238)
        arr[bg, 3] = 0
        char_t = Image.fromarray(arr)
        char_t = char_t.crop(char_t.getbbox())
        
        # 1. Standing preview (high-res transparent)
        base_name = name.replace('char_', '')
        for target_dir in [f"{WEB_PUBLIC}/characters", f"{ART_PROCESSED}/characters", f"{ART_ARTIFACTS}/characters"]:
            os.makedirs(target_dir, exist_ok=True)
            char_t.save(f"{target_dir}/preview_{base_name}.png")
            
        # 2. Spritesheet (144x288, 48x72 frames)
        spritesheet = make_character_spritesheet(char_t, name)
        for target_dir in [f"{WEB_PUBLIC}/characters", f"{ART_PROCESSED}/characters", f"{ART_ARTIFACTS}/characters"]:
            os.makedirs(target_dir, exist_ok=True)
            spritesheet.save(f"{target_dir}/{name}.png")
            
        # 3. Portrait Headshot (128x128 with ornate gold frame)
        # Crop head & upper shoulders (top 45% of character)
        cw, ch = char_t.size
        head_box = (int(cw * 0.1), 0, int(cw * 0.9), int(ch * 0.42))
        head = char_t.crop(head_box)
        
        # Fit into square 128x128 canvas
        portrait = Image.new('RGBA', (128, 128), (28, 24, 20, 255))
        # Warm subtle radial parchment background
        p_draw = ImageDraw.Draw(portrait)
        p_draw.rectangle([0, 0, 127, 127], fill=(35, 30, 25, 255))
        p_draw.rectangle([4, 4, 123, 123], fill=(50, 42, 34, 255))
        
        # Scale head to fit
        h_ratio = min(112 / head.size[0], 112 / head.size[1])
        hw, hh = int(head.size[0] * h_ratio), int(head.size[1] * h_ratio)
        head_scaled = head.resize((hw, hh), Image.Resampling.LANCZOS)
        
        paste_x = (128 - hw) // 2
        paste_y = (128 - hh) // 2 + 4
        portrait.paste(head_scaled, (paste_x, paste_y), head_scaled)
        
        # Ornate fantasy border (gold trim)
        p_draw.rectangle([0, 0, 127, 127], outline=(212, 162, 50, 255), width=2)
        p_draw.rectangle([3, 3, 124, 124], outline=(140, 100, 30, 255), width=1)
        
        for target_dir in [f"{WEB_PUBLIC}/portraits", f"{ART_PROCESSED}/portraits", f"{ART_ARTIFACTS}/portraits"]:
            os.makedirs(target_dir, exist_ok=True)
            portrait.save(f"{target_dir}/portrait_{base_name}.png")
            
    print(f"Successfully processed {len(boxes)} characters, sheets, and portraits.")

def process_buildings():
    print("Processing buildings...")
    # Market Stall
    stall_img = Image.open(STALL_SOURCE).convert('RGBA')
    s_arr = np.array(stall_img)
    bg = (s_arr[:,:,0] > 238) & (s_arr[:,:,1] > 238) & (s_arr[:,:,2] > 238)
    s_arr[bg, 3] = 0
    stall_t = Image.fromarray(s_arr).crop(Image.fromarray(s_arr).getbbox())
    
    # Scale to 256px wide for isometric world
    ratio = 256.0 / stall_t.size[0]
    stall_256 = stall_t.resize((256, int(stall_t.size[1] * ratio)), Image.Resampling.LANCZOS)
    
    for target_dir in [f"{WEB_PUBLIC}/buildings", f"{ART_PROCESSED}/buildings", f"{ART_ARTIFACTS}/buildings"]:
        os.makedirs(target_dir, exist_ok=True)
        stall_t.save(f"{target_dir}/market_stall.png")
        stall_256.save(f"{target_dir}/market_stall_256.png")
        
    # Blacksmith
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
    print("ALL MODEL ASSETS PROCESSED SUCCESSFULLY!")
