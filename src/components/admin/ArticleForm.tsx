"use client";

import { useActionState } from "react";
import type { Article } from "@/types/tables";
import { Field } from "@/components/admin/fields";
import { SeoFieldGroup } from "@/components/admin/SeoFieldGroup";
import { DocumentTextIcon, SearchIcon } from "@/components/ui/Icons";

type Props = {
  article?: Partial<Article>;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel?: string;
};

const ARTICLE_STATUSES = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開中" },
];

export function ArticleForm({ article, action, submitLabel = "保存" }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="_was_published" value={article?.status === "published" ? "true" : "false"} />

      {state?.error && (
        <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--color-error)" }}>
          {state.error}
        </div>
      )}

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <DocumentTextIcon size={16} />基本情報
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="タイトル" required>
            <input name="title" type="text" required defaultValue={article?.title} className="form-input" />
          </Field>
          <Field label="スラッグ">
            <input name="slug" type="text" defaultValue={article?.slug} className="form-input" placeholder="未入力時は自動生成" />
          </Field>
          <Field label="カテゴリ">
            <input name="category" type="text" defaultValue={article?.category ?? ""} className="form-input" placeholder="例: 選び方ガイド" />
          </Field>
          <Field label="監修者名">
            <input name="supervisor_name" type="text" defaultValue={article?.supervisor_name ?? ""} className="form-input" />
          </Field>
          <Field label="アイキャッチ画像URL">
            <input name="eyecatch_image_url" type="url" defaultValue={article?.eyecatch_image_url ?? ""} className="form-input" />
          </Field>
          <Field label="ステータス">
            <select name="status" defaultValue={article?.status ?? "draft"} className="form-input">
              {ARTICLE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>本文（Markdown）</h2>
        <textarea name="body_md" rows={18} defaultValue={article?.body_md ?? ""} className="form-input" style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.8125rem" }} />
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <SearchIcon size={16} />SEO
        </h2>
        <SeoFieldGroup
          defaultSeoTitle={article?.seo_title}
          defaultMetaDescription={article?.meta_description}
          defaultCanonicalUrl={article?.canonical_url}
          defaultNoindex={article?.noindex}
          showCanonical
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
