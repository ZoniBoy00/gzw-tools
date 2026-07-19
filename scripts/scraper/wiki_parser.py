"""
GZW Wiki Scraper — Using Fandom MediaWiki API.
Much more reliable than HTML scraping.
"""

import json
import logging
import re
import time
from typing import Optional
from urllib.parse import quote, urljoin

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

API_URL = "https://gray-zone-warfare.fandom.com/api.php"
BASE_URL = "https://gray-zone-warfare.fandom.com/wiki/"

S = requests.Session()
S.headers.update({
    "User-Agent": "GZW-Tools/1.0 (community tool; github.com/ZoniBoy00/gzw-tools)",
    "Accept": "application/json",
})


def api_call(params: dict, max_retries: int = 3) -> Optional[dict]:
    """Make a MediaWiki API call with retries."""
    params["format"] = "json"
    for attempt in range(max_retries):
        try:
            resp = S.get(API_URL, params=params, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning("API call failed (attempt %d/%d): %s", attempt + 1, max_retries, e)
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
    return None


def get_category_members(category: str, limit: int = 500) -> list[dict]:
    """Get all pages in a category."""
    pages = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{category}",
        "cmlimit": min(limit, 500),
    }

    while True:
        data = api_call(params)
        if not data:
            break

        members = data.get("query", {}).get("categorymembers", [])
        pages.extend(members)

        if "continue" in data and "cmcontinue" in data["continue"]:
            params["cmcontinue"] = data["continue"]["cmcontinue"]
        else:
            break

    return pages


def get_page_html(title: str) -> Optional[BeautifulSoup]:
    """Get parsed HTML content of a wiki page."""
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

    return BeautifulSoup(html, "lxml")


def get_page_extract(title: str) -> Optional[str]:
    """Get plain text extract of a page."""
    params = {
        "action": "query",
        "prop": "extracts",
        "titles": title,
        "explaintext": True,
        "exlimit": 1,
    }
    data = api_call(params)
    if not data:
        return None

    pages = data.get("query", {}).get("pages", {})
    for pid, info in pages.items():
        if pid != "-1":
            return info.get("extract", "")
    return None


def search_pages(search_term: str, limit: int = 50) -> list[dict]:
    """Search for pages by title."""
    params = {
        "action": "query",
        "list": "search",
        "srsearch": search_term,
        "srlimit": min(limit, 500),
    }
    data = api_call(params)
    if not data:
        return []
    return data.get("query", {}).get("search", [])


def extract_tables_from_html(soup: BeautifulSoup) -> list[dict]:
    """Extract tables from parsed HTML and convert to structured data."""
    tables = []
    for table in soup.find_all("table", class_=re.compile(r"wikitable|article-table|sortable|fandom-table|portable-infobox|pi-horizontal-group")):
        rows = table.find_all("tr")
        if not rows:
            continue

        # Get headers
        headers = []
        header_cells = rows[0].find_all(["th", "td"])
        for cell in header_cells:
            text = cell.get_text(" ", strip=True)
            text = re.sub(r"\s*\[edit\]\s*", "", text).strip()
            headers.append(text or f"col_{len(headers)}")

        # Get data rows
        data = []
        for row in rows[1:]:
            cells = row.find_all(["td", "th"])
            if not cells or (len(cells) == 1 and cells[0].get("colspan")):
                continue

            row_data = {}
            for i, cell in enumerate(cells):
                if i < len(headers):
                    for br in cell.find_all("br"):
                        br.replace_with("\n")
                    text = cell.get_text(" ", strip=True)
                    text = re.sub(r"\s+", " ", text).strip()

                    links = []
                    for link in cell.find_all("a"):
                        href = link.get("href", "")
                        if href and not href.startswith("#"):
                            links.append({
                                "text": link.get_text(strip=True),
                                "url": urljoin(BASE_URL, href) if not href.startswith("http") else href,
                            })

                    row_data[headers[i]] = {
                        "text": text,
                        "links": links,
                    } if links else text

            if row_data:
                data.append(row_data)

        if data:
            tables.append({"headers": headers, "rows": data})

    return tables


def save_json(data, path: str):
    """Save as JSON."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info("Saved to %s", path)
