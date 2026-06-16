"use client";
import { useEffect, useRef } from "react";

export type GymPin = {
  slug: string;
  name: string;
  address: string | null;
  monthly_fee_min: number | null;
  lat: number;
  lng: number;
};

const ICON_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png";
const ICON_RETINA_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png";
const SHADOW_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png";

// Default center: Nagoya
const DEFAULT_CENTER: [number, number] = [35.1709, 136.8815];

export function GymMap({ gyms }: { gyms: GymPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    import("leaflet").then((L) => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: ICON_URL,
        iconRetinaUrl: ICON_RETINA_URL,
        shadowUrl: SHADOW_URL,
      });

      const valid = gyms.filter((g) => g.lat && g.lng);
      const center = valid.length > 0 ? ([valid[0].lat, valid[0].lng] as [number, number]) : DEFAULT_CENTER;

      const map = L.map(containerRef.current!).setView(center, 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      valid.forEach((gym) => {
        const popup = `
          <div style="min-width:180px;font-family:sans-serif">
            <p style="font-weight:700;font-size:0.875rem;margin:0 0 4px">${gym.name}</p>
            ${gym.address ? `<p style="font-size:0.75rem;color:#666;margin:0 0 4px">${gym.address}</p>` : ""}
            ${gym.monthly_fee_min != null ? `<p style="font-size:0.75rem;margin:0 0 6px">月額 ¥${gym.monthly_fee_min.toLocaleString()}〜</p>` : ""}
            <a href="/gyms/${gym.slug}" style="font-size:0.8125rem;color:#1d4ed8">詳細を見る &rsaquo;</a>
          </div>`;
        L.marker([gym.lat, gym.lng]).addTo(map).bindPopup(popup);
      });

      if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map((g) => [g.lat, g.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [48, 48] });
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [gyms]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "520px",
        width: "100%",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-gray-200)",
        overflow: "hidden",
      }}
    />
  );
}
