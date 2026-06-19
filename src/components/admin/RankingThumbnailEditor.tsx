"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Canvas as FabricCanvas, FabricObject, Textbox } from "fabric";

const CANVAS_W = 480;
const CANVAS_H = 270;
const EXPORT_MULTIPLIER = 1280 / CANVAS_W;

function isTextbox(obj: FabricObject | null): obj is Textbox {
  return !!obj && obj.type === "textbox";
}

export function RankingThumbnailEditor({ rankingId, imageUrl }: { rankingId: string; imageUrl: string }) {
  const router = useRouter();
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [textValue, setTextValue] = useState("");
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState("#ffffff");
  const [overlayOpacity, setOverlayOpacity] = useState(0.45);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    let disposed = false;
    let canvas: FabricCanvas | null = null;

    (async () => {
      const { Canvas, FabricImage } = await import("fabric");
      if (disposed || !canvasElRef.current) return;
      canvas = new Canvas(canvasElRef.current, { width: CANVAS_W, height: CANVAS_H });
      canvasRef.current = canvas;

      canvas.on("selection:created", (e: any) => setSelected(e.selected?.[0] ?? null));
      canvas.on("selection:updated", (e: any) => setSelected(e.selected?.[0] ?? null));
      canvas.on("selection:cleared", () => setSelected(null));
      canvas.on("object:modified", () => forceRender((n) => n + 1));

      try {
        const img = await FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" });
        if (disposed || !canvas) return;
        const scale = Math.max(CANVAS_W / (img.width ?? CANVAS_W), CANVAS_H / (img.height ?? CANVAS_H));
        img.scale(scale);
        img.set({ left: CANVAS_W / 2, top: CANVAS_H / 2, originX: "center", originY: "center" });
        canvas.backgroundImage = img;
        canvas.requestRenderAll();
      } catch {
        setError("画像の読み込みに失敗しました");
      }
    })();

    return () => {
      disposed = true;
      canvas?.dispose();
      canvasRef.current = null;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (isTextbox(selected)) {
      setTextValue(selected.text ?? "");
      setFontSize(selected.fontSize ?? 36);
      setTextColor((selected.fill as string) ?? "#ffffff");
    } else if (selected?.type === "rect") {
      const fill = selected.fill as string;
      const m = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([\d.]+))?\)/.exec(fill ?? "");
      setOverlayOpacity(m?.[1] ? Number(m[1]) : 1);
    }
  }, [selected]);

  async function addText() {
    const { Textbox } = await import("fabric");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new Textbox("テキストを入力", {
      left: 30,
      top: 30,
      width: CANVAS_W - 60,
      fontSize: 36,
      fill: "#ffffff",
      fontWeight: "bold",
      textAlign: "center",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  }

  async function addOverlay() {
    const { Rect } = await import("fabric");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = new Rect({
      left: 0,
      top: CANVAS_H - 110,
      width: CANVAS_W,
      height: 110,
      fill: "rgba(0,0,0,0.45)",
    });
    canvas.add(rect);
    canvas.sendObjectToBack(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
  }

  function deleteSelected() {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    canvas.remove(selected);
    canvas.discardActiveObject();
    setSelected(null);
    canvas.requestRenderAll();
  }

  function updateTextValue(value: string) {
    setTextValue(value);
    if (isTextbox(selected)) {
      selected.set({ text: value });
      canvasRef.current?.requestRenderAll();
    }
  }

  function updateFontSize(value: number) {
    setFontSize(value);
    if (isTextbox(selected)) {
      selected.set({ fontSize: value });
      canvasRef.current?.requestRenderAll();
    }
  }

  function updateTextColor(value: string) {
    setTextColor(value);
    if (isTextbox(selected)) {
      selected.set({ fill: value });
      canvasRef.current?.requestRenderAll();
    }
  }

  function updateOverlayOpacity(value: number) {
    setOverlayOpacity(value);
    if (selected?.type === "rect") {
      selected.set({ fill: `rgba(0,0,0,${value})` });
      canvasRef.current?.requestRenderAll();
    }
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    setError(null);
    try {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      const dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier: EXPORT_MULTIPLIER });
      const res = await fetch("/api/admin/ranking-thumbnail-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankingId, dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
      <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>文字入れ・画像編集</h2>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <canvas ref={canvasElRef} style={{ border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-sm)" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", minWidth: "220px", flex: 1 }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={addText} className="btn btn-secondary btn-sm">＋テキスト</button>
            <button type="button" onClick={addOverlay} className="btn btn-secondary btn-sm">＋帯（読みやすく）</button>
          </div>

          {isTextbox(selected) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid var(--color-gray-200)", paddingTop: "0.625rem" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>テキスト内容</label>
              <textarea value={textValue} onChange={(e) => updateTextValue(e.target.value)} rows={2} className="form-input" />
              <label className="form-label" style={{ marginBottom: 0 }}>文字サイズ: {fontSize}px</label>
              <input type="range" min={16} max={72} value={fontSize} onChange={(e) => updateFontSize(Number(e.target.value))} />
              <label className="form-label" style={{ marginBottom: 0 }}>文字色</label>
              <input type="color" value={textColor} onChange={(e) => updateTextColor(e.target.value)} style={{ width: "60px", height: "32px" }} />
            </div>
          )}

          {selected?.type === "rect" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid var(--color-gray-200)", paddingTop: "0.625rem" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>帯の濃さ: {Math.round(overlayOpacity * 100)}%</label>
              <input type="range" min={0} max={1} step={0.05} value={overlayOpacity} onChange={(e) => updateOverlayOpacity(Number(e.target.value))} />
            </div>
          )}

          {selected && (
            <button type="button" onClick={deleteSelected} className="btn btn-sm" style={{ border: "1px solid #FCA5A5", color: "#DC2626", backgroundColor: "white", alignSelf: "flex-start" }}>
              選択中の要素を削除
            </button>
          )}

          <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
            画像をクリックして選択・ドラッグで移動できます。テキストは背景が暗い部分に置くか、「帯」を下に敷くと読みやすくなります。
          </p>
        </div>
      </div>

      {error && <p style={{ fontSize: "0.8125rem", color: "var(--color-error)", marginTop: "0.625rem" }}>{error}</p>}

      <div style={{ marginTop: "0.875rem" }}>
        <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? "保存中..." : "編集を保存"}
        </button>
      </div>
    </div>
  );
}
