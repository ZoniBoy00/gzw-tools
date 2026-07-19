"""Convert scraper JSON to frontend data files (weapons.json, armor.json, ammo.json)."""
import json, re
from pathlib import Path

SRC = Path('src/data')
SCRAPER = Path('scripts/scraper/data')

# ─── 1. Weapons ───
def gen_weapons():
    with open(SCRAPER / 'weapons.json') as f:
        scraped = json.load(f)
    
    type_map = {'Handgun': 'Pistol', 'Submachine Gun': 'SMG', 'SMG': 'SMG', 'Rifle': 'DMR', 'Sniper Rifle': 'Bolt-Action', 'Shotgun': 'Shotgun'}
    source_map = {
        'Glock 17': 'Gunny R.1', 'Beretta M9A1': 'Gunny R.1', 'Colt Combat Commander': 'Gunny R.1',
        'Colt 1911': 'Looting', 'Vz. 61 Skorpion': 'Gunny R.1', 'Type 51': 'Turncoat R.2',
        'MP5': 'Gunny R.2', 'MP7A1': 'Gunny R.2', 'MP7A2': 'Looting',
        'M4A1': 'Gunny R.2', 'DDM4': 'Gunny R.2', 'CQ A1': 'Turncoat R.2',
        'AK-19': 'Looting', 'SIG MCX': 'Gunny R.2', 'AK-74M': 'Turncoat R.2',
        'AK-74N': 'Looting', 'AK-12': 'Turncoat R.3', 'AKS-74U': 'Looting',
        'AKM': 'Turncoat R.2', 'AKMN': 'Looting', 'AKMSN': 'Looting',
        'AK-15': 'Turncoat R.3', 'AK-308': 'Looting', 'SKS': 'Turncoat R.2',
        'SVD': 'Turncoat R.3', 'M700': 'Looting',
        'Mosin-Nagant': 'Looting', 'Mosin-Nagant (Sniper)': 'Turncoat R.2',
        'Remington 788': 'Looting', 'M870': 'Gunny R.1', 'Mossberg 590': 'Gunny R.2',
    }
    
    weapons = []
    for w in scraped:
        name = w['name']
        if name.startswith('Category:') or name.startswith('User:'):
            continue
        wtype = type_map.get(w.get('type',''), w.get('type',''))
        if not wtype:
            continue
        cal = w.get('caliber','-')
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
        entry['source'] = source_map.get(name, 'Looting')
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
    types = {
        'vests': 'VEST',
        'helmets': 'HELMET',
        'rigs': 'RIG',
    }
    
    all_vests = []
    all_helmets = []
    
    for key, cat_name in [('vests', 'Armor Vest'), ('helmets', 'Helmet')]:
        path = SCRAPER / f'{key}.json'
        if not path.exists():
            print(f'  Skipping {key}: file not found')
            continue
        
        with open(path) as f:
            items = json.load(f)
        
        out = []
        for item in items:
            entry = {'name': item['name']}
            
            m = re.search(r'nij[_\s]?rating|armor[_\s]?rating', '|'.join(item.keys()), re.IGNORECASE)
            for k in ['nij', 'Nij_rating', 'armor_rating', 'nijRating']:
                if item.get(k):
                    entry['nij'] = item[k]
                    break
            if 'nij' not in entry:
                entry['nij'] = '-'
            
            entry['material'] = item.get('material', '-')
            entry['weight'] = item.get('weight', 0)
            if isinstance(entry['weight'], str):
                try: entry['weight'] = float(re.sub(r'[^0-9.]', '', entry['weight']))
                except: entry['weight'] = 0
            
            if key == 'vests':
                entry['plates'] = item.get('plates', item.get('armor_coverage', 'Front'))
                entry['grid'] = item.get('grid', item.get('grid_size', '3x3'))
            entry['source'] = item.get('source', 'Looting')
            
            if key == 'vests':
                all_vests.append(entry)
            else:
                all_helmets.append(entry)
        
        print(f'✅ {key}.json: {len(items)} items')
    
    # Save armor.json
    armor = {'vests': all_vests, 'helmets': all_helmets}
    with open(SRC / 'armor.json', 'w') as f:
        json.dump(armor, f, indent=2)
    print(f'✅ armor.json: {len(all_vests)} vests, {len(all_helmets)} helmets')
    
    # Generate TS wrapper (keep manual data for recommendations etc.)
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

# ─── 3. Ammo (keep manual — scraper has poor ammo data) ───
def gen_ammo():
    # Ammo.json from scraper is unreliable; keep existing hardcoded data
    # but ensure ammo/index.ts still exists
    print('⚠️  Ammo: keeping manual data (scraper has poor ammo coverage)')

if __name__ == '__main__':
    gen_weapons()
    gen_armor()
    gen_ammo()
    print('\n✅ All frontend data files generated')
