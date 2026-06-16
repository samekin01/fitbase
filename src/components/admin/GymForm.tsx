"use client";

import { useActionState } from "react";
import type { Gym, Prefecture, City, Station, Tag } from "@/types/tables";
import { Field, CheckField } from "@/components/admin/fields";

type Props = {
  gym?: Partial<Gym>;
  prefectures: Prefecture[];
  cities: City[];
  stations: Station[];
  allTags: Tag[];
  assignedTagIds: string[];
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel?: string;
};

const GYM_STATUSES = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開中" },
  { value: "hidden", label: "非公開" },
  { value: "claim_requested", label: "申請済み" },
  { value: "verified", label: "認証済み" },
  { value: "delete_requested", label: "削除申請" },
];

export function GymForm({ gym, prefectures, cities, stations, allTags, assignedTagIds, action, submitLabel = "保存" }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction}>
      {/* 既存ステータスを hidden で送る（公開日時の記録に使用） */}
      <input type="hidden" name="_was_published" value={gym?.status === "published" ? "true" : "false"} />

      {state?.error && (
        <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--color-error)" }}>
          {state.error}
        </div>
      )}

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>基本情報</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="ジム名" required>
            <input name="name" type="text" required defaultValue={gym?.name} className="form-input" />
          </Field>
          <Field label="スラッグ" required>
            <input name="slug" type="text" defaultValue={gym?.slug} className="form-input" placeholder="未入力時は自動生成" />
          </Field>
          <Field label="ステータス">
            <select name="status" defaultValue={gym?.status ?? "draft"} className="form-input">
              {GYM_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="ソース">
            <select name="source" defaultValue={gym?.source ?? "manual"} className="form-input">
              <option value="manual">manual</option>
              <option value="google_places">google_places</option>
              <option value="gym_owner">gym_owner</option>
              <option value="imported">imported</option>
            </select>
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>所在地</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="都道府県">
            <select name="prefecture_id" defaultValue={gym?.prefecture_id ?? ""} className="form-input">
              <option value="">選択してください</option>
              {prefectures.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="市区町村">
            <select name="city_id" defaultValue={gym?.city_id ?? ""} className="form-input">
              <option value="">選択してください</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="最寄り駅">
            <select name="nearest_station_id" defaultValue={gym?.nearest_station_id ?? ""} className="form-input">
              <option value="">なし</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="エリア名（表示用）">
            <input name="area_name" type="text" defaultValue={gym?.area_name ?? ""} className="form-input" placeholder="例: 栄・矢場町エリア" />
          </Field>
          <Field label="住所">
            <input name="address" type="text" defaultValue={gym?.address ?? ""} className="form-input" />
          </Field>
          <Field label="緯度">
            <input name="latitude" type="number" step="any" defaultValue={gym?.latitude ?? ""} className="form-input" />
          </Field>
          <Field label="経度">
            <input name="longitude" type="number" step="any" defaultValue={gym?.longitude ?? ""} className="form-input" />
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>連絡先・リンク</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="電話番号">
            <input name="phone" type="tel" defaultValue={gym?.phone ?? ""} className="form-input" />
          </Field>
          <Field label="公式サイト URL">
            <input name="website_url" type="url" defaultValue={gym?.website_url ?? ""} className="form-input" />
          </Field>
          <Field label="Google Maps URL">
            <input name="google_maps_url" type="url" defaultValue={gym?.google_maps_url ?? ""} className="form-input" />
          </Field>
          <Field label="Google Place ID">
            <input name="google_place_id" type="text" defaultValue={gym?.google_place_id ?? ""} className="form-input" />
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>料金・体験</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="入会金（円）">
            <input name="admission_fee" type="number" defaultValue={gym?.admission_fee ?? ""} className="form-input" />
          </Field>
          <Field label="体験">
            <CheckField name="has_trial" label="体験あり" defaultChecked={gym?.has_trial} />
          </Field>
          <Field label="体験料金（円）">
            <input name="trial_fee" type="number" defaultValue={gym?.trial_fee ?? ""} className="form-input" />
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>特徴・絞り込み条件</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <CheckField name="is_female_friendly" label="女性向け" defaultChecked={gym?.is_female_friendly} />
          <CheckField name="has_private_room" label="完全個室" defaultChecked={gym?.has_private_room} />
          <CheckField name="has_nutrition_support" label="食事指導" defaultChecked={gym?.has_nutrition_support} />
          <CheckField name="supports_contest" label="コンテスト対応" defaultChecked={gym?.supports_contest} />
          <CheckField name="is_near_station" label="駅近" defaultChecked={gym?.is_near_station} />
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>タグ</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {allTags.map((tag) => (
            <label key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="tag_ids"
                value={tag.id}
                defaultChecked={assignedTagIds.includes(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>店舗説明</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="店舗説明">
            <textarea name="description" rows={5} defaultValue={gym?.description ?? ""} className="form-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="おすすめポイント">
            <textarea name="recommended_points" rows={3} defaultValue={gym?.recommended_points ?? ""} className="form-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="対象ユーザー">
            <textarea name="target_users" rows={2} defaultValue={gym?.target_users ?? ""} className="form-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="トレーナー情報">
            <textarea name="trainer_info" rows={3} defaultValue={gym?.trainer_info ?? ""} className="form-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="設備">
            <textarea name="facilities" rows={2} defaultValue={gym?.facilities ?? ""} className="form-input" style={{ resize: "vertical" }} />
          </Field>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-gray-200)" }}>SEO</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Field label="SEOタイトル">
            <input name="seo_title" type="text" defaultValue={gym?.seo_title ?? ""} className="form-input" />
          </Field>
          <Field label="メタディスクリプション">
            <textarea name="meta_description" rows={2} defaultValue={gym?.meta_description ?? ""} className="form-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="noindex">
            <CheckField name="noindex" label="検索エンジンにインデックスさせない" defaultChecked={gym?.noindex} />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
