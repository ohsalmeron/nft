"""
Cosmicrafts Curated Data Pools
Pre-generated names, descriptions, and traits for consistent NFT metadata generation
"""

import random
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass

@dataclass
class NamePool:
    """Pool of names for different archetypes and factions"""
    used_names: set
    available_names: List[str]
    
    def get_random_name(self) -> str:
        """Get a random unused name, reset pool if empty"""
        if not self.available_names:
            # Reset pool when exhausted
            self.available_names = list(self.used_names)
            self.used_names.clear()
        
        name = random.choice(self.available_names)
        self.available_names.remove(name)
        self.used_names.add(name)
        return name

class CosmicraftsData:
    """Curated data pools for Cosmicrafts NFT generation"""
    
    def __init__(self):
        self.name_pools = self._init_name_pools()
        self.description_templates = self._init_description_templates()
        self.trait_pools = self._init_trait_pools()
    
    def _init_name_pools(self) -> Dict[str, NamePool]:
        """Initialize name pools for different archetypes"""
        
        # Animal-based names (hint at creature without being obvious)
        animal_names = [
            # Celestial animal-inspired
            "Gorgon Seer", "Serpent's Eye", "Phoenix Keeper", "Dragon Sage", "Griffin Walker",
            "Unicorn Guardian", "Basilisk Oracle", "Chimera Lord", "Sphinx Keeper", "Hydra Sage",
            
            # Cosmicon animal-inspired  
            "Boarhide", "Wolfheart", "Bearclaw", "Lionfang", "Eaglewing", "Hawkstrike",
            "Bullhorn", "Ramguard", "Stagrunner", "Foxshadow", "Crowcaller", "Ravenwing",
            
            # Spirat animal-inspired
            "Sharktooth", "Kraken Maw", "Whalefang", "Octopus Eye", "Squid Ink", "Crabclaw",
            "Lobster Tail", "Seahorse", "Dolphin Leap", "Turtle Shell", "Jellyfish", "Starfish",
            
            # Webe animal-inspired
            "Spider Web", "Ant Colony", "Bee Hive", "Wasp Sting", "Fly Trap", "Moth Wing",
            "Butterfly Net", "Dragonfly", "Cricket Song", "Grasshopper", "Locust Swarm", "Cicada",
            
            # Arch animal-inspired
            "Wormhole", "Leech Blood", "Tick Bite", "Flea Jump", "Mite Dust", "Louse Nest",
            "Maggot Rot", "Fly Larva", "Beetle Shell", "Centipede", "Millipede", "Scorpion Tail",
            
            # Spade animal-inspired
            "Bat Wing", "Rat King", "Mouse Trap", "Vole Hole", "Mole Hill", "Shrew Whisper",
            "Hedgehog", "Porcupine", "Skunk Spray", "Opossum", "Raccoon", "Squirrel"
        ]
        
        # Tech-based names
        tech_names = [
            # Celestial tech
            "Data Wraith", "Circuit Sage", "Node Walker", "Binary Oracle", "Code Keeper",
            "Algorithm Lord", "Protocol Master", "System Guardian", "Network Seer", "Matrix Sage",
            
            # Cosmicon tech
            "Steel Core", "Iron Will", "Metal Mind", "Titanium Soul", "Carbon Fiber", "Alloy Heart",
            "Plasma Core", "Quantum Drive", "Neural Net", "Cyber Brain", "Digital Soul", "Virtual Mind",
            
            # Spirat tech
            "Rust Bucket", "Junk Heap", "Scrap Metal", "Wreckage", "Salvage", "Debris",
            "Trash Heap", "Garbage", "Waste", "Refuse", "Dregs", "Remnants",
            
            # Webe tech
            "Processor", "Calculator", "Computer", "Mainframe", "Server", "Database",
            "Archive", "Memory Bank", "Storage Unit", "Data Core", "Information Hub", "Knowledge Base",
            
            # Arch tech
            "Bio Core", "Organic Circuit", "Living Metal", "Flesh Engine", "Bone Frame", "Blood Pump",
            "Muscle Wire", "Nerve Net", "Brain Stem", "Spinal Cord", "Heart Beat", "Lung Bellows",
            
            # Spade tech
            "Corrupted Code", "Virus", "Malware", "Trojan", "Worm", "Bug",
            "Glitch", "Error", "Crash", "Freeze", "Hang", "Loop"
        ]
        
        # Warrior-based names
        warrior_names = [
            # Celestial warriors
            "Blade Keeper", "Shield Bearer", "Storm Caller", "Void Guardian", "Star Warrior",
            "Cosmic Knight", "Galaxy Paladin", "Universe Defender", "Space Guardian", "Celestial Protector",
            
            # Cosmicon warriors
            "Iron Fist", "Steel Blade", "Metal Shield", "Titan Hammer", "Forge Master", "Anvil Lord",
            "Sword Smith", "Armor Maker", "Weapon Forger", "Battle Master", "War Chief", "Combat Leader",
            
            # Spirat warriors
            "Cutthroat", "Backstabber", "Throat Slitter", "Gut Ripper", "Bone Breaker", "Skull Crusher",
            "Blood Spiller", "Flesh Eater", "Soul Stealer", "Life Taker", "Death Dealer", "Murderer",
            
            # Webe warriors
            "Logic Warrior", "Algorithm Fighter", "Code Breaker", "System Hacker", "Data Destroyer", "Network Killer",
            "Protocol Breaker", "Firewall Crasher", "Security Bypass", "Access Denied", "Permission Error", "Unauthorized",
            
            # Arch warriors
            "Flesh Eater", "Bone Crusher", "Blood Drinker", "Soul Devourer", "Life Drainer", "Death Bringer",
            "Corruption", "Decay", "Rot", "Putrefaction", "Decomposition", "Disintegration",
            
            # Spade warriors
            "Sin Bearer", "Corruption Lord", "Evil Master", "Dark Lord", "Shadow King", "Void Prince",
            "Hell Spawn", "Demon Child", "Devil's Son", "Satan's Heir", "Lucifer's Kin", "Antichrist"
        ]
        
        # Mystical/Magical names
        mystical_names = [
            # Celestial mystical
            "Star Seer", "Cosmic Oracle", "Galaxy Prophet", "Universe Sage", "Space Mystic", "Celestial Seer",
            "Astral Walker", "Ethereal Being", "Spiritual Guide", "Divine Messenger", "Sacred Keeper", "Holy Guardian",
            
            # Cosmicon mystical
            "Order Keeper", "Law Giver", "Justice Bringer", "Balance Master", "Harmony Keeper", "Peace Maker",
            "Discipline Master", "Control Keeper", "Regulation Lord", "Standard Bearer", "Rule Maker", "Code Keeper",
            
            # Spirat mystical
            "Chaos Bringer", "Disorder Lord", "Anarchy Master", "Rebellion Leader", "Revolutionary", "Insurgent",
            "Outlaw", "Renegade", "Maverick", "Rebel", "Traitor", "Betrayer",
            
            # Webe mystical
            "Data Oracle", "Information Sage", "Knowledge Keeper", "Wisdom Bearer", "Truth Seeker", "Reality Checker",
            "Logic Master", "Reason Keeper", "Analysis Lord", "Calculation Master", "Computation Sage", "Processing Oracle",
            
            # Arch mystical
            "Corruption Sage", "Decay Oracle", "Rot Prophet", "Putrefaction Seer", "Decomposition Master", "Disintegration Lord",
            "Entropy Keeper", "Chaos Master", "Disorder Sage", "Anarchy Oracle", "Destruction Prophet", "Annihilation Seer",
            
            # Spade mystical
            "Evil Oracle", "Sin Prophet", "Corruption Seer", "Dark Sage", "Shadow Oracle", "Void Prophet",
            "Hell Seer", "Demon Oracle", "Devil Prophet", "Satan Sage", "Lucifer Seer", "Antichrist Oracle"
        ]
        
        # Create name pools
        pools = {}
        pools['animal'] = NamePool(set(), animal_names.copy())
        pools['tech'] = NamePool(set(), tech_names.copy())
        pools['warrior'] = NamePool(set(), warrior_names.copy())
        pools['mystical'] = NamePool(set(), mystical_names.copy())
        
        return pools
    
    def _init_description_templates(self) -> Dict[str, List[str]]:
        """Initialize description templates for different types"""
        
        return {
            'spaceship': [
                "A {color} {style} vessel with {feature}, built by the {faction} during the {era}.",
                "This {style} ship features {feature} and was constructed by {faction} {faction_purpose}.",
                "A {faction} {style} craft with {feature}, designed for {purpose} in the {era}.",
                "The {style} design includes {feature}, created by {faction} for {purpose}.",
                "Built by {faction} during the {era}, this {style} ship has {feature} for {purpose}."
            ],
            'character': [
                "A {faction} {archetype} with {feature}, forged during the {era} for {purpose}.",
                "This {archetype} warrior displays {feature} and serves the {faction} {faction_purpose}.",
                "A {faction} {archetype} bearing {feature}, created in the {era} to {purpose}.",
                "The {archetype} shows {feature}, representing the {faction} {faction_purpose}.",
                "Forged by {faction} during the {era}, this {archetype} has {feature} for {purpose}."
            ],
            'planet': [
                "A {atmosphere} world with {terrain}, controlled by the {faction} during the {era}.",
                "This {terrain} planet has {atmosphere} and serves as a {faction} {faction_purpose}.",
                "A {faction} world featuring {terrain} and {atmosphere}, established in the {era}.",
                "The {terrain} surface shows {atmosphere}, marking this as a {faction} {faction_purpose}.",
                "Controlled by {faction} during the {era}, this planet has {terrain} and {atmosphere}."
            ],
            'artifact': [
                "A {material} {type} with {feature}, created by the {faction} during the {era}.",
                "This {type} artifact displays {feature} and was forged by {faction} {faction_purpose}.",
                "A {faction} {type} bearing {feature}, crafted in the {era} to {purpose}.",
                "The {type} shows {feature}, representing the {faction} {faction_purpose}.",
                "Forged by {faction} during the {era}, this {type} has {feature} for {purpose}."
            ],
            'artwork': [
                "A {material} {type} with {feature}, created by the {faction} during the {era}.",
                "This {type} artwork displays {feature} and was forged by {faction} {faction_purpose}.",
                "A {faction} {type} bearing {feature}, crafted in the {era} to {purpose}.",
                "The {type} shows {feature}, representing the {faction} {faction_purpose}.",
                "Forged by {faction} during the {era}, this {type} has {feature} for {purpose}."
            ],
            'spritesheet': [
                "A {material} {type} with {feature}, created by the {faction} during the {era}.",
                "This {type} spritesheet displays {feature} and was forged by {faction} {faction_purpose}.",
                "A {faction} {type} bearing {feature}, crafted in the {era} to {purpose}.",
                "The {type} shows {feature}, representing the {faction} {faction_purpose}.",
                "Forged by {faction} during the {era}, this {type} has {feature} for {purpose}."
            ],
            'badge': [
                "A {material} {type} with {feature}, created by the {faction} during the {era}.",
                "This {type} badge displays {feature} and was forged by {faction} {faction_purpose}.",
                "A {faction} {type} bearing {feature}, crafted in the {era} to {purpose}.",
                "The {type} shows {feature}, representing the {faction} {faction_purpose}.",
                "Forged by {faction} during the {era}, this {type} has {feature} for {purpose}."
            ]
        }
    
    def _init_trait_pools(self) -> Dict[str, Dict[str, List[str]]]:
        """Initialize trait pools with options"""
        
        return {
            'factions': {
                'Celestials': 0.25,  # 25% chance
                'Cosmicons': 0.20,   # 20% chance  
                'Spirats': 0.20,     # 20% chance
                'Webes': 0.15,       # 15% chance
                'Archs': 0.10,       # 10% chance
                'Spades': 0.10       # 10% chance
            },
            'rarities': {
                'Common': 0.50,      # 50% chance
                'Rare': 0.30,        # 30% chance
                'Epic': 0.15,        # 15% chance
                'Legendary': 0.05    # 5% chance
            },
            'types': {
                'Spaceship': 0.30,
                'Character': 0.25,
                'Planet': 0.20,
                'Artwork': 0.15,
                'Spritesheet': 0.05,
                'Badge': 0.05
            }
        }
    
    def get_random_name(self, archetype: str) -> str:
        """Get a random name for the given archetype"""
        if archetype in self.name_pools:
            return self.name_pools[archetype].get_random_name()
        else:
            # Fallback to animal names
            return self.name_pools['animal'].get_random_name()
    
    def get_description_template(self, asset_type: str) -> str:
        """Get a random description template for the asset type"""
        if asset_type in self.description_templates:
            return random.choice(self.description_templates[asset_type])
        else:
            return "A mysterious {faction} artifact from the {era}."
    
    def get_random_trait(self, trait_type: str) -> str:
        """Get a random trait value based on weighted probabilities"""
        if trait_type in self.trait_pools:
            traits = self.trait_pools[trait_type]
            return random.choices(
                list(traits.keys()), 
                weights=list(traits.values())
            )[0]
        return "Unknown"
    
    def get_faction_purpose(self, faction: str) -> str:
        """Get faction-specific purpose/description"""
        purposes = {
            'Celestials': 'to maintain cosmic balance',
            'Cosmicons': 'for their military campaigns', 
            'Spirats': 'for their raiding missions',
            'Webes': 'for their computational needs',
            'Archs': 'for their consumption goals',
            'Spades': 'for their corruption schemes'
        }
        return purposes.get(faction, 'for unknown purposes')
    
    def get_era(self) -> str:
        """Get current era name"""
        return "Violet Eon"
    
    def get_visual_descriptors(self) -> Dict[str, List[str]]:
        """Get visual descriptor options for templates"""
        return {
            'colors': ['blue', 'red', 'green', 'purple', 'gold', 'silver', 'black', 'white', 'orange', 'yellow'],
            'styles': ['angular', 'curved', 'blocky', 'streamlined', 'bulky', 'elegant', 'brutal', 'refined'],
            'features': ['glowing lines', 'sharp edges', 'smooth curves', 'jagged spikes', 'rounded corners', 'geometric patterns'],
            'materials': ['crystalline', 'metallic', 'organic', 'stone', 'wood', 'bone', 'flesh', 'energy'],
            'atmospheres': ['toxic', 'breathable', 'corrosive', 'thin', 'dense', 'stormy', 'calm', 'turbulent'],
            'terrains': ['rocky', 'sandy', 'icy', 'volcanic', 'forest', 'desert', 'ocean', 'mountain'],
            'archetypes': ['warrior', 'mage', 'hunter', 'guardian', 'scout', 'engineer', 'pilot', 'commander'],
            'purposes': ['exploration', 'combat', 'defense', 'transport', 'mining', 'research', 'diplomacy', 'warfare']
        }

# Global instance
cosmicrafts_data = CosmicraftsData()
