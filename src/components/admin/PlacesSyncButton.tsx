"use client";
import { useState } from "react";

export function PlacesSyncButton({ gymId }: { gymId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSync() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/places/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "同期に失敗しました");
        return;
      }
      const u = data.updated;
      setStatus("ok");
      setMessage(
        u.rating != null
          ? `評価: ${u.rating.toFixed(1)} (${u.ratingCount}件)、座標: ${u.lat?.toFixed(4)}, ${u.lng?.toFixed(4)}`
          : "同期完了"
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setStatus("error");
      setMessage("ネットワークエラーが発生しました");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        className="btn btn-secondary btn-sm"
      >
        {status === "loading" ? "同期中..." : "Places データ同期"}
      </button>
      {message && (
        <span style={{ fontSize: "0.8125rem", color: status === "error" ? "var(--color-error)" : "var(--color-success)" }}>
          {message}
        </span>
      )}
    </div>
  );
}
