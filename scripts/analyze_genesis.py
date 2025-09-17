#!/usr/bin/env python3

import os
import json
import random
from pathlib import Path

# Cosmicrafts Genesis Lore Elements
COSMICRAFTS_LORE = {
    "character_types": ["Warrior", "Mage", "Archer", "Guardian", "Scout", "Healer", "Summoner", "Assassin"],
    "cosmic_elements": ["Void", "Light", "Shadow", "Time", "Space", "Energy", "Matter", "Spirit"],
    "armor_types": ["Ethereal Armor", "Cosmic Plate", "Void Mail", "Light Robes", "Shadow Leather", "Time Cloth", "Space Mesh", "Energy Crystal"],
    "weapons": ["Void Staff", "Light Sword", "Shadow Bow", "Time Dagger", "Space Hammer", "Energy Spear", "Matter Axe", "Spirit Wand"],
    "special_abilities": ["Shadow Magic", "Light Burst", "Time Warp", "Space Jump", "Energy Blast", "Matter Shift", "Spirit Summon", "Void Portal"],
    "cosmic_auras": ["Void-Touched", "Light-Born", "Shadow-Walker", "Time-Weaver", "Space-Bender", "Energy-Channeler", "Matter-Shifter", "Spirit-Guide"],
    "accessories": ["Cosmic Crown", "Void Cloak", "Light Wings", "Shadow Mask", "Time Hourglass", "Space Orb", "Energy Crystal", "Spirit Ring"]
}

def generate_genesis_name(mint_number):
    """Generate a unique name for Genesis hero based on mint number"""
    prefixes = ["Void", "Light", "Shadow", "Time", "Space", "Energy", "Matter", "Spirit", "Cosmic", "Ethereal"]
    suffixes = ["Walker", "Guardian", "Mage", "Warrior", "Scout", "Healer", "Summoner", "Assassin", "Knight", "Sage"]
    
    # Use mint number to ensure consistency
    prefix = prefixes[mint_number % len(prefixes)]
    suffix = suffixes[(mint_number + 3) % len(suffixes)]
    
    return f"{prefix} {suffix}"

def generate_description(mint_number, character_type, cosmic_element):
    """Generate description with Cosmicrafts lore"""
    descriptions = [
        f"A legendary {character_type} wielding the power of {cosmic_element}. One of the original Genesis heroes who emerged from the cosmic void.",
        f"An ancient {character_type} with mastery over {cosmic_element} energy. Among the first to emerge from the void.",
        f"A powerful {character_type} whose connection to {cosmic_element} shapes reality itself. Carrying fragments of creation.",
        f"A mysterious {character_type} whose {cosmic_element} abilities transcend mortal understanding. Destined to shape the universe."
    ]
    
    return descriptions[mint_number % len(descriptions)]

def generate_attributes(mint_number):
    """Generate attributes based on mint number for consistency"""
    # Use mint number as seed for consistent generation
    random.seed(mint_number)
    
    character_type = random.choice(COSMICRAFTS_LORE["character_types"])
    cosmic_element = random.choice(COSMICRAFTS_LORE["cosmic_elements"])
    armor_type = random.choice(COSMICRAFTS_LORE["armor_types"])
    weapon = random.choice(COSMICRAFTS_LORE["weapons"])
    special_ability = random.choice(COSMICRAFTS_LORE["special_abilities"])
    cosmic_aura = random.choice(COSMICRAFTS_LORE["cosmic_auras"])
    accessory = random.choice(COSMICRAFTS_LORE["accessories"])
    
    # Add lore-based attributes based on mint number
    if mint_number <= 10:
        rarity = "Mythic"
        generation = "Alpha"
    elif mint_number <= 25:
        rarity = "Legendary"
        generation = "Beta"
    elif mint_number <= 50:
        rarity = "Epic"
        generation = "Gamma"
    else:
        rarity = "Rare"
        generation = "Delta"
    
    return [
        {"trait_type": "Collection", "value": "Genesis"},
        {"trait_type": "Mint Number", "value": mint_number, "display_type": "number"},
        {"trait_type": "Generation", "value": generation},
        {"trait_type": "Rarity", "value": rarity},
        {"trait_type": "Character Type", "value": character_type},
        {"trait_type": "Cosmic Element", "value": cosmic_element},
        {"trait_type": "Armor Type", "value": armor_type},
        {"trait_type": "Weapon", "value": weapon},
        {"trait_type": "Special Ability", "value": special_ability},
        {"trait_type": "Cosmic Aura", "value": cosmic_aura},
        {"trait_type": "Accessory", "value": accessory}
    ]

def create_metadata_for_image(jpg_path, mint_number, canister_id="your-canister-id"):
    """Create metadata for a specific Genesis image"""
    jpg_filename = jpg_path.name
    webp_filename = f"genesis_{mint_number:03d}.webp"
    
    name = generate_genesis_name(mint_number)
    attributes = generate_attributes(mint_number)
    
    # Extract character type and cosmic element from attributes
    character_type = next(attr["value"] for attr in attributes if attr["trait_type"] == "Character Type")
    cosmic_element = next(attr["value"] for attr in attributes if attr["trait_type"] == "Cosmic Element")
    
    description = generate_description(mint_number, character_type, cosmic_element)
    
    metadata = {
        "name": name,
        "description": description,
        "image": f"https://{canister_id}.raw.icp0.io/images/{webp_filename}",
        "external_url": "https://cosmicrafts.com",
        "attributes": attributes
    }
    
    return metadata

def analyze_genesis_images():
    """Analyze all Genesis images and create metadata"""
    genesis_dir = Path("Genesis")
    metadata_dir = Path("metadata")
    
    # Ensure metadata directory exists
    metadata_dir.mkdir(exist_ok=True)
    
    # Get all JPG files and sort by numerical order
    jpg_files = list(genesis_dir.glob("*.jpg"))
    
    def extract_number(filename):
        import re
        match = re.search(r'(\d+)', filename.stem)
        return int(match.group(1)) if match else 0
    
    jpg_files.sort(key=extract_number)
    
    print(f"Found {len(jpg_files)} Genesis images")
    
    # Create metadata for first 5 images as example
    for i, jpg_path in enumerate(jpg_files[:5]):
        mint_number = extract_number(jpg_path)
        print(f"Creating metadata for {jpg_path.name} (Mint #{mint_number})")
        
        metadata = create_metadata_for_image(jpg_path, mint_number)
        
        # Save metadata
        metadata_file = metadata_dir / f"genesis_{mint_number:03d}.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"  Name: {metadata['name']}")
        print(f"  Character: {next(attr['value'] for attr in metadata['attributes'] if attr['trait_type'] == 'Character Type')}")
        print(f"  Element: {next(attr['value'] for attr in metadata['attributes'] if attr['trait_type'] == 'Cosmic Element')}")
        print(f"  Saved to: {metadata_file}")
        print()

if __name__ == "__main__":
    analyze_genesis_images()
