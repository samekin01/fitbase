"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavLinkItem = {
  label: string;
  href: string;
  badge?: number;
};

export type NavGroup = {
  title?: string;
  icon?: ReactNode;
  links: NavLinkItem[];
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0" }}>
      {groups.map((group, i) => (
        <div key={group.title ?? `group-${i}`}>
          {group.title && (
            <div className="admin-nav-group-title" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              {group.icon}
              {group.title}
            </div>
          )}
          {group.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-link${!group.title ? " admin-nav-link--top" : ""}${
                isActive(pathname, link.href) ? " admin-nav-link--active" : ""
              }`}
            >
              {!group.title && group.icon}
              {link.label}
              {!!link.badge && <span className="admin-nav-link__badge">{link.badge}</span>}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
