"use client";
import { useState } from "react";

type Gym = { id: string; name: string };
type JobStatus = "pending" | "running" | "gym" | "non_gym" | "error";
type GymJob = Gym & { status: JobStatus; message?: string };

export function GymClassifyRunner({ gyms }: { gyms: Gym[] }) {
  const [jobs, setJobs] = useState<GymJob[]>(gyms.map((g) => ({ ...g, status: "pending" })));
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const gymCount = jobs.filter((j) => j.status === "gym").length;
  const nonGymCount = jobs.filter((j) => j.status === "non_gym").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;
  const pending = jobs.filter((j) => j.status === "pending" || j.status === "error").length;
  const total = jobs.length;

  function updateJob(id: string, patch: Partial<GymJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  async function runAll() {
    setRunning(true);
    setFinished(false);
    for (const job of jobs) {
      if (job.status === "gym" || job.status === "non_gym") continue;
      updateJob(job.id, { status: "running" });
      try {
        const res = await fetch("/api/admin/gym-classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gymId: job.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          updateJob(job.id, { status: "error", message: data.error ?? "不明なエラー" });
        } else {
          updateJob(job.id, { status: data.isGym ? "gym" : "non_gym", message: data.reason });
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
    gym: "#16A34A",
    non_gym: "#DC2626",
    error: "#DC2626",
  };
  const statusLabel: Record<JobStatus, string> = {
    pending: "未判定",
    running: "判定中...",
    gym: "ジムと判定",
    non_gym: "ジムではないと判定（非公開）",
    error: "エラー",
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
            AIでジム判定（本当にパーソナルジムか自動チェック）
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
            ジムと判定 {gymCount}件 / ジムではないと判定 {nonGymCount}件
            {errorCount > 0 && ` / エラー ${errorCount}件`}
            （対象 {total}件）。ジムではないと判定された下書きは自動で「非公開」に変更されます。
          </p>
        </div>
        <button
          onClick={runAll}
          disabled={running || pending === 0}
          className="btn btn-primary btn-sm"
          style={{ whiteSpace: "nowrap" }}
        >
          {running ? "判定中..." : pending === 0 ? "完了" : `未判定 ${pending}件を判定`}
        </button>
      </div>

      {(gymCount + nonGymCount > 0 || running) && (
        <div style={{ height: "4px", backgroundColor: "var(--color-gray-100)" }}>
          <div
            style={{
              height: "100%",
              width: `${((gymCount + nonGymCount) / total) * 100}%`,
              backgroundColor: "#16A34A",
              transition: "width 0.3s",
            }}
          />
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>ジム名</th>
            <th>判定結果</th>
          </tr>
        </thead>
        <tbody>
          {jobs
            .filter((job) => job.status !== "pending" || !finished)
            .map((job) => (
              <tr key={job.id}>
                <td style={{ fontSize: "0.875rem", fontWeight: 600 }}>{job.name}</td>
                <td>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: statusColor[job.status] }}>
                    {statusLabel[job.status]}
                    {job.message && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 400, display: "block", color: "var(--color-gray-500)" }}>
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
