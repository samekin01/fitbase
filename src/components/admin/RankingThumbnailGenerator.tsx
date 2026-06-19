"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RankingThumbnailGenerator({
  rankingId,
  imageUrl,
}: {
  rankingId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ranking-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
      <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>アイキャッチ画像をAIで生成</h2>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          style={{ width: "100%", maxWidth: "360px", aspectRatio: "16/9", objectFit: "cover", borderRadius: "var(--radius-md)", marginBottom: "0.75rem", display: "block" }}
        />
      )}
      {error && (
        <p style={{ fontSize: "0.8125rem", color: "var(--color-error)", marginBottom: "0.5rem" }}>{error}</p>
      )}
      <button type="button" onClick={generate} disabled={loading} className="btn btn-secondary btn-sm">
        {loading ? "生成中..." : imageUrl ? "AIで再生成" : "AIで生成"}
      </button>
    </div>
  );
}
