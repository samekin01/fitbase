"use client";

import { useActionState } from "react";
import { submitDeleteRequest } from "@/lib/actions/forms";
import { TurnstileWidget } from "./TurnstileWidget";

export function DeleteRequestForm({ gymId }: { gymId: string }) {
  const [state, action, pending] = useActionState(submitDeleteRequest, null);

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
          削除依頼を受け付けました
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)" }}>
          内容を確認の上、対応いたします。
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
        <label className="form-label" htmlFor="reason">
          削除理由 <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          rows={5}
          placeholder="例：閉店しました。重複して掲載されています。など"
          className="form-input"
          style={{ resize: "vertical" }}
        />
      </div>

      <TurnstileWidget />

      <button type="submit" className="btn btn-primary" disabled={pending} style={{ width: "100%" }}>
        {pending ? "送信中..." : "削除を依頼する"}
      </button>
    </form>
  );
}
