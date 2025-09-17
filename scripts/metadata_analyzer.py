#!/usr/bin/env python3
"""
Cosmicrafts Metadata Analyzer
Analyzes metadata files to identify repetitive patterns, overused words, and naming issues
"""

import os
import json
import re
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Any, Tuple

def log(message: str):
    """Log messages with timestamp"""
    print(f"[{message}]")

def load_metadata_files(metadata_dir: Path) -> List[Dict[str, Any]]:
    """Load all metadata files from the directory"""
    metadata_files = []
    
    for json_file in sorted(metadata_dir.glob("*.json")):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
                metadata['file_name'] = json_file.stem
                metadata_files.append(metadata)
        except Exception as e:
            log(f"[ERROR] Failed to load {json_file.name}: {e}")
    
    return metadata_files

def analyze_names(metadata_files: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze naming patterns and identify repetitive names"""
    log("=== Analyzing Names ===")
    
    all_names = [item['name'] for item in metadata_files if 'name' in item]
    name_counter = Counter(all_names)
    
    # Find duplicate names
    duplicates = {name: count for name, count in name_counter.items() if count > 1}
    
    # Analyze name patterns
    name_patterns = defaultdict(int)
    for name in all_names:
        # Extract common patterns
        if ' ' in name:
            parts = name.split(' ')
            if len(parts) >= 2:
                pattern = f"{parts[0]} *"  # First word + anything
                name_patterns[pattern] += 1
        
        # Check for common prefixes/suffixes
        if name.startswith('The '):
            name_patterns['The *'] += 1
        if name.endswith(' Ship'):
            name_patterns['* Ship'] += 1
        if name.endswith(' Planet'):
            name_patterns['* Planet'] += 1
        if name.endswith(' Artifact'):
            name_patterns['* Artifact'] += 1
    
    # Find most common words in names
    all_words = []
    for name in all_names:
        words = re.findall(r'\b\w+\b', name.lower())
        all_words.extend(words)
    
    word_counter = Counter(all_words)
    common_words = word_counter.most_common(20)
    
    return {
        'total_names': len(all_names),
        'unique_names': len(set(all_names)),
        'duplicates': duplicates,
        'name_patterns': dict(name_patterns),
        'common_words': common_words
    }

def analyze_descriptions(metadata_files: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze description patterns and identify repetitive phrases"""
    log("=== Analyzing Descriptions ===")
    
    all_descriptions = [item['description'] for item in metadata_files if 'description' in item]
    
    # Find duplicate descriptions
    desc_counter = Counter(all_descriptions)
    duplicates = {desc: count for desc, count in desc_counter.items() if count > 1}
    
    # Analyze common phrases
    all_words = []
    common_phrases = defaultdict(int)
    
    for desc in all_descriptions:
        # Extract words
        words = re.findall(r'\b\w+\b', desc.lower())
        all_words.extend(words)
        
        # Find common phrases (2-4 word combinations)
        desc_lower = desc.lower()
        for i in range(len(words) - 1):
            for j in range(i + 2, min(i + 5, len(words) + 1)):
                phrase = ' '.join(words[i:j])
                if len(phrase) > 5:  # Only meaningful phrases
                    common_phrases[phrase] += 1
    
    word_counter = Counter(all_words)
    common_words = word_counter.most_common(30)
    common_phrases = {k: v for k, v in common_phrases.items() if v > 2}  # Only phrases used more than twice
    
    return {
        'total_descriptions': len(all_descriptions),
        'unique_descriptions': len(set(all_descriptions)),
        'duplicates': duplicates,
        'common_words': common_words,
        'common_phrases': dict(sorted(common_phrases.items(), key=lambda x: x[1], reverse=True)[:20])
    }

def analyze_attributes(metadata_files: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze attribute patterns and identify repetitive traits"""
    log("=== Analyzing Attributes ===")
    
    all_attributes = []
    faction_counter = Counter()
    type_counter = Counter()
    rarity_counter = Counter()
    
    for item in metadata_files:
        if 'attributes' in item:
            for attr in item['attributes']:
                all_attributes.append(attr)
                
                trait_type = attr.get('trait_type', '')
                value = attr.get('value', '')
                
                if trait_type == 'Faction':
                    faction_counter[value] += 1
                elif trait_type == 'Type':
                    type_counter[value] += 1
                elif trait_type == 'Rarity':
                    rarity_counter[value] += 1
    
    # Find duplicate attribute combinations
    attr_combinations = []
    for item in metadata_files:
        if 'attributes' in item:
            combo = tuple(sorted([(attr.get('trait_type'), attr.get('value')) for attr in item['attributes']]))
            attr_combinations.append(combo)
    
    combo_counter = Counter(attr_combinations)
    duplicate_combos = {combo: count for combo, count in combo_counter.items() if count > 1}
    
    return {
        'total_attributes': len(all_attributes),
        'faction_distribution': dict(faction_counter),
        'type_distribution': dict(type_counter),
        'rarity_distribution': dict(rarity_counter),
        'duplicate_combinations': duplicate_combos
    }

def analyze_faction_naming_compliance(metadata_files: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze how well names follow faction-specific naming conventions"""
    log("=== Analyzing Faction Naming Compliance ===")
    
    # Define faction naming patterns
    faction_patterns = {
        'Celestials': {
            'keywords': ['anu', 'enlil', 'shamash', 'kur', 'nammu', 'ziggurat', 'temple', 'throne', 'celestial', 'spiral'],
            'style': 'ancient_gods'
        },
        'Cosmicons': {
            'keywords': ['praetor', 'legion', 'imperium', 'codex', 'sentinel', 'aegis', 'nova', 'pax', 'ordo'],
            'style': 'roman_militaristic'
        },
        'Spirats': {
            'keywords': ['skarr', 'void', 'corsair', 'raider', 'fang', 'skull', 'rust', 'black', 'crimson'],
            'style': 'pirate_rebellious'
        },
        'Webes': {
            'keywords': ['core', 'node', 'protocol', 'algorithm', 'directive', 'subroutine', 'nexus', 'archive'],
            'style': 'machine_alphanumeric'
        },
        'Archs': {
            'keywords': ['ulthorg', 'chrysalith', 'vorcath', 'hive', 'maw', 'ichor', 'spawn', 'devourer'],
            'style': 'lovecraftian_horror'
        },
        'Spades': {
            'keywords': ['malphas', 'nihrex', 'oblivara', 'sepulchral', 'abyss', 'harrower', 'corruptor', 'void'],
            'style': 'demonic_corrupted'
        }
    }
    
    compliance_results = defaultdict(lambda: {'correct': 0, 'incorrect': 0, 'examples': []})
    
    for item in metadata_files:
        name = item.get('name', '').lower()
        faction = None
        
        # Find faction from attributes
        if 'attributes' in item:
            for attr in item['attributes']:
                if attr.get('trait_type') == 'Faction':
                    faction = attr.get('value')
                    break
        
        if faction and faction in faction_patterns:
            pattern = faction_patterns[faction]
            has_keyword = any(keyword in name for keyword in pattern['keywords'])
            
            if has_keyword:
                compliance_results[faction]['correct'] += 1
            else:
                compliance_results[faction]['incorrect'] += 1
                compliance_results[faction]['examples'].append(item.get('name', ''))
    
    return dict(compliance_results)

def generate_report(analysis_results: Dict[str, Any]) -> str:
    """Generate a comprehensive analysis report"""
    report = []
    report.append("=" * 60)
    report.append("COSMICRAFTS METADATA ANALYSIS REPORT")
    report.append("=" * 60)
    report.append("")
    
    # Names Analysis
    names_analysis = analysis_results['names']
    report.append("📛 NAMES ANALYSIS")
    report.append("-" * 30)
    report.append(f"Total names: {names_analysis['total_names']}")
    report.append(f"Unique names: {names_analysis['unique_names']}")
    report.append(f"Duplication rate: {((names_analysis['total_names'] - names_analysis['unique_names']) / names_analysis['total_names'] * 100):.1f}%")
    
    if names_analysis['duplicates']:
        report.append("\n🔴 DUPLICATE NAMES:")
        for name, count in sorted(names_analysis['duplicates'].items(), key=lambda x: x[1], reverse=True):
            report.append(f"  '{name}' appears {count} times")
    
    report.append("\n📊 COMMON WORDS IN NAMES:")
    for word, count in names_analysis['common_words'][:10]:
        report.append(f"  '{word}': {count} times")
    
    report.append("\n🔄 NAME PATTERNS:")
    for pattern, count in sorted(names_analysis['name_patterns'].items(), key=lambda x: x[1], reverse=True)[:10]:
        report.append(f"  '{pattern}': {count} times")
    
    # Descriptions Analysis
    desc_analysis = analysis_results['descriptions']
    report.append("\n\n📝 DESCRIPTIONS ANALYSIS")
    report.append("-" * 30)
    report.append(f"Total descriptions: {desc_analysis['total_descriptions']}")
    report.append(f"Unique descriptions: {desc_analysis['unique_descriptions']}")
    report.append(f"Duplication rate: {((desc_analysis['total_descriptions'] - desc_analysis['unique_descriptions']) / desc_analysis['total_descriptions'] * 100):.1f}%")
    
    if desc_analysis['duplicates']:
        report.append("\n🔴 DUPLICATE DESCRIPTIONS:")
        for desc, count in sorted(desc_analysis['duplicates'].items(), key=lambda x: x[1], reverse=True)[:5]:
            report.append(f"  '{desc[:50]}...' appears {count} times")
    
    report.append("\n📊 COMMON WORDS IN DESCRIPTIONS:")
    for word, count in desc_analysis['common_words'][:15]:
        report.append(f"  '{word}': {count} times")
    
    report.append("\n🔄 COMMON PHRASES:")
    common_phrases_list = list(desc_analysis['common_phrases'].items())
    for phrase, count in common_phrases_list[:10]:
        report.append(f"  '{phrase}': {count} times")
    
    # Attributes Analysis
    attr_analysis = analysis_results['attributes']
    report.append("\n\n🏷️ ATTRIBUTES ANALYSIS")
    report.append("-" * 30)
    report.append(f"Total attributes: {attr_analysis['total_attributes']}")
    
    report.append("\n📊 FACTION DISTRIBUTION:")
    for faction, count in attr_analysis['faction_distribution'].items():
        report.append(f"  {faction}: {count}")
    
    report.append("\n📊 TYPE DISTRIBUTION:")
    for type_name, count in attr_analysis['type_distribution'].items():
        report.append(f"  {type_name}: {count}")
    
    report.append("\n📊 RARITY DISTRIBUTION:")
    for rarity, count in attr_analysis['rarity_distribution'].items():
        report.append(f"  {rarity}: {count}")
    
    # Faction Compliance Analysis
    compliance_analysis = analysis_results['faction_compliance']
    report.append("\n\n🎯 FACTION NAMING COMPLIANCE")
    report.append("-" * 30)
    
    for faction, data in compliance_analysis.items():
        total = data['correct'] + data['incorrect']
        if total > 0:
            compliance_rate = (data['correct'] / total) * 100
            report.append(f"\n{faction}: {compliance_rate:.1f}% compliant ({data['correct']}/{total})")
            
            if data['examples']:
                report.append(f"  Examples of non-compliant names:")
                for example in data['examples'][:3]:
                    report.append(f"    - {example}")
    
    # Recommendations
    report.append("\n\n💡 RECOMMENDATIONS")
    report.append("-" * 30)
    
    if names_analysis['duplicates']:
        report.append("🔴 Fix duplicate names - ensure each NFT has a unique name")
    
    if desc_analysis['duplicates']:
        report.append("🔴 Fix duplicate descriptions - make each description unique")
    
    if names_analysis['common_words'][0][1] > 10:
        report.append("⚠️ Reduce overuse of common words in names")
    
    if desc_analysis['common_words'][0][1] > 20:
        report.append("⚠️ Reduce overuse of common words in descriptions")
    
    report.append("✅ Improve faction naming compliance for better immersion")
    report.append("✅ Add more variety to descriptions and avoid repetitive phrases")
    
    return "\n".join(report)

def main():
    """Main analysis function"""
    log("=== Cosmicrafts Metadata Analyzer Started ===")
    
    metadata_dir = Path("metadata")
    if not metadata_dir.exists():
        log("[ERROR] Metadata directory not found")
        return
    
    # Load all metadata files
    log("Loading metadata files...")
    metadata_files = load_metadata_files(metadata_dir)
    log(f"Loaded {len(metadata_files)} metadata files")
    
    if not metadata_files:
        log("[ERROR] No metadata files found")
        return
    
    # Perform analysis
    analysis_results = {
        'names': analyze_names(metadata_files),
        'descriptions': analyze_descriptions(metadata_files),
        'attributes': analyze_attributes(metadata_files),
        'faction_compliance': analyze_faction_naming_compliance(metadata_files)
    }
    
    # Generate and save report
    report = generate_report(analysis_results)
    
    # Save report to file
    report_file = Path("metadata_analysis_report.txt")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    # Print report to console
    print(report)
    
    log(f"Analysis complete! Report saved to {report_file}")
    log("=== Cosmicrafts Metadata Analyzer Complete ===")

if __name__ == "__main__":
    main()
