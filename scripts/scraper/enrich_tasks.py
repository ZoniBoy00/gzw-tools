"""Enrich tasks.json with more data from GZW Fandom wiki pages."""
import json, re, requests, time, sys
from pathlib import Path

API = 'https://gray-zone-warfare.fandom.com/api.php'
HEADERS = {'User-Agent': 'GZW-Tools/1.0', 'Accept': 'application/json'}
SLEEP = 0.5

def parse_page(title, max_retries=3):
    """Get parsed HTML content of a wiki page."""
    for attempt in range(max_retries):
        try:
            r = requests.get(API, params={'action':'parse','page':title,'prop':'text','format':'json'}, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                data = r.json()
                if 'parse' in data and 'text' in data['parse']:
                    return data['parse']['text']['*']
            return None
        except Exception as e:
            print(f'    Error: {e}')
            if attempt < max_retries - 1:
                time.sleep(2)
    return None

def extract_infobox(html):
    """Extract key-value pairs from portable infobox."""
    data = {}
    # Match pi-data items
    for m in re.finditer(
        r'<div[^>]*class="pi-data"[^>]*>.*?<h3[^>]*class="pi-data-label"[^>]*>(.*?)</h3>.*?<div[^>]*class="pi-data-value"[^>]*>(.*?)</div>',
        html, re.DOTALL
    ):
        label = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        value = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        value = re.sub(r'\s+', ' ', value)
        if label and value:
            data[label.lower()] = value
    return data

def extract_section(html, section_name):
    """Extract text content of a wiki section."""
    # Find the section header
    pattern = rf'<span[^>]*id="{section_name}"[^>]*>.*?</span>.*?</h[234]>.*?(?=<h[234]|\Z)'
    m = re.search(pattern, html, re.DOTALL)
    if m:
        text = m.group(0)
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '\n', text)
        # Clean up
        lines = []
        for line in text.split('\n'):
            line = line.strip()
            if line and len(line) > 3 and not line.startswith('[') and 'mw-editsection' not in line:
                lines.append(line)
        return lines
    return []

def extract_objectives_from_gallery(html):
    """Extract objective descriptions from image gallery captions."""
    objectives = []
    for m in re.finditer(r'alt="([^"]*objective[^"]*)"', html, re.IGNORECASE):
        caption = m.group(1).strip()
        if caption and len(caption) > 5:
            objectives.append(caption)
    for m in re.finditer(r'data-caption="([^"]*)"', html):
        caption = m.group(1).strip()
        if caption and len(caption) > 5 and 'objective' not in caption.lower():
            objectives.append(caption)
    return objectives[:8]

def enrich_tasks():
    path = Path('scripts/scraper/data/tasks.json')
    with open(path) as f:
        tasks = json.load(f)
    
    total = len(tasks)
    enriched = 0
    
    for i, task in enumerate(tasks):
        name = task['name']
        print(f'[{i+1}/{total}] {name}...', end=' ', flush=True)
        
        html = parse_page(name)
        if not html:
            print('❌ (no page)')
            continue
        
        # Extract infobox
        info = extract_infobox(html)
        
        # Check for additional infobox fields
        updated = False
        
        # Map known fields
        field_map = {
            'given by': 'vendor',
            'location': 'area',
            'area': 'area',
            'type': 'quest_type',
            'requires': 'requirements',
            'requirement': 'requirements',
            'difficulty': 'difficulty',
            'reward': 'reward_text',
            'rewards': 'reward_text',
            'xp_reward': 'xp',
            'rep_reward': 'rep_reward',
            'money_reward': 'money_reward',
        }
        
        for wiki_key, our_key in field_map.items():
            if wiki_key in info:
                val = re.sub(r'[\u200b\xa0]', '', info[wiki_key]).strip()
                if val and val != task.get(our_key, ''):
                    task[our_key] = val
                    updated = True
        
        # Try to get objectives from section
        objectives = extract_section(html, 'Objectives')
        if objectives:
            # Filter out TOC and navigation lines
            objectives = [o for o in objectives if len(o) > 10 and not o.startswith('Retrieved from')]
            if objectives:
                task['objectives'] = objectives[:8]
                updated = True
        
        # Try gallery captions as fallback
        if not task.get('objectives'):
            gallery_objs = extract_objectives_from_gallery(html)
            if gallery_objs:
                task['objectives'] = gallery_objs
                updated = True
        
        # Try rewards section
        rewards = extract_section(html, 'Rewards')
        if rewards and not task.get('reward_text'):
            task['reward_text'] = ' '.join([r for r in rewards if len(r) > 5 and not r.startswith('[')][:5])
            updated = True
        
        if updated:
            enriched += 1
            print(f'✅ (+{len(task.keys())} fields)')
        else:
            print('✓')
        
        time.sleep(SLEEP)
    
    # Save
    with open(path, 'w') as f:
        json.dump(tasks, f, indent=2)
    # Also copy to src
    with open('src/data/tasks.json', 'w') as f:
        json.dump(tasks, f, indent=2)
    
    print(f'\n✅ Done: {enriched}/{total} tasks enriched')

if __name__ == '__main__':
    enrich_tasks()
