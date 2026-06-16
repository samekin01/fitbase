"use client";

export function ConfirmForm({
  message,
  action,
  label,
  buttonStyle,
  buttonClassName,
}: {
  message: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  buttonStyle?: React.CSSProperties;
  buttonClassName?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button type="submit" className={buttonClassName} style={buttonStyle}>
        {label}
      </button>
    </form>
  );
}
