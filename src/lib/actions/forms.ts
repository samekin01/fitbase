"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendAdminNotification } from "@/lib/email";

export type FormState = { error?: string; success?: boolean };

const TURNSTILE_ERROR = "認証に失敗しました。もう一度お試しください。";
const SUBMIT_ERROR = "送信に失敗しました。時間をおいて再度お試しください。";

async function verifyOrFail(formData: FormData): Promise<string | null> {
  const token = formData.get("cf-turnstile-response") as string | null;
  const ok = await verifyTurnstile(token);
  return ok ? null : TURNSTILE_ERROR;
}

export async function submitContact(_prev: FormState | null, formData: FormData): Promise<FormState> {
  const turnstileError = await verifyOrFail(formData);
  if (turnstileError) return { error: turnstileError };

  const name = (formData.get("name") as string ?? "").trim();
  const email = (formData.get("email") as string ?? "").trim();
  const subject = (formData.get("subject") as string ?? "").trim() || null;
  const message = (formData.get("message") as string ?? "").trim();

  if (!name || !email || !message) {
    return { error: "必須項目が入力されていません。" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("contacts").insert({ name, email, subject, message });
  if (error) return { error: SUBMIT_ERROR };

  await sendAdminNotification(
    `[FitBase] お問い合わせ: ${subject ?? "(件名なし)"}`,
    `<p>${name} 様（${email}）より問い合わせがありました。</p><p>${message.replace(/\n/g, "<br>")}</p>`
  );

  return { success: true };
}

export async function submitClaim(_prev: FormState | null, formData: FormData): Promise<FormState> {
  const turnstileError = await verifyOrFail(formData);
  if (turnstileError) return { error: turnstileError };

  const gymId = (formData.get("gym_id") as string) || null;
  const ownerName = (formData.get("owner_name") as string ?? "").trim();
  const companyName = (formData.get("company_name") as string ?? "").trim() || null;
  const email = (formData.get("email") as string ?? "").trim();
  const phone = (formData.get("phone") as string ?? "").trim() || null;
  const position = (formData.get("position") as string ?? "").trim() || null;
  const message = (formData.get("message") as string ?? "").trim() || null;

  if (!ownerName || !email) {
    return { error: "必須項目が入力されていません。" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("gym_claims").insert({
    gym_id: gymId,
    owner_name: ownerName,
    company_name: companyName,
    email,
    phone,
    position,
    message,
  });
  if (error) return { error: SUBMIT_ERROR };

  await sendAdminNotification(
    `[FitBase] 掲載者管理申請: ${ownerName}`,
    `<p>${ownerName} 様（${email}）より管理者申請がありました。</p><p>会社名: ${companyName ?? "-"}</p><p>${(message ?? "").replace(/\n/g, "<br>")}</p>`
  );

  return { success: true };
}

export async function submitUpdateRequest(_prev: FormState | null, formData: FormData): Promise<FormState> {
  const turnstileError = await verifyOrFail(formData);
  if (turnstileError) return { error: turnstileError };

  const gymId = (formData.get("gym_id") as string) || null;
  const requesterName = (formData.get("requester_name") as string ?? "").trim();
  const email = (formData.get("email") as string ?? "").trim();
  const message = (formData.get("message") as string ?? "").trim();

  if (!requesterName || !email || !message) {
    return { error: "必須項目が入力されていません。" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("gym_update_requests").insert({
    gym_id: gymId,
    requester_name: requesterName,
    email,
    message,
  });
  if (error) return { error: SUBMIT_ERROR };

  await sendAdminNotification(
    `[FitBase] 情報修正依頼: ${requesterName}`,
    `<p>${requesterName} 様（${email}）より修正依頼がありました。</p><p>${message.replace(/\n/g, "<br>")}</p>`
  );

  return { success: true };
}

export async function submitDeleteRequest(_prev: FormState | null, formData: FormData): Promise<FormState> {
  const turnstileError = await verifyOrFail(formData);
  if (turnstileError) return { error: turnstileError };

  const gymId = (formData.get("gym_id") as string) || null;
  const requesterName = (formData.get("requester_name") as string ?? "").trim();
  const email = (formData.get("email") as string ?? "").trim();
  const reason = (formData.get("reason") as string ?? "").trim();

  if (!requesterName || !email || !reason) {
    return { error: "必須項目が入力されていません。" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("gym_delete_requests").insert({
    gym_id: gymId,
    requester_name: requesterName,
    email,
    reason,
  });
  if (error) return { error: SUBMIT_ERROR };

  await sendAdminNotification(
    `[FitBase] 掲載削除依頼: ${requesterName}`,
    `<p>${requesterName} 様（${email}）より削除依頼がありました。</p><p>${reason.replace(/\n/g, "<br>")}</p>`
  );

  return { success: true };
}
