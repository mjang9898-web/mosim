#!/usr/bin/env python3
"""Regenerate the /thumbs/ 400px-wide webp thumbnails the funnel (step3/step4) uses.

The planner cards render images via thumbUrl() -> /assets/<folder>/thumbs/<name>.webp
(a perf optimization). These thumbs are committed assets, NOT a build output, so they
do NOT auto-update. RUN THIS whenever you add/replace any card image so the funnel
stays in sync with the full-size images used on experience.html.

Usage:  python3 scripts/gen-thumbs.py
Requires: Pillow (local dev only; not part of the Vercel build).
"""
import os, glob
from PIL import Image

FOLDERS = [
    "assets/culture-heritage", "assets/culture-famous", "assets/culture-shop",
    "assets/cuisine-hansik", "assets/cuisine-street", "assets/cuisine-grill", "assets/cuisine-drinks",
]
WIDTH = 400
QUALITY = 72

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
made = removed = 0
for folder in FOLDERS:
    d = os.path.join(root, folder)
    if not os.path.isdir(d):
        continue
    td = os.path.join(d, "thumbs")
    os.makedirs(td, exist_ok=True)
    parents = {os.path.basename(p) for p in glob.glob(os.path.join(d, "*.webp"))}
    # (re)generate a thumb for every current parent image
    for name in parents:
        src = os.path.join(d, name)
        im = Image.open(src).convert("RGB")
        h = round(im.height * WIDTH / im.width)
        im.resize((WIDTH, h), Image.LANCZOS).save(os.path.join(td, name), "WEBP", quality=QUALITY, method=6)
        made += 1
    # delete orphan thumbs whose parent image no longer exists
    for t in glob.glob(os.path.join(td, "*.webp")):
        if os.path.basename(t) not in parents:
            os.remove(t); removed += 1
    print(f"  {folder}: {len(parents)} thumbs, removed {sum(1 for t in glob.glob(os.path.join(td,'*.webp')) if os.path.basename(t) not in parents)} orphans")

print(f"\nthumbs regenerated: {made} written, {removed} orphans removed")
