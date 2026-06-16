#!/usr/bin/env python3
import re

with open('/home/Dmujeres-traccar/traccar/MainMap-C62m7Ii9.js') as f:
    content = f.read()

# React error 321 - style prop as string instead of object
# Find all inline style assignments that might have string values
# Look for patterns like style: "..." or style: '...' (which are wrong)
for m in re.finditer(r'style:\s*"(?:[^"\\]|\\.)*"', content):
    val = m.group()
    start = max(0, m.start() - 60)
    end = min(len(content), m.end() + 60)
    print(f"STRING STYLE: {val[:80]}")
    print(f"  Context: {content[start:end]}")
    print()

# Also check for style={string} usage - React expects style={{key: val}}
for m in re.finditer(r'style:\s*\'(?:[^\'\\]|\\.)*\'', content):
    val = m.group()
    start = max(0, m.start() - 60)
    end = min(len(content), m.end() + 60)
    print(f"STRING STYLE: {val[:80]}")
    print(f"  Context: {content[start:end]}")
    print()