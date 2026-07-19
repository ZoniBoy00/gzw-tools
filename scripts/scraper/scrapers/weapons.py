"""
GZW Wiki Scraper — Weapons scraper.
Extracts weapon data from the Weapons page.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import re

from wiki_parser import fetch_page, parse_table, save_json

logger = logging.getLogger(__name__)

WEAPONS_PAGE = "Weapons"
OUTPUT_PATH = "data/weapons.json"


def scrape() -> list[dict]:
    """Scrape weapon data from the wiki."""
    logger.info("Fetching Weapons page...")
    soup = fetch_page(WEAPONS_PAGE)
    if not soup:
        logger.error("Could not fetch Weapons page")
        return []

    # Clean
    for aside in soup.find_all("aside"):
        aside.decompose()
    for script in soup.find_all("script"):
        script.decompose()

    tables = soup.find_all("table", class_=re.compile(r"wikitable|article-table|sortable"))
    weapons = []

    for table in tables:
        parsed = parse_table(table)
        for row in parsed:
            weapon = _parse_weapon_row(row)
            if weapon:
                weapons.append(weapon)

    logger.info("Scraped %d weapons", len(weapons))
    return weapons


def _parse_weapon_row(row: dict) -> dict | None:
    """Parse a single weapon row."""
    name = ""
    caliber = ""
    weapon_type = ""
    mag_size = ""
    fire_rate = ""
    source = ""

    for key, value in row.items():
        key_lower = key.lower().strip()
        text = value if isinstance(value, str) else value.get("text", "")

        if "name" in key_lower:
            name = text
        elif "caliber" in key_lower or "cartridge" in key_lower:
            caliber = text
        elif "type" in key_lower and not weapon_type:
            weapon_type = text
        elif "mag" in key_lower or "capacity" in key_lower:
            mag_size = re.sub(r"[^0-9]", "", text)
        elif "fire" in key_lower or "rate" in key_lower or "rpm" in key_lower:
            fire_rate = re.sub(r"[^0-9]", "", text)
        elif "source" in key_lower or "vendor" in key_lower or "obtain" in key_lower:
            source = text
        elif not name and not caliber and not weapon_type:
            # Might be a first-column name
            if not name and text:
                name = text

    if not name:
        return None

    return {
        "name": name,
        "caliber": caliber,
        "type": weapon_type,
        "magSize": int(mag_size) if mag_size and mag_size.isdigit() else None,
        "fireRate": int(fire_rate) if fire_rate and fire_rate.isdigit() else None,
        "source": source,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    data = scrape()
    if data:
        save_json(data, OUTPUT_PATH)
        logger.info("Saved %d weapons", len(data))
