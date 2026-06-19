import { createAdminClient } from "@/lib/supabase/admin";
import { AiFillRunner } from "@/components/admin/AiFillRunner";
import { PhotoRunner } from "@/components/admin/PhotoRunner";
import { GymClassifyRunner } from "@/components/admin/GymClassifyRunner";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { bulkPublishFilledGyms } from "@/lib/actions/gyms";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI一括入力 | FitBase CMS" };

export default async function AiFillPage() {
  const supabase = createAdminClient();

  const [gyms, gymImages] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("gyms")
        .select("id, name, address, website_url, description, google_place_id")
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
    fetchAllRows((from, to) =>
      supabase.from("gym_images").select("gym_id").range(from, to)
    ),
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
          <a href="/admin/places" style={{ color: "var(--color-link)", marginTop: "0.5rem", display: "inline-block" }}>
            Google Places からジムを取り込む &rsaquo;
          </a>
        </div>
      </div>
    );
  }

  // 既にAI一括入力済み（description設定済み）で、ジム判定も通過している（draftのまま）件数
  const filledGymCount = gyms.filter((g: any) => g.description).length;

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

      {/* AIでジム判定（ジムではない店舗を自動で非公開に） */}
      <GymClassifyRunner gyms={gyms.map((g: any) => ({ id: g.id, name: g.name }))} />

      {/* AI入力済み・ジム判定通過分を一括公開 */}
      {filledGymCount > 0 && (
        <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem" }}>入力済みジムを一括公開</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "0.75rem" }}>
            説明文が自動入力済み（AI一括入力が完了）かつ、ジム判定で「ジムではない」と判定されていない（下書きのまま残っている）ジムが {filledGymCount} 件あります。これらを一括で公開します。
          </p>
          <ConfirmForm
            action={bulkPublishFilledGyms}
            message={`入力済みの下書きジム ${filledGymCount} 件を一括公開します。よろしいですか？`}
            label={`${filledGymCount}件を一括公開`}
            buttonClassName="btn btn-primary btn-sm"
          />
        </div>
      )}

      {/* AI テキスト一括入力 */}
      <AiFillRunner gyms={gyms} />

      {/* Google 写真一括設定 */}
      {photoGyms.length > 0 && <PhotoRunner gyms={photoGyms} />}
    </div>
  );
}
