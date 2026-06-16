"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function uploadGymImage(gymId: string, formData: FormData) {
  const supabase = createAdminClient();
  const file = formData.get("file") as File | null;
  const altText = (formData.get("alt_text") as string) || "";

  if (!file || file.size === 0) throw new Error("ファイルが選択されていません。");
  if (!file.type.startsWith("image/")) throw new Error("画像ファイルを選択してください。");
  if (file.size > 5 * 1024 * 1024) throw new Error("ファイルサイズは5MB以下にしてください。");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${gymId}/${Date.now()}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from("gym-images")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (storageError) throw new Error(storageError.message);

  const { data: publicUrl } = supabase.storage.from("gym-images").getPublicUrl(storagePath);

  const { count } = await supabase
    .from("gym_images")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId);

  const isCover = (count ?? 0) === 0;

  const { error: dbError } = await supabase.from("gym_images").insert({
    gym_id: gymId,
    storage_path: storagePath,
    url: publicUrl.publicUrl,
    alt_text: altText || null,
    is_cover: isCover,
    sort_order: count ?? 0,
  });

  if (dbError) {
    await supabase.storage.from("gym-images").remove([storagePath]);
    throw new Error(dbError.message);
  }

  revalidatePath(`/admin/gyms/${gymId}/images`);
}

export async function deleteGymImage(gymId: string, imageId: string, storagePath: string) {
  const supabase = createAdminClient();

  const { data: img } = await supabase
    .from("gym_images")
    .select("is_cover")
    .eq("id", imageId)
    .single();

  const { error } = await supabase.from("gym_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);

  await supabase.storage.from("gym-images").remove([storagePath]);

  if (img?.is_cover) {
    const { data: next } = await supabase
      .from("gym_images")
      .select("id")
      .eq("gym_id", gymId)
      .order("sort_order")
      .limit(1)
      .single();
    if (next) {
      await supabase.from("gym_images").update({ is_cover: true }).eq("id", next.id);
    }
  }

  revalidatePath(`/admin/gyms/${gymId}/images`);
}

export async function setCoverImage(gymId: string, imageId: string) {
  const supabase = createAdminClient();
  await supabase.from("gym_images").update({ is_cover: false }).eq("gym_id", gymId);
  const { error } = await supabase.from("gym_images").update({ is_cover: true }).eq("id", imageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/gyms/${gymId}/images`);
}
