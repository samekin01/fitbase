"use client";
import { useState } from "react";
import { generateAreaRanking } from "@/lib/actions/rankings";

type Prefecture = { id: string; name: string };
type City = { id: string; name: string; prefecture_id: string };

export function AreaRankingGenerator({ prefectures, cities }: { prefectures: Prefecture[]; cities: City[] }) {
  const [prefectureId, setPrefectureId] = useState(prefectures[0]?.id ?? "");
  const citiesInPref = cities.filter((c) => c.prefecture_id === prefectureId);

  return (
    <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem" }}>エリアを選んで作成</h2>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "0.75rem" }}>
        指定したエリア（都道府県全体、または市区町村）1件だけ、評価70%＋価格30%のスコア順にランキングを下書き状態で作成します。既にそのエリアのランキングがある場合はエラーになります。
      </p>
      <form action={generateAreaRanking} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label className="form-label" htmlFor="area_prefecture_id" style={{ marginBottom: 0 }}>都道府県</label>
          <select
            id="area_prefecture_id"
            name="prefecture_id"
            value={prefectureId}
            onChange={(e) => setPrefectureId(e.target.value)}
            className="form-input"
            style={{ width: "140px" }}
          >
            {prefectures.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label className="form-label" htmlFor="area_city_id" style={{ marginBottom: 0 }}>市区町村</label>
          <select id="area_city_id" name="city_id" defaultValue="" className="form-input" style={{ width: "200px" }}>
            <option value="">（都道府県全体）</option>
            {citiesInPref.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label className="form-label" htmlFor="area_limit" style={{ marginBottom: 0 }}>掲載上位</label>
          <input id="area_limit" name="limit" type="number" min="1" max="50" defaultValue={10} className="form-input" style={{ width: "70px" }} />
        </div>

        <button type="submit" className="btn btn-primary btn-sm">このエリアでランキングを作成</button>
      </form>
    </div>
  );
}
