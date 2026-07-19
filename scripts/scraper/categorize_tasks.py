"""Categorize tasks by wiki category and add missing hidden tasks."""
import json, requests, re, time
from pathlib import Path

API = 'https://gray-zone-warfare.fandom.com/api.php'
HEADERS = {'User-Agent': 'GZW-Tools/1.0', 'Accept': 'application/json'}

def get_category_pages(category):
    """Get all non-category pages in a wiki category."""
    pages = []
    params = {
        'action': 'query', 'list': 'categorymembers',
        'cmtitle': f'Category:{category}', 'cmlimit': 500,
        'cmtype': 'page', 'format': 'json',
    }
    while True:
        r = requests.get(API, params=params, headers=HEADERS, timeout=15)
        data = r.json()
        members = data.get('query', {}).get('categorymembers', [])
        for m in members:
            if not m['title'].startswith('Category:'):
                pages.append(m['title'])
        cont = data.get('continue', {})
        if 'cmcontinue' in cont:
            params['cmcontinue'] = cont['cmcontinue']
        else:
            break
    return pages

def parse_page_for_infobox(title):
    """Get infobox data from a wiki page."""
    r = requests.get(API, params={'action':'parse','page':title,'prop':'text','format':'json'}, headers=HEADERS, timeout=15)
    html = r.json().get('parse', {}).get('text', {}).get('*', '')
    data = {}
    for m in re.finditer(
        r'<div[^>]*class="pi-data"[^>]*>.*?<h3[^>]*class="pi-data-label"[^>]*>(.*?)</h3>.*?<div[^>]*class="pi-data-value"[^>]*>(.*?)</div>',
        html, re.DOTALL
    ):
        label = re.sub(r'<[^>]+>', '', m.group(1)).strip().lower()
        value = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        data[label] = re.sub(r'\s+', ' ', value)
    return data, html

print('Fetching wiki categories...')
categories = {
    'main_task': get_category_pages('Main task'),
    'side_task': get_category_pages('Side task'),
    'hidden_task': get_category_pages('Hidden Task'),
    'squad_strike': get_category_pages('Squad Strike Missions'),
}
for cat, pages in categories.items():
    print(f'  {cat}: {len(pages)} pages')

# Build page -> category mapping
page_cat = {}
for cat, pages in categories.items():
    for p in pages:
        page_cat[p] = cat

print(f'\nTotal unique categorized pages: {len(page_cat)}')

# Load existing tasks
with open('scripts/scraper/data/tasks.json') as f:
    tasks = json.load(f)
existing_names = {t['name'] for t in tasks}

# Add missing hidden tasks
missing = [p for p in categories['hidden_task'] if p not in existing_names]
print(f'\nMissing tasks to add: {len(missing)}')
for title in missing:
    print(f'  Adding: {title}...', end=' ', flush=True)
    data, html = parse_page_for_infobox(title)
    
    task = {
        'id': title.lower().replace(" ", "-").replace("'", ""),
        'name': title,
        'vendor': data.get('given by', ''),
        'area': data.get('location', data.get('area', '')),
        'type': 'hidden',
        'category': 'hidden_task',
    }
    
    # Extract objectives
    text = re.sub(r'<[^>]+>', '\n', html)
    m = re.search(r'==\s*Objectives?\s*==\s*\n(.+?)(?=\n==|\Z)', text, re.DOTALL | re.IGNORECASE)
    if m:
        objs = []
        for line in m.group(1).split('\n'):
            line = line.strip().strip('•-*')
            if line and len(line) > 5:
                objs.append(line)
        task['objectives'] = objs[:8]
    
    # Extract rewards
    m2 = re.search(r'==\s*Rewards?\s*==\s*\n(.+?)(?=\n==|\Z)', text, re.DOTALL | re.IGNORECASE)
    if m2:
        task['reward_text'] = m2.group(1).strip()[:300]
    
    tasks.append(task)
    print('✅')
    time.sleep(0.5)

# Update category for existing tasks
updated = 0
for t in tasks:
    cat = page_cat.get(t['name'])
    if cat:
        t['category'] = cat
        # Also update type based on category
        if cat == 'main_task':
            t['type'] = 'main'
        elif cat == 'side_task':
            t['type'] = 'side'
        elif cat == 'hidden_task':
            t['type'] = 'hidden'
        elif cat == 'squad_strike':
            t['type'] = 'squad'
        updated += 1
    elif 'category' not in t:
        t['category'] = 'unknown'

print(f'\nUpdated categories: {updated}/{len(tasks)}')

# Save
for path in ['scripts/scraper/data/tasks.json', 'src/data/tasks.json']:
    with open(path, 'w') as f:
        json.dump(tasks, f, indent=2)
    print(f'Saved: {path} ({len(tasks)} tasks)')

# Summary
from collections import Counter
cats = Counter(t.get('category','unknown') for t in tasks)
print(f'\nCategory distribution: {dict(cats)}')
types = Counter(t.get('type','unknown') for t in tasks)
print(f'Type distribution: {dict(types)}')
