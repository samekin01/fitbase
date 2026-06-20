import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/paginate";

export type SalesMetrics = {
  actionLeadCount: number;
  totalActions: number;
  avgActions: number;

  notStartedCount: number;
  approachingCount: number;

  apptCount: number;
  apptRate: number | null;

  negoCount: number;
  negoRate: number | null;

  wonCount: number;
  wonRate: number | null;

  contractCount: number;
  contractTotal: number;
  contractAvg: number | null;
};

export async function fetchSalesMetrics(): Promise<SalesMetrics> {
  const supabase = createAdminClient();

  const activities = await fetchAllRows((from, to) =>
    (supabase as any).from("sales_lead_activities").select("gym_id").range(from, to)
  );
  const actionLeadIds = new Set((activities as any[]).map((a) => a.gym_id));
  const actionLeadCount = actionLeadIds.size;
  const totalActions = (activities as any[]).length;
  const avgActions = actionLeadCount > 0 ? totalActions / actionLeadCount : 0;

  const { count: totalPublished } = await supabase
    .from("gyms")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const leads = await fetchAllRows((from, to) =>
    (supabase as any).from("sales_leads").select("gym_id, stage").range(from, to)
  );

  const stageCounts: Record<string, number> = {};
  for (const lead of leads as any[]) {
    stageCounts[lead.stage] = (stageCounts[lead.stage] ?? 0) + 1;
  }

  // 未着手 = sales_leadsに行が無い公開ジム（暗黙の未着手） + 明示的にstage='not_started'の行
  const untouchedCount = Math.max((totalPublished ?? 0) - (leads as any[]).length, 0);
  const notStartedCount = untouchedCount + (stageCounts.not_started ?? 0);
  const approachingCount = stageCounts.approaching ?? 0;
  const apptOnlyCount = stageCounts.appointment_set ?? 0;
  const negoOnlyCount = stageCounts.negotiating ?? 0;
  const wonCount = stageCounts.won ?? 0;

  // 各レートは「現在そのステージ以降にいる件数」（累積）で数える。
  // ステージをまたいで一気に進んだ場合も正しく数えられ、ステージを戻した場合も
  // 履歴を持たずその場の現在地だけで判定するため、即座に数値が追従する。
  const apptCount = apptOnlyCount + negoOnlyCount + wonCount;
  const negoCount = negoOnlyCount + wonCount;

  const { data: wonLeads } = await (supabase as any)
    .from("sales_leads")
    .select("contract_amount")
    .eq("stage", "won")
    .not("contract_amount", "is", null);
  const amounts = (wonLeads ?? []).map((l: any) => Number(l.contract_amount)).filter((n: number) => !Number.isNaN(n));
  const contractCount = amounts.length;
  const contractTotal = amounts.reduce((sum: number, n: number) => sum + n, 0);
  const contractAvg = contractCount > 0 ? contractTotal / contractCount : null;

  const apptDenominator = notStartedCount + approachingCount;

  return {
    actionLeadCount,
    totalActions,
    avgActions,
    notStartedCount,
    approachingCount,
    apptCount,
    apptRate: apptDenominator > 0 ? apptCount / apptDenominator : null,
    negoCount,
    negoRate: apptCount > 0 ? negoCount / apptCount : null,
    wonCount,
    wonRate: negoCount > 0 ? wonCount / negoCount : null,
    contractCount,
    contractTotal,
    contractAvg,
  };
}
