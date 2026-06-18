"use client";
import { useState, useRef } from "react";

export default function StationImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    skippedClosed: number;
    skippedExisting: number;
    total: number;
    byPref: { name: string; count: number }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file) return;
    setStatus("loading");
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/import-stations", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        setStatus("error");
      } else {
        setResult(data);
        setStatus("done");
      }
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-gray-900)" }}>
        駅データ一括インポート
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)", marginBottom: "2rem" }}>
        無料の公開データ（ekidata.jp）から愛知・岐阜・三重・静岡の全駅を一括登録します。
      </p>

      {/* ─── 手順 ─── */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>手順</p>
        <ol style={{ paddingLeft: "1.25rem", lineHeight: 2, fontSize: "0.875rem", color: "var(--color-gray-700)" }}>
          <li>
            <a
              href="https://ekidata.jp/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-link)", fontWeight: 600 }}
            >
              ekidata.jp
            </a>{" "}
            にアクセスし、「駅データ.csv」をダウンロード
            <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginLeft: "0.5rem" }}>
              （無料・登録不要）
            </span>
          </li>
          <li>ダウンロードしたCSVファイルを下のフォームで選択</li>
          <li>「インポート開始」ボタンを押す（数秒で完了）</li>
        </ol>
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            backgroundColor: "var(--color-gray-50)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.8125rem",
            color: "var(--color-gray-600)",
          }}
        >
          東海4県（愛知・岐阜・三重・静岡）の駅のみ自動抽出。既に登録済みの駅はスキップされます。
        </div>
      </div>

      {/* ─── ファイル選択 ─── */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed var(--color-gray-300)",
            borderRadius: "var(--radius-md)",
            padding: "2rem",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: file ? "#F0F7FF" : "transparent",
            transition: "background-color 0.15s",
            marginBottom: "1rem",
          }}
        >
          {file ? (
            <div>
              <p style={{ fontWeight: 700, color: "var(--color-gray-900)" }}>{file.name}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "0.25rem" }}>
                クリックしてCSVファイルを選択
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-400)" }}>
                station20xxxxxx.csv
              </p>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={!file || status === "loading"}
          style={{ width: "100%" }}
        >
          {status === "loading" ? "インポート中..." : "インポート開始"}
        </button>
      </div>

      {/* ─── 結果 ─── */}
      {status === "done" && result && (
        <div
          style={{
            backgroundColor: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem 1.5rem",
          }}
        >
          <p style={{ fontWeight: 700, color: "#15803D", fontSize: "1rem", marginBottom: "0.5rem" }}>
            インポート完了
          </p>
          <div style={{ fontSize: "0.875rem", color: "#166534", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p>新規登録: <strong>{result.inserted}件</strong> / 合計対象: <strong>{result.total}件</strong></p>
            <p style={{ color: "#4B7C5F" }}>
              スキップ: {result.skipped}件（廃駅 {result.skippedClosed}件 + 登録済み {result.skippedExisting}件）
            </p>
            {result.byPref.length > 0 && (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                {result.byPref.map((p) => (
                  <span key={p.name} style={{ backgroundColor: "#DCFCE7", borderRadius: "4px", padding: "2px 8px", fontWeight: 600 }}>
                    {p.name}: {p.count}駅
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div
          style={{
            backgroundColor: "#FFF5F5",
            border: "1px solid #FECACA",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem 1.5rem",
          }}
        >
          <p style={{ fontWeight: 700, color: "#DC2626", marginBottom: "0.25rem" }}>エラー</p>
          <p style={{ fontSize: "0.875rem", color: "#B91C1C" }}>{error}</p>
        </div>
      )}
    </div>
  );
}
