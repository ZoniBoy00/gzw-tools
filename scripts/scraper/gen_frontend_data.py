"""Convert scraper JSON to frontend data files (weapons.json, armor.json, ammo.json, item_images.json).
Dynamically extracts sources from wiki data instead of using hardcoded maps."""

import json, re
from pathlib import Path
from collections import defaultdict

SRC = Path('src/data')
SCRAPER = Path('scripts/scraper/data')

# ─── 1. Weapons ───
def gen_weapons():
    with open(SCRAPER / 'weapons.json') as f:
        scraped = json.load(f)
    
    type_map = {
        'Handgun': 'Pistol', 'Submachine Gun': 'SMG', 'SMG': 'SMG',
        'Rifle': 'DMR', 'Sniper Rifle': 'Bolt-Action', 'Shotgun': 'Shotgun',
        'Assault Rifle': 'Assault Rifle', 'Carbine': 'Carbine',
        'Battle Rifle': 'Battle Rifle', 'Designated Marksman Rifle': 'DMR',
        'Machine Gun': 'MG',
    }
    
    # Dynamically build source_map from scraped weapon data
    source_map = {}
    for w in scraped:
        name = w.get('name', '')
        if name.startswith('Category:') or name.startswith('User:'):
            continue
        
        # Extract source from vendor field or text patterns
        source = w.get('vendor', '')
        if not source:
            # Try to extract from text metadata
            source = w.get('source', '')
        
        # Also look for source in the ammo page data (we'll merge later)
        if source:
            # Clean up source names
            source = source.strip()
            # Match known vendor patterns
            vendor_patterns = {
                'gunny': 'Gunny',
                'artisan': 'Artisan',
                'turncoat': 'Turncoat',
                'banshee': 'Banshee',
                'handshake': 'Handshake',
                'lab rat': 'Lab Rat',
            }
            for pattern, vendor in vendor_patterns.items():
                if pattern in source.lower():
                    # Extract rep level
                    rep_match = re.search(r'r\.?\s*(\d+)', source, re.IGNORECASE)
                    rep = f" R.{rep_match.group(1)}" if rep_match else ""
                    source = f"{vendor}{rep}"
                    break
            
            # Fallback: check for stand-alone names
            if source.lower() in ['looting', 'loot', 'world']:
                source = 'Looting'
        
        if not source:
            source = 'Looting'  # Default
        
        source_map[name] = source
    
    weapons = []
    for w in scraped:
        name = w['name']
        if name.startswith('Category:') or name.startswith('User:'):
            continue
        
        wtype = type_map.get(w.get('type', ''), w.get('type', ''))
        if not wtype or wtype == '':
            # Try to infer from data
            caliber = w.get('caliber', '').lower()
            if any(x in caliber for x in ['pistol', '9x19', '.45 acp', '7.62x25', '7.65']):
                wtype = 'Pistol'
            elif 'shotgun' in caliber or 'gauge' in caliber:
                wtype = 'Shotgun'
            elif any(x in w.get('type', '').lower() for x in ['sniper', 'bolt']):
                wtype = 'Bolt-Action'
            elif 'smg' in w.get('type', '').lower() or 'submachine' in w.get('type', '').lower():
                wtype = 'SMG'
            elif 'rifle' in w.get('type', '').lower():
                wtype = 'Assault Rifle'
            else:
                continue  # Skip if we can't determine type
        
        cal = w.get('caliber', '-')
        try:
            mag = int(float(re.sub(r'[^0-9.]', '', str(w.get('magSize', w.get('capacity', '30'))))))
        except:
            mag = 30
        if mag <= 0 or mag > 200:
            mag = 30
        
        entry = {'name': name, 'type': wtype, 'caliber': cal, 'magSize': mag}
        fr = w.get('fireRate', '')
        if fr:
            entry['fireRate'] = fr
        
        # Dynamic source lookup
        entry['source'] = source_map.get(name, 'Looting')
        
        # Add image if available
        img = w.get('image', '')
        if img:
            entry['image'] = img
        
        weapons.append(entry)
    
    # Sort
    weapons.sort(key=lambda x: (x['type'], x['name']))
    
    with open(SRC / 'weapons.json', 'w') as f:
        json.dump(weapons, f, indent=2)
    print(f'✅ weapons.json: {len(weapons)} items')
    
    # Generate TS wrapper
    with open(SRC / 'weapons.ts', 'w') as f:
        f.write('// Auto-generated from scraper. Do not edit manually.\n')
        f.write('import type { WeaponEntry } from "./types";\n')
        f.write('import data from "./weapons.json" with { type: "json" };\n')
        f.write('export const WEAPONS = data as WeaponEntry[];\n')
        f.write('export const WEAPON_TYPES = [...new Set(WEAPONS.map((w) => w.type))] as string[];\n')
        f.write('export const WEAPON_CALIBERS = [...new Set(WEAPONS.map((w) => w.caliber))] as string[];\n')
    print('✅ weapons.ts wrapper')


# ─── 2. Armor ───
def gen_armor():
    all_vests = []
    all_helmets = []
    
    for key, cat_name in [('vests', 'Armor Vest'), ('helmets', 'Helmet')]:
        path = SCRAPER / f'{key}.json'
        if not path.exists():
            print(f'  Skipping {key}: file not found')
            continue
        
        with open(path) as f:
            items = json.load(f)
        
        for item in items:
            entry = {'name': item['name']}
            
            # Extract NIJ rating
            nij = ''
            for k in ['nij', 'Nij_rating', 'armor_rating', 'nijRating']:
                val = item.get(k, '')
                if val:
                    nij = val
                    break
            if not nij:
                # Check raw infobox data
                for k, v in item.items():
                    if 'nij' in k.lower() or 'armor' in k.lower():
                        nij = v
                        break
            entry['nij'] = nij if nij else '-'
            
            entry['material'] = item.get('material', '-')
            entry['weight'] = item.get('weight', 0)
            if isinstance(entry['weight'], str):
                try:
                    entry['weight'] = float(re.sub(r'[^0-9.]', '', entry['weight']))
                except:
                    entry['weight'] = 0
            
            if key == 'vests':
                entry['plates'] = item.get('plates', item.get('armor_coverage', 'Front'))
                entry['grid'] = item.get('grid', item.get('grid_size', '3x3'))
            
            # Dynamic source extraction
            entry['source'] = item.get('source', item.get('vendor', 'Looting'))
            
            # Add image
            img = item.get('image', '')
            if img:
                entry['image'] = img
            
            if key == 'vests':
                all_vests.append(entry)
            else:
                all_helmets.append(entry)
        
        print(f'✅ {key}.json: {len(items)} items')
    
    armor = {'vests': all_vests, 'helmets': all_helmets}
    with open(SRC / 'armor.json', 'w') as f:
        json.dump(armor, f, indent=2)
    print(f'✅ armor.json: {len(all_vests)} vests, {len(all_helmets)} helmets')
    
    # Generate TS wrapper
    with open(SRC / 'armor.ts', 'w') as f:
        f.write('// Auto-generated from scraper + manual data.\n')
        f.write('import type { ArmorVest, Helmet, GearRecommendation } from "./types";\n')
        f.write('import data from "./armor.json" with { type: "json" };\n')
        f.write('export const VESTS = data.vests as ArmorVest[];\n')
        f.write('export const HELMETS = data.helmets as Helmet[];\n')
        f.write('\n// Manual data (not from wiki scraper):\n')
        f.write("export const MATERIAL_RANK: Record<string, { rank: number; desc: string; color: string }> = {\n")
        f.write("  Aramid: { rank: 1, desc: 'Light, flexible', color: 'text-blue-400' },\n")
        f.write("  UHMWPE: { rank: 2, desc: 'Light, moderate', color: 'text-cyan-400' },\n")
        f.write("  Steel: { rank: 3, desc: 'Heavy, high', color: 'text-amber-400' },\n")
        f.write("  Ceramic: { rank: 4, desc: 'Best, brittle', color: 'text-red-400' },\n")
        f.write("};\n")
        f.write("export const RECOMMENDATIONS: GearRecommendation[] = [\n")
        f.write("  { tier: 'T1', label: 'Budget / Early', vest: 'Molle Vest (IIIA)', helmet: 'SS-27 (IIA)', ammo: ['5.56x45mm FMJ / M193', '7.62x39mm PS', '9x19mm FMJ'], notes: 'Good vs AI. Avoid geared PvP.' },\n")
        f.write("  { tier: 'T2', label: 'Mid Tier', vest: 'SK-S (III) or ATBV (III)', helmet: 'ACH (IIIA)', ammo: ['5.56x45mm AP M855', '5.45x39mm PP 7N10'], notes: 'Can fight players. SK-S is only 3.15kg.' },\n")
        f.write("  { tier: 'T3', label: 'High Tier', vest: 'CZ 4M Hornet (III+)', helmet: 'FAST Carbon (IIIA)', ammo: ['5.56x45mm AP M855A1', '7.62x51mm AP M61'], notes: 'Ceramic plates stop most rifle rounds.' },\n")
        f.write("  { tier: 'T4', label: 'End Game', vest: 'LVS Tactical (III++)', helmet: 'FAST Carbon (IIIA)', ammo: ['5.56x45mm AP M995', '7.62x54R AP 7N13'], notes: 'Best in slot. Full coverage.' },\n")
        f.write("];\n")
        f.write("export const VENDOR_GEAR = [\n")
        f.write("  { vendor: 'Handshake', rep: 1, items: 'Commander IIIA, LVS Overt IIIA+' },\n")
        f.write("  { vendor: 'Handshake', rep: 2, items: 'Covert Woodland III, LVS Tactical III, MICH IIA helmet' },\n")
        f.write("  { vendor: 'Handshake', rep: 3, items: 'CZ 4M Hornet Green III+' },\n")
        f.write("  { vendor: 'Handshake', rep: 4, items: 'LVS Tactical Multicam III++' },\n")
        f.write("  { vendor: 'Artisan', rep: 1, items: 'Molle Vest IIIA, SS-27 IIA helmet' },\n")
        f.write("  { vendor: 'Turncoat', rep: 2, items: 'SK-S III, ATBV III, ACH IIIA helmet' },\n")
        f.write("  { vendor: 'Turncoat', rep: 3, items: '6B23-1 III+ steel vest' },\n")
        f.write("  { vendor: 'Banshee', rep: 2, items: 'FAST Carbon IIIA helmet' },\n")
        f.write("];\n")
    print('✅ armor.ts wrapper with RECOMMENDATIONS + VENDOR_GEAR')


# ─── 3. Ammo ───
def gen_ammo():
    """Convert scraped ammo data (with penetration info) to frontend format."""
    ammo_path = SCRAPER / 'ammo.json'
    if not ammo_path.exists():
        print('⚠️  No ammo.json from scraper, keeping manual data')
        return
    
    with open(ammo_path) as f:
        scraped = json.load(f)
    
    # Group ammo by caliber and provide clean frontend data
    ammo_by_caliber = defaultdict(list)
    
    for a in scraped:
        name = a.get('name', '')
        if not name or name.startswith('Category:') or name.startswith('Template:'):
            continue
        
        # Extract caliber from the name or data
        caliber = a.get('caliber', '')
        if not caliber:
            # Try to infer from category or page name
            cal_mapping = {
                '9x19': '9x19mm',
                '.45': '.45 ACP',
                '5.56': '5.56x45mm',
                '5.45': '5.45x39mm',
                '7.62x39': '7.62x39mm',
                '7.62x51': '7.62x51mm',
                '7.62x54': '7.62x54mmR',
                '.300': '.300 AAC Blackout',
                '4.6x30': '4.6x30mm',
                '12 gauge': '12 Gauge',
                '12ga': '12 Gauge',
                '7.62x25': '7.62x25mm',
                '7.65': '7.65mm Browning',
            }
            for key, cal in cal_mapping.items():
                if key in name.lower():
                    caliber = cal
                    break
        
        entry = {
            'name': name,
            'caliber': caliber,
        }
        
        # Add penetration data
        pen = a.get('stopped_by_armor_class', a.get('penetration', ''))
        if pen:
            entry['stopped_by_armor_class'] = pen
        
        # Add velocity
        vel = a.get('velocity', '')
        if vel:
            entry['velocity'] = vel
        
        # Add source
        src = a.get('source', a.get('vendor', ''))
        if src:
            entry['source'] = src
        
        # Add image
        img = a.get('image', '')
        if img:
            entry['image'] = img
        
        ammo_by_caliber[caliber].append(entry)
    
    # Save as frontend ammo.json
    frontend_ammo = []
    for caliber in sorted(ammo_by_caliber.keys()):
        for entry in ammo_by_caliber[caliber]:
            frontend_ammo.append(entry)
    
    if frontend_ammo:
        with open(SRC / 'ammo.json', 'w') as f:
            json.dump(frontend_ammo, f, indent=2)
        print(f'✅ ammo.json: {len(frontend_ammo)} items across {len(ammo_by_caliber)} calibers (with penetration data)')
    else:
        print('⚠️  No ammo data generated')


# ─── 4. Item Images ───
def gen_item_images():
    """Generate item_images.json from scraped image data."""
    images_path = SCRAPER / 'item_images.json'
    
    all_images = {}
    
    # Load scraped item_images.json if it exists
    if images_path.exists():
        with open(images_path) as f:
            all_images = json.load(f)
        print(f'✅ Using scraped item_images.json: {len(all_images)} images')
    else:
        # Fallback: gather images from all scraper data files
        print('⚠️  No scraped item_images.json, building from data files...')
        for f_path in sorted(SCRAPER.glob('*.json')):
            if f_path.name == 'item_images.json':
                continue
            try:
                with open(f_path) as f:
                    data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        name = item.get('name', '')
                        img = item.get('image', '')
                        if name and img and img.startswith('http'):
                            all_images[name] = img
                elif isinstance(data, dict):
                    for key, val in data.items():
                        if isinstance(val, list):
                            for item in val:
                                name = item.get('name', '')
                                img = item.get('image', '')
                                if name and img and img.startswith('http'):
                                    all_images[name] = img
            except Exception as e:
                pass
    
    # Also include images from existing weapon_images.json and armor_images.json
    for legacy_file in ['weapon_images.json', 'armor_images.json']:
        legacy_path = SCRAPER / legacy_file
        if legacy_path.exists():
            with open(legacy_path) as f:
                legacy_images = json.load(f)
            if isinstance(legacy_images, dict):
                for name, url in legacy_images.items():
                    if name not in all_images:
                        all_images[name] = url
            elif isinstance(legacy_images, list):
                for item in legacy_images:
                    name = item.get('name', '')
                    img = item.get('image', '')
                    if name and img and name not in all_images:
                        all_images[name] = img
    
    if all_images:
        with open(SRC / 'item_images.json', 'w') as f:
            json.dump(all_images, f, indent=2)
        print(f'✅ item_images.json: {len(all_images)} entries')


if __name__ == '__main__':
    gen_weapons()
    gen_armor()
    gen_ammo()
    gen_item_images()
    print('\n✅ All frontend data files generated')
