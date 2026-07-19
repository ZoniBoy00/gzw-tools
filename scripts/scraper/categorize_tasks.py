"""Categorize tasks by wiki category and add missing hidden/contract/squad tasks.
Scrapes ALL task categories to ensure comprehensive coverage."""
import json, requests, re, time
from pathlib import Path
from collections import Counter

API = 'https://gray-zone-warfare.fandom.com/api.php'
HEADERS = {'User-Agent': 'GZW-Tools/1.0', 'Accept': 'application/json'}

# All task-related categories
ALL_CATEGORIES = [
    ("main_task", "Main task"),
    ("side_task", "Side task"),
    ("hidden_task", "Hidden Task"),
    ("squad_strike", "Squad Strike Missions"),
    ("contract", "Contract"),
    ("contracts", "Contracts"),
    ("task", "Task"),
    ("tasks", "Tasks"),
    ("task_item", "Task Item"),
    ("main_tasks", "Main tasks"),
    ("side_tasks", "Side tasks"),
]

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
            if not m['title'].startswith('Category:') and m['ns'] == 0:
                pages.append(m['title'])
        cont = data.get('continue', {})
        if 'cmcontinue' in cont:
            params['cmcontinue'] = cont['cmcontinue']
        else:
            break
    return pages

def parse_page_for_infobox(title):
    """Get infobox data from a wiki page."""
    r = requests.get(API, params={'action': 'parse', 'page': title, 'prop': 'text', 'format': 'json'}, headers=HEADERS, timeout=15)
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

# Map internal keys to display types
KEY_TO_TYPE = {
    'main_task': 'main',
    'main_tasks': 'main',
    'side_task': 'side',
    'side_tasks': 'side',
    'hidden_task': 'hidden',
    'squad_strike': 'squad',
    'contract': 'contract',
    'contracts': 'contract',
    'task': 'unknown',
    'tasks': 'unknown',
    'task_item': 'task_item',
}

print('Fetching ALL wiki task categories...')
categories = {}
for key, cat_name in ALL_CATEGORIES:
    try:
        pages = get_category_pages(cat_name)
        categories[key] = pages
        print(f'  {key} ({cat_name}): {len(pages)} pages')
    except Exception as e:
        print(f'  {key} ({cat_name}): ERROR - {e}')
        categories[key] = []
    time.sleep(0.3)

# Build page -> category mapping (first match wins, prioritized)
PRIORITY = ['main_task', 'main_tasks', 'side_task', 'side_tasks', 'hidden_task',
            'squad_strike', 'contract', 'contracts', 'task', 'tasks', 'task_item']

page_cat = {}
seen = set()
for cat_key in PRIORITY:
    for p in categories.get(cat_key, []):
        if p not in seen:
            seen.add(p)
            page_cat[p] = cat_key

print(f'\nTotal unique categorized pages: {len(page_cat)}')

# Load existing tasks
tasks_path = Path('scripts/scraper/data/tasks.json')
if tasks_path.exists():
    with open(tasks_path) as f:
        tasks = json.load(f)
else:
    tasks = []

existing_names = {t['name'] for t in tasks}

# Find missing tasks not in the existing list
found_missing = set()
for cat_key, cat_pages in categories.items():
    for p in cat_pages:
        if p not in existing_names:
            found_missing.add(p)

print(f'\nMissing tasks to add: {len(found_missing)}')

# Add missing tasks
new_count = 0
for title in sorted(found_missing):
    print(f'  Adding: {title}...', end=' ', flush=True)
    try:
        data, html = parse_page_for_infobox(title)
    except Exception as e:
        print(f'❌ ({e})')
        continue
    
    cat_key = page_cat.get(title, 'unknown')
    
    task = {
        'id': title.lower().replace(" ", "-").replace("'", "").replace(",", ""),
        'name': title,
        'vendor': data.get('given by', ''),
        'area': data.get('location', data.get('area', '')),
        'type': KEY_TO_TYPE.get(cat_key, 'unknown'),
        'category': cat_key,
    }
    
    # Detect type from infobox
    type_from_box = data.get('type', '').lower()
    if type_from_box:
        if 'main' in type_from_box:
            task['type'] = 'main'
        elif 'side' in type_from_box:
            task['type'] = 'side'
        elif 'contract' in type_from_box:
            task['type'] = 'contract'
        elif 'hidden' in type_from_box:
            task['type'] = 'hidden'
    
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
    new_count += 1
    print('✅')
    time.sleep(0.5)

# Update category for existing tasks
updated = 0
for t in tasks:
    cat = page_cat.get(t['name'])
    if cat:
        t['category'] = cat
        # Update type based on category if not already set
        new_type = KEY_TO_TYPE.get(cat)
        if new_type and new_type != 'unknown':
            # Only override if current type is less specific
            current_type = t.get('type', 'unknown')
            if current_type == 'unknown' or current_type == 'task_item':
                t['type'] = new_type
                updated += 1
    elif 'category' not in t:
        t['category'] = 'unknown'

print(f'\nUpdated types/categories: {updated}/{len(tasks)}')

# Deduplicate
seen_names = set()
unique_tasks = []
for t in tasks:
    if t['name'] not in seen_names:
        seen_names.add(t['name'])
        unique_tasks.append(t)

if len(unique_tasks) < len(tasks):
    print(f'Removed {len(tasks) - len(unique_tasks)} duplicates')

# Save
save_paths = ['scripts/scraper/data/tasks.json', 'src/data/tasks.json']
for p in save_paths:
    path = Path(p)
    if path.parent.exists():
        with open(path, 'w') as f:
            json.dump(unique_tasks, f, indent=2)
        print(f'Saved: {path} ({len(unique_tasks)} tasks)')

# Summary
cats = Counter(t.get('category', 'unknown') for t in unique_tasks)
print(f'\nCategory distribution:')
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {count}')

types = Counter(t.get('type', 'unknown') for t in unique_tasks)
print(f'Type distribution:')
for t, count in sorted(types.items(), key=lambda x: -x[1]):
    print(f'  {t}: {count}')

print(f'\n✅ Done! Added {new_count} new tasks, updated {updated} categories')
