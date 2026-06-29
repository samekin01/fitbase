"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SEO_TITLE_MAX = 60;
const META_DESCRIPTION_MAX = 120;

export type SeoAiTarget = {
  table: string;
  id: string;
  name: string;
  original_seo_title: string | null;
  original_meta_description: string | null;
};

type JobStatus = "pending" | "generating" | "review" | "applying" | "applied" | "error";
type Job = SeoAiTarget & {
  status: JobStatus;
  message?: string;
  draft_seo_title?: string;
  draft_meta_description?: string;
};

export function SeoAiFillRunner({ targets }: { targets: SeoAiTarget[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(targets.map((t) => ({ ...t, status: "pending" })));
  const [generating, setGenerating] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);

  const total = jobs.length;
  const reviewCount = jobs.filter((j) => j.status === "review").length;
  const appliedCount = jobs.filter((j) => j.status === "applied").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;
  const pendingCount = jobs.filter((j) => j.status === "pending" || j.status === "error").length;

  function updateJob(id: string, patch: Partial<Job>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  async function generateOne(job: Job) {
    updateJob(job.id, { status: "generating" });
    try {
      const res = await fetch("/api/admin/seo-ai-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: job.table, id: job.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        updateJob(job.id, { status: "error", message: data.error ?? "不明なエラー" });
        return;
      }
      updateJob(job.id, {
        status: "review",
        draft_seo_title: data.seo_title,
        draft_meta_description: data.meta_description,
      });
    } catch (e: any) {
      updateJob(job.id, { status: "error", message: e.message });
    }
  }

  async function generateAll() {
    setGenerating(true);
    for (const job of jobs) {
      if (job.status === "review" || job.status === "applied") continue;
      await generateOne(job);
    }
    setGenerating(false);
  }

  async function applyOne(job: Job) {
    updateJob(job.id, { status: "applying" });
    try {
      const res = await fetch("/api/admin/seo-ai-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: job.table,
          id: job.id,
          seo_title: job.draft_seo_title,
          meta_description: job.draft_meta_description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        updateJob(job.id, { status: "error", message: data.error ?? "不明なエラー" });
        return false;
      }
      updateJob(job.id, { status: "applied" });
      return true;
    } catch (e: any) {
      updateJob(job.id, { status: "error", message: e.message });
      return false;
    }
  }

  async function applyAllReviewed() {
    setApplyingAll(true);
    for (const job of jobs) {
      if (job.status !== "review") continue;
      await applyOne(job);
    }
    setApplyingAll(false);
    router.refresh();
  }

  if (total === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1rem 1.25rem",
          marginBottom: reviewCount > 0 || appliedCount > 0 || errorCount > 0 ? "0.75rem" : "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>
            要対応項目をAIで自動生成
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)" }}>
            SEOノウハウを踏まえてAIが内容を作成します。生成後は内容を確認・編集してから「適用」してください（自動では保存されません）。
            {(reviewCount > 0 || appliedCount > 0 || errorCount > 0) && (
              <span style={{ marginLeft: "0.5rem" }}>
                確認待ち {reviewCount}件 / 適用済み {appliedCount}件
                {errorCount > 0 && <span style={{ color: "#DC2626" }}> / エラー {errorCount}件</span>}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={generateAll}
            disabled={generating || pendingCount === 0}
            className="btn btn-secondary"
            style={{ whiteSpace: "nowrap" }}
          >
            {generating ? "生成中..." : pendingCount === 0 ? "生成完了" : `未対応 ${pendingCount} 件をAIで生成`}
          </button>
          <button
            onClick={applyAllReviewed}
            disabled={applyingAll || reviewCount === 0}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            {applyingAll ? "適用中..." : `確認済み ${reviewCount} 件をすべて適用`}
          </button>
        </div>
      </div>

      {jobs.some((j) => j.status === "review" || j.status === "applying" || j.status === "applied" || j.status === "error") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {jobs
            .filter((j) => j.status === "review" || j.status === "applying" || j.status === "applied" || j.status === "error")
            .map((job) => (
              <ReviewCard key={job.id} job={job} onChange={(patch) => updateJob(job.id, patch)} onApply={() => applyOne(job)} />
            ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  job,
  onChange,
  onApply,
}: {
  job: Job;
  onChange: (patch: Partial<Job>) => void;
  onApply: () => void;
}) {
  const titleLen = (job.draft_seo_title ?? "").length;
  const descLen = (job.draft_meta_description ?? "").length;

  return (
    <div
      style={{
        backgroundColor: job.status === "applied" ? "var(--color-gray-50)" : "var(--color-white)",
        border: "1px solid var(--color-gray-200)",
        borderRadius: "var(--radius-md)",
        padding: "1rem 1.125rem",
        opacity: job.status === "applied" ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-gray-900)" }}>{job.name}</p>
        <StatusBadge status={job.status} />
      </div>

      {job.status === "error" && (
        <p style={{ fontSize: "0.8125rem", color: "#DC2626", marginBottom: "0.5rem" }}>{job.message}</p>
      )}

      {(job.status === "review" || job.status === "applying" || job.status === "applied") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", display: "block", marginBottom: "0.25rem" }}>
              SEOタイトル（{titleLen}/{SEO_TITLE_MAX}文字）
              {job.original_seo_title && (
                <span style={{ marginLeft: "0.5rem" }}>元: 「{job.original_seo_title}」</span>
              )}
            </label>
            <input
              type="text"
              value={job.draft_seo_title ?? ""}
              onChange={(e) => onChange({ draft_seo_title: e.target.value })}
              disabled={job.status !== "review"}
              maxLength={SEO_TITLE_MAX}
              className="form-input"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", display: "block", marginBottom: "0.25rem" }}>
              メタディスクリプション（{descLen}/{META_DESCRIPTION_MAX}文字）
              {job.original_meta_description && (
                <span style={{ marginLeft: "0.5rem" }}>元あり</span>
              )}
            </label>
            <textarea
              value={job.draft_meta_description ?? ""}
              onChange={(e) => onChange({ draft_meta_description: e.target.value })}
              disabled={job.status !== "review"}
              maxLength={META_DESCRIPTION_MAX}
              className="form-input"
              style={{ width: "100%", minHeight: "60px", resize: "vertical" }}
            />
          </div>
          {job.status === "review" && (
            <div>
              <button onClick={onApply} className="btn btn-primary btn-sm">
                この内容を適用
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; className: string }> = {
    pending: { label: "未生成", className: "badge" },
    generating: { label: "生成中...", className: "badge badge-yellow" },
    review: { label: "確認待ち", className: "badge badge-yellow" },
    applying: { label: "適用中...", className: "badge badge-yellow" },
    applied: { label: "適用済み", className: "badge badge-green" },
    error: { label: "エラー", className: "badge badge-red" },
  };
  const { label, className } = map[status];
  return <span className={className}>{label}</span>;
}
