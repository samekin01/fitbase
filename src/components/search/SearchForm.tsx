"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  large?: boolean;
};

export function SearchForm({ placeholder = "ジム名・エリアで検索", defaultValue = "", large = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement).value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="form-input"
        style={{
          flex: 1,
          ...(large
            ? { fontSize: "1rem", padding: "0.875rem 1.125rem", borderColor: "#E5E7EB" }
            : {}),
        }}
        disabled={isPending}
      />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isPending}
        style={large ? { padding: "0 2rem", fontSize: "1rem", whiteSpace: "nowrap" } : undefined}
      >
        検索
      </button>
    </form>
  );
}
