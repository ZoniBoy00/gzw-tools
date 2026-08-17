/**
 * GZW Wiki client — fetches and parses task pages from the GZW Fandom wiki.
 * The gzw-data API only exposes basic task metadata (name, vendor, location),
 * so detailed quest info (briefing, objectives, required items, rewards) is
 * fetched on-demand from the wiki's MediaWiki API (CORS-enabled via origin=*).
 */

const WIKI_API = 'https://gray-zone-warfare.fandom.com/api.php';

export interface TaskReward {
  level: number; // 0 = main reward, 1 = sub-note (e.g. "after first completion")
  text: string;
}

export interface TaskWikiData {
  title: string;
  vendor: string;
  location: string;
  previous: string;
  next: string;
  briefing: string;
  objectives: string[];
  requiredItems: { item: string; amount: string; notes: string }[];
  rewards: TaskReward[];
  guide: string;
}

const cache = new Map<string, TaskWikiData>();

export function wikiTaskUrl(name: string): string {
  return `https://gray-zone-warfare.fandom.com/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`;
}

export async function fetchTaskWiki(name: string): Promise<TaskWikiData> {
  const cached = cache.get(name);
  if (cached) return cached;

  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(name)}&prop=wikitext&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wiki ${res.status}: ${res.statusText}`);
  const body = await res.json();
  const wikitext: string | undefined = body?.parse?.wikitext?.['*'];
  if (!wikitext) throw new Error('Page not found on wiki');

  const parsed = parseTaskWikitext(wikitext, name);
  cache.set(name, parsed);
  return parsed;
}

// ─── Wikitext parsing ───

function parseTaskWikitext(wikitext: string, fallbackTitle: string): TaskWikiData {
  const infobox = parseInfobox(wikitext);
  const sections = parseSections(wikitext);

  const briefing = cleanText(sections['Briefing'] || '');
  const objectives = parseObjectives(sections['Objectives'] || '');
  const requiredItems = parseRequiredItems(wikitext);
  const rewards = parseRewards(sections['Rewards'] || '');
  const guide = cleanText(
    (sections['Guide'] || '')
      .replace(/\{\|[\s\S]*?\|\}/g, '') // drop tables (items are shown separately)
      .replace(/^={2,4}\s*([^=\n]+?)\s*={2,4}\s*$/gm, '\n$1\n'), // unwrap sub-headers
  );

  return {
    title: infobox.title || fallbackTitle,
    vendor: cleanText(infobox.vendor || ''),
    location: cleanText(infobox.location || ''),
    previous: cleanText(infobox.previous || ''),
    next: cleanText(infobox.next || ''),
    briefing,
    objectives,
    requiredItems,
    rewards,
    guide,
  };
}

/** Extract key=value pairs from the {{Infobox quest ...}} template. */
function parseInfobox(wikitext: string): Record<string, string> {
  const out: Record<string, string> = {};
  const m = wikitext.match(/\{\{\s*Infobox quest([\s\S]*?)\n\}\}/i);
  if (!m) return out;
  const body = m[1];
  // Match "key =value" lines (value may span multiple lines)
  const re = /^\s*\|?\s*([a-z_]+)\s*=\s*([\s\S]*?)(?=^\s*\|?\s*[a-z_]+\s*=|$)/gim;
  let match;
  while ((match = re.exec(body)) !== null) {
    out[match[1].toLowerCase()] = match[2].trim();
  }
  return out;
}

/** Split wikitext into sections by ==Header== markers (ignores === sub-headers). */
function parseSections(wikitext: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const re = /^==(?!=)(.+?)(?<!=)==\s*$/gm;
  const matches = [...wikitext.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : wikitext.length;
    sections[name] = wikitext.slice(start, end);
  }
  return sections;
}

/** Parse bullet-list objectives into a flat list (supports nested ** sub-bullets). */
function parseObjectives(content: string): string[] {
  const lines = content.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\*\*?\s*(.+)$/);
    if (m) out.push(cleanText(m[1]));
  }
  return out;
}

/** Parse reward bullets: "* main" and "** sub-note" lines into a structured list. */
function parseRewards(content: string): TaskReward[] {
  const out: TaskReward[] = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^(\*+)\s*(.+)$/);
    if (!m) continue;
    const text = cleanText(m[2]);
    if (!text) continue;
    out.push({ level: m[1].length - 1, text });
  }
  return out;
}

/** Parse the Required Items table inside the Guide section. */
function parseRequiredItems(content: string): { item: string; amount: string; notes: string }[] {
  const out: { item: string; amount: string; notes: string }[] = [];
  const tableRe = /\{\|[\s\S]*?\|\}/g;
  const tables = content.match(tableRe) || [];
  for (const table of tables) {
    if (!/Item name/i.test(table)) continue;
    // Header cells are on lines starting with "!" before the first data row
    const headerCells = table
      .split('\n')
      .filter((l) => l.startsWith('!'))
      .map((l) => cleanText(l.slice(1)));
    const colItem = headerCells.findIndex((h) => /item name/i.test(h));
    const colAmount = headerCells.findIndex((h) => /amount/i.test(h));
    const colNotes = headerCells.findIndex((h) => /notes/i.test(h));
    if (colItem === -1) continue;

    // Line-based row parsing (handles multi-line cells, skips headers)
    const rows: string[][] = [];
    let current: string[] = [];
    for (const raw of table.split('\n')) {
      const line = raw.trim();
      if (line.startsWith('|-') || line === '|}') {
        if (current.length) rows.push(current);
        current = [];
        continue;
      }
      if (!line.startsWith('|')) continue; // skip "!" headers, "{|" start, etc.
      current.push(line.slice(1).trim());
    }
    if (current.length) rows.push(current);

    for (const row of rows) {
      const item = cleanText(row[colItem] || '');
      if (!item) continue;
      const amount = colAmount >= 0 ? cleanText(row[colAmount] || '') : '';
      const notes = colNotes >= 0 ? cleanText(row[colNotes] || '') : '';
      out.push({ item, amount, notes });
    }
  }
  return out;
}

/** Strip wiki markup and HTML from a block of text. */
function cleanText(text: string): string {
  let t = text;
  // Remove comments
  t = t.replace(/<!--[\s\S]*?-->/g, '');
  // Remove <ref> footnotes
  t = t.replace(/<ref[\s\S]*?<\/ref>/g, '');
  t = t.replace(/<ref[^>]*\/>/g, '');
  // Remove galleries (image strips)
  t = t.replace(/<gallery[\s\S]*?<\/gallery>/gi, '');
  // Unpack <tabber> tabs: keep each tab's content, drop the tab name
  t = t.replace(/<tabber>([\s\S]*?)<\/tabber>/gi, (_m, inner: string) =>
    inner
      .split(/\|-\|/)
      .map((tab) => tab.replace(/^[^=\n]*=\s*/, ''))
      .join('\n'),
  );
  // Remove file/image links
  t = t.replace(/\[\[(?:File|Image|Category):[\s\S]*?\]\]/gi, '');
  // Convert [[Link|text]] → text, [[Link]] → Link
  t = t.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  t = t.replace(/\[\[([^\]]+)\]\]/g, '$1');
  // Remove templates: {{Quote|...}} keeps inner text, others removed
  t = t.replace(/\{\{Quote\|([\s\S]*?)\}\}/gi, '$1');
  t = t.replace(/\{\{[\s\S]*?\}\}/g, '');
  // Strip remaining HTML tags
  t = t.replace(/<[^>]+>/g, '');
  // Decode common entities
  t = t.replace(/&nbsp;/gi, ' ');
  t = t.replace(/&amp;/gi, '&');
  t = t.replace(/&quot;/gi, '"');
  t = t.replace(/&#39;/g, "'");
  t = t.replace(/&lt;/gi, '<');
  t = t.replace(/&gt;/gi, '>');
  // Remove bold/italic markers
  t = t.replace(/'''/g, '').replace(/''/g, '');
  // Collapse whitespace
  t = t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return t;
}