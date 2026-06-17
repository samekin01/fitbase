"use client";
import { useState } from "react";

type Gym = { id: string; name: string; address: string | null; website_url: string | null; description?: string | null };
type JobStatus = "pending" | "running" | "done" | "error";
type GymJob = Gym & { status: JobStatus; message?: string; preExisting: boolean };

export function AiFillRunner({ gyms }: { gyms: Gym[] }) {
  const [jobs, setJobs] = useState<GymJob[]>(
    gyms.map((g) => ({
      ...g,
      status: g.description ? "done" : "pending",
      preExisting: !!g.description,
    }))
  );
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);

  const done = jobs.filter((j) => j.status === "done").length;
  const errors = jobs.filter((j) => j.status === "error").length;
  const total = jobs.length;
  const pending = jobs.filter((j) => j.status === "pending" || j.status === "error").length;

  function updateJob(id: string, patch: Partial<GymJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  async function runAll() {
    setRunning(true);
    setStarted(true);
    for (const job of jobs) {
      if (job.status === "done") continue;
      updateJob(job.id, { status: "running" });
      try {
        const res = await fetch("/api/admin/ai-fill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gymId: job.id }),
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
    <div>
      {/* ヘッダー／進捗 */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>
            ドラフトジム AI一括入力
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
            {done} / {total} 件完了
            {errors > 0 && (
              <span style={{ color: "#DC2626", marginLeft: "0.75rem" }}>{errors} 件エラー</span>
            )}
            {pending > 0 && !running && (
              <span style={{ color: "var(--color-gray-500)", marginLeft: "0.75rem" }}>（未処理 {pending} 件）</span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {done === total && started && (
            <a href="/admin/gyms" className="btn btn-sm" style={{ border: "1px solid var(--color-gray-300)", backgroundColor: "var(--color-white)", color: "var(--color-gray-700)" }}>
              ジム一覧で確認
            </a>
          )}
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
              : errors > 0 && !started
              ? `エラー分を再試行 (${errors}件)`
              : `未処理 ${pending} 件を一括AI入力`}
          </button>
        </div>
      </div>

      {/* プログレスバー */}
      {started && (
        <div
          style={{
            backgroundColor: "var(--color-gray-100)",
            borderRadius: "999px",
            height: "6px",
            marginBottom: "1.25rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(done / total) * 100}%`,
              backgroundColor: "#16A34A",
              transition: "width 0.3s",
              borderRadius: "999px",
            }}
          />
        </div>
      )}

      {/* ジム一覧 */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>ジム名</th>
              <th>住所</th>
              <th>公式サイト</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td style={{ fontWeight: 600, fontSize: "0.875rem" }}>{job.name}</td>
                <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)" }}>
                  {job.address ?? "—"}
                </td>
                <td style={{ fontSize: "0.8125rem" }}>
                  {job.website_url ? (
                    <span style={{ color: "#16A34A" }}>あり</span>
                  ) : (
                    <span style={{ color: "var(--color-gray-400)" }}>なし</span>
                  )}
                </td>
                <td>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: job.preExisting && job.status === "done"
                        ? "var(--color-gray-400)"
                        : statusColor[job.status],
                    }}
                  >
                    {job.preExisting && job.status === "done" ? "AI済み" : statusLabel[job.status]}
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
