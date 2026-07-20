#!/usr/bin/env python3
"""Reorder JSON fields so id comes right after name for readability."""
import json, os

DATADIR = "src/data"

def reorder(item: dict, order: list[str]) -> dict:
    """Return new dict with keys in the specified order."""
    result = {}
    for k in order:
        if k in item:
            result[k] = item[k]
    # Add any remaining keys not in order list
    for k in item:
        if k not in result:
            result[k] = item[k]
    return result

# --- ARMOR: name, id, type, nij, material, plates, grid, weight, source, image ---
armor_order = ["name", "id", "type", "nij", "material", "plates", "grid", "weight", "source", "image"]
armor = json.load(open(f"{DATADIR}/armor.json"))
armor = [reorder(a, armor_order) for a in armor]
with open(f"{DATADIR}/armor.json", "w") as f:
    json.dump(armor, f, indent=2, ensure_ascii=False)
print(f"armor.json: reordered {len(armor)} items")

# --- WEAPONS: name, id, type, caliber, magSize, fireRate, source, image ---
weapons_order = ["name", "id", "type", "caliber", "magSize", "fireRate", "source", "image"]
weapons = json.load(open(f"{DATADIR}/weapons.json"))
weapons = [reorder(w, weapons_order) for w in weapons]
with open(f"{DATADIR}/weapons.json", "w") as f:
    json.dump(weapons, f, indent=2, ensure_ascii=False)
print(f"weapons.json: reordered {len(weapons)} items")

# --- KEYS: name, id, location, wikiUrl, inTask, image ---
keys_order = ["name", "id", "location", "wikiUrl", "inTask", "image"]
keys = json.load(open(f"{DATADIR}/keys.json"))
keys = [reorder(k, keys_order) for k in keys]
with open(f"{DATADIR}/keys.json", "w") as f:
    json.dump(keys, f, indent=2, ensure_ascii=False)
print(f"keys.json: reordered {len(keys)} items")

# --- BACKPACKS: already good, just verify ---
backpacks = json.load(open(f"{DATADIR}/backpacks.json"))
bp_keys = list(backpacks[0].keys()) if backpacks else []
print(f"backpacks.json: {len(backpacks)} items, keys={bp_keys}")

# --- RIGS: already good, just verify ---
rigs = json.load(open(f"{DATADIR}/rigs.json"))
rig_keys = list(rigs[0].keys()) if rigs else []
print(f"rigs.json: {len(rigs)} items, keys={rig_keys}")

# --- THROWABLES: already good, just verify ---
throws = json.load(open(f"{DATADIR}/throwables.json"))
thr_keys = list(throws[0].keys()) if throws else []
print(f"throwables.json: {len(throws)} items, keys={thr_keys}")

print("\nDone!")
