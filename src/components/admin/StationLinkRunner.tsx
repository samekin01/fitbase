"use client";
import { useState, useTransition } from "react";

type GymRow = {
  id: string;
  name: string;
  google_place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  nearest_station_id: string | null;
  stationName?: string;
};

type JobStatus = "done" | "pending" | "running" | "error";

type GymJob = GymRow & {
  status: JobStatus;
  result?: string;
};

export function StationLinkRunner({ gyms }: { gyms: GymRow[] }) {
  const [jobs, setJobs] = useState<GymJob[]>(() =>
    gyms.map((g) => ({
      ...g,
      status: g.nearest_station_id ? "done" : "pending",
    }))
  );
  const [isPending, startTransition] = useTransition();

  function setJobStatus(id: string, update: Partial<GymJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...update } : j)));
  }

  async function runOne(gymId: string) {
    setJobStatus(gymId, { status: "running", result: undefined });
    try {
      const res = await fetch("/api/admin/link-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJobStatus(gymId, { status: "error", result: data.error });
      } else {
        setJobStatus(gymId, {
          status: "done",
          result: `${data.stationName} 徒歩${data.walkMinutes}分（${data.distanceMeters}m）`,
        });
      }
    } catch (e: any) {
      setJobStatus(gymId, { status: "error", result: e.message });
    }
  }

  async function runAll() {
    const targets = jobs.filter((j) => j.status === "pending");
    for (const j of targets) {
      await runOne(j.id);
    }
  }

  const pendingCount = jobs.filter((j) => j.status === "pending").length;
  const doneCount = jobs.filter((j) => j.status === "done").length;

  const statusColor: Record<JobStatus, string> = {
    done: "#16A34A",
    pending: "#6B7280",
    running: "#1558D6",
    error: "#DC2626",
  };

  const statusLabel: Record<JobStatus, string> = {
    done: "完了",
    pending: "未処理",
    running: "処理中...",
    error: "エラー",
  };

  return (
    <div>
      {/* コントロール */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
          padding: "1rem 1.25rem",
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div style={{ flex: 1, fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
          完了 <strong>{doneCount}</strong> 件 ／ 未処理 <strong>{pendingCount}</strong> 件
        </div>
        <button
          className="btn btn-primary"
          onClick={() => startTransition(runAll)}
          disabled={isPending || pendingCount === 0}
        >
          未処理 {pendingCount}件を一括リンク
        </button>
      </div>

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
              <th>座標</th>
              <th>最寄駅</th>
              <th>ステータス</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td style={{ fontWeight: 600, maxWidth: "200px" }}>
                  <span style={{ fontSize: "0.875rem" }}>{job.name}</span>
                </td>
                <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
                  {job.latitude && job.longitude
                    ? `${job.latitude.toFixed(4)}, ${job.longitude.toFixed(4)}`
                    : job.google_place_id
                    ? "Place IDあり"
                    : "なし"}
                </td>
                <td style={{ fontSize: "0.875rem" }}>
                  {job.stationName && <span style={{ color: "var(--color-gray-700)" }}>{job.stationName}</span>}
                  {job.result && job.status === "done" && (
                    <span style={{ color: "var(--color-success)", fontSize: "0.8125rem" }}>{job.result}</span>
                  )}
                  {job.result && job.status === "error" && (
                    <span style={{ color: "var(--color-error)", fontSize: "0.75rem" }}>{job.result}</span>
                  )}
                </td>
                <td>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: statusColor[job.status],
                      padding: "0.125rem 0.5rem",
                      border: `1px solid ${statusColor[job.status]}`,
                      borderRadius: "3px",
                    }}
                  >
                    {statusLabel[job.status]}
                  </span>
                </td>
                <td>
                  {(job.status === "pending" || job.status === "error") && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => runOne(job.id)}
                      disabled={job.status === "running"}
                    >
                      リンク
                    </button>
                  )}
                  {job.status === "done" && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setJobStatus(job.id, { status: "pending", result: undefined });
                      }}
                      style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}
                    >
                      再実行
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
