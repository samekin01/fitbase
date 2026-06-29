"use client";
import { useTransition } from "react";
import type { ContentStatus } from "@/types/tables";

const STATUS_OPTIONS = [
  { value: "published", label: "公開中", color: "#16A34A" },
  { value: "draft", label: "下書き", color: "#D97706" },
];

export function ContentStatusSelect({
  id,
  currentStatus,
  action,
}: {
  id: string;
  currentStatus: string;
  action: (id: string, status: ContentStatus) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ContentStatus;
    if (next === currentStatus) return;
    startTransition(async () => {
      await action(id, next);
    });
  }

  const current = STATUS_OPTIONS.find((o) => o.value === currentStatus);

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        color: isPending ? "#9CA3AF" : (current?.color ?? "#6B7280"),
        border: "1px solid var(--color-gray-200)",
        borderRadius: "4px",
        padding: "2px 6px",
        backgroundColor: "var(--color-white)",
        cursor: "pointer",
        appearance: "auto",
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
