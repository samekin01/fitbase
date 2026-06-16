import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// service_role キーを使用するクライアント（サーバー専用・RLS バイパス）
// このファイルをクライアントコンポーネントで import しないこと
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
