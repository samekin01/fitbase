export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "0.5rem", alignItems: "start", borderBottom: "1px solid var(--color-gray-100)", paddingBottom: "0.75rem" }}>
      <label className="form-label" style={{ paddingTop: "0.5rem", marginBottom: 0 }}>
        {label}{required && <span style={{ color: "var(--color-error)", marginLeft: "0.25rem" }}>*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

export function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", cursor: "pointer" }}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
