import os
import json
import re
import requests
from PIL import Image
import time
from datetime import datetime
import subprocess
import socket
import hashlib
import base64

# Directories
ASSETS_DIR = 'assets'
METADATA_DIR = 'metadata'
LOG_FILE = 'process.log'

# --- Configuration ---
# Target size for image resizing
TARGET_SIZE = (1024, 1024)
# --- XMP Metadata Configuration ---
# These fields will be embedded into the final WebP assets.

# A. Creator & Copyright
CREATOR_COMPANY = "World of Unreal LLC"
CREDITS = ["Omar Hernandez Salmeron"]  # List of artists, developers, etc.
PROJECT_NAME = "Cosmicrafts"
COLLECTION_NAME = "Cosmicrafts Avatars"

# B. Licensing & Rights
COPYRIGHT_NOTICE = f"© {datetime.now().year} {CREATOR_COMPANY}. All Rights Reserved."
LICENSE_TERMS = "Owner may use for personal and limited commercial purposes, including social media posts and creating merchandise up to a value of $1,000 USD per year. Resale of the NFT is permitted. Full terms at the License URL."
LICENSE_URL = "https://cosmicrafts.com/terms"
ATTRIBUTION_TEXT = f"Credit to '{PROJECT_NAME}' and the creator is required when sharing."

# C. Blockchain & Technical
# The script will automatically get the canister ID from canister_ids.json
# NFT_CONTRACT_ADDRESS = "xea2t-daaaa-aaaaj-qnp2a-cai" 
INCLUDE_DIGITAL_SIGNATURE = True  # Embeds a SHA-256 hash of the file
INCLUDE_TIMESTAMP = True  # Embeds the creation date
# --- End Configuration ---

# Helper to slugify names for filenames
slugify = lambda s: re.sub(r'[^a-zA-Z0-9]+', '_', s.strip().lower()).strip('_')

def log(msg):
    print(msg)
    with open(LOG_FILE, 'a') as f:
        f.write(f"[{datetime.now().isoformat()}] {msg}\n")

CANISTER_IDS_FILE = 'canister_ids.json'
try:
    with open(CANISTER_IDS_FILE) as f:
        canister_ids = json.load(f)
    canister_id = canister_ids['core_nft']['ic']
except FileNotFoundError:
    log(f"[WARN] {CANISTER_IDS_FILE} not found. Image URLs and contract address in metadata will be incomplete.")
    canister_id = "YOUR-CANISTER-ID-HERE"

# Ensure metadata directory exists
os.makedirs(METADATA_DIR, exist_ok=True)

OLLAMA_URL = 'http://localhost:11434/api/generate'
OLLAMA_MODEL = 'qwen2.5vl'

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

def phase1_convert_png_to_webp():
    log("=== Phase 1: Converting PNGs to WebP ===")
    converted_files = 0
    for filename in os.listdir(ASSETS_DIR):
        if filename.lower().endswith('.png'):
            png_path = os.path.join(ASSETS_DIR, filename)
            webp_path = os.path.splitext(png_path)[0] + '.webp'
            try:
                with Image.open(png_path) as img:
                    img = img.convert('RGBA')
                    # Note: Image.LANCZOS is deprecated. Using Image.Resampling.LANCZOS
                    img = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
                    img.save(webp_path, 'WEBP', quality=80, method=6)
                    log(f"Converted {filename} -> {os.path.basename(webp_path)}")
                os.remove(png_path)
                log(f"Removed original PNG: {filename}")
                converted_files += 1
            except Exception as e:
                log(f"[ERROR] Failed to convert {filename}: {e}")
    if converted_files == 0:
        log("No new PNG files to convert.")
    log("=== Phase 1 Complete ===")

def query_ollama_multimodal(prompt: str, image_path: str, model: str = OLLAMA_MODEL) -> str:
    """Query Ollama with image and text prompt using multimodal model"""
    try:
        # Read and encode the image
        with open(image_path, 'rb') as f:
            image_data = f.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        data = {
            "model": model,
            "prompt": prompt,
            "images": [image_base64],
            "stream": False
        }
        
        # Print the full payload to the console
        print("\n[OLLAMA][PAYLOAD] Sending the following payload to Ollama:")
        print(json.dumps(data, indent=2)[:1000] + '...')  # Truncate if too long
        
        response = requests.post(OLLAMA_URL, json=data)
        response.raise_for_status()
        
        # Print the full raw response
        print("\n[OLLAMA][RAW RESPONSE] Ollama returned:")
        print(json.dumps(response.json(), indent=2))
        
        ollama_response = response.json()["response"].strip()
        log(f"[OLLAMA][RESPONSE] {ollama_response}")  # Log to file
        print(f"[OLLAMA][RESPONSE] {ollama_response}")  # Print to console for real-time feedback
        return ollama_response
    except Exception as e:
        print(f"[OLLAMA][ERROR] Multimodal query failed: {e}")
        print(f"[OLLAMA][ERROR] Payload was: {json.dumps(data, indent=2)[:1000]}...")
        log(f"[OLLAMA][ERROR] Multimodal query failed: {e}")
        raise

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

def phase2_ollama_multimodal_metadata():
    log("=== Phase 2: Generating Metadata with Qwen 2.5 VL (Multimodal) ===")
    os.makedirs(METADATA_DIR, exist_ok=True)
    
    for filename in os.listdir(ASSETS_DIR):
        if not filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
            continue
            
        image_path = os.path.join(ASSETS_DIR, filename)
        attempts = 0
        success = False
        
        while attempts < 3 and not success:
            try:
                log(f"[OLLAMA][INFO] Processing {filename} with Qwen 2.5 VL (attempt {attempts+1}/3)")
                
                prompt = f"""
Analyze this image and generate the following for an NFT collection:

1. Name: A unique, catchy NFT name (max 5 words) based on what you see in the image
2. Description: A creative, lore-rich description (1-2 sentences) describing the character/scene
3. Traits: 3-5 unique, collection-worthy traits (comma separated) based on visual elements like clothing, colors, accessories, etc.

Format your response exactly as:
Name: [name]
Description: [description]
Traits: [trait1, trait2, trait3]
"""
                
                ollama_output = query_ollama_multimodal(prompt, image_path)
                name, description, traits = parse_ollama_output(ollama_output)
                
                if not name:
                    name = filename.split('.')[0].replace('_', ' ').title()
                if not description:
                    description = f"A unique character from the {COLLECTION_NAME} collection."
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
                log(f"[OLLAMA][DETAILS] Name: {name}, Traits: {', '.join(traits)}")
                success = True
                time.sleep(5)  # Wait 5 seconds between requests
                
            except Exception as e:
                attempts += 1
                log(f"[OLLAMA][ERROR] Failed to process {filename} (attempt {attempts}/3): {e}")
                if attempts < 3:
                    time.sleep(3)
                else:
                    log(f"[OLLAMA][FAIL] Skipping {filename} after 3 failed attempts.")
    
    log("=== Phase 2 Complete ===")

def generate_xmp_metadata(metadata: dict, image_path: str) -> str:
    # --- Helper to format lists for XMP ---
    def format_list(items, tag):
        return f'<{tag}><rdf:Bag>{ "".join(f"<rdf:li>{item}</rdf:li>" for item in items) }</rdf:Bag></{tag}>'

    # --- Basic Info ---
    name = metadata.get('name', '')
    description = metadata.get('description', '')

    # --- Traits ---
    trait_list = [attr.get('value', '') for attr in metadata.get('attributes', [])]
    
    # --- Credits ---
    creator_list_xml = format_list(CREDITS, "dc:creator")

    # --- Subject/Keywords ---
    subject_list_xml = format_list(trait_list, "dc:subject")
    
    # --- Technical Metadata ---
    timestamp_xml = f'<xmp:CreateDate>{datetime.now().isoformat()}</xmp:CreateDate>' if INCLUDE_TIMESTAMP else ''
    
    signature_xml = ''
    if INCLUDE_DIGITAL_SIGNATURE:
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
            hash_sha256 = hashlib.sha256(image_bytes).hexdigest()
            signature_xml = f'<cosmicrafts:DigitalSignature type="SHA-256">{hash_sha256}</cosmicrafts:DigitalSignature>'

    # --- Build XMP ---
    xmp = f'''<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c011 79.156380, 2014/05/21-23:38:37        ">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:cosmicrafts="https://cosmicrafts.com/ns/1.0/"
   xmp:CreateDate="{datetime.now().isoformat() if INCLUDE_TIMESTAMP else ''}"
   photoshop:Source="{PROJECT_NAME}"
   photoshop:Category="{COLLECTION_NAME}">
   <dc:title>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">{name}</rdf:li>
    </rdf:Alt>
   </dc:title>
   <dc:description>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">{description}</rdf:li>
    </rdf:Alt>
   </dc:description>
   {creator_list_xml}
   {subject_list_xml}
   <xmpRights:Owner>
    <rdf:Bag>
     <rdf:li>{CREATOR_COMPANY}</rdf:li>
    </rdf:Bag>
   </xmpRights:Owner>
   <xmpRights:Marked>True</xmpRights:Marked>
   <xmpRights:WebStatement>{LICENSE_URL}</xmpRights:WebStatement>
   <xmpRights:UsageTerms>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">{LICENSE_TERMS}</rdf:li>
    </rdf:Alt>
   </xmpRights:UsageTerms>
   <dc:rights>
      <rdf:Alt>
         <rdf:li xml:lang="x-default">{COPYRIGHT_NOTICE}</rdf:li>
      </rdf:Alt>
   </dc:rights>
   <cosmicrafts:ContractAddress>{canister_id}</cosmicrafts:ContractAddress>
   {signature_xml}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>'''
    return xmp

def phase3_embed_xmp_metadata():
    log("=== Phase 3: Embedding XMP Metadata into WebP files ===")
    for meta_filename in os.listdir(METADATA_DIR):
        if not meta_filename.lower().endswith('.json'):
            continue
        base = os.path.splitext(meta_filename)[0]
        meta_path = os.path.join(METADATA_DIR, meta_filename)
        webp_path = os.path.join(ASSETS_DIR, base + '.webp')

        if not os.path.exists(webp_path):
            log(f"[XMP][WARN] No corresponding webp file found for {meta_filename}. Looked for {webp_path}. Skipping.")
            continue
        
        try:
            with open(meta_path, 'r') as f:
                metadata = json.load(f)
            
            xmp_str = generate_xmp_metadata(metadata, webp_path)
            
            xmp_path = os.path.join(METADATA_DIR, base + '.xmp')
            with open(xmp_path, 'w') as f:
                f.write(xmp_str)
            
            subprocess.run(['webpmux', '-set', 'xmp', xmp_path, webp_path, '-o', webp_path], check=True, capture_output=True, text=True)
            os.remove(xmp_path)
            log(f"[XMP][SUCCESS] Embedded metadata into {os.path.basename(webp_path)}")
        except subprocess.CalledProcessError as e:
            log(f"[XMP][ERROR] Failed to embed metadata in {os.path.basename(webp_path)}.")
            log(f"[XMP][ERROR] webpmux stderr: {e.stderr}")
        except Exception as e:
            log(f"[XMP][ERROR] An unexpected error occurred for {os.path.basename(webp_path)}: {e}")
    log("=== Phase 3 Complete ===")

if __name__ == "__main__":
    ensure_ollama_running()
    log("=== NFT Asset Generation Pipeline Started ===")
    log("=== Using Qwen 2.5 VL for Multimodal Image Analysis ===")
    phase1_convert_png_to_webp()
    log("="*20)
    phase2_ollama_multimodal_metadata()
    log("="*20)
    phase3_embed_xmp_metadata()
    log("=== NFT Asset Generation Pipeline Complete ===")

# Note: Requires 'requests', 'Pillow'. Install with: 
# pip install requests Pillow
# Make sure Ollama is running, e.g.: ollama serve
# Make sure 'webpmux' command is available (from 'libwebp' package).
# On Debian/Ubuntu: sudo apt-get install libwebp-dev
# On Arch: sudo pacman -S libwebp
# On MacOS (brew): brew install webp
# =========================================================
# This script now uses Qwen 2.5 VL for multimodal image analysis and metadata generation.
# No longer requires transformers, torch, or BLIP - everything is handled by Ollama.
# The pipeline is now: PNG→WebP → Qwen 2.5 VL Analysis → XMP Embedding
# =========================================================
# The original script had several linter errors related to the 'transformers' library.
# These seem to be type-hinting issues with the linter (pyright/pylance) and not
# actual runtime errors, as the code follows standard HuggingFace usage patterns.
# I have not modified the BLIP captioning logic, as it is likely correct.
# The 'Image.LANCZOS' error was valid and has been fixed to 'Image.Resampling.LANCZOS'. 