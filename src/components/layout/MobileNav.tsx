"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PREF_LINKS = [
  { name: "愛知県", slug: "aichi", cities: [{ name: "名古屋市", slug: "nagoya" }, { name: "豊橋市", slug: "toyohashi" }, { name: "岡崎市", slug: "okazaki" }, { name: "豊田市", slug: "toyota" }] },
  { name: "岐阜県", slug: "gifu",  cities: [{ name: "岐阜市",  slug: "gifu" },  { name: "大垣市",  slug: "ogaki" },   { name: "各務原市", slug: "kakamigahara" }] },
  { name: "三重県", slug: "mie",   cities: [{ name: "津市",    slug: "tsu" },   { name: "四日市市", slug: "yokkaichi" }, { name: "鈴鹿市",  slug: "suzuka" }] },
  { name: "静岡県", slug: "shizuoka", cities: [{ name: "静岡市", slug: "shizuoka" }, { name: "浜松市", slug: "hamamatsu" }, { name: "沼津市", slug: "numazu" }] },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger button */}
      <button
        className="nav-mobile-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 199, top: "63px" }}
        />
      )}

      {/* Drawer */}
      <div
        className={`nav-mobile-menu${isOpen ? " is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        {/* エリアから探す */}
        <div style={{ padding: "0.75rem 1rem 0.25rem", fontSize: "0.6875rem", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          エリアから探す
        </div>
        {PREF_LINKS.map((pref) => (
          <div key={pref.slug} style={{ borderBottom: "1px solid #F3F4F6" }}>
            <Link href={`/${pref.slug}/`} style={{ display: "block", padding: "0.75rem 1rem 0.375rem", fontWeight: 700, fontSize: "0.9375rem", color: "#111827", textDecoration: "none" }}>
              {pref.name}
            </Link>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", padding: "0 1rem 0.75rem" }}>
              {pref.cities.map((city) => (
                <Link key={city.slug} href={`/${pref.slug}/${city.slug}/`} style={{ fontSize: "0.8125rem", color: "#1558D6", padding: "0.25rem 0.625rem", border: "1px solid #DBEAFE", borderRadius: "3px", textDecoration: "none", backgroundColor: "#F0F7FF" }}>
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* その他ナビ */}
        <div style={{ borderBottom: "1px solid #F3F4F6" }}>
          {[
            { href: "/search",   label: "ジムを検索する" },
            { href: "/features", label: "特集" },
            { href: "/rankings", label: "ランキング" },
            { href: "/articles", label: "コラム" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ display: "block", padding: "0.875rem 1rem", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", textDecoration: "none", borderBottom: "1px solid #F9FAFB" }}>
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: "1.25rem 1rem" }}>
          <Link
            href="/contact"
            style={{ display: "block", textAlign: "center", padding: "0.875rem", backgroundColor: "#111827", color: "#FFFFFF", borderRadius: "6px", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}
          >
            掲載を依頼する
          </Link>
        </div>
      </div>
    </>
  );
}
