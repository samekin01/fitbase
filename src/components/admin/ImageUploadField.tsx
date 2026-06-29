"use client";
import { useState } from "react";

type Props = {
  name: string;
  defaultValue?: string | null;
  uploadAction: (formData: FormData) => Promise<string>;
};

export function ImageUploadField({ name, defaultValue, uploadAction }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const uploadedUrl = await uploadAction(fd);
      setUrl(uploadedUrl);
    } catch (err: any) {
      setError(err.message ?? "アップロードに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url && (
        <div style={{ marginBottom: "0.625rem" }}>
          <img
            src={url}
            alt=""
            style={{ maxWidth: "280px", maxHeight: "157px", width: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-gray-200)", display: "block" }}
          />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <label className="btn btn-secondary btn-sm" style={{ cursor: uploading ? "default" : "pointer" }}>
          {uploading ? "アップロード中..." : url ? "画像を変更" : "画像をアップロード"}
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: "none" }} />
        </label>
        {url && !uploading && (
          <button type="button" onClick={() => setUrl("")} className="btn btn-sm" style={{ color: "var(--color-error)", backgroundColor: "transparent", border: "none" }}>
            削除
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: "0.75rem", color: "var(--color-error)", marginTop: "0.375rem" }}>{error}</p>}
    </div>
  );
}
