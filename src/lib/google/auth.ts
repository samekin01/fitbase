import { JWT } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

let cachedClient: JWT | null = null;

export function isGoogleApiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}

function getClient(): JWT {
  if (cachedClient) return cachedClient;

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY が未設定です");

  const credentials = JSON.parse(raw) as { client_email: string; private_key: string };
  cachedClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
  return cachedClient;
}

export async function getGoogleAccessToken(): Promise<string> {
  const client = getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("アクセストークンの取得に失敗しました");
  return token;
}
