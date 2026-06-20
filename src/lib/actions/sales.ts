"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type SalesStage = "not_started" | "approaching" | "appointment_set" | "negotiating" | "won" | "lost";

export async function updateLeadStage(gymId: string, stage: SalesStage) {
  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("sales_leads")
    .upsert({ gym_id: gymId, stage }, { onConflict: "gym_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}

export type LostReason = "price" | "timing" | "competitor" | "no_effect" | "other";

export type LeadFields = {
  is_rep?: string | null;
  fs_rep?: string | null;
  approach_count?: number;
  approach_result?: string | null;
  negotiation_notes?: string | null;
  memo?: string | null;
  follow_up_date?: string | null;
  next_action?: string | null;
  lost_reason?: LostReason | null;
  contract_amount?: number | null;
};

export async function updateLeadFields(gymId: string, fields: LeadFields) {
  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("sales_leads")
    .upsert({ gym_id: gymId, ...fields }, { onConflict: "gym_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}

export async function addLeadActivity(gymId: string, activityDate: string, content: string) {
  if (!content.trim()) throw new Error("内容は必須です");
  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("sales_lead_activities")
    .insert({ gym_id: gymId, activity_date: activityDate, content: content.trim() });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}

export async function updateLeadActivity(activityId: string, activityDate: string, content: string) {
  if (!content.trim()) throw new Error("内容は必須です");
  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("sales_lead_activities")
    .update({ activity_date: activityDate, content: content.trim() })
    .eq("id", activityId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}

export async function deleteLeadActivity(activityId: string) {
  const supabase = createAdminClient();
  const { error } = await (supabase as any).from("sales_lead_activities").delete().eq("id", activityId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}
