"use client";

import { useActionState } from "react";
import type { Ranking, Prefecture, City, Station } from "@/types/tables";
import { Field } from "@/components/admin/fields";
import { SeoFieldGroup } from "@/components/admin/SeoFieldGroup";
import { TrophyIcon, MapPinIcon, DocumentTextIcon, SearchIcon } from "@/components/ui/Icons";

type Props = {
  ranking?: Partial<Ranking>;
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

export function RankingForm({ ranking, prefectures, cities, stations, action, submitLabel = "保存" }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction}>
      {state?.error && (
        <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--color-error)" }}>
          {state.error}
        </div>
      )}

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <TrophyIcon size={16} />基本情報
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="タイトル" required>
            <input name="title" type="text" required defaultValue={ranking?.title} className="form-input" placeholder="例: 名古屋市のパーソナルジムおすすめランキング" />
          </Field>
          <Field label="スラッグ">
            <input name="slug" type="text" defaultValue={ranking?.slug} className="form-input" placeholder="未入力時は自動生成" />
          </Field>
          <Field label="カテゴリ">
            <input name="category" type="text" defaultValue={ranking?.category ?? ""} className="form-input" placeholder="例: 安さ重視" />
          </Field>
          <Field label="アイキャッチ画像URL">
            <input name="eyecatch_image_url" type="url" defaultValue={ranking?.eyecatch_image_url ?? ""} className="form-input" placeholder="https://..." />
            <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
              推奨サイズ: 1280×720px（横16:9）
            </p>
          </Field>
          <Field label="ステータス">
            <select name="status" defaultValue={ranking?.status ?? "draft"} className="form-input">
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
            <select name="prefecture_id" defaultValue={ranking?.prefecture_id ?? ""} className="form-input">
              <option value="">指定なし</option>
              {prefectures.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="市区町村">
            <select name="city_id" defaultValue={ranking?.city_id ?? ""} className="form-input">
              <option value="">指定なし</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="駅">
            <select name="station_id" defaultValue={ranking?.station_id ?? ""} className="form-input">
              <option value="">指定なし</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <DocumentTextIcon size={16} />導入文（Markdown）
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", margin: "0.5rem 0" }}>
          ランキング本文の先頭に表示される導入文です。各ジムの紹介文は「ランクイン管理」画面で順位ごとに編集します。
        </p>
        <textarea name="body_md" rows={10} defaultValue={ranking?.body_md ?? ""} className="form-input" style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.8125rem" }} />
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <DocumentTextIcon size={16} />クロージング文（Markdown）
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", margin: "0.5rem 0" }}>
          ランキング本文の最後（ジム紹介の後）に表示されます。
        </p>
        <textarea name="closing_md" rows={6} defaultValue={ranking?.closing_md ?? ""} className="form-input" style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.8125rem" }} />
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>
          <SearchIcon size={16} />SEO
        </h2>
        <SeoFieldGroup
          defaultSeoTitle={ranking?.seo_title}
          defaultMetaDescription={ranking?.meta_description}
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
