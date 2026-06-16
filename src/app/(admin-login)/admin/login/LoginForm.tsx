"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-gray-100)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Image
            src="/logo.png"
            alt="FitBase"
            width={1308}
            height={512}
            style={{ height: "32px", width: "auto", display: "inline-block" }}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.375rem", fontWeight: 600, letterSpacing: "0.06em" }}>
            CMS
          </p>
        </div>

        {state?.error && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "var(--radius-sm)",
              padding: "0.5rem 0.75rem",
              marginBottom: "1rem",
            }}
          >
            {state.error}
          </p>
        )}

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {pending ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
