import { isGoogleApiConfigured } from "@/lib/google/auth";
import { fetchGa4Summary, type Ga4Summary } from "@/lib/google/analytics";
import { fetchGscSummary, type GscSummary } from "@/lib/google/search-console";
import { TrendChart } from "@/components/admin/AnalyticsCharts";

export const dynamic = "force-dynamic";
export const metadata = { title: "アナリティクス | FitBase CMS" };

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

function MetricCard({
  label,
  value,
  previous,
  caption,
  isPercent,
}: {
  label: string;
  value: number;
  previous?: number;
  caption?: string;
  isPercent?: boolean;
}) {
  const display = isPercent ? `${(value * 100).toFixed(1)}%` : value.toLocaleString();
  return (
    <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1rem 1.125rem" }}>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "0.25rem" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.625rem", fontWeight: 700, color: "var(--color-gray-900)" }}>{display}</span>
        {previous !== undefined && (
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: changeColor(value, previous) }}>
            {pctChange(value, previous)}
          </span>
        )}
      </div>
      {caption && <p style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", marginTop: "0.25rem" }}>{caption}</p>}
    </div>
  );
}

function SetupGuide() {
  return (
    <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
      <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-gray-900)" }}>
        Google Analytics・Search Console連携が未設定です
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-600)", marginBottom: "1rem" }}>
        以下の環境変数を設定すると、このページにアクセス状況・検索結果での見え方が表示されるようになります。
      </p>
      <ol style={{ fontSize: "0.8125rem", color: "var(--color-gray-700)", lineHeight: 1.9, paddingLeft: "1.25rem" }}>
        <li>GA4プロパティを作成し、計測IDを <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code> に設定</li>
        <li>Search Consoleでサイトを確認し、確認用コードを <code>GOOGLE_SITE_VERIFICATION</code> に設定</li>
        <li>Google Cloudでサービスアカウントを作成し、JSON鍵を <code>GOOGLE_SERVICE_ACCOUNT_KEY</code> に設定</li>
        <li>そのサービスアカウントを、GA4プロパティとSearch Consoleプロパティの両方に「閲覧者」として追加</li>
        <li>GA4プロパティIDを <code>GA4_PROPERTY_ID</code>、Search ConsoleのプロパティURLを <code>GSC_SITE_URL</code> に設定</li>
      </ol>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem", color: "#B91C1C", fontSize: "0.875rem" }}>
      <strong>データの取得に失敗しました。</strong>
      <p style={{ marginTop: "0.375rem", whiteSpace: "pre-wrap" }}>{message}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const ga4PropertyId = process.env.GA4_PROPERTY_ID;
  const gscSiteUrl = process.env.GSC_SITE_URL;
  const configured = isGoogleApiConfigured() && !!ga4PropertyId && !!gscSiteUrl;

  let ga4: Ga4Summary | null = null;
  let gsc: GscSummary | null = null;
  let error: string | null = null;

  if (configured) {
    try {
      [ga4, gsc] = await Promise.all([fetchGa4Summary(ga4PropertyId!), fetchGscSummary(gscSiteUrl!)]);
    } catch (e: any) {
      error = e.message;
    }
  }

  return (
    <div style={{ maxWidth: "980px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        アナリティクス
      </h1>

      {!configured && <SetupGuide />}
      {configured && error && <ErrorCard message={error} />}

      {ga4 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 className="admin-section-title" style={{ marginTop: 0 }}>アクセス状況（直近28日間）</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "1rem" }}>
            <MetricCard label="セッション数" value={ga4.current.sessions} previous={ga4.previous.sessions} caption="サイトに訪れた回数" />
            <MetricCard label="ユーザー数" value={ga4.current.activeUsers} previous={ga4.previous.activeUsers} caption="訪れた人の数（重複なし）" />
            <MetricCard label="ページビュー数" value={ga4.current.pageViews} previous={ga4.previous.pageViews} caption="ページが見られた回数" />
          </div>

          <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1rem 1.125rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.5rem" }}>日別アクセス推移</p>
            <TrendChart
              data={ga4.trend}
              lines={[
                { key: "sessions", label: "セッション数", color: "#1558D6" },
                { key: "pageViews", label: "ページビュー数", color: "#16A34A" },
              ]}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", padding: "0.875rem 1rem 0.5rem" }}>人気ページ TOP10</p>
              <table className="data-table">
                <tbody>
                  {ga4.topPages.map((p) => (
                    <tr key={p.path}>
                      <td style={{ fontSize: "0.8125rem" }}>
                        <div style={{ fontWeight: 600 }}>{p.title || p.path}</div>
                        <div style={{ color: "var(--color-gray-400)", fontSize: "0.75rem" }}>{p.path}</div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{p.pageViews.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", padding: "0.875rem 1rem 0.5rem" }}>流入元の割合</p>
              <table className="data-table">
                <tbody>
                  {ga4.channels.map((c) => (
                    <tr key={c.channel}>
                      <td style={{ fontSize: "0.8125rem" }}>{c.channel}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{c.sessions.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {gsc && (
        <section>
          <h2 className="admin-section-title">検索結果での見え方（直近28日間）</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "1rem" }}>
            <MetricCard label="検索クリック数" value={gsc.current.clicks} previous={gsc.previous.clicks} caption="検索結果からサイトに来た回数" />
            <MetricCard label="検索表示回数" value={gsc.current.impressions} previous={gsc.previous.impressions} caption="検索結果に表示された回数" />
            <MetricCard
              label="クリック率"
              value={gsc.current.ctr}
              previous={gsc.previous.ctr}
              isPercent
              caption="表示された人の何%がクリックしたか"
            />
            <MetricCard label="平均掲載順位" value={Math.round(gsc.current.position * 10) / 10} caption="Google検索で平均何番目に表示されているか" />
          </div>

          <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1rem 1.125rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.5rem" }}>検索クリック・表示回数の推移</p>
            <TrendChart
              data={gsc.trend}
              lines={[
                { key: "clicks", label: "クリック数", color: "#1558D6" },
                { key: "impressions", label: "表示回数", color: "#D97706" },
              ]}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", padding: "0.875rem 1rem 0.5rem" }}>人気検索キーワード TOP10</p>
              <table className="data-table">
                <tbody>
                  {gsc.topQueries.map((q) => (
                    <tr key={q.query}>
                      <td style={{ fontSize: "0.8125rem" }}>{q.query}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{q.clicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", padding: "0.875rem 1rem 0.5rem" }}>検索からよく見られているページ TOP10</p>
              <table className="data-table">
                <tbody>
                  {gsc.topPages.map((p) => (
                    <tr key={p.page}>
                      <td style={{ fontSize: "0.8125rem", wordBreak: "break-all" }}>{p.page}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{p.clicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
