"use client";

import { logout } from "@/lib/actions/auth";

export function LogoutButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <form action={logout}>
      <button type="submit" className={className} style={style}>
        {children ?? "ログアウト"}
      </button>
    </form>
  );
}
