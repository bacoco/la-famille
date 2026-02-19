#!/usr/bin/env python3
"""Convert a SOUL.md file to identity.aieos.json format.

Usage: convert-soul-to-aieos.py <path/to/SOUL.md>

Outputs identity.aieos.json next to the SOUL.md file (or to stdout with --stdout).
"""

import json
import re
import sys
from pathlib import Path


def extract_sections(text: str) -> dict[str, str]:
    """Extract markdown sections (## heading -> content) from text."""
    sections = {}
    current_heading = None
    current_lines: list[str] = []

    for line in text.splitlines():
        heading_match = re.match(r'^#{1,3}\s+(.+)', line)
        if heading_match:
            if current_heading is not None:
                sections[current_heading] = '\n'.join(current_lines).strip()
            current_heading = heading_match.group(1).strip()
            current_lines = []
        else:
            current_lines.append(line)

    if current_heading is not None:
        sections[current_heading] = '\n'.join(current_lines).strip()

    return sections


def extract_list_items(text: str) -> list[str]:
    """Extract bullet/numbered list items from text."""
    items = []
    for line in text.splitlines():
        match = re.match(r'^\s*[-*+]\s+(.+)', line)
        if match:
            items.append(match.group(1).strip())
        else:
            match = re.match(r'^\s*\d+[.)]\s+(.+)', line)
            if match:
                items.append(match.group(1).strip())
    return items


def find_section(sections: dict[str, str], *patterns: str) -> str:
    """Find a section matching any of the given patterns (case-insensitive)."""
    for pattern in patterns:
        for heading, content in sections.items():
            if re.search(pattern, heading, re.IGNORECASE):
                return content
    return ''


def detect_language(text: str) -> str:
    """Simple heuristic to detect French vs English."""
    fr_markers = ['est', 'les', 'des', 'une', 'dans', 'avec', 'pour', 'sur', 'qui', 'pas']
    words = re.findall(r'\b\w+\b', text.lower())
    fr_count = sum(1 for w in words if w in fr_markers)
    return 'fr' if fr_count > 5 else 'en'


def detect_formality(text: str) -> str:
    """Detect formality level from personality/vibe text."""
    informal_markers = ['casual', 'décontracté', 'informel', 'friendly', 'cool', 'chill']
    formal_markers = ['formal', 'formel', 'professionnel', 'rigoureux', 'académique']
    text_lower = text.lower()
    informal = sum(1 for m in informal_markers if m in text_lower)
    formal = sum(1 for m in formal_markers if m in text_lower)
    if formal > informal:
        return 'formal'
    elif informal > formal:
        return 'casual'
    return 'moderate'


def convert_soul_to_aieos(soul_path: Path) -> dict:
    """Convert a SOUL.md file to AIEOS identity structure."""
    text = soul_path.read_text(encoding='utf-8')
    sections = extract_sections(text)

    agent_id = soul_path.parent.name

    # Extract each mapped section
    core_truths_text = find_section(sections, r'core\s*truths?', r'vérités?\s*fondamentales?', r'principes?\s*fondament')
    role_text = find_section(sections, r'rôle', r'role', r'mission', r'responsabilit')
    vibe_text = find_section(sections, r'vibe', r'personnalit', r'personality', r'ton', r'style')
    limits_text = find_section(sections, r'limites?', r'limits?', r'contraintes?', r'restrictions?', r'boundaries')
    security_text = find_section(sections, r'sécurité', r'security', r'trust', r'confiance')
    tools_text = find_section(sections, r'tools?', r'outils?', r'capabilities', r'compétences')

    # Build AIEOS structure
    aieos = {
        'version': '1.0',
        'agent_id': agent_id,
        'psychology': {
            'moral_compass': extract_list_items(core_truths_text) if core_truths_text else [],
            'personality_traits': extract_list_items(vibe_text) if vibe_text else [],
            'emotional_baseline': 'stable',
        },
        'capabilities': {
            'skills': extract_list_items(role_text) if role_text else [],
            'tool_access': extract_list_items(tools_text) if tools_text else [],
            'limitations': extract_list_items(limits_text) if limits_text else [],
        },
        'linguistics': {
            'style': vibe_text.split('\n')[0] if vibe_text else '',
            'formality': detect_formality(vibe_text) if vibe_text else 'moderate',
            'language': detect_language(text),
        },
        'security': {
            'trust_level': 'high',
            'api_access': extract_list_items(security_text) if security_text else [],
        },
    }

    return aieos


def main():
    if len(sys.argv) < 2:
        print(f'Usage: {sys.argv[0]} <path/to/SOUL.md> [--stdout]', file=sys.stderr)
        sys.exit(1)

    soul_path = Path(sys.argv[1]).resolve()
    if not soul_path.exists():
        print(f'Error: {soul_path} not found', file=sys.stderr)
        sys.exit(1)

    aieos = convert_soul_to_aieos(soul_path)
    output = json.dumps(aieos, indent=2, ensure_ascii=False)

    if '--stdout' in sys.argv:
        print(output)
    else:
        out_path = soul_path.parent / 'identity.aieos.json'
        out_path.write_text(output + '\n', encoding='utf-8')
        print(f'  Written: {out_path}')


if __name__ == '__main__':
    main()
