"use client";

import { useActionState, useRef } from "react";
import type { Article } from "@/types/tables";
import { Field } from "@/components/admin/fields";
import { SeoFieldGroup } from "@/components/admin/SeoFieldGroup";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { uploadBodyImage } from "@/lib/actions/images";
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

  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  function publishNow() {
    if (statusRef.current) statusRef.current.value = "published";
    formRef.current?.requestSubmit();
  }

  return (
    <form action={formAction} ref={formRef}>
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
          <Field label="アイキャッチ画像">
            <ImageUploadField name="eyecatch_image_url" defaultValue={article?.eyecatch_image_url} uploadAction={uploadBodyImage.bind(null, "articles")} />
          </Field>
          <Field label="ステータス">
            <select name="status" ref={statusRef} defaultValue={article?.status ?? "draft"} className="form-input">
              {ARTICLE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>本文</h2>
        <RichTextEditor name="body_md" defaultValue={article?.body_md} uploadAction={uploadBodyImage.bind(null, "articles")} minHeight={360} />
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
        <button type="submit" className="btn btn-secondary" disabled={isPending}>
          {isPending ? "保存中..." : submitLabel}
        </button>
        {article?.status !== "published" && (
          <button type="button" onClick={publishNow} className="btn btn-primary" disabled={isPending}>
            公開する
          </button>
        )}
      </div>
    </form>
  );
}
