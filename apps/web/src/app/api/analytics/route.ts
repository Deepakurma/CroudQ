import { NextResponse } from 'next/server';

import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.NEXT_PUBLIC_GA4_PROPERTY_ID;
const saJson = process.env.NEXT_PUBLIC_GA_SA_JSON;
const CACHE_TTL = Number(process.env.NEXT_PUBLIC_ANALYTICS_CACHE_TTL || '300');

type Row = { date: string; views: number };
type AnalyticsCacheData = {
  yesterday: number;
  today: number;
  lastWeek: number;
  week: number;
  lastMonth: number;
  month: number;
  rows: Row[];
};

let cache: { ts: number; data: AnalyticsCacheData } | null = null;

/**
 * Generates an array of dates (YYYY-MM-DD) starting from 'days' ago up to today.
 * @param days The number of days to look back (e.g., 61 for 62 total days including today).
 * @returns An array of date strings.
 */
function getReportDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

async function getReport(): Promise<AnalyticsCacheData> {
  // 1. Cache Check (Efficiency)
  if (cache && (Date.now() - cache.ts) / 1000 < CACHE_TTL) return cache.data;

  // Set the total days for the GA query: 61 days ago + today = 62 days
  const DAYS_TOTAL = 61; // Used for the GA query date range, resulting in 62 days of data

  const client = saJson
    ? new BetaAnalyticsDataClient({ credentials: JSON.parse(saJson) })
    : new BetaAnalyticsDataClient();

  // 2. Fetch Data from GA4
  const [resp] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${DAYS_TOTAL}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'screenPageViews' }]
  });

  // 3. Pre-Process and Initialize Data Structures (Efficiency & Accuracy)

  const dateRange = getReportDateRange(DAYS_TOTAL);

  // Initialize rows with all required dates and 0 views
  const rows: Row[] = dateRange.map((date) => ({ date, views: 0 }));

  // Create a map for quick lookups using the YYYY-MM-DD format
  const gaDataMap = new Map<string, number>();
  (resp.rows || []).forEach((r) => {
    const gaDate = r.dimensionValues?.[0]?.value || ''; // Format YYYYMMDD
    const views = Number(r.metricValues?.[0]?.value || 0);
    if (gaDate) {
      // Convert YYYYMMDD to YYYY-MM-DD
      const formattedDate = `${gaDate.slice(0, 4)}-${gaDate.slice(4, 6)}-${gaDate.slice(6, 8)}`;
      gaDataMap.set(formattedDate, views);
    }
  });

  // 4. Fill Rows and Calculate Stats in One Pass (Efficiency)
  let sum7 = 0; // Last 7 days
  let sum14 = 0; // Last 14 days
  let sum30 = 0; // Last 30 days
  let sum60 = 0; // Last 60 days (for lastMonth calculation)

  const NUM_ROWS = rows.length; // Should be 62 (for 61 days ago + today)

  for (let i = 0; i < NUM_ROWS; i++) {
    const row = rows[i];

    // Get view count (0 if missing)
    const views = gaDataMap.get(row.date) ?? 0;
    row.views = views;

    // Days ago: 0 is today, 1 is yesterday, ... 61 is the oldest day
    const daysAgo = NUM_ROWS - 1 - i;

    // Sum the latest data
    if (daysAgo < 7) sum7 += views;
    if (daysAgo < 14) sum14 += views;
    if (daysAgo < 30) sum30 += views;
    if (daysAgo < 60) sum60 += views;
  }

  // 5. Final Payload Construction
  const lastRow = rows[NUM_ROWS - 1]; // Today
  // Use the third-to-last row as the safe "yesterday" if the array size is unexpected
  const prevRow = rows[NUM_ROWS - 2] ?? { views: 0 };

  const payload: AnalyticsCacheData = {
    today: lastRow.views,
    yesterday: prevRow.views,
    week: sum7,
    lastWeek: sum14 - sum7, // Sum of days 7 to 13 ago
    month: sum30,
    lastMonth: sum60 - sum30, // Sum of days 30 to 59 ago
    rows: rows.slice(-30) // Only return the last 30 days for display
  };

  // 6. Update Cache
  cache = { ts: Date.now(), data: payload };
  return payload;
}

// --- Next.js API Route Handler ---

export async function GET() {
  try {
    const data = await getReport();
    // Use the built-in NextResponse.json which handles serialisation and headers
    return NextResponse.json(data);
  } catch (err) {
    console.error('Analytics error', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
