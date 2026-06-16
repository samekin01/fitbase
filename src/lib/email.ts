export async function sendAdminNotification(subject: string, html: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "FitBase <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  }).catch(() => {});
}
