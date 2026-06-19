"use client";

import { useState } from "react";
import { Field, CheckField } from "@/components/admin/fields";

const TITLE_MAX = 60;
const DESC_MAX = 120;

function CounterLabel({ length, max }: { length: number; max: number }) {
  const over = length > max;
  return (
    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: over ? "var(--color-error)" : "var(--color-gray-400)" }}>
      {length}/{max}文字{over && "（長すぎます）"}
    </span>
  );
}

export function SeoFieldGroup({
  defaultSeoTitle,
  defaultMetaDescription,
  defaultCanonicalUrl,
  defaultNoindex,
  showCanonical = false,
  showNoindex = true,
}: {
  defaultSeoTitle?: string | null;
  defaultMetaDescription?: string | null;
  defaultCanonicalUrl?: string | null;
  defaultNoindex?: boolean | null;
  showCanonical?: boolean;
  showNoindex?: boolean;
}) {
  const [title, setTitle] = useState(defaultSeoTitle ?? "");
  const [desc, setDesc] = useState(defaultMetaDescription ?? "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="SEOタイトル">
        <input
          name="seo_title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />
        <div style={{ textAlign: "right", marginTop: "0.25rem" }}>
          <CounterLabel length={title.length} max={TITLE_MAX} />
        </div>
      </Field>
      <Field label="メタディスクリプション">
        <textarea
          name="meta_description"
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="form-input"
          style={{ resize: "vertical" }}
        />
        <div style={{ textAlign: "right", marginTop: "0.25rem" }}>
          <CounterLabel length={desc.length} max={DESC_MAX} />
        </div>
      </Field>
      {showCanonical && (
        <Field label="カノニカルURL">
          <input name="canonical_url" type="url" defaultValue={defaultCanonicalUrl ?? ""} className="form-input" />
        </Field>
      )}
      {showNoindex && (
        <Field label="noindex">
          <CheckField name="noindex" label="検索エンジンにインデックスさせない" defaultChecked={!!defaultNoindex} />
        </Field>
      )}
    </div>
  );
}
