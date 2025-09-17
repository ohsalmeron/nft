#!/usr/bin/env python3
"""
Cosmicrafts Metadata Validator
Prevents duplicates and similarities in metadata generation
"""

import re
from collections import defaultdict
from typing import Dict, List, Any, Tuple, Set

class MetadataValidator:
    def __init__(self):
        self.used_names: Set[str] = set()
        self.used_descriptions: Set[str] = set()
        self.name_patterns: Dict[str, int] = defaultdict(int)
        self.description_phrases: Dict[str, int] = defaultdict(int)
        
    def validate_name(self, name: str, max_similarity_score: float = 0.7) -> Tuple[bool, float, str]:
        """
        Validate a name for uniqueness and similarity
        Returns: (is_valid, similarity_score, reason)
        """
        name_lower = name.lower().strip()
        
        # Check exact duplicate
        if name_lower in self.used_names:
            return False, 1.0, "Exact duplicate name"
        
        # Check similarity patterns
        similarity_score = self._calculate_name_similarity(name_lower)
        
        if similarity_score > max_similarity_score:
            return False, similarity_score, f"Too similar to existing names (score: {similarity_score:.2f})"
        
        # Check for repetitive patterns
        if self._has_repetitive_pattern(name_lower):
            return False, 0.8, "Repetitive naming pattern"
        
        return True, similarity_score, "Valid"
    
    def validate_description(self, description: str, max_similarity_score: float = 0.6) -> Tuple[bool, float, str]:
        """
        Validate a description for uniqueness and similarity
        Returns: (is_valid, similarity_score, reason)
        """
        desc_lower = description.lower().strip()
        
        # Check exact duplicate
        if desc_lower in self.used_descriptions:
            return False, 1.0, "Exact duplicate description"
        
        # Check similarity patterns
        similarity_score = self._calculate_description_similarity(desc_lower)
        
        if similarity_score > max_similarity_score:
            return False, similarity_score, f"Too similar to existing descriptions (score: {similarity_score:.2f})"
        
        # Check for repetitive phrases
        if self._has_repetitive_phrases(desc_lower):
            return False, 0.7, "Repetitive phrases detected"
        
        return True, similarity_score, "Valid"
    
    def _calculate_name_similarity(self, name: str) -> float:
        """Calculate similarity score for a name against existing names"""
        if not self.used_names:
            return 0.0
        
        # Extract words and patterns
        words = set(re.findall(r'\b\w+\b', name))
        if not words:
            return 0.0
        
        # Check word overlap with existing names
        max_overlap = 0
        for existing_name in self.used_names:
            existing_words = set(re.findall(r'\b\w+\b', existing_name))
            if existing_words:
                overlap = len(words.intersection(existing_words)) / len(words.union(existing_words))
                max_overlap = max(max_overlap, overlap)
        
        # Check pattern similarity
        pattern_similarity = self._check_name_pattern_similarity(name)
        
        return max(max_overlap, pattern_similarity)
    
    def _calculate_description_similarity(self, description: str) -> float:
        """Calculate similarity score for a description against existing descriptions"""
        if not self.used_descriptions:
            return 0.0
        
        # Extract phrases (2-4 word combinations)
        words = re.findall(r'\b\w+\b', description)
        phrases = []
        for i in range(len(words) - 1):
            for j in range(i + 2, min(i + 5, len(words) + 1)):
                phrase = ' '.join(words[i:j])
                if len(phrase) > 5:
                    phrases.append(phrase)
        
        if not phrases:
            return 0.0
        
        # Check phrase overlap
        max_overlap = 0
        for existing_desc in self.used_descriptions:
            existing_words = re.findall(r'\b\w+\b', existing_desc)
            existing_phrases = []
            for i in range(len(existing_words) - 1):
                for j in range(i + 2, min(i + 5, len(existing_words) + 1)):
                    phrase = ' '.join(existing_words[i:j])
                    if len(phrase) > 5:
                        existing_phrases.append(phrase)
            
            if existing_phrases:
                phrase_set = set(phrases)
                existing_phrase_set = set(existing_phrases)
                overlap = len(phrase_set.intersection(existing_phrase_set)) / len(phrase_set.union(existing_phrase_set))
                max_overlap = max(max_overlap, overlap)
        
        return max_overlap
    
    def _check_name_pattern_similarity(self, name: str) -> float:
        """Check if name follows similar patterns to existing names"""
        # Extract first word pattern
        first_word = name.split()[0] if ' ' in name else name
        
        # Count how many existing names start with the same word
        pattern_count = sum(1 for existing in self.used_names if existing.startswith(first_word))
        
        if len(self.used_names) > 0:
            return pattern_count / len(self.used_names)
        
        return 0.0
    
    def _has_repetitive_pattern(self, name: str) -> bool:
        """Check if name follows a repetitive pattern"""
        # Check for common repetitive patterns
        repetitive_patterns = [
            r'^the\s+\w+\s+\w+$',  # "The [Word] [Word]"
            r'^\w+\s+\w+\s+ship$',  # "[Word] [Word] Ship"
            r'^\w+\s+\w+\s+planet$',  # "[Word] [Word] Planet"
            r'^\w+\s+\w+\s+artifact$',  # "[Word] [Word] Artifact"
        ]
        
        for pattern in repetitive_patterns:
            if re.match(pattern, name):
                # Count how many existing names follow this pattern
                pattern_count = sum(1 for existing in self.used_names if re.match(pattern, existing))
                if pattern_count >= 3:  # Allow max 3 items with same pattern
                    return True
        
        return False
    
    def _has_repetitive_phrases(self, description: str) -> bool:
        """Check if description contains repetitive phrases"""
        # Extract common phrases and check frequency
        words = re.findall(r'\b\w+\b', description)
        phrases = []
        
        for i in range(len(words) - 1):
            for j in range(i + 2, min(i + 4, len(words) + 1)):
                phrase = ' '.join(words[i:j])
                if len(phrase) > 5:
                    phrases.append(phrase)
        
        # Check if any phrase is overused
        for phrase in phrases:
            if self.description_phrases[phrase] >= 5:  # Max 5 uses of same phrase
                return True
        
        return False
    
    def add_validated_item(self, name: str, description: str):
        """Add a validated item to the tracking sets"""
        name_lower = name.lower().strip()
        desc_lower = description.lower().strip()
        
        self.used_names.add(name_lower)
        self.used_descriptions.add(desc_lower)
        
        # Track patterns for future validation
        self._track_name_patterns(name_lower)
        self._track_description_phrases(desc_lower)
    
    def _track_name_patterns(self, name: str):
        """Track naming patterns for similarity detection"""
        if ' ' in name:
            first_word = name.split()[0]
            self.name_patterns[first_word] += 1
    
    def _track_description_phrases(self, description: str):
        """Track description phrases for similarity detection"""
        words = re.findall(r'\b\w+\b', description)
        
        for i in range(len(words) - 1):
            for j in range(i + 2, min(i + 4, len(words) + 1)):
                phrase = ' '.join(words[i:j])
                if len(phrase) > 5:
                    self.description_phrases[phrase] += 1
    
    def get_validation_stats(self) -> Dict[str, Any]:
        """Get validation statistics"""
        return {
            'total_names': len(self.used_names),
            'total_descriptions': len(self.used_descriptions),
            'name_patterns': dict(self.name_patterns),
            'description_phrases': {k: v for k, v in self.description_phrases.items() if v > 1}
        }
