"use client";

import { useActionState } from "react";
import { submitContact } from "@/lib/actions/forms";
import { TurnstileWidget } from "./TurnstileWidget";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, null);

  if (state?.success) {
    return (
      <div
        style={{
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "2rem",
          textAlign: "center",
          backgroundColor: "var(--color-white)",
        }}
      >
        <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.5rem" }}>
          送信が完了しました
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)" }}>
          お問い合わせいただきありがとうございます。内容を確認の上、担当者よりご連絡いたします。
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-gray-200)",
        borderRadius: "var(--radius-md)",
        padding: "1.5rem",
      }}
    >
      {state?.error && (
        <p
          style={{
            fontSize: "0.875rem",
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-sm)",
            padding: "0.5rem 0.75rem",
          }}
        >
          {state.error}
        </p>
      )}

      <div>
        <label className="form-label" htmlFor="name">
          お名前 <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <input id="name" name="name" type="text" required className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="email">
          メールアドレス <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <input id="email" name="email" type="email" required className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="subject">
          件名
        </label>
        <input id="subject" name="subject" type="text" className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="message">
          お問い合わせ内容 <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <textarea id="message" name="message" required rows={6} className="form-input" style={{ resize: "vertical" }} />
      </div>

      <TurnstileWidget />

      <button type="submit" className="btn btn-primary" disabled={pending} style={{ width: "100%" }}>
        {pending ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}
