"use client";

import { logout } from "@/lib/actions/auth";

export function LogoutButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <form action={logout}>
      <button type="submit" className={className} style={style}>
        ログアウト
      </button>
    </form>
  );
}
