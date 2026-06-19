import { getGoogleAccessToken } from "./auth";

const BASE = "https://analyticsdata.googleapis.com/v1beta";

async function runReport(propertyId: string, body: Record<string, unknown>) {
  const token = await getGoogleAccessToken();
  const res = await fetch(`${BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 Data API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export type Ga4Summary = {
  current: { sessions: number; activeUsers: number; pageViews: number };
  previous: { sessions: number; activeUsers: number; pageViews: number };
  trend: { date: string; sessions: number; activeUsers: number; pageViews: number }[];
  topPages: { path: string; title: string; pageViews: number }[];
  channels: { channel: string; sessions: number }[];
};

function formatDate(d: string) {
  // "20260619" -> "06/19"
  return `${d.slice(4, 6)}/${d.slice(6, 8)}`;
}

export async function fetchGa4Summary(propertyId: string): Promise<Ga4Summary> {
  const metrics = [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }];

  const [summaryRes, trendRes, topPagesRes, channelRes] = await Promise.all([
    runReport(propertyId, {
      dateRanges: [
        { startDate: "27daysAgo", endDate: "today" },
        { startDate: "55daysAgo", endDate: "28daysAgo" },
      ],
      metrics,
    }),
    runReport(propertyId, {
      dateRanges: [{ startDate: "27daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics,
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport(propertyId, {
      dateRanges: [{ startDate: "27daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),
    runReport(propertyId, {
      dateRanges: [{ startDate: "27daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
  ]);

  const summaryRows = summaryRes.rows ?? [];
  const toTotals = (row: any) => ({
    sessions: Number(row?.metricValues?.[0]?.value ?? 0),
    activeUsers: Number(row?.metricValues?.[1]?.value ?? 0),
    pageViews: Number(row?.metricValues?.[2]?.value ?? 0),
  });

  return {
    current: toTotals(summaryRows[0]),
    previous: toTotals(summaryRows[1]),
    trend: (trendRes.rows ?? []).map((row: any) => ({
      date: formatDate(row.dimensionValues[0].value),
      sessions: Number(row.metricValues[0].value),
      activeUsers: Number(row.metricValues[1].value),
      pageViews: Number(row.metricValues[2].value),
    })),
    topPages: (topPagesRes.rows ?? []).map((row: any) => ({
      path: row.dimensionValues[0].value,
      title: row.dimensionValues[1].value,
      pageViews: Number(row.metricValues[0].value),
    })),
    channels: (channelRes.rows ?? []).map((row: any) => ({
      channel: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0].value),
    })),
  };
}
