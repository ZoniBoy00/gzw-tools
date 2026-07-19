"""
GZW Wiki Scraper — Main entry point.
Uses MediaWiki API to fetch data from Fandom.
Run: python3 scrape.py [--tasks] [--weapons] [--armor] [--all]
"""

import argparse
import json
import logging
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("gzw-scraper")

OUTPUT_DIR = Path(__file__).parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)


def run_tasks():
    """Scrape all tasks using the MediaWiki API."""
    from wiki_parser import get_category_members, save_json

    logger.info("=" * 60)
    logger.info("Fetching tasks...")

    # Get task pages from all relevant categories
    categories = [
        "Main_tasks", "Side_tasks", "Contracts",
        "Tasks", "Task_items",
    ]

    all_pages = []
    seen = set()
    for cat in categories:
        pages = get_category_members(cat, limit=500)
        for p in pages:
            if p["title"] not in seen:
                seen.add(p["title"])
                p["category"] = cat
                all_pages.append(p)
        logger.info("  Category %s: %d pages", cat, len(pages))

    logger.info("Total unique task pages: %d", len(all_pages))

    # Parse each task page for detailed info
    from wiki_parser import get_page_html
    tasks = []

    for i, page in enumerate(all_pages):
        title = page["title"]
        category = page.get("category", "Tasks")
        logger.debug("  [%d/%d] %s", i + 1, len(all_pages), title)

        soup = get_page_html(title)
        if not soup:
            continue

        task = {
            "id": title.lower().replace(" ", "-").replace("'", "").replace(",", ""),
            "name": title,
            "vendor": "",
            "area": "",
            "type": "main" if "main" in category.lower()
                    else "side" if "side" in category.lower()
                    else "contract" if "contract" in category.lower() or "Contract" in category
                    else "unknown",
        }

        # Parse portable infobox
        infobox = soup.find("aside", class_=lambda c: c and "portable-infobox" in str(c))
        if infobox:
            for data_item in infobox.find_all("div", class_="pi-data"):
                label_el = data_item.find("h3", class_="pi-data-label")
                value_el = data_item.find("div", class_="pi-data-value")
                if label_el and value_el:
                    label = label_el.get_text(" ", strip=True).lower()
                    value = value_el.get_text(" ", strip=True)
                    if "vendor" in label:
                        task["vendor"] = value
                    elif "location" in label or "area" in label:
                        # Clean up "Kiu Vongsa , Nam Thaven , Pha Lang"
                        task["area"] = ", ".join(
                            a.strip() for a in value.replace("\u200b", "").split(",") if a.strip()
                        )

        # Extract objectives from page text
        content = soup.get_text(" ", strip=True)
        # Find the Objectives section
        obj_match = __import__('re').search(
            r'==\s*Objectives\s*==\s*(.+?)(?=\n==|\Z)',
            content, __import__('re').DOTALL
        )
        if obj_match:
            obj_text = obj_match.group(1).strip()
            objectives = []
            for line in obj_text.split("\n"):
                line = line.strip().strip("•-*")
                if line and len(line) > 5:
                    objectives.append(line)
            task["objectives"] = objectives[:5]  # Max 5 objectives

        tasks.append(task)

    if tasks:
        out_path = OUTPUT_DIR / "tasks.json"
        save_json(tasks, str(out_path))
        logger.info("✅ Tasks: %d saved", len(tasks))

        # Also save summary by vendor
        by_vendor = {}
        for t in tasks:
            v = t["vendor"] or "Unknown"
            if v not in by_vendor:
                by_vendor[v] = []
            by_vendor[v].append(t)
        for v, ts in sorted(by_vendor.items()):
            types = {}
            for t in ts:
                types[t["type"]] = types.get(t["type"], 0) + 1
            logger.info("  %s: %d tasks %s", v, len(ts), types)


def run_weapons():
    """Scrape weapons list from wiki."""
    from wiki_parser import get_category_members, get_page_html, save_json

    logger.info("=" * 60)
    logger.info("Fetching weapons...")

    pages = get_category_members("Weapons", limit=200)
    logger.info("Found %d weapon pages", len(pages))

    weapons = []
    for page in pages:
        title = page["title"]
        soup = get_page_html(title)
        if not soup:
            continue

        weapon = {"name": title}

        # Portable infobox
        infobox = soup.find("aside", class_=lambda c: c and "portable-infobox" in str(c))
        if infobox:
            for data_item in infobox.find_all("div", class_="pi-data"):
                label_el = data_item.find("h3", class_="pi-data-label")
                value_el = data_item.find("div", class_="pi-data-value")
                if label_el and value_el:
                    label = label_el.get_text(" ", strip=True).lower()
                    value = value_el.get_text(" ", strip=True)
                    if "caliber" in label or "calibre" in label:
                        weapon["caliber"] = value
                    elif "type" in label:
                        weapon["type"] = value
                    elif "magazine" in label or "capacity" in label:
                        weapon["magSize"] = value
                    elif "fire" in label:
                        weapon["fireRate"] = value

        if "caliber" in weapon or "type" in weapon:
            weapons.append(weapon)

    if weapons:
        out_path = OUTPUT_DIR / "weapons.json"
        save_json(weapons, str(out_path))
        logger.info("✅ Weapons: %d saved", len(weapons))


def main():
    parser = argparse.ArgumentParser(description="GZW Wiki Scraper")
    parser.add_argument("--tasks", action="store_true", help="Scrape tasks")
    parser.add_argument("--weapons", action="store_true", help="Scrape weapons")
    parser.add_argument("--armor", action="store_true", help="Scrape armor")
    parser.add_argument("--all", action="store_true", help="Scrape everything")
    args = parser.parse_args()

    if not any([args.tasks, args.weapons, args.armor, args.all]):
        args.all = True

    logger.info("🏴‍☠️ GZW Wiki Scraper")
    logger.info("Output: %s", OUTPUT_DIR)

    if args.all or args.tasks:
        run_tasks()
    if args.all or args.weapons:
        run_weapons()

    logger.info("=" * 60)
    logger.info("✅ Done! Files in: %s", OUTPUT_DIR)


if __name__ == "__main__":
    main()
