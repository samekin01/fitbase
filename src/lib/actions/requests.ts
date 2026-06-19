"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateContactStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("contacts").update({ status } as any).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/requests/contacts");
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}

export async function updateClaimStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("gym_claims").update({ status } as any).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/requests/claims");
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}

export async function updateUpdateRequestStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("gym_update_requests").update({ status } as any).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/requests/updates");
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}

export async function updateDeleteRequestStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("gym_delete_requests").update({ status } as any).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/requests/deletes");
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}
