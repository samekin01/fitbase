import { createAdminClient } from "@/lib/supabase/admin";
import { AiFillRunner } from "@/components/admin/AiFillRunner";
import { PhotoRunner } from "@/components/admin/PhotoRunner";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI一括入力 | FitBase CMS" };

export default async function AiFillPage() {
  const supabase = createAdminClient();

  const [{ data: gyms }, { data: gymImages }] = await Promise.all([
    supabase
      .from("gyms")
      .select("id, name, address, website_url, description, google_place_id")
      .eq("status", "draft")
      .order("created_at", { ascending: false }),
    supabase
      .from("gym_images")
      .select("gym_id"),
  ]);

  if (!gyms?.length) {
    return (
      <div style={{ maxWidth: "800px" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
          AI一括入力
        </h1>
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "3rem 2rem",
            textAlign: "center",
            color: "var(--color-gray-500)",
            fontSize: "0.875rem",
          }}
        >
          下書き状態のジムがありません。
          <br />
          <a href="/admin/gyms/places" style={{ color: "var(--color-link)", marginTop: "0.5rem", display: "inline-block" }}>
            Google Places からジムを取り込む &rsaquo;
          </a>
        </div>
      </div>
    );
  }

  // Build set of gym IDs that already have at least one image
  const gymsWithPhoto = new Set((gymImages ?? []).map((img: any) => img.gym_id));

  // Gyms with a google_place_id (required for photo fetch)
  const photoGyms = gyms
    .filter((g: any) => g.google_place_id)
    .map((g: any) => ({
      id: g.id,
      name: g.name,
      hasPhoto: gymsWithPhoto.has(g.id),
    }));

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>
          AI一括入力
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)" }}>
          下書きジムの公式サイトをAIが解析し、説明文・料金・タグ等を自動入力します。入力後に各ジムを確認・修正してから公開してください。
        </p>
      </div>

      {!process.env.ANTHROPIC_API_KEY && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            fontSize: "0.875rem",
            color: "#B91C1C",
          }}
        >
          <strong>ANTHROPIC_API_KEY が未設定です。</strong>
          .env.local に ANTHROPIC_API_KEY を追加し、Vercel の環境変数にも登録してください。
        </div>
      )}

      {/* AI テキスト一括入力 */}
      <AiFillRunner gyms={gyms} />

      {/* Google 写真一括設定 */}
      {photoGyms.length > 0 && <PhotoRunner gyms={photoGyms} />}
    </div>
  );
}
