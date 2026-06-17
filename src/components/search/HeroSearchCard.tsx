"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Prefecture = { slug: string; name: string };

const FEATURES: { param: string; label: string }[] = [
  { param: "trial",     label: "体験レッスンあり" },
  { param: "female",    label: "女性向け" },
  { param: "private",   label: "完全個室" },
  { param: "nutrition", label: "食事指導あり" },
  { param: "station",   label: "駅近" },
];

const PRICE_OPTIONS = [
  { label: "〜¥30,000", value: "30000" },
  { label: "〜¥50,000", value: "50000" },
  { label: "〜¥80,000", value: "80000" },
];

const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  height: "52px",
  padding: "0 1rem",
  border: "1.5px solid #CBD5E1",
  borderRadius: "6px",
  fontSize: "0.9375rem",
  color: "#1E293B",
  backgroundColor: "#FAFAFA",
  outline: "none",
  boxSizing: "border-box",
  appearance: "none",
};

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-block",
        padding: "0.25rem 0.625rem",
        borderRadius: "3px",
        fontSize: "0.8125rem",
        border: active ? "1.5px solid #1558D6" : "1.5px solid #E2E8F0",
        backgroundColor: active ? "rgba(21,88,214,0.07)" : "transparent",
        color: active ? "#1558D6" : "#64748B",
        cursor: "pointer",
        userSelect: "none",
        lineHeight: 1.5,
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </span>
  );
}

export function HeroSearchCard({ prefectures }: { prefectures: Prefecture[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [prefSlug, setPrefSlug] = useState("");
  const [activeFeatures, setActiveFeatures] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState("");

  function toggleFeature(param: string) {
    setActiveFeatures((prev) => {
      const next = new Set(prev);
      next.has(param) ? next.delete(param) : next.add(param);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (prefSlug) params.set("pref", prefSlug);
    for (const f of activeFeatures) params.set(f, "1");
    if (maxPrice) params.set("maxprice", maxPrice);
    router.push(`/search${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "10px",
        padding: "1.375rem 1.5rem 1.25rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.07)",
        width: "100%",
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* ── メイン行: キーワード + エリア + ボタン ── */}
        <div className="hero-search-row" style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem", alignItems: "stretch" }}>
          {/* キーワード */}
          <div className="hero-search-keyword" style={{ flex: "2 1 0", position: "relative" }}>
            <svg
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="エリア・ジム名・駅名など"
              style={{ ...INPUT_BASE, paddingLeft: "2.75rem" }}
              autoComplete="off"
            />
          </div>

          {/* エリア */}
          <div className="hero-search-area" style={{ flex: "1 1 0", position: "relative" }}>
            <select
              value={prefSlug}
              onChange={(e) => setPrefSlug(e.target.value)}
              style={{ ...INPUT_BASE, paddingRight: "2.25rem", cursor: "pointer", color: prefSlug ? "#1E293B" : "#94A3B8" }}
            >
              <option value="">すべてのエリア</option>
              {prefectures.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
            <svg
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* 検索ボタン */}
          <button
            type="submit"
            className="hero-search-btn"
            style={{
              flexShrink: 0,
              padding: "0 2.25rem",
              height: "52px",
              backgroundColor: "#1558D6",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            検索する
          </button>
        </div>

        {/* ── フィルター行 ── */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, letterSpacing: "0.03em", flexShrink: 0 }}>
            こだわり:
          </span>
          {FEATURES.map((f) => (
            <FilterChip key={f.param} active={activeFeatures.has(f.param)} onClick={() => toggleFeature(f.param)}>
              {f.label}
            </FilterChip>
          ))}
          <span style={{ width: "1px", height: "16px", backgroundColor: "#E2E8F0", flexShrink: 0, alignSelf: "center" }} />
          <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, letterSpacing: "0.03em", flexShrink: 0 }}>
            月額上限:
          </span>
          {PRICE_OPTIONS.map(({ label, value }) => (
            <FilterChip key={value} active={maxPrice === value} onClick={() => setMaxPrice(maxPrice === value ? "" : value)}>
              {label}
            </FilterChip>
          ))}
        </div>
      </form>
    </div>
  );
}
