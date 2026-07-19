"""
GZW Wiki Scraper v2 — Comprehensive data extractor
Scrapes Weapons, Armor, Helmets, Attachments, Ammo, Gear and more
from the Gray Zone Warfare Fandom wiki.
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from pathlib import Path

import requests
import bs4

sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("gzw-scraper")

OUTPUT_DIR = Path(__file__).parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)

# ─── Wiki API setup ───

API_URL = "https://gray-zone-warfare.fandom.com/api.php"
HEADERS = {
    "User-Agent": "GZW-Tools/1.0 (community tool; github.com/ZoniBoy00/gzw-tools)",
}

def api_call(params, max_retries=3):
    """Make a MediaWiki API call with retries."""
    params["format"] = "json"
    for attempt in range(max_retries):
        try:
            r = requests.get(API_URL, params=params, headers=HEADERS, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.warning("API call failed (attempt %d/%d): %s", attempt + 1, max_retries, e)
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
    return None

def get_category_members(category, limit=500):
    """Get all pages in a category via categorymembers API."""
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

def get_page_image(title):
    """Get thumbnail URL for a wiki page."""
    params = {
        "action": "query",
        "titles": title,
        "prop": "pageimages",
        "piprop": "thumbnail",
        "pithumbsize": 200,
        "format": "json",
    }
    data = api_call(params)
    if data:
        for p in data.get("query", {}).get("pages", {}).values():
            if isinstance(p, dict) and p.get("thumbnail"):
                return p["thumbnail"]["source"]
    return None

def parse_infobox(soup):
    """Extract key-value pairs from a portable infobox."""
    import bs4
    data = {}
    if not soup:
        return data
    infobox = soup.find("aside", class_=lambda c: c and "portable-infobox" in str(c)) if soup else None
    if not infobox:
        # Try wikitable as fallback
        return data
    
    for data_item in infobox.find_all("div", class_="pi-data"):
        label_el = data_item.find("h3", class_="pi-data-label")
        value_el = data_item.find("div", class_="pi-data-value")
        if label_el and value_el:
            label = label_el.get_text(" ", strip=True).lower().replace(" ", "_")
            value = value_el.get_text(" ", strip=True)
            # Clean value
            value = re.sub(r'\s+', ' ', value).strip()
            data[label] = value
    return data

def parse_page(title):
    """Get parsed HTML of a wiki page."""
    params = {
        "action": "parse",
        "page": title,
        "prop": "text",
        "formatversion": "2",
    }
    data = api_call(params)
    if not data:
        return None
    html = data.get("parse", {}).get("text", "")
    if not html:
        return None
    import bs4
    return bs4.BeautifulSoup(html, "lxml")

def extract_objectives(soup):
    """Extract objectives section from page text."""
    if not soup:
        return []
    text = soup.get_text(" ", strip=True)
    m = re.search(r'==\s*Objectives\s*==\s*(.+?)(?=\n==|\Z)', text, re.DOTALL)
    if m:
        objectives = []
        for line in m.group(1).split("\n"):
            line = line.strip().strip("•-*")
            if line and len(line) > 5:
                objectives.append(line)
        return objectives[:8]
    return []

# ─── Scrapers ───

import requests as req_module
import bs4

def scrape_weapons():
    """Scrape all weapon pages."""
    logger.info("=" * 60)
    logger.info("Scraping Weapons...")
    pages = get_category_members("Weapons", limit=500)
    logger.info("Found %d weapon pages", len(pages))
    
    weapons = []
    for i, p in enumerate(pages):
        title = p["title"]
        logger.debug("  [%d/%d] %s", i + 1, len(pages), title)
        
        soup = parse_page(title)
        info = parse_infobox(soup)
        
        weapon = {"name": title, "id": title.lower().replace(" ", "-").replace("'", "")}
        
        # Map wiki fields to standard fields
        field_map = {
            "type": "type",
            "caliber": "caliber",
            "calibre": "caliber",
            "magazine_capacity": "magSize",
            "capacity": "magSize",
            "fire_rate": "fireRate",
            "weight": "weight",
            "length": "length",
        }
        for wiki_key, our_key in field_map.items():
            if wiki_key in info:
                val = info[wiki_key]
                # Extract number from "600 RPM" or "30 rounds"
                if our_key in ("magSize", "fireRate"):
                    nums = re.findall(r'\d+', val)
                    if nums:
                        weapon[our_key] = nums[0]
                elif our_key == "weight":
                    nums = re.findall(r'[\d.]+', val)
                    if nums:
                        weapon[our_key] = float(nums[0])
                else:
                    weapon[our_key] = val
        
        # Get image
        img = get_page_image(title)
        if img:
            weapon["image"] = img
        
        # Extract source/vendor from page text
        if soup:
            text = soup.get_text(" ", strip=True)
            vendor_patterns = [
                (r'vendor[:\s]+(\w+)', 1),
                (r'obtained\s+from\s+(\w+)', 1),
                (r'available\s+at\s+rep\s+level\s+(\d+)', 1),
            ]
            for pattern, group in vendor_patterns:
                m = re.search(pattern, text, re.IGNORECASE)
                if m:
                    key = "vendor" if "vendor" in pattern else "repLevel"
                    weapon[key] = m.group(group).strip()
        
        weapons.append(weapon)
        time.sleep(0.3)
    
    if weapons:
        path = OUTPUT_DIR / "weapons.json"
        with open(path, "w") as f:
            json.dump(weapons, f, indent=2)
        logger.info("✅ Weapons: %d saved", len(weapons))
    
    return weapons


def scrape_armor():
    """Scrape armor vests, helmets, and tactical rigs."""
    categories = {
        "vests": "Armor Vest",
        "helmets": "Helmet",
        "rigs": "Tactical Rigs",
        "backpacks": "Backpacks",
    }
    
    results = {}
    for key, cat in categories.items():
        logger.info("=" * 60)
        logger.info("Scraping %s (category: %s)...", key, cat)
        pages = get_category_members(cat, limit=200)
        logger.info("Found %d pages", len(pages))
        
        items = []
        for i, p in enumerate(pages):
            title = p["title"]
            logger.debug("  [%d/%d] %s", i + 1, len(pages), title)
            
            soup = parse_page(title)
            info = parse_infobox(soup)
            
            item = {"name": title, "id": title.lower().replace(" ", "-").replace("'", "")}
            
            field_map = {
                "type": "type",
                "armor_rating": "nij",
                "nij_rating": "nij",
                "material": "material",
                "weight": "weight",
                "capacity": "capacity",
                "grid_size": "grid",
                "armor_coverage": "plates",
                "coverage": "plates",
                "source": "source",
            }
            for wiki_key, our_key in field_map.items():
                if wiki_key in info:
                    val = info[wiki_key]
                    if our_key == "weight":
                        nums = re.findall(r'[\d.]+', val)
                        if nums:
                            item[our_key] = float(nums[0])
                    else:
                        item[our_key] = val
            
            img = get_page_image(title)
            if img:
                item["image"] = img
            
            items.append(item)
            time.sleep(0.3)
        
        results[key] = items
        if items:
            path = OUTPUT_DIR / f"{key}.json"
            with open(path, "w") as f:
                json.dump(items, f, indent=2)
            logger.info("✅ %s: %d saved", key, len(items))
    
    return results


def scrape_ammo():
    """Scrape ammunition data."""
    logger.info("=" * 60)
    logger.info("Scraping Ammunition...")
    
    # Ammo is on the 'Ammunition' page as tables, not individual pages
    # Let's search for ammo-related pages
    search_terms = ["ammunition", "cartridge", "bullet", "ammo"]
    pages_set = set()
    
    for term in search_terms:
        params = {
            "action": "query",
            "list": "search",
            "srsearch": term,
            "srlimit": 50,
        }
        data = api_call(params)
        if data:
            for r in data.get("query", {}).get("search", []):
                if r["ns"] == 0 and "ammo" in r["title"].lower() or "cartridge" in r["title"].lower():
                    pages_set.add(r["title"])
    
    # Also check Weapons category for ammo-like pages
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:Ammunition",
        "cmlimit": 50,
        "cmtype": "page",
    }
    data = api_call(params)
    if data:
        for m in data.get("query", {}).get("categorymembers", []):
            pages_set.add(m["title"])
    
    logger.info("Found %d ammo-related pages", len(pages_set))
    
    ammo_items = []
    for title in sorted(pages_set):
        logger.debug("  %s", title)
        soup = parse_page(title)
        info = parse_infobox(soup)
        
        item = {"name": title}
        for wiki_key in ("caliber", "calibre", "type", "velocity", "weight", "damage"):
            if wiki_key in info:
                item[wiki_key] = info[wiki_key]
        
        img = get_page_image(title)
        if img:
            item["image"] = img
        
        # Extract tables from the page for detailed ammo data
        if soup:
            tables = soup.find_all("table", class_=re.compile(r"wikitable|article-table|sortable|fandom-table"))
            for table in tables:
                rows = table.find_all("tr")
                if len(rows) < 2:
                    continue
                headers = [h.get_text(" ", strip=True) for h in rows[0].find_all(["th", "td"])]
                if any("caliber" in h.lower() or "cartridge" in h.lower() for h in headers):
                    for row in rows[1:]:
                        cells = row.find_all(["td", "th"])
                        if len(cells) >= 2:
                            row_data = {}
                            for j, cell in enumerate(cells):
                                if j < len(headers):
                                    row_data[headers[j]] = cell.get_text(" ", strip=True)
                            if row_data:
                                ammo_items.append(row_data)
        
        time.sleep(0.3)
    
    if ammo_items:
        # Deduplicate
        seen = set()
        unique = []
        for a in ammo_items:
            key = json.dumps(a, sort_keys=True)
            if key not in seen:
                seen.add(key)
                unique.append(a)
        
        path = OUTPUT_DIR / "ammo.json"
        with open(path, "w") as f:
            json.dump(unique, f, indent=2)
        logger.info("✅ Ammo: %d entries saved", len(unique))
    
    return ammo_items


def scrape_attachments():
    """Scrape weapon attachments, magazines, and mods."""
    categories = {
        "magazines": "Magazines",
        "weapon_parts": "Weapon Parts",
        "helmet_mods": "Helmet Mods",
        "helmet_mounts": "Helmet Mounts",
    }
    
    for key, cat in categories.items():
        logger.info("=" * 60)
        logger.info("Scraping %s (category: %s)...", key, cat)
        pages = get_category_members(cat, limit=200)
        logger.info("Found %d pages", len(pages))
        
        items = []
        for i, p in enumerate(pages):
            title = p["title"]
            soup = parse_page(title)
            info = parse_infobox(soup)
            
            item = {"name": title}
            for wiki_key in ("type", "caliber", "capacity", "weight", "effect", "compatibility"):
                if wiki_key in info:
                    item[wiki_key] = info[wiki_key]
            
            img = get_page_image(title)
            if img:
                item["image"] = img
            
            items.append(item)
            time.sleep(0.3)
        
        if items:
            path = OUTPUT_DIR / f"{key}.json"
            with open(path, "w") as f:
                json.dump(items, f, indent=2)
            logger.info("✅ %s: %d saved", key, len(items))


def scrape_tasks():
    """Scrape all tasks/missions."""
    logger.info("=" * 60)
    logger.info("Scraping Tasks...")
    
    categories = ["Main tasks", "Side tasks", "Contracts", "Tasks", "Task items", "Squad Strike Missions Item"]
    all_pages = []
    seen_titles = set()
    
    for cat in categories:
        pages = get_category_members(cat, limit=500)
        for p in pages:
            if p["title"] not in seen_titles:
                seen_titles.add(p["title"])
                p["from_category"] = cat
                all_pages.append(p)
        logger.info("  Category %s: %d pages", cat, len(pages))
    
    logger.info("Total unique task pages: %d", len(all_pages))
    
    tasks = []
    for i, page in enumerate(all_pages):
        title = page["title"]
        category = page.get("from_category", "Tasks")
        logger.debug("  [%d/%d] %s", i + 1, len(all_pages), title)
        
        soup = parse_page(title)
        if not soup:
            continue
        
        task = {
            "id": title.lower().replace(" ", "-").replace("'", "").replace(",", ""),
            "name": title,
            "vendor": "",
            "area": "",
            "type": "unknown",
            "objectives": [],
        }
        
        # Categorize
        cl = category.lower()
        if "contract" in cl or "squad" in cl:
            task["type"] = "squad"
        elif "main" in cl:
            task["type"] = "main"
        elif "side" in cl:
            task["type"] = "side"
        
        # Parse infobox
        info = parse_infobox(soup)
        for wiki_key, our_key in {"given by": "vendor", "location": "area", "area": "area", "objectives": "objectives_text"}.items():
            if wiki_key in info:
                val = info[wiki_key]
                val = re.sub(r'[\u200b\xa0]', '', val)
                if our_key in ("vendor", "area"):
                    task[our_key] = val
                elif our_key == "objectives_text":
                    task["objectives"] = [o.strip() for o in val.split("\n") if o.strip()][:8]
        
        # Fallback: extract objectives from page text
        if not task["objectives"]:
            task["objectives"] = extract_objectives(soup)
        
        tasks.append(task)
    
    if tasks:
        path = OUTPUT_DIR / "tasks.json"
        with open(path, "w") as f:
            json.dump(tasks, f, indent=2)
        logger.info("✅ Tasks: %d saved", len(tasks))
        
        # Summary by vendor
        by_vendor = {}
        for t in tasks:
            v = t["vendor"] or "Unknown"
            by_vendor.setdefault(v, []).append(t)
        for v, ts in sorted(by_vendor.items()):
            logger.info("  %s: %d tasks", v, len(ts))
    
    return tasks


def scrape_other():
    """Scrape medical items, gear, containers."""
    categories = {
        "medical": "Medical Item",
        "gear": "Gear",
        "containers": "Containers",
        "loot": "Loot Containers",
    }
    
    for key, cat in categories.items():
        logger.info("=" * 60)
        logger.info("Scraping %s (category: %s)...", key, cat)
        pages = get_category_members(cat, limit=200)
        logger.info("Found %d pages", len(pages))
        
        items = []
        for p in pages:
            title = p["title"]
            soup = parse_page(title)
            info = parse_infobox(soup)
            
            item = {"name": title}
            for wiki_key in ("type", "weight", "effect", "uses", "capacity"):
                if wiki_key in info:
                    item[wiki_key] = info[wiki_key]
            
            img = get_page_image(title)
            if img:
                item["image"] = img
            
            items.append(item)
            time.sleep(0.3)
        
        if items:
            path = OUTPUT_DIR / f"{key}.json"
            with open(path, "w") as f:
                json.dump(items, f, indent=2)
            logger.info("✅ %s: %d saved", key, len(items))


# ─── Main ───

def main():
    parser = argparse.ArgumentParser(description="GZW Wiki Scraper v2")
    parser.add_argument("--weapons", action="store_true")
    parser.add_argument("--armor", action="store_true")
    parser.add_argument("--ammo", action="store_true")
    parser.add_argument("--attachments", action="store_true")
    parser.add_argument("--tasks", action="store_true")
    parser.add_argument("--other", action="store_true")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()
    
    if not any([args.weapons, args.armor, args.ammo, args.attachments, args.tasks, args.other, args.all]):
        args.all = True
    
    logger.info("🏴‍☠️ GZW Wiki Scraper v2")
    logger.info("Output: %s", OUTPUT_DIR)
    
    if args.all or args.weapons:
        scrape_weapons()
    if args.all or args.armor:
        scrape_armor()
    if args.all or args.ammo:
        scrape_ammo()
    if args.all or args.attachments:
        scrape_attachments()
    if args.all or args.tasks:
        scrape_tasks()
    if args.all or args.other:
        scrape_other()
    
    # Generate summary
    summaries = []
    for f in sorted(OUTPUT_DIR.glob("*.json")):
        try:
            with open(f) as fh:
                data = json.load(fh)
            summaries.append((f.stem, len(data) if isinstance(data, list) else "obj"))
        except:
            pass
    
    logger.info("=" * 60)
    logger.info("✅ Scrape complete! Files:")
    for name, count in sorted(summaries):
        logger.info("  %s.json: %s items", name, count)


if __name__ == "__main__":
    main()
