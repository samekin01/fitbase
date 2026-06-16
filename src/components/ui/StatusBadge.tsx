const STATUS_MAP: Record<string, { label: string; className: string }> = {
  published:        { label: "公開中",     className: "badge badge-green" },
  draft:            { label: "下書き",     className: "badge badge-gray" },
  hidden:           { label: "非公開",     className: "badge badge-gray" },
  claim_requested:  { label: "申請済み",   className: "badge badge-blue" },
  verified:         { label: "認証済み",   className: "badge badge-blue" },
  delete_requested: { label: "削除申請",   className: "badge badge-red" },
  pending:          { label: "未対応",     className: "badge badge-yellow" },
  approved:         { label: "承認",       className: "badge badge-green" },
  rejected:         { label: "却下",       className: "badge badge-red" },
  handled:          { label: "対応済み",   className: "badge badge-green" },
  unread:           { label: "未読",       className: "badge badge-yellow" },
  read:             { label: "既読",       className: "badge badge-gray" },
};

type Props = {
  status: string;
};

export function StatusBadge({ status }: Props) {
  const config = STATUS_MAP[status] ?? { label: status, className: "badge badge-gray" };
  return <span className={config.className}>{config.label}</span>;
}
