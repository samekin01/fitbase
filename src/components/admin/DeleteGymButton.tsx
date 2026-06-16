"use client";

export function DeleteGymButton({ gymName, action }: { gymName: string; action: (formData: FormData) => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`「${gymName}」を削除しますか？`)) e.preventDefault();
      }}
    >
      <button type="submit" className="btn btn-sm" style={{ backgroundColor: "#DC2626", color: "white", border: "none" }}>
        削除する
      </button>
    </form>
  );
}
