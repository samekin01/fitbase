import { createAdminClient } from "@/lib/supabase/admin";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  UsersIcon,
  ClipboardListIcon as UpdateIcon,
  InboxIcon,
  ChartBarIcon,
  SearchIcon,
  GlobeAltIcon,
  TrophyIcon,
} from "@/components/ui/Icons";
import { isGoogleApiConfigured } from "@/lib/google/auth";
import { fetchGa4Summary } from "@/lib/google/analytics";
import { fetchGscSummary } from "@/lib/google/search-console";
import { TrendChart } from "@/components/admin/AnalyticsCharts";

export const dynamic = "force-dynamic";
export const metadata = { title: "ダッシュボード | FitBase CMS" };

type Stat = {
  label: string;
  value: number;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  bg: string;
};

function StatCard({ stat }: { stat: Stat }) {
  return (
    <a href={stat.href} className="admin-stat-card">
      <span className="admin-stat-card__icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
        <stat.icon size={22} />
      </span>
      <div>
        <p className="admin-stat-card__label">{stat.label}</p>
        <p className="admin-stat-card__value">{stat.value.toLocaleString()}</p>
      </div>
    </a>
  );
}

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "±0%";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

function changeColor(current: number, previous: number): string {
  if (current === previous) return "var(--color-gray-500)";
  return current > previous ? "var(--color-success)" : "var(--color-error)";
}

function SummaryMetric({
  label,
  value,
  previous,
  isPercent,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  previous?: number;
  isPercent?: boolean;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  const display = isPercent ? `${(value * 100).toFixed(1)}%` : value.toLocaleString();
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "30px",
          height: "30px",
          borderRadius: "8px",
          backgroundColor: bg,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div>
        <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.125rem" }}>{label}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>{display}</span>
          {previous !== undefined && (
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: changeColor(value, previous) }}>
              {pctChange(value, previous)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function buildInsights(
  ga4: { current: { sessions: number; activeUsers: number }; previous: { sessions: number; activeUsers: number } },
  gsc: { current: { clicks: number; position: number }; previous: { clicks: number; position: number } }
): string[] {
  const insights: string[] = [];

  const sessionsPct = ga4.previous.sessions === 0 ? null : ((ga4.current.sessions - ga4.previous.sessions) / ga4.previous.sessions) * 100;
  if (sessionsPct !== null) {
    insights.push(
      sessionsPct >= 0
        ? `サイトへの訪問数は前期間より${sessionsPct.toFixed(0)}%増えています。`
        : `サイトへの訪問数は前期間より${Math.abs(sessionsPct).toFixed(0)}%減っています。`
    );
  }

  const clicksPct = gsc.previous.clicks === 0 ? null : ((gsc.current.clicks - gsc.previous.clicks) / gsc.previous.clicks) * 100;
  if (clicksPct !== null) {
    insights.push(
      clicksPct >= 0
        ? `検索結果からのクリック数は前期間より${clicksPct.toFixed(0)}%増えています。`
        : `検索結果からのクリック数は前期間より${Math.abs(clicksPct).toFixed(0)}%減っています。`
    );
  }

  const positionDiff = gsc.previous.position - gsc.current.position;
  if (Math.abs(positionDiff) >= 0.3) {
    insights.push(
      positionDiff > 0
        ? `Google検索での平均掲載順位が${positionDiff.toFixed(1)}位上がりました。`
        : `Google検索での平均掲載順位が${Math.abs(positionDiff).toFixed(1)}位下がりました。`
    );
  }

  if (insights.length === 0) insights.push("前期間と比べて大きな変化はありません。");
  return insights;
}

export default async function DashboardPage() {
  const supabase = createAdminClient();

  const [
    { count: totalGyms },
    { count: publishedGyms },
    { count: draftGyms },
    { count: pendingClaims },
    { count: pendingUpdates },
    { count: pendingDeletes },
    { count: unreadContacts },
    { data: recentGyms },
  ] = await Promise.all([
    supabase.from("gyms").select("*", { count: "exact", head: true }),
    supabase.from("gyms").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("gyms").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("gym_claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("gym_update_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("gym_delete_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "unread"),
    supabase
      .from("gyms")
      .select("id, name, status, updated_at, prefectures(name), cities(name)")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const ga4PropertyId = process.env.GA4_PROPERTY_ID;
  const gscSiteUrl = process.env.GSC_SITE_URL;
  const analyticsConfigured = isGoogleApiConfigured() && !!ga4PropertyId && !!gscSiteUrl;

  let ga4 = null as Awaited<ReturnType<typeof fetchGa4Summary>> | null;
  let gsc = null as Awaited<ReturnType<typeof fetchGscSummary>> | null;
  if (analyticsConfigured) {
    try {
      [ga4, gsc] = await Promise.all([fetchGa4Summary(ga4PropertyId!), fetchGscSummary(gscSiteUrl!)]);
    } catch {
      ga4 = null;
      gsc = null;
    }
  }

  const mergedTrend = ga4?.trend.map((g) => ({
    date: g.date,
    sessions: g.sessions,
    clicks: gsc?.trend.find((s) => s.date === g.date)?.clicks ?? 0,
  }));

  const gymStats: Stat[] = [
    {
      label: "ジム総数",
      value: totalGyms ?? 0,
      href: "/admin/gyms",
      icon: BuildingOfficeIcon,
      color: "var(--color-gray-700)",
      bg: "var(--color-gray-100)",
    },
    {
      label: "公開中",
      value: publishedGyms ?? 0,
      href: "/admin/gyms?status=published",
      icon: CheckCircleIcon,
      color: "var(--color-success)",
      bg: "#DCFCE7",
    },
    {
      label: "下書き",
      value: draftGyms ?? 0,
      href: "/admin/gyms?status=draft",
      icon: ClipboardListIcon,
      color: "var(--color-warning)",
      bg: "#FEF3C7",
    },
  ];

  const requestStats: Stat[] = [
    {
      label: "管理申請（未対応）",
      value: pendingClaims ?? 0,
      href: "/admin/requests/claims",
      icon: UsersIcon,
      color: "var(--color-error)",
      bg: "#FEE2E2",
    },
    {
      label: "修正依頼（未対応）",
      value: pendingUpdates ?? 0,
      href: "/admin/requests/updates",
      icon: UpdateIcon,
      color: "var(--color-error)",
      bg: "#FEE2E2",
    },
    {
      label: "削除依頼（未対応）",
      value: pendingDeletes ?? 0,
      href: "/admin/requests/deletes",
      icon: InboxIcon,
      color: "var(--color-error)",
      bg: "#FEE2E2",
    },
    {
      label: "未読問い合わせ",
      value: unreadContacts ?? 0,
      href: "/admin/requests/contacts",
      icon: InboxIcon,
      color: "var(--color-error)",
      bg: "#FEE2E2",
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        ダッシュボード
      </h1>

      {ga4 && gsc && (
        <>
          <h2 className="admin-section-title" style={{ marginTop: 0 }}>エグゼクティブサマリー（直近28日間）</h2>
          <div
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem 1.375rem",
              marginBottom: "1.75rem",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
              <SummaryMetric
                label="セッション数"
                value={ga4.current.sessions}
                previous={ga4.previous.sessions}
                icon={<ChartBarIcon size={16} />}
                color="#1558D6"
                bg="#E8EFFC"
              />
              <SummaryMetric
                label="ユーザー数"
                value={ga4.current.activeUsers}
                previous={ga4.previous.activeUsers}
                icon={<UsersIcon size={16} />}
                color="#16A34A"
                bg="#DCFCE7"
              />
              <SummaryMetric
                label="検索クリック数"
                value={gsc.current.clicks}
                previous={gsc.previous.clicks}
                icon={<SearchIcon size={16} />}
                color="#D97706"
                bg="#FEF3C7"
              />
              <SummaryMetric
                label="検索表示回数"
                value={gsc.current.impressions}
                previous={gsc.previous.impressions}
                icon={<GlobeAltIcon size={16} />}
                color="#7C3AED"
                bg="#F3E8FF"
              />
              <SummaryMetric
                label="平均掲載順位"
                value={Math.round(gsc.current.position * 10) / 10}
                icon={<TrophyIcon size={16} />}
                color="var(--color-gray-700)"
                bg="var(--color-gray-100)"
              />
            </div>

            <div style={{ borderTop: "1px solid var(--color-gray-100)", paddingTop: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.5rem" }}>
                セッション数・検索クリック数の推移
              </p>
              {mergedTrend && (
                <TrendChart
                  data={mergedTrend}
                  height={160}
                  lines={[
                    { key: "sessions", label: "セッション数", color: "#1558D6" },
                    { key: "clicks", label: "検索クリック数", color: "#D97706" },
                  ]}
                />
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.375rem" }}>
                  人気ページ TOP3
                </p>
                {ga4.topPages.slice(0, 3).map((p) => (
                  <div
                    key={p.path}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      fontSize: "0.8125rem",
                      padding: "0.375rem 0",
                      borderBottom: "1px solid var(--color-gray-100)",
                    }}
                  >
                    <span style={{ color: "var(--color-gray-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title || p.path}
                    </span>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>{p.pageViews.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.375rem" }}>
                  人気検索キーワード TOP3
                </p>
                {gsc.topQueries.slice(0, 3).map((q) => (
                  <div
                    key={q.query}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      fontSize: "0.8125rem",
                      padding: "0.375rem 0",
                      borderBottom: "1px solid var(--color-gray-100)",
                    }}
                  >
                    <span style={{ color: "var(--color-gray-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.query}
                    </span>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>{q.clicks.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--color-gray-100)", paddingTop: "0.875rem" }}>
              {buildInsights(ga4, gsc).map((line) => (
                <p key={line} style={{ fontSize: "0.8125rem", color: "var(--color-gray-700)", lineHeight: 1.7 }}>
                  ・{line}
                </p>
              ))}
            </div>
            <a
              href="/admin/analytics"
              style={{ display: "inline-block", marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--color-link)", fontWeight: 600 }}
            >
              詳細を見る →
            </a>
          </div>
        </>
      )}

      {!analyticsConfigured && (
        <div
          style={{
            backgroundColor: "var(--color-gray-50)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "0.875rem 1.125rem",
            marginBottom: "1.75rem",
            fontSize: "0.8125rem",
            color: "var(--color-gray-600)",
          }}
        >
          アナリティクス連携が未設定です。設定すると、ここにアクセス状況のサマリーが表示されます。
          <a href="/admin/analytics" style={{ marginLeft: "0.5rem", color: "var(--color-link)", fontWeight: 600 }}>
            設定方法を見る →
          </a>
        </div>
      )}

      <h2 className="admin-section-title">ジム統計</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {gymStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <h2 className="admin-section-title">対応待ち</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {requestStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {recentGyms && recentGyms.length > 0 && (
        <>
          <h2 className="admin-section-title">最近更新されたジム</h2>
          <div
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <table className="data-table">
              <tbody>
                {recentGyms.map((gym: any) => (
                  <tr key={gym.id}>
                    <td style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      <a href={`/admin/gyms/${gym.id}`} style={{ color: "var(--color-gray-900)" }}>
                        {gym.name}
                      </a>
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
                      {gym.prefectures?.name}
                      {gym.cities?.name ? ` ${gym.cities.name}` : ""}
                    </td>
                    <td style={{ fontSize: "0.75rem" }}>
                      <span
                        style={{
                          padding: "0.125rem 0.5rem",
                          borderRadius: "4px",
                          fontWeight: 600,
                          backgroundColor: gym.status === "published" ? "#DCFCE7" : "#FEF3C7",
                          color: gym.status === "published" ? "var(--color-success)" : "var(--color-warning)",
                        }}
                      >
                        {gym.status === "published" ? "公開中" : "下書き"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {new Date(gym.updated_at).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
