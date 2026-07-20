#!/usr/bin/env python3
"""Normalise all JSON data files to consistent format with id + image."""
import json, re, os

DATADIR = "src/data"

def slug(name: str) -> str:
    """Generate a consistent id slug from item name."""
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s

# --- 1. ARMOR: add id + type ---
armor = json.load(open(f"{DATADIR}/armor.json"))
cat_map = {"vests": "Ballistic Vest", "helmets": "Helmet", "plate_carriers": "Plate Carrier"}
for item in armor:
    item["id"] = slug(item["name"])
    item["type"] = cat_map.get(item.get("category", ""), item.get("category", ""))
with open(f"{DATADIR}/armor.json", "w") as f:
    json.dump(armor, f, indent=2, ensure_ascii=False)
print(f"armor.json: {len(armor)} items - added id + type")

# --- 2. WEAPONS: add id ---
weapons = json.load(open(f"{DATADIR}/weapons.json"))
missing_img = []
for item in weapons:
    item["id"] = slug(item["name"])
    if "image" not in item or not item["image"]:
        missing_img.append(item["name"])
with open(f"{DATADIR}/weapons.json", "w") as f:
    json.dump(weapons, f, indent=2, ensure_ascii=False)
print(f"weapons.json: {len(weapons)} items - added id")
if missing_img:
    print(f"  Still missing images: {missing_img}")

# --- 3. KEYS: add id ---
keys = json.load(open(f"{DATADIR}/keys.json"))
for item in keys:
    item["id"] = slug(item["name"])
with open(f"{DATADIR}/keys.json", "w") as f:
    json.dump(keys, f, indent=2, ensure_ascii=False)
print(f"keys.json: {len(keys)} items - added id")

print("\nDone!")
