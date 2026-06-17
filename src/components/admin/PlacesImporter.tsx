"use client";
import { useState, useTransition } from "react";
import type { PlaceCandidate } from "@/lib/places/google-places";

type Prefecture = { id: string; name: string; slug: string };
type ResultRow = PlaceCandidate & { alreadyImported: boolean; selected: boolean };

export function PlacesImporter({ prefectures }: { prefectures: Prefecture[] }) {
  const [prefectureId, setPrefectureId] = useState(prefectures[0]?.id ?? "");
  const [prefSlug, setPrefSlug] = useState(prefectures[0]?.slug ?? "");
  const [query, setQuery] = useState("パーソナルジム");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState<{ query: string; prefSlug: string } | null>(null);
  const [searchError, setSearchError] = useState("");
  const [importResult, setImportResult] = useState<{ inserted: string[]; skipped: string[]; errors: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onPrefChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const pref = prefectures.find((p) => p.id === id);
    setPrefectureId(id);
    setPrefSlug(pref?.slug ?? "");
    setRows([]);
    setNextPageToken(null);
    setCurrentSearch(null);
    setImportResult(null);
  }

  function toggleRow(placeId: string) {
    setRows((prev) =>
      prev.map((r) => (r.placeId === placeId ? { ...r, selected: !r.selected } : r))
    );
  }

  function toggleAll() {
    const selectable = rows.filter((r) => !r.alreadyImported);
    const allSelected = selectable.every((r) => r.selected);
    setRows((prev) =>
      prev.map((r) => (r.alreadyImported ? r : { ...r, selected: !allSelected }))
    );
  }

  async function doSearch(pageToken?: string) {
    const searchQuery = pageToken ? (currentSearch?.query ?? query) : query;
    const searchPrefSlug = pageToken ? (currentSearch?.prefSlug ?? prefSlug) : prefSlug;

    const res = await fetch("/api/places/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery, prefSlug: searchPrefSlug, pageToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSearchError(data.error ?? "検索に失敗しました");
      return;
    }

    const newRows: ResultRow[] = (data.results ?? []).map((r: any) => ({
      ...r,
      selected: !r.alreadyImported,
    }));

    if (pageToken) {
      // 追加読み込み: 既存行に重複しないものだけ追記
      const existingIds = new Set(rows.map((r) => r.placeId));
      setRows((prev) => [...prev, ...newRows.filter((r) => !existingIds.has(r.placeId))]);
    } else {
      setRows(newRows);
      setCurrentSearch({ query: searchQuery, prefSlug: searchPrefSlug });
    }

    setNextPageToken(data.nextPageToken ?? null);
  }

  function handleSearch() {
    setSearchError("");
    setImportResult(null);
    setNextPageToken(null);
    startTransition(async () => {
      try {
        await doSearch();
      } catch {
        setSearchError("ネットワークエラーが発生しました");
      }
    });
  }

  function handleLoadMore() {
    if (!nextPageToken) return;
    setSearchError("");
    startTransition(async () => {
      try {
        await doSearch(nextPageToken);
      } catch {
        setSearchError("ネットワークエラーが発生しました");
      }
    });
  }

  function handleImport() {
    const selected = rows.filter((r) => r.selected && !r.alreadyImported);
    if (!selected.length) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/places/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidates: selected, prefectureId, query: currentSearch?.query ?? query }),
        });
        const data = await res.json();
        if (!res.ok) { setSearchError(data.error ?? "取込に失敗しました"); return; }
        setImportResult(data);
        const importedNames = new Set(data.inserted);
        setRows((prev) =>
          prev.map((r) => (importedNames.has(r.name) ? { ...r, alreadyImported: true, selected: false } : r))
        );
      } catch {
        setSearchError("ネットワークエラーが発生しました");
      }
    });
  }

  const selectedCount = rows.filter((r) => r.selected && !r.alreadyImported).length;

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* 検索フォーム */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-gray-700)" }}>
              都道府県
            </label>
            <select
              value={prefectureId}
              onChange={onPrefChange}
              className="form-input"
              style={{ width: "140px" }}
            >
              {prefectures.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "220px" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-gray-700)" }}>
              検索キーワード
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="例: パーソナルジム 名古屋"
              className="form-input"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isPending || !query.trim()}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            {isPending && rows.length === 0 ? "検索中..." : "Places 検索"}
          </button>
        </div>

        {searchError && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "var(--color-error)" }}>
            {searchError}
          </p>
        )}
      </div>

      {/* インポート結果メッセージ */}
      {importResult && (
        <div
          style={{
            backgroundColor: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: "0.25rem" }}>取込完了</p>
          {importResult.inserted.length > 0 && (
            <p>追加: {importResult.inserted.join("、")}</p>
          )}
          {importResult.skipped.length > 0 && (
            <p style={{ color: "var(--color-gray-600)" }}>スキップ（既存）: {importResult.skipped.join("、")}</p>
          )}
          {importResult.errors.length > 0 && (
            <p style={{ color: "var(--color-error)" }}>エラー: {importResult.errors.join("、")}</p>
          )}
          <p style={{ marginTop: "0.5rem" }}>
            <a href="/admin/gyms" style={{ color: "var(--color-link)", fontSize: "0.8125rem" }}>
              ジム一覧で確認する &rsaquo;
            </a>
          </p>
        </div>
      )}

      {/* 検索結果テーブル */}
      {rows.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
              {rows.length}件が見つかりました
            </p>
            <button
              onClick={handleImport}
              disabled={isPending || selectedCount === 0}
              className="btn btn-primary btn-sm"
            >
              {isPending && importResult !== null ? "取込中..." : `選択した ${selectedCount} 件を取込む`}
            </button>
          </div>

          <div
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "36px" }}>
                    <input type="checkbox" onChange={toggleAll} checked={rows.filter((r) => !r.alreadyImported).every((r) => r.selected) && rows.some((r) => !r.alreadyImported)} />
                  </th>
                  <th>名称</th>
                  <th>住所</th>
                  <th>評価</th>
                  <th>電話</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.placeId}
                    style={{
                      backgroundColor: row.alreadyImported ? "var(--color-gray-50)" : undefined,
                      opacity: row.alreadyImported ? 0.6 : 1,
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={row.alreadyImported}
                        onChange={() => toggleRow(row.placeId)}
                      />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{row.name}</span>
                      {row.websiteUri && (
                        <a
                          href={row.websiteUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "block", fontSize: "0.75rem", color: "var(--color-link)", marginTop: "2px" }}
                        >
                          公式サイト
                        </a>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-700)" }}>
                      {row.address}
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
                      {row.rating != null ? (
                        <span>
                          <span style={{ color: "#B45309", fontWeight: 700 }}>{row.rating.toFixed(1)}</span>
                          <span style={{ color: "var(--color-gray-400)", marginLeft: "3px" }}>({row.ratingCount})</span>
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-700)" }}>
                      {row.phone ?? "—"}
                    </td>
                    <td>
                      {row.alreadyImported ? (
                        <span className="badge" style={{ backgroundColor: "var(--color-gray-100)", color: "var(--color-gray-600)" }}>取込済</span>
                      ) : (
                        <span className="badge badge-green">新規</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 次のページ読み込みボタン */}
          {nextPageToken && (
            <div style={{ textAlign: "center", marginTop: "0.875rem" }}>
              <button
                onClick={handleLoadMore}
                disabled={isPending}
                className="btn btn-sm"
                style={{
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-gray-300)",
                  color: "var(--color-gray-700)",
                }}
              >
                {isPending ? "読み込み中..." : "次の20件を読み込む"}
              </button>
            </div>
          )}
        </>
      )}

      {rows.length === 0 && !isPending && !searchError && (
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
          都道府県とキーワードを指定して「Places 検索」を実行してください。
        </div>
      )}
    </div>
  );
}
