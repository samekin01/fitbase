"use client";

import { useTransition } from "react";

type Option = { value: string; label: string; color: string };

export function RequestStatusSelect({
  currentStatus,
  options,
  action,
}: {
  currentStatus: string;
  options: Option[];
  action: (status: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === currentStatus) return;
    startTransition(async () => {
      await action(next);
    });
  }

  const current = options.find((o) => o.value === currentStatus);

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
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
