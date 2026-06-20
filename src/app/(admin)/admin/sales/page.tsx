import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { CurrencyYenIcon, PhoneIcon, ClipboardListIcon, CheckCircleIcon, TrophyIcon } from "@/components/ui/Icons";
import { SalesKanban, type LeadCard, type SalesStage } from "@/components/admin/SalesKanban";
import { fetchSalesMetrics } from "@/lib/sales-metrics";

export const dynamic = "force-dynamic";
export const metadata = { title: "営業リスト | FitBase CMS" };

const PAGE_SIZE = 60;

function pct(n: number | null): string {
  return n === null ? "—" : `${(n * 100).toFixed(1)}%`;
}

function MetricTile({
  label,
  value,
  detail,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "30px",
          height: "30px",
          borderRadius: "8px",
          backgroundColor: bg,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div>
        <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.125rem" }}>{label}</p>
        <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.125rem" }}>{value}</p>
        <p style={{ fontSize: "0.6875rem", color: "var(--color-gray-400)" }}>{detail}</p>
      </div>
    </div>
  );
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ prefecture?: string; rep?: string; repRole?: string; q?: string; page?: string; due?: string }>;
}) {
  const params = await searchParams;
  const prefectureId = params.prefecture ?? "";
  const repFilter = params.rep ?? "";
  const repRole = params.repRole === "fs" ? "fs" : params.repRole === "is" ? "is" : "";
  const q = params.q ?? "";
  const page = Number(params.page ?? 1);
  const dueToday = params.due === "1";

  const supabase = createAdminClient();
  const metrics = await fetchSalesMetrics();

  const { data: prefectures } = await supabase.from("prefectures").select("id, name").order("sort_order");
  const { data: reps } = await (supabase as any).from("sales_reps").select("id, name, role").order("sort_order");
  const isRepOptions = (reps ?? []).filter((r: any) => r.role === "is" || r.role === "both").map((r: any) => r.name);
  const fsRepOptions = (reps ?? []).filter((r: any) => r.role === "fs" || r.role === "both").map((r: any) => r.name);
  const allRepOptions = Array.from(new Set([...isRepOptions, ...fsRepOptions])).sort();

  const allLeads = await fetchAllRows((from, to) =>
    (supabase as any)
      .from("sales_leads")
      .select(
        "gym_id, stage, is_rep, fs_rep, approach_count, approach_result, negotiation_notes, memo, follow_up_date, next_action, lost_reason, contract_amount, updated_at, gyms(id, name, slug, phone, prefecture_id, prefectures(name), cities(name))"
      )
      .range(from, to)
  );

  const repSet = new Set<string>(allRepOptions);
  for (const lead of allLeads as any[]) {
    if (lead.is_rep) repSet.add(lead.is_rep);
    if (lead.fs_rep) repSet.add(lead.fs_rep);
  }
  const repOptions = Array.from(repSet).sort();

  const todayStr = new Date().toISOString().slice(0, 10);

  function matchesFilters(lead: any): boolean {
    if (prefectureId && lead.gyms?.prefecture_id !== prefectureId) return false;
    if (q && !lead.gyms?.name?.includes(q)) return false;
    if (repFilter) {
      if (repRole === "is" && lead.is_rep !== repFilter) return false;
      if (repRole === "fs" && lead.fs_rep !== repFilter) return false;
      if (!repRole && lead.is_rep !== repFilter && lead.fs_rep !== repFilter) return false;
    }
    if (dueToday && (!lead.follow_up_date || lead.follow_up_date > todayStr)) return false;
    return true;
  }

  const filteredLeads = (allLeads as any[]).filter(matchesFilters).filter((l) => l.gyms);

  function toCard(lead: any): LeadCard {
    return {
      gymId: lead.gym_id,
      name: lead.gyms.name,
      prefectureName: lead.gyms.prefectures?.name ?? null,
      cityName: lead.gyms.cities?.name ?? null,
      phone: lead.gyms.phone,
      stage: lead.stage,
      isRep: lead.is_rep,
      fsRep: lead.fs_rep,
      approachCount: lead.approach_count,
      approachResult: lead.approach_result,
      negotiationNotes: lead.negotiation_notes,
      memo: lead.memo,
      followUpDate: lead.follow_up_date,
      nextAction: lead.next_action,
      lostReason: lead.lost_reason,
      contractAmount: lead.contract_amount != null ? Number(lead.contract_amount) : null,
    };
  }

  const byStage: Record<SalesStage, LeadCard[]> = {
    not_started: [],
    approaching: [],
    appointment_set: [],
    negotiating: [],
    won: [],
    lost: [],
  };
  for (const lead of filteredLeads) {
    byStage[lead.stage as SalesStage]?.push(toCard(lead));
  }

  // 担当者・今日対応で絞り込んでいる場合、未着手のリードを持たない（=sales_leadsに行が無い）
  // 公開ジムはそもそも対象外（担当者未割当・次回アクション日未設定のため）。
  // 絞り込みが無い場合のみ、対象一覧を補完するために未着手ジムを別途取得する。
  let notStartedTotal = byStage.not_started.length;
  if (!repFilter && !dueToday) {
    const touchedGymIds = new Set((allLeads as any[]).map((l) => l.gym_id));

    let query = supabase
      .from("gyms")
      .select("id, name, phone, prefecture_id, prefectures(name), cities(name)", { count: "exact" })
      .eq("status", "published")
      .order("name")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (prefectureId) query = query.eq("prefecture_id", prefectureId);
    if (q) query = query.ilike("name", `%${q}%`);

    const { data: untouchedGyms, count } = await query;
    const filteredUntouched = (untouchedGyms ?? []).filter((g: any) => !touchedGymIds.has(g.id));

    for (const gym of filteredUntouched as any[]) {
      byStage.not_started.push({
        gymId: gym.id,
        name: gym.name,
        prefectureName: gym.prefectures?.name ?? null,
        cityName: gym.cities?.name ?? null,
        phone: gym.phone,
        stage: "not_started",
        isRep: null,
        fsRep: null,
        approachCount: 0,
        approachResult: null,
        negotiationNotes: null,
        memo: null,
        followUpDate: null,
        nextAction: null,
        lostReason: null,
        contractAmount: null,
      });
    }
    // touched分の厳密な除外件数は計算コストが高いため、おおよその目安として表示する
    notStartedTotal = Math.max((count ?? 0) - touchedGymIds.size, byStage.not_started.length);
  }

  return (
    <div>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        <CurrencyYenIcon size={20} />
        営業リスト
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", marginBottom: "0.75rem" }}>
        公開中のジムに対する有料プラン・追加サービスの提案状況を、ステージ別に管理します。カードはドラッグ＆ドロップでステージを移動できます。
      </p>
      <p style={{ marginBottom: "1.25rem" }}>
        <a href="/admin/sales/reps" style={{ fontSize: "0.8125rem", color: "var(--color-link)", fontWeight: 600 }}>
          営業担当者を管理 →
        </a>
      </p>

      <h2 className="admin-section-title" style={{ marginTop: 0 }}>営業サマリー</h2>
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem 1.375rem",
          marginBottom: "1.75rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "1rem",
        }}
      >
        <MetricTile
          label="平均アプローチ回数"
          value={`${metrics.avgActions.toFixed(1)}回`}
          detail={`合計${metrics.totalActions}件 / 対象${metrics.actionLeadCount}件`}
          icon={<PhoneIcon size={16} />}
          color="#1558D6"
          bg="#E8EFFC"
        />
        <MetricTile
          label="アポ獲得率"
          value={pct(metrics.apptRate)}
          detail={`${metrics.apptCount}件 / ${metrics.notStartedCount + metrics.approachingCount}件（未着手+アプローチ中）`}
          icon={<ClipboardListIcon size={16} />}
          color="#7C3AED"
          bg="#F3E8FF"
        />
        <MetricTile
          label="商談実行率"
          value={pct(metrics.negoRate)}
          detail={`${metrics.negoCount}件 / ${metrics.apptCount}件`}
          icon={<TrophyIcon size={16} />}
          color="#D97706"
          bg="#FEF3C7"
        />
        <MetricTile
          label="成約率"
          value={pct(metrics.wonRate)}
          detail={`${metrics.wonCount}件 / ${metrics.negoCount}件`}
          icon={<CheckCircleIcon size={16} />}
          color="#15803D"
          bg="#DCFCE7"
        />
        <MetricTile
          label="平均契約単価"
          value={metrics.contractAvg !== null ? `¥${Math.round(metrics.contractAvg).toLocaleString()}` : "—"}
          detail={`合計¥${metrics.contractTotal.toLocaleString()} / ${metrics.contractCount}件`}
          icon={<CurrencyYenIcon size={16} />}
          color="var(--color-gray-700)"
          bg="var(--color-gray-100)"
        />
      </div>

      <form method="get" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input name="q" type="search" placeholder="ジム名で検索" defaultValue={q} className="form-input" style={{ width: "200px" }} />
        <select name="prefecture" defaultValue={prefectureId} className="form-input" style={{ width: "140px" }}>
          <option value="">すべてのエリア</option>
          {(prefectures ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select name="repRole" defaultValue={repRole} className="form-input" style={{ width: "120px" }}>
          <option value="">IS/FS両方</option>
          <option value="is">IS担当のみ</option>
          <option value="fs">FS担当のみ</option>
        </select>
        <input name="rep" type="text" list="rep-options" placeholder="担当者名で絞込" defaultValue={repFilter} className="form-input" style={{ width: "160px" }} />
        <datalist id="rep-options">
          {repOptions.map((r) => <option key={r} value={r} />)}
        </datalist>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--color-gray-700)" }}>
          <input type="checkbox" name="due" value="1" defaultChecked={dueToday} />
          本日対応予定
        </label>
        <button type="submit" className="btn btn-secondary btn-sm">絞込</button>
        {(prefectureId || repFilter || q || repRole || dueToday) && (
          <a href="/admin/sales" className="btn btn-secondary btn-sm">クリア</a>
        )}
      </form>

      <SalesKanban
        byStage={byStage}
        notStartedTotal={notStartedTotal}
        page={page}
        pageSize={PAGE_SIZE}
        hasFilters={!!(prefectureId || repFilter || q || dueToday)}
        isRepOptions={isRepOptions}
        fsRepOptions={fsRepOptions}
        baseQuery={{ prefecture: prefectureId, rep: repFilter, repRole, q, due: dueToday ? "1" : "" }}
      />
    </div>
  );
}
