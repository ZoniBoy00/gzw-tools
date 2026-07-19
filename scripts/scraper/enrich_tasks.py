"""Enrich tasks.json with more data from GZW Fandom wiki pages.
Scrapes ALL task categories (Main, Side, Hidden, Squad, Contract) to find every task."""

import json, re, requests, time, sys
from pathlib import Path

API = 'https://gray-zone-warfare.fandom.com/api.php'
HEADERS = {'User-Agent': 'GZW-Tools/1.0', 'Accept': 'application/json'}
SLEEP = 0.5

# All task-related categories that could contain tasks
TASK_CATEGORIES = [
    # Singular named categories
    "Main task",
    "Side task",
    "Hidden Task",
    "Task",
    "Task Item",
    # Plural named categories
    "Main tasks",
    "Side tasks",
    "Tasks",
    "Task items",
    # Contract/Squad categories
    "Contract",
    "Contracts",
    "Squad Strike Missions",
    "Squad Strike Missions Item",
]

# Map category to task type
CATEGORY_TYPE_MAP = {
    "main task": "main",
    "main tasks": "main",
    "side task": "side",
    "side tasks": "side",
    "hidden task": "hidden",
    "contract": "contract",
    "contracts": "contract",
    "squad strike missions": "squad",
    "squad strike missions item": "squad",
    "task": "unknown",
    "tasks": "unknown",
    "task item": "unknown",
    "task items": "unknown",
}


def api_call(params, max_retries=3):
    """Make a MediaWiki API call with retries."""
    params["format"] = "json"
    for attempt in range(max_retries):
        try:
            r = requests.get(API, params=params, headers=HEADERS, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f'    API error: {e}')
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
    return None


def get_category_members(category, limit=500):
    """Get all pages in a category."""
    pages = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{category}",
        "cmlimit": min(limit, 500),
        "cmtype": "page",
    }
    while True:
        data = api_call(params)
        if not data:
            break
        members = data.get("query", {}).get("categorymembers", [])
        pages.extend(members)
        cont = data.get("continue", {})
        if "cmcontinue" in cont:
            params["cmcontinue"] = cont["cmcontinue"]
        else:
            break
    return pages


def get_all_task_pages():
    """Get ALL task pages from all categories, with category mapping."""
    all_pages = {}  # title -> set of categories
    page_categories = {}  # title -> primary category type
    
    for cat in TASK_CATEGORIES:
        try:
            pages = get_category_members(cat, limit=500)
            for p in pages:
                title = p["title"]
                if p["ns"] != 0:
                    continue  # Only main namespace pages
                
                if title not in all_pages:
                    all_pages[title] = set()
                all_pages[title].add(cat)
                
                # Set primary type based on category
                cat_lower = cat.lower()
                for key, type_val in CATEGORY_TYPE_MAP.items():
                    if key in cat_lower or cat_lower in key:
                        if title not in page_categories or type_val != "unknown":
                            page_categories[title] = type_val
                        break
            
            print(f'  Category {cat}: {len(pages)} pages')
            time.sleep(0.3)
        except Exception as e:
            print(f'  Category {cat}: error - {e}')
    
    return all_pages, page_categories


def parse_page(title, max_retries=3):
    """Get parsed HTML content of a wiki page."""
    for attempt in range(max_retries):
        try:
            r = requests.get(API, params={'action': 'parse', 'page': title, 'prop': 'text', 'format': 'json'}, headers=HEADERS, timeout=30)
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
    pattern = rf'<span[^>]*id="{section_name}"[^>]*>.*?</span>.*?</h[234]>.*?(?=<h[234]|\Z)'
    m = re.search(pattern, html, re.DOTALL)
    if m:
        text = m.group(0)
        text = re.sub(r'<[^>]+>', '\n', text)
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
    """Main enrichment function."""
    path = Path('scripts/scraper/data/tasks.json')
    
    # Load existing tasks
    if path.exists():
        with open(path) as f:
            tasks = json.load(f)
        existing_names = {t['name'] for t in tasks}
        print(f'Loaded {len(tasks)} existing tasks')
    else:
        tasks = []
        existing_names = set()
        print('No existing tasks.json found, starting from scratch')
    
    # Step 1: Find ALL task pages from ALL categories
    print('\n📋 Fetching ALL task categories...')
    all_task_pages, page_types = get_all_task_pages()
    print(f'\nTotal unique task pages found: {len(all_task_pages)}')
    
    # Step 2: Find missing tasks not in the existing list
    missing_tasks = [t for t in all_task_pages if t not in existing_names]
    print(f'\nMissing tasks to add: {len(missing_tasks)}')
    
    # Step 3: Add missing tasks
    for title in sorted(missing_tasks):
        print(f'  Adding: {title}...', end=' ', flush=True)
        html = parse_page(title)
        if not html:
            print('❌ (no page)')
            continue
        
        info = extract_infobox(html)
        
        task_type = page_types.get(title, 'unknown')
        
        task = {
            'id': title.lower().replace(" ", "-").replace("'", "").replace(",", ""),
            'name': title,
            'vendor': info.get('given by', ''),
            'area': info.get('location', info.get('area', '')),
            'type': task_type,
            'objectives': [],
        }
        
        # Detect type from infobox
        type_from_box = info.get('type', '').lower()
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
        
        # Map additional infobox fields
        field_map = {
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
                if val:
                    task[our_key] = val
        
        tasks.append(task)
        print('✅')
        time.sleep(SLEEP)
    
    # Step 4: Enrich existing tasks with better categorization and data
    enriched = 0
    total = len(tasks)
    
    print(f'\n📋 Enriching {total} tasks...')
    
    for i, task in enumerate(tasks):
        name = task['name']
        
        # Update category type from our comprehensive scan
        cat_type = page_types.get(name)
        if cat_type and cat_type != 'unknown':
            if task.get('type', 'unknown') == 'unknown' or cat_type in ('main', 'side', 'hidden', 'squad'):
                task['type'] = cat_type
                enriched += 1
        
        # Skip if already enriched with full data
        if task.get('difficulty') or task.get('requirements') or task.get('xp'):
            continue
        
        # Parse page for fresh enrichment
        html = parse_page(name)
        if not html:
            continue
        
        info = extract_infobox(html)
        
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
        
        updated = False
        for wiki_key, our_key in field_map.items():
            if wiki_key in info:
                val = re.sub(r'[\u200b\xa0]', '', info[wiki_key]).strip()
                if val and val != task.get(our_key, ''):
                    task[our_key] = val
                    updated = True
        
        # Try to get objectives from section
        objectives = extract_section(html, 'Objectives')
        if objectives:
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
        
        time.sleep(SLEEP)
    
    # Step 5: Deduplicate
    seen = set()
    unique_tasks = []
    for t in tasks:
        if t['name'] not in seen:
            seen.add(t['name'])
            unique_tasks.append(t)
    
    if len(unique_tasks) < len(tasks):
        print(f'  Removed {len(tasks) - len(unique_tasks)} duplicates')
    
    # Save
    with open(path, 'w') as f:
        json.dump(unique_tasks, f, indent=2)
    print(f'\n✅ Saved: {path} ({len(unique_tasks)} tasks)')
    
    # Also copy to src
    src_path = Path('src/data/tasks.json')
    if src_path.parent.exists():
        with open(src_path, 'w') as f:
            json.dump(unique_tasks, f, indent=2)
        print(f'✅ Copied to: {src_path}')
    
    # Print summary
    from collections import Counter
    types = Counter(t.get('type', 'unknown') for t in unique_tasks)
    print(f'\n📊 Task type distribution:')
    for t, count in sorted(types.items(), key=lambda x: -x[1]):
        print(f'  {t}: {count}')
    
    print(f'\nDone! {enriched} tasks enriched')


if __name__ == '__main__':
    enrich_tasks()
