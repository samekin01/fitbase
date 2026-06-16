import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DeleteRequestForm } from "@/components/forms/DeleteRequestForm";
import { getGymBasicBySlug } from "@/lib/gym-query";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gym = await getGymBasicBySlug(slug);
  if (!gym) return {};
  return {
    title: `${gym.name} の掲載削除依頼 | FitBase`,
    robots: { index: false },
  };
}

export default async function GymDeleteRequestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gym = await getGymBasicBySlug(slug);
  if (!gym) notFound();

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem", maxWidth: "640px" }}>
      <Breadcrumb
        items={[
          { label: "トップ", href: "/" },
          { label: gym.name, href: `/gyms/${gym.slug}/` },
          { label: "掲載の削除を依頼する" },
        ]}
      />

      <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-gray-900)", margin: "1rem 0 0.5rem" }}>
        {gym.name} の掲載削除依頼
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
        閉店・重複掲載などの理由で掲載の削除を希望される場合は、こちらからご連絡ください。
      </p>

      <DeleteRequestForm gymId={gym.id} />
    </div>
  );
}
