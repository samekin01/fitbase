"use client";
import { useState } from "react";

type Ranking = { id: string; title: string; body_md: string | null };
type JobStatus = "pending" | "running" | "done" | "error";
type RankingJob = Ranking & { status: JobStatus; message?: string; preExisting: boolean };

export function RankingAiFillRunner({ rankings }: { rankings: Ranking[] }) {
  const [jobs, setJobs] = useState<RankingJob[]>(
    rankings.map((r) => ({
      ...r,
      status: r.body_md ? "done" : "pending",
      preExisting: !!r.body_md,
    }))
  );
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);

  const done = jobs.filter((j) => j.status === "done").length;
  const errors = jobs.filter((j) => j.status === "error").length;
  const total = jobs.length;
  const pending = jobs.filter((j) => j.status === "pending" || j.status === "error").length;

  function updateJob(id: string, patch: Partial<RankingJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  async function runAll() {
    setRunning(true);
    setStarted(true);
    for (const job of jobs) {
      if (job.status === "done") continue;
      updateJob(job.id, { status: "running" });
      try {
        const res = await fetch("/api/admin/ranking-ai-fill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rankingId: job.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          updateJob(job.id, { status: "error", message: data.error ?? "不明なエラー" });
        } else {
          updateJob(job.id, { status: "done", preExisting: false });
        }
      } catch (e: any) {
        updateJob(job.id, { status: "error", message: e.message });
      }
    }
    setRunning(false);
  }

  if (total === 0) return null;

  const statusColor: Record<JobStatus, string> = {
    pending: "var(--color-gray-400)",
    running: "#2563EB",
    done: "#16A34A",
    error: "#DC2626",
  };
  const statusLabel: Record<JobStatus, string> = {
    pending: "待機中",
    running: "生成中...",
    done: "完了",
    error: "エラー",
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem 1.5rem",
          marginBottom: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>
            ランキング AI一括SEO生成
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
            {done} / {total} 件完了
            {errors > 0 && <span style={{ color: "#DC2626", marginLeft: "0.75rem" }}>{errors} 件エラー</span>}
            {pending > 0 && !running && (
              <span style={{ color: "var(--color-gray-500)", marginLeft: "0.75rem" }}>（未処理 {pending} 件）</span>
            )}
          </p>
        </div>
        <button
          onClick={runAll}
          disabled={running || pending === 0}
          className="btn btn-primary"
          style={{ whiteSpace: "nowrap" }}
        >
          {running
            ? `処理中 (${done}/${total})`
            : pending === 0
            ? "すべて完了"
            : `未処理 ${pending} 件にタイトル・本文を自動生成`}
        </button>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ランキング</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td style={{ fontWeight: 600, fontSize: "0.875rem" }}>{job.title}</td>
                <td>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: statusColor[job.status] }}>
                    {job.preExisting && job.status === "done" ? "生成済み" : statusLabel[job.status]}
                    {job.status === "error" && job.message && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 400, display: "block", color: "#DC2626" }}>
                        {job.message}
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
