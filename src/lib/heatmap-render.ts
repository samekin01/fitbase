export type HeatPoint = { x: number; y: number };

const GRADIENT_STOPS: { offset: number; color: [number, number, number] }[] = [
  { offset: 0, color: [37, 99, 235] },
  { offset: 0.35, color: [34, 211, 238] },
  { offset: 0.6, color: [74, 222, 128] },
  { offset: 0.8, color: [250, 204, 21] },
  { offset: 1, color: [239, 68, 68] },
];

function colorForIntensity(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const a = GRADIENT_STOPS[i];
    const b = GRADIENT_STOPS[i + 1];
    if (clamped >= a.offset && clamped <= b.offset) {
      const span = b.offset - a.offset || 1;
      const localT = (clamped - a.offset) / span;
      return [
        Math.round(a.color[0] + (b.color[0] - a.color[0]) * localT),
        Math.round(a.color[1] + (b.color[1] - a.color[1]) * localT),
        Math.round(a.color[2] + (b.color[2] - a.color[2]) * localT),
      ];
    }
  }
  return GRADIENT_STOPS[GRADIENT_STOPS.length - 1].color;
}

export function renderHeatmap(canvas: HTMLCanvasElement, points: HeatPoint[], width: number, height: number, radius = 32) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx || width <= 0 || height <= 0) return;
  ctx.clearRect(0, 0, width, height);
  if (points.length === 0) return;

  const density = document.createElement("canvas");
  density.width = width;
  density.height = height;
  const dctx = density.getContext("2d");
  if (!dctx) return;
  dctx.globalCompositeOperation = "lighter";

  for (const p of points) {
    const gradient = dctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
    gradient.addColorStop(0, "rgba(0,0,0,0.22)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    dctx.fillStyle = gradient;
    dctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
  }

  const densityData = dctx.getImageData(0, 0, width, height);
  const outData = ctx.createImageData(width, height);

  let maxAlpha = 0;
  for (let i = 3; i < densityData.data.length; i += 4) {
    if (densityData.data[i] > maxAlpha) maxAlpha = densityData.data[i];
  }
  if (maxAlpha === 0) return;

  for (let i = 0; i < densityData.data.length; i += 4) {
    const alpha = densityData.data[i + 3];
    if (alpha === 0) continue;
    const intensity = alpha / maxAlpha;
    const [r, g, b] = colorForIntensity(intensity);
    outData.data[i] = r;
    outData.data[i + 1] = g;
    outData.data[i + 2] = b;
    outData.data[i + 3] = Math.min(255, Math.round(alpha * 2.4));
  }
  ctx.putImageData(outData, 0, 0);
}
