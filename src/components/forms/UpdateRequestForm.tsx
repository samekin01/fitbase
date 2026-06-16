"use client";

import { useActionState } from "react";
import { submitUpdateRequest } from "@/lib/actions/forms";
import { TurnstileWidget } from "./TurnstileWidget";

export function UpdateRequestForm({ gymId }: { gymId: string }) {
  const [state, action, pending] = useActionState(submitUpdateRequest, null);

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
          修正依頼を受け付けました
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)" }}>
          内容を確認の上、反映いたします。ご協力ありがとうございます。
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
      <input type="hidden" name="gym_id" value={gymId} />

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
        <label className="form-label" htmlFor="requester_name">
          お名前 <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <input id="requester_name" name="requester_name" type="text" required className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="email">
          メールアドレス <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <input id="email" name="email" type="email" required className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="message">
          修正してほしい内容 <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="例：料金が変更されています。営業時間が間違っています。など"
          className="form-input"
          style={{ resize: "vertical" }}
        />
      </div>

      <TurnstileWidget />

      <button type="submit" className="btn btn-primary" disabled={pending} style={{ width: "100%" }}>
        {pending ? "送信中..." : "修正を依頼する"}
      </button>
    </form>
  );
}
