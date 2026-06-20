"use client";

import { useActionState } from "react";
import { createSalesRep } from "@/lib/actions/sales-reps";

export function RepForm() {
  const [state, formAction, pending] = useActionState(createSalesRep, null);

  return (
    <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
      <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem" }}>担当者を追加</h2>
      {state?.error && <p style={{ fontSize: "0.875rem", color: "#b91c1c", marginBottom: "0.75rem" }}>{state.error}</p>}
      <form action={formAction} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label className="form-label" htmlFor="name">担当者名 *</label>
          <input id="name" name="name" type="text" required className="form-input" placeholder="例: 山田太郎" style={{ width: "160px" }} />
        </div>
        <div>
          <label className="form-label" htmlFor="role">役割</label>
          <select id="role" name="role" className="form-input" defaultValue="both" style={{ width: "120px" }}>
            <option value="both">IS/FS両方</option>
            <option value="is">ISのみ</option>
            <option value="fs">FSのみ</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="sort_order">表示順</label>
          <input id="sort_order" name="sort_order" type="number" className="form-input" defaultValue={0} style={{ width: "80px" }} />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "追加中..." : "追加"}
        </button>
      </form>
    </div>
  );
}
