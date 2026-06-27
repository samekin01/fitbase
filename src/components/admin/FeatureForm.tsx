"use client";

import { useActionState, useRef, useState } from "react";
import type { Feature, Prefecture, City, Station } from "@/types/tables";
import { Field } from "@/components/admin/fields";
import { SeoFieldGroup } from "@/components/admin/SeoFieldGroup";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { uploadBodyImage } from "@/lib/actions/images";
import { TagIcon, MapPinIcon, DocumentTextIcon, SearchIcon, SparklesIcon } from "@/components/ui/Icons";

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

type AiGenerated = {
  title?: string;
  category?: string;
  body_md?: string;
  seo_title?: string;
  meta_description?: string;
  faq?: { q: string; a: string }[];
};

export function FeatureForm({ feature, prefectures, cities, stations, action, submitLabel = "保存" }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  const formRef = useRef<HTMLFormElement>(null);
  const [aiVersion, setAiVersion] = useState(0);
  const [aiData, setAiData] = useState<AiGenerated | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const faqItems = Array.isArray(feature?.faq_json) ? (feature!.faq_json as { q: string; a: string }[]) : [];
  const currentFaq = aiData?.faq ?? faqItems;

  async function generateWithAI() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const title = ((fd.get("title") as string) ?? "").trim();
    const category = ((fd.get("category") as string) ?? "").trim();
    if (!title && !category) {
      setAiError("タイトルかカテゴリのどちらかを入力してから生成してください");
      return;
    }
    const prefectureId = fd.get("prefecture_id") as string;
    const cityId = fd.get("city_id") as string;
    const stationId = fd.get("station_id") as string;
    const prefectureName = prefectures.find((p) => p.id === prefectureId)?.name ?? "";
    const cityName = cities.find((c) => c.id === cityId)?.name ?? "";
    const stationName = stations.find((s) => s.id === stationId)?.name ?? "";

    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/admin/feature-ai-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureId: feature?.id, title, category, prefectureName, cityName, stationName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      setAiData(data);
      setAiVersion((v) => v + 1);
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form action={formAction} ref={formRef}>
      {state?.error && (
        <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--color-error)" }}>
          {state.error}
        </div>
      )}

      <div style={{ backgroundColor: "#F3E8FF", border: "1px solid #E9D5FF", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.5rem", color: "#7C3AED" }}>
          <SparklesIcon size={16} />AIでコンテンツを自動生成
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", marginBottom: "0.75rem" }}>
          タイトル・カテゴリ・対象エリアを入力してから生成すると、本文・SEO情報・FAQを自動作成します。生成後も内容は自由に手動で編集してから保存できます。
        </p>
        {aiError && (
          <p style={{ fontSize: "0.8125rem", color: "var(--color-error)", marginBottom: "0.5rem" }}>{aiError}</p>
        )}
        <button type="button" onClick={generateWithAI} disabled={aiLoading} className="btn btn-primary btn-sm" style={{ backgroundColor: "#7C3AED", borderColor: "#7C3AED" }}>
          {aiLoading ? "生成中..." : "AIで自動生成"}
        </button>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <TagIcon size={16} />基本情報
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="タイトル" required>
            <input key={`title-${aiVersion}`} name="title" type="text" required defaultValue={aiData?.title ?? feature?.title} className="form-input" />
          </Field>
          <Field label="スラッグ">
            <input name="slug" type="text" defaultValue={feature?.slug} className="form-input" placeholder="未入力時は自動生成" />
          </Field>
          <Field label="カテゴリ">
            <input key={`category-${aiVersion}`} name="category" type="text" defaultValue={aiData?.category ?? feature?.category ?? ""} className="form-input" placeholder="例: 女性向け特集" />
          </Field>
          <Field label="アイキャッチ画像URL">
            <input name="eyecatch_image_url" type="url" defaultValue={feature?.eyecatch_image_url ?? ""} className="form-input" placeholder="https://..." />
            <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
              推奨サイズ: 1280×720px（横16:9）。保存後、AIでの自動生成もできます。
            </p>
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
        <RichTextEditor
          key={`body-${aiVersion}`}
          name="body_md"
          defaultValue={aiData?.body_md ?? feature?.body_md}
          uploadAction={uploadBodyImage.bind(null, "features")}
        />
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
                key={`faq_q_${i}-${aiVersion}`}
                name={`faq_q_${i}`}
                type="text"
                defaultValue={currentFaq[i]?.q ?? ""}
                className="form-input"
                placeholder={`質問 ${i + 1}`}
                style={{ marginBottom: "0.5rem" }}
              />
              <textarea
                key={`faq_a_${i}-${aiVersion}`}
                name={`faq_a_${i}`}
                rows={2}
                defaultValue={currentFaq[i]?.a ?? ""}
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
          key={`seo-${aiVersion}`}
          defaultSeoTitle={aiData?.seo_title ?? feature?.seo_title}
          defaultMetaDescription={aiData?.meta_description ?? feature?.meta_description}
          defaultNoindex={feature?.noindex}
          showNoindex
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
