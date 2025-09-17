"""
Smart Metadata Generator
Uses curated data pools and visual analysis to generate consistent NFT metadata
"""

import json
import random
from typing import Dict, List, Any, Tuple
from pathlib import Path
from cosmicrafts_data import cosmicrafts_data

class SmartMetadataGenerator:
    """Generates metadata using curated data pools and visual analysis"""
    
    def __init__(self):
        self.data = cosmicrafts_data
        self.used_combinations = set()  # Track used name+description combinations
    
    def analyze_visual_archetype(self, image_path: str) -> str:
        """
        Analyze image to determine archetype
        This would integrate with the LLM's visual analysis
        For now, returns a random archetype for testing
        """
        # TODO: Integrate with actual LLM visual analysis
        archetypes = ['animal', 'tech', 'warrior', 'mystical']
        return random.choice(archetypes)
    
    def generate_metadata(self, image_path: str, file_number: str) -> Dict[str, Any]:
        """Generate complete metadata using curated data"""
        
        # 1. Analyze visual archetype (placeholder for now)
        archetype = self.analyze_visual_archetype(image_path)
        
        # 2. Get random traits
        faction = self.data.get_random_trait('factions')
        rarity = self.data.get_random_trait('rarities')
        asset_type = self.data.get_random_trait('types')
        
        # 3. Get curated name
        name = self.data.get_random_name(archetype)
        
        # 4. Generate description using template
        description = self._generate_description(asset_type, faction, archetype)
        
        # 5. Create attributes
        attributes = [
            {"trait_type": "Type", "value": asset_type},
            {"trait_type": "Faction", "value": faction},
            {"trait_type": "Rarity", "value": rarity}
        ]
        
        # 6. Create final metadata
        metadata = {
            "name": name,
            "description": description,
            "image": f"https://wanvb-2aaaa-aaaaj-qnp4a-cai.raw.icp0.io/images/{file_number}.webp",
            "attributes": attributes
        }
        
        # 7. Track this combination to avoid duplicates
        combination_key = f"{name}|{description[:50]}"
        self.used_combinations.add(combination_key)
        
        return metadata
    
    def _generate_description(self, asset_type: str, faction: str, archetype: str) -> str:
        """Generate description using templates and curated data"""
        
        # Get template (convert to lowercase for template lookup)
        template = self.data.get_description_template(asset_type.lower())
        
        # Get visual descriptors
        descriptors = self.data.get_visual_descriptors()
        
        # Fill template with random but appropriate values
        try:
            description = template.format(
                color=random.choice(descriptors['colors']),
                style=random.choice(descriptors['styles']),
                feature=random.choice(descriptors['features']),
                faction=faction,
                era=self.data.get_era(),
                faction_purpose=self.data.get_faction_purpose(faction),
                purpose=random.choice(descriptors['purposes']),
                archetype=random.choice(descriptors['archetypes']),
                atmosphere=random.choice(descriptors['atmospheres']),
                terrain=random.choice(descriptors['terrains']),
                material=random.choice(descriptors['materials']),
                type=asset_type.lower()
            )
        except KeyError as e:
            # Fallback if template has missing keys
            description = f"A {random.choice(descriptors['colors'])} {asset_type.lower()} with {random.choice(descriptors['features'])}, created by the {faction} during the {self.data.get_era()}."
        
        return description
    
    def get_validation_stats(self) -> Dict[str, int]:
        """Get statistics about generated metadata"""
        return {
            'total_combinations': len(self.used_combinations),
            'available_names': sum(len(pool.available_names) for pool in self.data.name_pools.values()),
            'used_names': sum(len(pool.used_names) for pool in self.data.name_pools.values())
        }

def test_smart_generator():
    """Test the smart metadata generator"""
    generator = SmartMetadataGenerator()
    
    print("=== Testing Smart Metadata Generator ===")
    
    # Generate 10 test metadata entries
    for i in range(1, 11):
        file_number = f"{i:03d}"
        metadata = generator.generate_metadata(f"test_{file_number}.webp", file_number)
        
        print(f"\n--- Test #{i} ---")
        print(f"Name: {metadata['name']}")
        print(f"Description: {metadata['description']}")
        print(f"Faction: {metadata['attributes'][1]['value']}")
        print(f"Rarity: {metadata['attributes'][2]['value']}")
    
    # Show stats
    stats = generator.get_validation_stats()
    print(f"\n=== Statistics ===")
    print(f"Total combinations used: {stats['total_combinations']}")
    print(f"Available names: {stats['available_names']}")
    print(f"Used names: {stats['used_names']}")

if __name__ == "__main__":
    test_smart_generator()
