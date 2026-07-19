"""
GZW Wiki Scraper — Tasks scraper using MediaWiki API.
Fetches tasks by listing category members and parsing each task page.
"""

import logging
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from wiki_parser import get_category_members, get_page_html, save_json

logger = logging.getLogger(__name__)

OUTPUT_PATH = "data/tasks.json"


def scrape() -> list[dict]:
    """Scrape all tasks from the wiki."""
    logger.info("Fetching task list from category...")

    # Get all task pages
    task_pages = get_category_members("Tasks", limit=500)
    logger.info("Found %d task pages in category", len(task_pages))

    # Also get subcategories
    subcats = get_category_members("Tasks", limit=50)
    for cat in subcats:
        if "ns" in cat and cat.get("ns") == 14:  # Subcategory
            sub_pages = get_category_members(cat["title"].replace("Category:", ""), limit=200)
            task_pages.extend(sub_pages)
            logger.info("  + %d from subcategory %s", len(sub_pages), cat["title"])

    # Deduplicate
    seen = set()
    unique_pages = []
    for p in task_pages:
        if p["title"] not in seen:
            seen.add(p["title"])
            unique_pages.append(p)

    logger.info("Total unique task pages: %d", len(unique_pages))

    # Parse each task page
    tasks = []
    for i, page in enumerate(unique_pages):
        title = page["title"]
        logger.debug("  [%d/%d] Parsing: %s", i + 1, len(unique_pages), title)

        task = parse_task_page(title)
        if task:
            task["id"] = title.lower().replace(" ", "-").replace("'", "")
            tasks.append(task)

    logger.info("Successfully parsed %d/%d tasks", len(tasks), len(unique_pages))
    return tasks


def parse_task_page(title: str) -> dict | None:
    """Parse a single task page."""
    try:
        soup = get_page_html(title)
        if not soup:
            return None

        task = {
            "name": title,
            "objectives": [],
            "vendor": "",
            "area": "",
            "type": "unknown",
            "difficulty": "",
            "requirements": [],
            "rewards": [],
            "hasImage": False,
        }

        # Extract portable infobox data
        infobox = soup.find("aside", class_=lambda c: c and "portable-infobox" in str(c))
        if infobox:
            # Title
            title_el = infobox.find("h2", class_="pi-title")
            if title_el:
                task["name"] = title_el.get_text(" ", strip=True)

            # Data items
            for data_item in infobox.find_all("div", class_="pi-data"):
                label_el = data_item.find("h3", class_="pi-data-label")
                value_el = data_item.find("div", class_="pi-data-value")
                if label_el and value_el:
                    label = label_el.get_text(" ", strip=True).lower()
                    value = value_el.get_text(" ", strip=True)

                    if "vendor" in label:
                        task["vendor"] = value
                    elif "type" in label or "category" in label:
                        task["type"] = value.lower()
                        if "main" in value.lower():
                            task["type"] = "main"
                        elif "side" in value.lower():
                            task["type"] = "side"
                        elif "contract" in value.lower():
                            task["type"] = "contract"
                    elif "area" in label or "location" in label:
                        task["area"] = value
                    elif "difficulty" in label or "difficult" in label:
                        task["difficulty"] = value
                    elif "requirement" in label or "prerequisite" in label or "previous" in label:
                        task["requirements"] = [v.strip() for v in value.split(",") if v.strip()]
                    elif "reward" in label:
                        task["rewards"] = [v.strip() for v in value.split("\n") if v.strip()]
                    elif "next" in label:
                        task["next"] = value

        # Extract objectives from the page text
        content = soup.get_text(" ", strip=True)
        objective_patterns = [
            r"Objectives?\s*[:\n](.+?)(?:\n\n|Tasks?[:\n]|Rewards?[:\n]|$)",
            r"Objective[:\n](.+?)(?:\n\n|Tasks?[:\n]|Reward|$)",
        ]
        for pattern in objective_patterns:
            match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
            if match:
                objectives_text = match.group(1).strip()
                objectives = [o.strip() for o in objectives_text.split("\n") if o.strip() and len(o.strip()) > 5]
                if objectives:
                    task["objectives"] = objectives
                    break

        # Check for images
        if soup.find("img", class_=re.compile(r"thumb|infobox")):
            task["hasImage"] = True

        return task

    except Exception as e:
        logger.warning("Failed to parse task '%s': %s", title, e)
        return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    data = scrape()
    if data:
        save_json(data, OUTPUT_PATH)
        logger.info("Total: %d tasks saved", len(data))
