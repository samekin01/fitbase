import { FireIcon } from "@/components/ui/Icons";

export const metadata = { title: "ヒートマップ | FitBase CMS" };

function SetupGuide() {
  return (
    <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
      <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-gray-900)" }}>
        Microsoft Clarity連携が未設定です
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-600)", marginBottom: "1rem" }}>
        Microsoft Clarity（無料）を設定すると、サイト訪問者がどこをクリックしたか・どこまでスクロールしたかをヒートマップで確認できるようになります。
      </p>
      <ol style={{ fontSize: "0.8125rem", color: "var(--color-gray-700)", lineHeight: 1.9, paddingLeft: "1.25rem" }}>
        <li>
          <a href="https://clarity.microsoft.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-link)" }}>
            clarity.microsoft.com
          </a>
          {" "}にアクセスし、Microsoftアカウント（またはGoogleアカウント）でログイン
        </li>
        <li>「Add new project」からプロジェクトを作成（名前は「FitBase」、URLは本番URLを入力）</li>
        <li>作成後に表示される計測コードの中から、プロジェクトID（10桁程度の英数字）をコピー</li>
        <li>そのプロジェクトIDを環境変数 <code>NEXT_PUBLIC_CLARITY_PROJECT_ID</code> に設定</li>
      </ol>
    </div>
  );
}

export default function HeatmapPage() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  return (
    <div style={{ maxWidth: "720px" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        <FireIcon size={20} />
        ヒートマップ
      </h1>

      {!projectId && <SetupGuide />}

      {projectId && (
        <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-gray-900)" }}>
            Microsoft Clarityで確認できます
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-gray-600)", marginBottom: "1rem" }}>
            計測タグはサイトに設置済みです。ヒートマップ・録画再生などはMicrosoft Clarityの管理画面（外部サイト）で確認します。専門知識は不要で、サイトの画面に色付きの重なり（クリックされた場所が赤く濃くなる等）が表示されます。
          </p>
          <a
            href={`https://clarity.microsoft.com/projects/view/${projectId}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Clarityダッシュボードを開く
          </a>
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--color-gray-100)" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.5rem" }}>
              見方のポイント
            </p>
            <ul style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
              <li>「Heatmaps」メニューでページごとのクリック・スクロールの傾向を確認できます</li>
              <li>赤色が濃い部分ほどよくクリック・注目されている場所です</li>
              <li>「Recordings」メニューでは実際の操作を動画のように再生できます</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
