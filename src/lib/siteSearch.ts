export interface SiteSearchItem {
  id: string;
  title: string;
  type: string;
  detail: string;
  path: string;
  keywords?: string;
  searchParams?: Record<string, string>;
}

export function searchSite(items: SiteSearchItem[], query: string, limit = 12): SiteSearchItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];
  return items
    .map((item, index) => {
      const text = `${item.title} ${item.type} ${item.detail} ${item.keywords ?? ''}`.toLocaleLowerCase();
      const title = item.title.toLocaleLowerCase();
      const score = title === normalized ? 0 : title.startsWith(normalized) ? 1 : title.includes(normalized) ? 2 : text.includes(normalized) ? 3 : Number.POSITIVE_INFINITY;
      return { item, index, score };
    })
    .filter(result => Number.isFinite(result.score))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit)
    .map(result => result.item);
}
