import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { UpdateRequestForm } from "@/components/forms/UpdateRequestForm";
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
    title: `${gym.name} の情報修正依頼 | FitBase`,
    robots: { index: false },
  };
}

export default async function GymUpdateRequestPage({
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
          { label: "情報の修正を依頼する" },
        ]}
      />

      <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-gray-900)", margin: "1rem 0 0.5rem" }}>
        {gym.name} の情報修正依頼
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
        掲載内容に誤りや古い情報がある場合は、こちらからご連絡ください。
      </p>

      <UpdateRequestForm gymId={gym.id} />
    </div>
  );
}
