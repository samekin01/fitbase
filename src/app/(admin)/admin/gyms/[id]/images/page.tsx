import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadGymImage, deleteGymImage, setCoverImage } from "@/lib/actions/images";

export const dynamic = "force-dynamic";

export default async function GymImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: gym }, { data: images }] = await Promise.all([
    supabase.from("gyms").select("id, name").eq("id", id).single(),
    supabase.from("gym_images").select("*").eq("gym_id", id).order("sort_order"),
  ]);

  if (!gym) notFound();

  const uploadAction = uploadGymImage.bind(null, id);

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Link href={`/admin/gyms/${id}`} style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
          ← {gym.name}
        </Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          画像管理
        </h1>
      </div>

      {/* アップロードフォーム */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          画像をアップロード
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1rem" }}>
          JPEG / PNG / WebP 対応。最大 5MB。最初にアップロードした画像がカバー画像になります。
        </p>
        <form action={uploadAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label className="form-label" htmlFor="file">
              ファイル *
            </label>
            <input
              id="file"
              name="file"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="alt_text">
              代替テキスト（alt属性）
            </label>
            <input
              id="alt_text"
              name="alt_text"
              type="text"
              className="form-input"
              placeholder="例: ○○パーソナルジム 外観"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary btn-sm">
              アップロード
            </button>
          </div>
        </form>
      </div>

      {/* 画像一覧 */}
      {images && images.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {images.map((img: any) => (
            <div
              key={img.id}
              style={{
                backgroundColor: "var(--color-white)",
                border: img.is_cover
                  ? "2px solid var(--color-accent)"
                  : "1px solid var(--color-gray-200)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt_text ?? ""}
                style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "0.625rem" }}>
                {img.is_cover && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      color: "#000",
                      fontSize: "0.6875rem",
                      marginBottom: "0.5rem",
                      display: "inline-block",
                    }}
                  >
                    カバー
                  </span>
                )}
                {img.alt_text && (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-gray-600)",
                      marginBottom: "0.5rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {img.alt_text}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {!img.is_cover && (
                    <form action={setCoverImage.bind(null, id, img.id)}>
                      <button type="submit" className="btn btn-sm btn-secondary">
                        カバーに設定
                      </button>
                    </form>
                  )}
                  <form
                    action={deleteGymImage.bind(null, id, img.id, img.storage_path)}
                  >
                    <button
                      type="submit"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: "transparent",
                        color: "var(--color-error)",
                        border: "1px solid var(--color-error)",
                      }}
                      onClick={(e) => {
                        if (!confirm("この画像を削除しますか？")) e.preventDefault();
                      }}
                    >
                      削除
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem" }}>
          まだ画像がありません。上のフォームからアップロードしてください。
        </p>
      )}
    </div>
  );
}
