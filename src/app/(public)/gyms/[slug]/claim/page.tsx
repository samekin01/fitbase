import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClaimForm } from "@/components/forms/ClaimForm";
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
    title: `${gym.name} の管理者申請 | FitBase`,
    robots: { index: false },
  };
}

export default async function GymClaimPage({
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
          { label: "この店舗の管理者の方へ" },
        ]}
      />

      <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-gray-900)", margin: "1rem 0 0.5rem" }}>
        {gym.name} の管理者申請
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
        この店舗の運営者・関係者の方は、こちらから掲載情報の管理権限をご申請ください。確認後、担当者よりご連絡いたします。
      </p>

      <ClaimForm gymId={gym.id} />
    </div>
  );
}
