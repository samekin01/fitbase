"use client";

import { useEffect, useState, useTransition } from "react";
import {
  updateLeadStage,
  updateLeadFields,
  addLeadActivity,
  updateLeadActivity,
  deleteLeadActivity,
  type LostReason,
} from "@/lib/actions/sales";

export type SalesStage = "not_started" | "approaching" | "appointment_set" | "negotiating" | "won" | "lost";

export type LeadCard = {
  gymId: string;
  name: string;
  prefectureName: string | null;
  cityName: string | null;
  phone: string | null;
  stage: SalesStage;
  isRep: string | null;
  fsRep: string | null;
  approachCount: number;
  approachResult: string | null;
  negotiationNotes: string | null;
  memo: string | null;
  followUpDate: string | null;
  nextAction: string | null;
  lostReason: LostReason | null;
  contractAmount: number | null;
};

type Activity = { id: string; activity_date: string; content: string };

const STAGE_COLUMNS: { stage: SalesStage; label: string; color: string; bg: string }[] = [
  { stage: "not_started", label: "未着手", color: "var(--color-gray-600)", bg: "var(--color-gray-100)" },
  { stage: "approaching", label: "アプローチ中", color: "#1D4ED8", bg: "#DBEAFE" },
  { stage: "appointment_set", label: "アポ獲得", color: "#7C3AED", bg: "#F3E8FF" },
  { stage: "negotiating", label: "商談中", color: "#92400E", bg: "#FEF3C7" },
  { stage: "won", label: "成約", color: "#15803D", bg: "#DCFCE7" },
  { stage: "lost", label: "見送り", color: "#B91C1C", bg: "#FEE2E2" },
];

const LOST_REASON_LABEL: Record<LostReason, string> = {
  price: "価格",
  timing: "タイミング",
  competitor: "競合",
  no_effect: "効果が見えない",
  other: "その他",
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function LeadCardView({ card, onClick }: { card: LeadCard; onClick: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/gym-id", card.gymId);
      }}
      onClick={onClick}
      style={{
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-gray-200)",
        borderRadius: "var(--radius-md)",
        padding: "0.625rem 0.75rem",
        marginBottom: "0.5rem",
        cursor: "grab",
        fontSize: "0.8125rem",
      }}
    >
      <p style={{ fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>{card.name}</p>
      <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.375rem" }}>
        {card.prefectureName}
        {card.cityName ? ` ${card.cityName}` : ""}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        {card.isRep && (
          <span className="tag-pill" style={{ fontSize: "0.6875rem" }}>IS: {card.isRep}</span>
        )}
        {card.fsRep && (
          <span className="tag-pill" style={{ fontSize: "0.6875rem" }}>FS: {card.fsRep}</span>
        )}
        {card.approachCount > 0 && (
          <span className="tag-pill" style={{ fontSize: "0.6875rem" }}>アプローチ{card.approachCount}回</span>
        )}
        {card.followUpDate && (
          <span
            className="tag-pill"
            style={{
              fontSize: "0.6875rem",
              backgroundColor: isOverdue(card.followUpDate) ? "#FEE2E2" : undefined,
              color: isOverdue(card.followUpDate) ? "var(--color-error)" : undefined,
            }}
          >
            次回{card.nextAction ? `${card.nextAction} ` : " "}{card.followUpDate}
          </span>
        )}
        {card.stage === "lost" && card.lostReason && (
          <span className="tag-pill" style={{ fontSize: "0.6875rem", backgroundColor: "#FEE2E2", color: "var(--color-error)" }}>
            見送り理由: {LOST_REASON_LABEL[card.lostReason]}
          </span>
        )}
        {card.stage === "won" && card.contractAmount != null && (
          <span className="tag-pill" style={{ fontSize: "0.6875rem", backgroundColor: "#DCFCE7", color: "#15803D" }}>
            契約単価: ¥{card.contractAmount.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityLog({ gymId }: { gymId: string }) {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function load() {
    fetch(`/api/admin/sales/activities?gymId=${gymId}`)
      .then((r) => r.json())
      .then((data) => setActivities(data.activities ?? []));
  }

  useEffect(load, [gymId]);

  function submit() {
    if (!content.trim()) return;
    startTransition(async () => {
      await addLeadActivity(gymId, date, content);
      setContent("");
      load();
    });
  }

  function startEdit(a: Activity) {
    setEditingId(a.id);
    setEditDate(a.activity_date);
    setEditContent(a.content);
  }

  function saveEdit() {
    if (!editingId || !editContent.trim()) return;
    startTransition(async () => {
      await updateLeadActivity(editingId, editDate, editContent);
      setEditingId(null);
      load();
    });
  }

  function remove(id: string) {
    if (!confirm("この履歴を削除しますか？")) return;
    startTransition(async () => {
      await deleteLeadActivity(id);
      load();
    });
  }

  return (
    <div>
      <label className="form-label">アプローチ履歴</label>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.625rem" }}>
        {activities === null && <p style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>読み込み中...</p>}
        {activities?.length === 0 && <p style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>記録はまだありません</p>}
        {activities?.map((a) =>
          editingId === a.id ? (
            <div key={a.id} style={{ border: "1px solid var(--color-gray-200)", borderRadius: "6px", padding: "0.5rem 0.625rem" }}>
              <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.375rem" }}>
                <input type="date" className="form-input" style={{ width: "140px" }} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <textarea
                className="form-input"
                rows={2}
                style={{ resize: "vertical", marginBottom: "0.375rem" }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                  キャンセル
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit} disabled={isPending}>
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div key={a.id} style={{ border: "1px solid var(--color-gray-100)", borderRadius: "6px", padding: "0.5rem 0.625rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                <p style={{ fontSize: "0.6875rem", color: "var(--color-gray-400)", marginBottom: "0.125rem" }}>{a.activity_date}</p>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    style={{ fontSize: "0.6875rem", color: "var(--color-link)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    disabled={isPending}
                    style={{ fontSize: "0.6875rem", color: "var(--color-error)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    削除
                  </button>
                </div>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-700)", whiteSpace: "pre-wrap" }}>{a.content}</p>
            </div>
          )
        )}
      </div>
      <div style={{ display: "flex", gap: "0.375rem" }}>
        <input type="date" className="form-input" style={{ width: "140px" }} value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          type="text"
          className="form-input"
          placeholder="例: 電話で担当者に説明、後日検討との回答"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={submit} disabled={isPending}>
          追加
        </button>
      </div>
    </div>
  );
}

function DetailPanel({
  card,
  isRepOptions,
  fsRepOptions,
  onClose,
}: {
  card: LeadCard;
  isRepOptions: string[];
  fsRepOptions: string[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    is_rep: card.isRep ?? "",
    fs_rep: card.fsRep ?? "",
    approach_result: card.approachResult ?? "",
    negotiation_notes: card.negotiationNotes ?? "",
    memo: card.memo ?? "",
    follow_up_date: card.followUpDate ?? "",
    next_action: card.nextAction ?? "",
    lost_reason: card.lostReason ?? "",
    contract_amount: card.contractAmount != null ? String(card.contractAmount) : "",
  });

  function save() {
    startTransition(async () => {
      await updateLeadFields(card.gymId, {
        is_rep: form.is_rep || null,
        fs_rep: form.fs_rep || null,
        approach_result: form.approach_result || null,
        negotiation_notes: form.negotiation_notes || null,
        memo: form.memo || null,
        follow_up_date: form.follow_up_date || null,
        next_action: form.next_action || null,
        lost_reason: (form.lost_reason as LostReason) || null,
        contract_amount: form.contract_amount ? Number(form.contract_amount) : null,
      });
      onClose();
    });
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "440px", maxWidth: "90vw", height: "100%", backgroundColor: "var(--color-white)", padding: "1.5rem", overflowY: "auto" }}
      >
        <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.25rem" }}>{card.name}</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
          {card.prefectureName}{card.cityName ? ` ${card.cityName}` : ""}
          {card.phone ? ` ・ ${card.phone}` : ""}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label className="form-label">IS担当者</label>
            <select className="form-input" value={form.is_rep} onChange={(e) => setForm({ ...form, is_rep: e.target.value })}>
              <option value="">未設定</option>
              {isRepOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              {form.is_rep && !isRepOptions.includes(form.is_rep) && (
                <option value={form.is_rep}>{form.is_rep}（未登録）</option>
              )}
            </select>
          </div>
          <div>
            <label className="form-label">FS担当者</label>
            <select className="form-input" value={form.fs_rep} onChange={(e) => setForm({ ...form, fs_rep: e.target.value })}>
              <option value="">未設定</option>
              {fsRepOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              {form.fs_rep && !fsRepOptions.includes(form.fs_rep) && (
                <option value={form.fs_rep}>{form.fs_rep}（未登録）</option>
              )}
            </select>
          </div>
          {isRepOptions.length === 0 && fsRepOptions.length === 0 && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>
              担当者が未登録です。「営業担当者を管理」から追加してください。
            </p>
          )}

          <div style={{ borderTop: "1px solid var(--color-gray-100)", paddingTop: "0.875rem" }}>
            <ActivityLog gymId={card.gymId} />
          </div>

          <div>
            <label className="form-label">アプローチ結果（最新の総括）</label>
            <textarea
              rows={2}
              className="form-input"
              style={{ resize: "vertical" }}
              value={form.approach_result}
              onChange={(e) => setForm({ ...form, approach_result: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">商談内容</label>
            <textarea
              rows={3}
              className="form-input"
              style={{ resize: "vertical" }}
              value={form.negotiation_notes}
              onChange={(e) => setForm({ ...form, negotiation_notes: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">メモ</label>
            <textarea
              rows={3}
              className="form-input"
              style={{ resize: "vertical" }}
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">次回アクション内容</label>
              <input
                type="text"
                className="form-input"
                placeholder="例: 再架電、メール送付、訪問"
                value={form.next_action}
                onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">次回アクション予定日</label>
              <input
                type="date"
                className="form-input"
                style={{ width: "150px" }}
                value={form.follow_up_date}
                onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="form-label">見送り理由（見送りにする場合）</label>
            <select className="form-input" value={form.lost_reason} onChange={(e) => setForm({ ...form, lost_reason: e.target.value })}>
              <option value="">未設定</option>
              {Object.entries(LOST_REASON_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">契約単価（円、成約の場合）</label>
            <input
              type="number"
              className="form-input"
              placeholder="例: 300000"
              value={form.contract_amount}
              onChange={(e) => setForm({ ...form, contract_amount: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>閉じる</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={isPending}>
            {isPending ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_COLUMNS: Record<SalesStage, LeadCard[]> = {
  not_started: [],
  approaching: [],
  appointment_set: [],
  negotiating: [],
  won: [],
  lost: [],
};

export function SalesKanban({
  byStage,
  notStartedTotal,
  page,
  pageSize,
  hasFilters,
  isRepOptions,
  fsRepOptions,
  baseQuery,
}: {
  byStage: Record<SalesStage, LeadCard[]>;
  notStartedTotal: number;
  page: number;
  pageSize: number;
  hasFilters: boolean;
  isRepOptions: string[];
  fsRepOptions: string[];
  baseQuery: Record<string, string>;
}) {
  const [columns, setColumns] = useState(byStage);
  const [selectedCard, setSelectedCard] = useState<LeadCard | null>(null);
  const [, startTransition] = useTransition();
  const [dragOverStage, setDragOverStage] = useState<SalesStage | null>(null);

  // 保存後にrevalidatePathでサーバーから新しいbyStageが届いたら、ローカルの表示状態を最新化する。
  // useStateの初期値は初回マウント時にしか使われないため、これが無いと保存内容が画面に反映されない。
  useEffect(() => {
    setColumns(byStage);
  }, [byStage]);

  function handleDrop(stage: SalesStage, e: React.DragEvent) {
    e.preventDefault();
    setDragOverStage(null);
    const gymId = e.dataTransfer.getData("text/gym-id");
    if (!gymId) return;

    setColumns((prev) => {
      let moved: LeadCard | null = null;
      const next: Record<SalesStage, LeadCard[]> = { ...EMPTY_COLUMNS };
      for (const key of Object.keys(prev) as SalesStage[]) {
        next[key] = prev[key].filter((c) => {
          if (c.gymId === gymId) {
            moved = { ...c, stage };
            return false;
          }
          return true;
        });
      }
      if (moved) next[stage] = [moved, ...next[stage]];
      return next;
    });

    startTransition(async () => {
      await updateLeadStage(gymId, stage);
    });
  }

  const totalPages = Math.ceil(notStartedTotal / pageSize);

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {STAGE_COLUMNS.map((col) => {
          const cards = columns[col.stage];
          return (
            <div
              key={col.stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(col.stage);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(col.stage, e)}
              style={{
                flex: "0 0 260px",
                backgroundColor: dragOverStage === col.stage ? "#F0F9FF" : "var(--color-gray-50)",
                border: "1px solid var(--color-gray-200)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem",
                minHeight: "200px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: col.color }}>{col.label}</span>
                <span className="badge" style={{ backgroundColor: col.bg, color: col.color }}>
                  {col.stage === "not_started" ? notStartedTotal : cards.length}
                </span>
              </div>
              {cards.map((card) => (
                <LeadCardView key={card.gymId} card={card} onClick={() => setSelectedCard(card)} />
              ))}
              {cards.length === 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textAlign: "center", padding: "1rem 0" }}>
                  カードがありません
                </p>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.25rem", marginTop: "1rem", justifyContent: "center" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?${new URLSearchParams({ ...baseQuery, page: String(p) })}`}
              className={`pagination__item${p === page ? " pagination__item--active" : ""}`}
            >
              {p}
            </a>
          ))}
        </div>
      )}

      {!hasFilters && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", marginTop: "0.5rem" }}>
          「未着手」は全{notStartedTotal}件中、{pageSize}件ずつ表示しています。エリアや名前で絞り込むと探しやすくなります。
        </p>
      )}

      {selectedCard && (
        <DetailPanel card={selectedCard} isRepOptions={isRepOptions} fsRepOptions={fsRepOptions} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
