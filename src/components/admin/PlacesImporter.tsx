"use client";
import { useState, useTransition } from "react";
import type { PlaceCandidate } from "@/lib/places/google-places";

type Prefecture = { id: string; name: string; slug: string };
type City = { id: string; name: string; prefecture_id: string };
type ResultRow = PlaceCandidate & { alreadyImported: boolean; selected: boolean };

export function PlacesImporter({ prefectures, cities }: { prefectures: Prefecture[]; cities: City[] }) {
  const [prefectureId, setPrefectureId] = useState(prefectures[0]?.id ?? "");
  const citiesInPref = cities.filter((c) => c.prefecture_id === prefectureId);
  const [cityId, setCityId] = useState("");
  const [query, setQuery] = useState("パーソナルジム");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [searchError, setSearchError] = useState("");
  const [importResult, setImportResult] = useState<{ inserted: string[]; skipped: string[]; errors: string[] } | null>(null);
  const [stationProgress, setStationProgress] = useState<{ done: number; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onPrefChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setPrefectureId(id);
    setCityId("");
    setRows([]);
    setImportResult(null);
  }

  async function searchByStations() {
    setSearchError("");
    setImportResult(null);
    setRows([]);

    const stationsUrl = cityId
      ? `/api/places/stations?cityId=${cityId}`
      : `/api/places/stations?prefectureId=${prefectureId}`;
    const stationsRes = await fetch(stationsUrl);
    const stationsData = await stationsRes.json();
    if (!stationsRes.ok) {
      setSearchError(stationsData.error ?? "駅一覧の取得に失敗しました");
      return;
    }
    const stations: { id: string; name: string; latitude: number; longitude: number }[] = stationsData.stations ?? [];
    if (stations.length === 0) {
      setSearchError("登録されている駅がありません");
      return;
    }

    const aggregated = new Map<string, ResultRow>();
    setStationProgress({ done: 0, total: stations.length });

    for (let i = 0; i < stations.length; i++) {
      const st = stations[i];
      try {
        const res = await fetch("/api/places/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, lat: st.latitude, lng: st.longitude, radius: 1200 }),
        });
        const data = await res.json();
        if (res.ok) {
          for (const r of data.results ?? []) {
            if (!aggregated.has(r.placeId)) {
              aggregated.set(r.placeId, { ...r, selected: !r.alreadyImported });
            }
          }
          setRows([...aggregated.values()]);
        }
      } catch {
        // 1駅分の失敗はスキップして続行
      }
      setStationProgress({ done: i + 1, total: stations.length });
    }
    setStationProgress(null);
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

  function handleImport() {
    const selected = rows.filter((r) => r.selected && !r.alreadyImported);
    if (!selected.length) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/places/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidates: selected, prefectureId, query }),
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

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-gray-700)" }}>
              市区町村
            </label>
            <select
              value={cityId}
              onChange={(e) => { setCityId(e.target.value); setRows([]); setImportResult(null); }}
              className="form-input"
              style={{ width: "220px" }}
            >
              <option value="">（都道府県全体・全市区町村の駅）</option>
              {citiesInPref.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
              placeholder="例: パーソナルジム"
              className="form-input"
            />
          </div>

          <button
            onClick={() => startTransition(searchByStations)}
            disabled={isPending || !query.trim() || !prefectureId}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            {stationProgress ? `検索中 (${stationProgress.done}/${stationProgress.total}駅)` : "駅ごとに検索"}
          </button>
        </div>

        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
          選択した市区町村（または都道府県全体）の登録済み駅すべてについて、駅周辺1.2km圏内をそれぞれ検索し、重複を除いて結果を集約します。Google Places検索は1回あたり最大60件までの制限がありますが、駅単位に分割することでこの上限を回避し、件数を増やせます。駅数が多いほど時間がかかります（都道府県全体の場合は数分かかることがあります）。
        </p>

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
          都道府県とキーワードを指定して「駅ごとに検索」を実行してください。
        </div>
      )}
    </div>
  );
}
