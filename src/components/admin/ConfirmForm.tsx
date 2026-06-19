"use client";

export function ConfirmForm({
  message,
  action,
  label,
  buttonStyle,
  buttonClassName,
  children,
}: {
  message: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  buttonStyle?: React.CSSProperties;
  buttonClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
    >
      {children}
      <button type="submit" className={buttonClassName} style={buttonStyle}>
        {label}
      </button>
    </form>
  );
}
