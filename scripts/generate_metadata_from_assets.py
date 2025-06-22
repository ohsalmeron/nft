import os
import json
import re
import requests
from PIL import Image
import time
from datetime import datetime
import subprocess
import socket

# Directories
ASSETS_DIR = 'assets'
METADATA_DIR = 'metadata'
CAPTIONS_FILE = 'captions.json'
LOG_FILE = 'process.log'

CANISTER_IDS_FILE = 'canister_ids.json'
with open(CANISTER_IDS_FILE) as f:
    canister_ids = json.load(f)
canister_id = canister_ids['core_nft']['ic']

# Ensure metadata directory exists
os.makedirs(METADATA_DIR, exist_ok=True)

OLLAMA_URL = 'http://localhost:11434/api/generate'
OLLAMA_MODEL = 'qwen3:1.7b'  # Use qwen3 1.7B as a lighter, more stable model

# Helper to slugify names for filenames
slugify = lambda s: re.sub(r'[^a-zA-Z0-9]+', '_', s.strip().lower()).strip('_')

def log(msg):
    print(msg)
    with open(LOG_FILE, 'a') as f:
        f.write(f"[{datetime.now().isoformat()}] {msg}\n")

def ensure_ollama_running():
    try:
        # Try to connect to Ollama
        s = socket.create_connection(('localhost', 11434), timeout=2)
        s.close()
        log('[OLLAMA] Ollama is already running.')
        return
    except Exception:
        log('[OLLAMA] Ollama is not running. Attempting to start Ollama in the background...')
        subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        import time
        for i in range(30):
            try:
                s = socket.create_connection(('localhost', 11434), timeout=2)
                s.close()
                log('[OLLAMA] Ollama started successfully.')
                return
            except Exception:
                time.sleep(1)
        log('[OLLAMA][ERROR] Ollama did not start after 30 seconds. Exiting.')
        exit(1)

def phase1_blip_caption_all():
    from transformers import BlipProcessor, BlipForConditionalGeneration
    import torch
    processor = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base', use_fast=True)
    model = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-base')
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model.to(device)
    captions = {}
    for filename in os.listdir(ASSETS_DIR):
        if not filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
            continue
        image_path = os.path.join(ASSETS_DIR, filename)
        try:
            with Image.open(image_path) as img:
                inputs = processor(images=img, return_tensors="pt").to(device)
                out = model.generate(**inputs)
                caption = processor.decode(out[0], skip_special_tokens=True)
                captions[filename] = caption
                log(f"[BLIP] Captioned {filename}: {caption}")
        except Exception as e:
            log(f"[BLIP][ERROR] Failed to caption {filename}: {e}")
    # Free GPU memory
    del model
    del processor
    if device == 'cuda':
        torch.cuda.empty_cache()
    with open(CAPTIONS_FILE, 'w') as f:
        json.dump(captions, f, indent=2)
    log(f"[BLIP] Saved all captions to {CAPTIONS_FILE}")

def query_ollama(prompt: str, model: str = OLLAMA_MODEL) -> str:
    data = {"model": model, "prompt": prompt, "stream": False}
    response = requests.post(OLLAMA_URL, json=data)
    response.raise_for_status()
    return response.json()["response"].strip()

def parse_ollama_output(output: str):
    # Expecting output in a structured format
    # Name: ...\nDescription: ...\nTraits: ...
    name, description, traits = '', '', []
    lines = output.split('\n')
    for line in lines:
        if line.lower().startswith('name:'):
            name = line.split(':', 1)[1].strip()
        elif line.lower().startswith('description:'):
            description = line.split(':', 1)[1].strip()
        elif line.lower().startswith('traits:'):
            traits_str = line.split(':', 1)[1].strip()
            # Traits can be comma or semicolon separated
            traits = [t.strip() for t in re.split(r',|;', traits_str) if t.strip()]
        elif line.strip() and not name:
            name = line.strip()
        elif line.strip() and not description:
            description = line.strip()
    return name, description, traits

def phase2_ollama_metadata():
    if not os.path.exists(CAPTIONS_FILE):
        log(f"[OLLAMA][ERROR] {CAPTIONS_FILE} not found. Run phase 1 first.")
        return
    with open(CAPTIONS_FILE) as f:
        captions = json.load(f)
    os.makedirs(METADATA_DIR, exist_ok=True)
    for filename, caption in captions.items():
        image_path = os.path.join(ASSETS_DIR, filename)
        attempts = 0
        success = False
        while attempts < 3 and not success:
            try:
                log(f"[OLLAMA][INFO] Processing {filename} (attempt {attempts+1}/3)")
                prompt = f"""
Given this image description: '{caption}', generate the following for an NFT collection:
1. Name: A unique, catchy NFT name (max 5 words)
2. Description: A creative, lore-rich description (1-2 sentences)
3. Traits: 3-5 unique, collection-worthy traits (comma separated, e.g. 'Cyber Samurai, Glowing Eyes, Futuristic Tokyo')
Format:
Name: ...\nDescription: ...\nTraits: ...
"""
                ollama_output = query_ollama(prompt)
                name, description, traits = parse_ollama_output(ollama_output)
                if not name:
                    name = caption.title()
                if not description:
                    description = caption
                if not traits:
                    traits = ["Unique"]
                new_filename = slugify(name) + os.path.splitext(filename)[1].lower()
                new_image_path = os.path.join(ASSETS_DIR, new_filename)
                if new_filename != filename:
                    os.rename(image_path, new_image_path)
                    log(f"[OLLAMA][SUCCESS] Renamed {filename} -> {new_filename}")
                else:
                    new_image_path = image_path
                image_url = f"https://{canister_id}.raw.icp0.io/images/{new_filename}"
                metadata = {
                    "name": name,
                    "description": description,
                    "image": image_url,
                    "attributes": [
                        {"trait_type": "Trait", "value": trait} for trait in traits
                    ]
                }
                out_path = os.path.join(METADATA_DIR, f"{os.path.splitext(new_filename)[0]}.json")
                with open(out_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                log(f"[OLLAMA][SUCCESS] Generated metadata for {new_filename} -> {out_path}")
                success = True
                time.sleep(10)  # Wait 10 seconds to allow GPU/VRAM to recover
            except Exception as e:
                attempts += 1
                log(f"[OLLAMA][ERROR] Failed to process {filename} (attempt {attempts}/3): {e}")
                if attempts < 3:
                    time.sleep(3)
                else:
                    log(f"[OLLAMA][FAIL] Skipping {filename} after 3 failed attempts.")

if __name__ == "__main__":
    ensure_ollama_running()
    log("=== NFT Metadata Generation Started ===")
    log("=== Phase 1: BLIP Captioning All Images ===")
    phase1_blip_caption_all()
    log("=== Phase 2: Generating Metadata with Ollama ===")
    phase2_ollama_metadata()
    log("=== NFT Metadata Generation Complete ===")

# Note: Requires 'requests' package. Install with: pip install requests
# Make sure Ollama is running and a model is pulled, e.g.: ollama pull llama2 