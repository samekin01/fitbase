"use client";

import { useEffect, useRef, useState } from "react";
import { renderHeatmap, type HeatPoint } from "@/lib/heatmap-render";

type PathStat = { path: string; click_count: number };
type RawPoint = { x_pct: number; y_pct: number; doc_height: number; viewport_width: number };

const DAY_OPTIONS = [
  { value: 7, label: "直近7日間" },
  { value: 28, label: "直近28日間" },
  { value: 90, label: "直近90日間" },
  { value: 36500, label: "全期間" },
];

const CONTAINER_WIDTH = 1280;

export function HeatmapViewer({ siteUrl, paths }: { siteUrl: string; paths: PathStat[] }) {
  const [selectedPath, setSelectedPath] = useState(paths[0]?.path ?? "");
  const [days, setDays] = useState(28);
  const [rawPoints, setRawPoints] = useState<RawPoint[]>([]);
  const [loading, setLoading] = useState(false);
  // contentHeight/renderWidthは描画計算専用。iframeの幅自体はCSSで固定し、
  // 計測値を幅のスタイルに戻すと「計測→縮小→再計測」のループで幅が縮み続けるため分離している。
  const [contentHeight, setContentHeight] = useState(800);
  const [renderWidth, setRenderWidth] = useState(CONTAINER_WIDTH);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!selectedPath) return;
    setLoading(true);
    fetch(`/api/admin/heatmap-points?path=${encodeURIComponent(selectedPath)}&days=${days}`)
      .then((r) => r.json())
      .then((data) => setRawPoints(data.points ?? []))
      .finally(() => setLoading(false));
  }, [selectedPath, days]);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, [selectedPath]);

  function handleIframeLoad() {
    const doc = iframeRef.current?.contentWindow?.document;
    if (!doc) return;

    const updateSize = () => {
      setContentHeight(doc.documentElement.scrollHeight || 800);
      setRenderWidth(iframeRef.current?.clientWidth || CONTAINER_WIDTH);
    };
    updateSize();

    observerRef.current?.disconnect();
    observerRef.current = new ResizeObserver(updateSize);
    observerRef.current.observe(doc.documentElement);
  }

  useEffect(() => {
    if (!canvasRef.current) return;
    const points: HeatPoint[] = rawPoints.map((p) => ({
      x: (p.x_pct / 100) * renderWidth,
      y: (p.y_pct / 100) * contentHeight,
    }));
    renderHeatmap(canvasRef.current, points, renderWidth, contentHeight);
  }, [rawPoints, renderWidth, contentHeight]);

  if (paths.length === 0) {
    return (
      <div className="empty-state">
        まだクリックデータが記録されていません。サイトにアクセスして数回クリックすると、ここにデータが表示されます。
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select value={selectedPath} onChange={(e) => setSelectedPath(e.target.value)} className="form-input" style={{ width: "320px" }}>
          {paths.map((p) => (
            <option key={p.path} value={p.path}>
              {p.path}（{p.click_count}クリック）
            </option>
          ))}
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="form-input" style={{ width: "160px" }}>
          {DAY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {loading && <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", alignSelf: "center" }}>読み込み中...</span>}
        {!loading && <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", alignSelf: "center" }}>{rawPoints.length}件のクリックを表示中</span>}
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: `${CONTAINER_WIDTH}px`,
          height: `${contentHeight}px`,
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          backgroundColor: "var(--color-white)",
        }}
      >
        <iframe
          ref={iframeRef}
          key={selectedPath}
          src={`${siteUrl}${selectedPath}`}
          onLoad={handleIframeLoad}
          scrolling="no"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${contentHeight}px`,
            border: "none",
            pointerEvents: "none",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${contentHeight}px`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
