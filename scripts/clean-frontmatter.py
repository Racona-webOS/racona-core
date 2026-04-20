#!/usr/bin/env python3
"""
Script to remove Astro frontmatter from markdown files in the knowledge base.
Keeps only the markdown content for the AI assistant.
"""

import os
import re
from pathlib import Path

def clean_frontmatter(file_path):
    """Remove frontmatter from a markdown file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Remove frontmatter (between --- and ---)
        # This regex matches frontmatter at the beginning of the file
        cleaned_content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.DOTALL)

        # Remove any leading whitespace
        cleaned_content = cleaned_content.lstrip()

        # Only write if content changed
        if cleaned_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)
            print(f"Cleaned: {file_path}")
            return True
        else:
            print(f"No frontmatter found: {file_path}")
            return False

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Clean all markdown files in the knowledge base."""
    kb_path = Path("apps/web/static/knowledge-base")

    if not kb_path.exists():
        print(f"Knowledge base path not found: {kb_path}")
        return

    # Find all markdown files
    md_files = list(kb_path.rglob("*.md")) + list(kb_path.rglob("*.mdx"))

    print(f"Found {len(md_files)} markdown files")

    cleaned_count = 0
    for file_path in md_files:
        if clean_frontmatter(file_path):
            cleaned_count += 1

    print(f"\nCleaned {cleaned_count} files out of {len(md_files)} total files")

if __name__ == "__main__":
    main()