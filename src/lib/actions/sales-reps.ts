"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createSalesRep(_prev: { error?: string } | null, formData: FormData) {
  const name = (formData.get("name") as string ?? "").trim();
  const role = (formData.get("role") as string) || "both";
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  if (!name) return { error: "担当者名は必須です。" };

  const supabase = createAdminClient();
  const { error } = await (supabase as any).from("sales_reps").insert({ name, role, sort_order });
  if (error) return { error: error.message };

  revalidatePath("/admin/sales/reps");
  revalidatePath("/admin/sales");
  return {};
}

export async function deleteSalesRep(id: string) {
  const supabase = createAdminClient();
  const { error } = await (supabase as any).from("sales_reps").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales/reps");
  revalidatePath("/admin/sales");
}
