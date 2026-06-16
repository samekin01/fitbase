"use client";

import { useActionState } from "react";
import { submitClaim } from "@/lib/actions/forms";
import { TurnstileWidget } from "./TurnstileWidget";

export function ClaimForm({ gymId }: { gymId: string }) {
  const [state, action, pending] = useActionState(submitClaim, null);

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
          申請を受け付けました
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)" }}>
          内容を確認の上、担当者よりご連絡いたします。
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
        <label className="form-label" htmlFor="owner_name">
          ご担当者名 <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <input id="owner_name" name="owner_name" type="text" required className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="company_name">
          会社名・店舗運営会社名
        </label>
        <input id="company_name" name="company_name" type="text" className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="position">
          ご担当者様の役職
        </label>
        <input id="position" name="position" type="text" className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="email">
          メールアドレス <span style={{ color: "#b91c1c" }}>必須</span>
        </label>
        <input id="email" name="email" type="email" required className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="phone">
          電話番号
        </label>
        <input id="phone" name="phone" type="tel" className="form-input" />
      </div>

      <div>
        <label className="form-label" htmlFor="message">
          補足事項
        </label>
        <textarea id="message" name="message" rows={5} className="form-input" style={{ resize: "vertical" }} />
      </div>

      <TurnstileWidget />

      <button type="submit" className="btn btn-primary" disabled={pending} style={{ width: "100%" }}>
        {pending ? "送信中..." : "申請する"}
      </button>
    </form>
  );
}
