import { getGoogleAccessToken } from "./auth";

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function queryAnalytics(siteUrl: string, body: Record<string, unknown>) {
  const token = await getGoogleAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Search Console API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

type Totals = { clicks: number; impressions: number; ctr: number; position: number };

export type GscSummary = {
  current: Totals;
  previous: Totals;
  trend: { date: string; clicks: number; impressions: number }[];
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
};

function toTotals(row: any): Totals {
  return {
    clicks: row?.clicks ?? 0,
    impressions: row?.impressions ?? 0,
    ctr: row?.ctr ?? 0,
    position: row?.position ?? 0,
  };
}

export async function fetchGscSummary(siteUrl: string): Promise<GscSummary> {
  const [currentRes, previousRes, trendRes, queriesRes, pagesRes] = await Promise.all([
    queryAnalytics(siteUrl, { startDate: dateStr(27), endDate: dateStr(0) }),
    queryAnalytics(siteUrl, { startDate: dateStr(55), endDate: dateStr(28) }),
    queryAnalytics(siteUrl, { startDate: dateStr(27), endDate: dateStr(0), dimensions: ["date"] }),
    queryAnalytics(siteUrl, { startDate: dateStr(27), endDate: dateStr(0), dimensions: ["query"], rowLimit: 25 }),
    queryAnalytics(siteUrl, { startDate: dateStr(27), endDate: dateStr(0), dimensions: ["page"], rowLimit: 25 }),
  ]);

  const queries = (queriesRes.rows ?? [])
    .map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }))
    .sort((a: any, b: any) => b.clicks - a.clicks)
    .slice(0, 10);

  const pages = (pagesRes.rows ?? [])
    .map((row: any) => ({ page: row.keys[0], clicks: row.clicks, impressions: row.impressions }))
    .sort((a: any, b: any) => b.clicks - a.clicks)
    .slice(0, 10);

  return {
    current: toTotals(currentRes.rows?.[0]),
    previous: toTotals(previousRes.rows?.[0]),
    trend: (trendRes.rows ?? []).map((row: any) => ({
      date: `${row.keys[0].slice(5, 7)}/${row.keys[0].slice(8, 10)}`,
      clicks: row.clicks,
      impressions: row.impressions,
    })),
    topQueries: queries,
    topPages: pages,
  };
}
