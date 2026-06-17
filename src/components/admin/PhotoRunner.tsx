"use client";
import { useState } from "react";

type Gym = { id: string; name: string; hasPhoto: boolean };
type JobStatus = "pending" | "running" | "done" | "error" | "skipped";
type GymJob = Gym & { status: JobStatus; message?: string };

export function PhotoRunner({ gyms }: { gyms: Gym[] }) {
  const [jobs, setJobs] = useState<GymJob[]>(
    gyms.map((g) => ({ ...g, status: g.hasPhoto ? "skipped" : "pending" }))
  );
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const done = jobs.filter((j) => j.status === "done").length;
  const errors = jobs.filter((j) => j.status === "error").length;
  const skipped = jobs.filter((j) => j.status === "skipped").length;
  const pending = jobs.filter((j) => j.status === "pending" || j.status === "error").length;
  const total = jobs.length;

  function updateJob(id: string, patch: Partial<GymJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  async function runAll(overwrite = false) {
    setRunning(true);
    setFinished(false);
    for (const job of jobs) {
      if (!overwrite && (job.status === "done" || job.status === "skipped")) continue;
      updateJob(job.id, { status: "running" });
      try {
        const res = await fetch("/api/admin/ai-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gymId: job.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          updateJob(job.id, { status: "error", message: data.error ?? "不明なエラー" });
        } else {
          updateJob(job.id, { status: "done" });
        }
      } catch (e: any) {
        updateJob(job.id, { status: "error", message: e.message });
      }
    }
    setRunning(false);
    setFinished(true);
  }

  const statusColor: Record<JobStatus, string> = {
    pending: "var(--color-gray-400)",
    running: "#2563EB",
    done: "#16A34A",
    error: "#DC2626",
    skipped: "var(--color-gray-300)",
  };
  const statusLabel: Record<JobStatus, string> = {
    pending: "未設定",
    running: "取得中...",
    done: "完了",
    error: "エラー",
    skipped: "設定済み",
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-gray-200)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        marginTop: "2rem",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--color-gray-200)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.125rem" }}>
            Google写真を一括設定
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
            {done}件完了 / {skipped}件設定済み / {errors > 0 ? `${errors}件エラー` : ""} （対象 {total}件）
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {skipped > 0 && finished && (
            <button
              onClick={() => runAll(true)}
              disabled={running}
              className="btn btn-sm"
              style={{ border: "1px solid var(--color-gray-300)", backgroundColor: "var(--color-white)", color: "var(--color-gray-700)", whiteSpace: "nowrap" }}
            >
              設定済みも上書き
            </button>
          )}
          <button
            onClick={() => runAll(false)}
            disabled={running || pending === 0}
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: "nowrap" }}
          >
            {running
              ? "取得中..."
              : pending === 0
              ? "完了"
              : `未設定 ${pending}件に写真を設定`}
          </button>
        </div>
      </div>

      {/* プログレスバー */}
      {(done > 0 || running) && (
        <div style={{ height: "4px", backgroundColor: "var(--color-gray-100)" }}>
          <div
            style={{
              height: "100%",
              width: `${((done + skipped) / total) * 100}%`,
              backgroundColor: "#16A34A",
              transition: "width 0.3s",
            }}
          />
        </div>
      )}

      {/* ジム一覧 */}
      <table className="data-table">
        <thead>
          <tr>
            <th>ジム名</th>
            <th>写真ステータス</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td style={{ fontSize: "0.875rem", fontWeight: 600 }}>{job.name}</td>
              <td>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: statusColor[job.status] }}>
                  {statusLabel[job.status]}
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
  );
}
