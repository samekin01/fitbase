"use client";

import { useActionState } from "react";
import type { Feature, Prefecture, City, Station } from "@/types/tables";
import { Field } from "@/components/admin/fields";
import { SeoFieldGroup } from "@/components/admin/SeoFieldGroup";
import { TagIcon, MapPinIcon, DocumentTextIcon, SearchIcon } from "@/components/ui/Icons";

type Props = {
  feature?: Partial<Feature>;
  prefectures: Prefecture[];
  cities: City[];
  stations: Station[];
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel?: string;
};

const STATUSES = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開中" },
];

const FAQ_SLOTS = 5;

export function FeatureForm({ feature, prefectures, cities, stations, action, submitLabel = "保存" }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  const faqItems = Array.isArray(feature?.faq_json) ? (feature!.faq_json as { q: string; a: string }[]) : [];

  return (
    <form action={formAction}>
      {state?.error && (
        <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--color-error)" }}>
          {state.error}
        </div>
      )}

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <TagIcon size={16} />基本情報
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="タイトル" required>
            <input name="title" type="text" required defaultValue={feature?.title} className="form-input" />
          </Field>
          <Field label="スラッグ">
            <input name="slug" type="text" defaultValue={feature?.slug} className="form-input" placeholder="未入力時は自動生成" />
          </Field>
          <Field label="カテゴリ">
            <input name="category" type="text" defaultValue={feature?.category ?? ""} className="form-input" placeholder="例: 女性向け特集" />
          </Field>
          <Field label="表示順">
            <input name="sort_order" type="number" defaultValue={feature?.sort_order ?? 0} className="form-input" style={{ width: "100px" }} />
          </Field>
          <Field label="ステータス">
            <select name="status" defaultValue={feature?.status ?? "draft"} className="form-input">
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <MapPinIcon size={16} />対象エリア（任意）
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="都道府県">
            <select name="prefecture_id" defaultValue={feature?.prefecture_id ?? ""} className="form-input">
              <option value="">指定なし</option>
              {prefectures.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="市区町村">
            <select name="city_id" defaultValue={feature?.city_id ?? ""} className="form-input">
              <option value="">指定なし</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="駅">
            <select name="station_id" defaultValue={feature?.station_id ?? ""} className="form-input">
              <option value="">指定なし</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <DocumentTextIcon size={16} />本文（Markdown）
        </h2>
        <textarea name="body_md" rows={14} defaultValue={feature?.body_md ?? ""} className="form-input" style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.8125rem" }} />
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>よくある質問（FAQ）</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "0.75rem" }}>
          入力した分だけ公開ページとFAQ構造化データに反映されます。空欄の行は無視されます。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {Array.from({ length: FAQ_SLOTS }, (_, i) => (
            <div key={i} style={{ border: "1px solid var(--color-gray-100)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
              <input
                name={`faq_q_${i}`}
                type="text"
                defaultValue={faqItems[i]?.q ?? ""}
                className="form-input"
                placeholder={`質問 ${i + 1}`}
                style={{ marginBottom: "0.5rem" }}
              />
              <textarea
                name={`faq_a_${i}`}
                rows={2}
                defaultValue={faqItems[i]?.a ?? ""}
                className="form-input"
                placeholder="回答"
                style={{ resize: "vertical" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <SearchIcon size={16} />SEO
        </h2>
        <SeoFieldGroup
          defaultSeoTitle={feature?.seo_title}
          defaultMetaDescription={feature?.meta_description}
          showNoindex={false}
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
