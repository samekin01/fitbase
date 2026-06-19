import { createAdminClient } from "@/lib/supabase/admin";
import { FireIcon } from "@/components/ui/Icons";
import { HeatmapViewer } from "@/components/admin/HeatmapViewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "ヒートマップ | FitBase CMS" };

export default async function HeatmapPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000";

  const supabase = createAdminClient();
  const { data: paths } = await (supabase as any).rpc("get_top_clicked_paths", { days_back: 90, limit_count: 50 }) as {
    data: { path: string; click_count: number }[] | null;
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        <FireIcon size={20} />
        ヒートマップ
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", marginBottom: "1.5rem" }}>
        サイト訪問者がどこをクリックしたかを、ページの見た目の上に色で重ねて表示します。赤色が濃い部分ほどよくクリックされている場所です。
      </p>

      <HeatmapViewer siteUrl={siteUrl} paths={paths ?? []} />
    </div>
  );
}
