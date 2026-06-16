import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ | FitBase",
  description: "FitBaseへのお問い合わせはこちらから。新規掲載のご相談、サイトに関するご質問などお気軽にご連絡ください。",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem", maxWidth: "640px" }}>
      <Breadcrumb items={[{ label: "トップ", href: "/" }, { label: "お問い合わせ" }]} />

      <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-gray-900)", margin: "1rem 0 0.5rem" }}>
        お問い合わせ
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
        新規掲載のご相談、サイトに関するご質問などはこちらのフォームよりお送りください。
      </p>

      <ContactForm />
    </div>
  );
}
