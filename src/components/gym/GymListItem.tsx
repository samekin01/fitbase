import Image from "next/image";
import Link from "next/link";
import {
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  UsersIcon,
  LockClosedIcon,
  ClipboardListIcon,
  TrophyIcon,
  ChevronRightIcon,
} from "@/components/ui/Icons";

export type GymSummary = {
  slug: string;
  name: string;
  address: string | null;
  area_name: string | null;
  monthly_fee_min: number | null;
  total_price_min: number | null;
  has_trial: boolean;
  is_female_friendly: boolean;
  has_private_room: boolean;
  has_nutrition_support: boolean;
  supports_contest: boolean;
  google_rating: number | null;
  google_review_count: number | null;
  image_url?: string | null;
};

type Props = { gym: GymSummary };

export function GymListItem({ gym }: Props) {
  const href = `/gyms/${gym.slug}/`;
  const locationText = [gym.area_name, gym.address].filter(Boolean).join("  /  ");

  const featureTags: { icon: React.ReactNode; label: string }[] = [];
  if (gym.is_female_friendly)
    featureTags.push({ icon: <UsersIcon size={12} />, label: "女性向け" });
  if (gym.has_private_room)
    featureTags.push({ icon: <LockClosedIcon size={12} />, label: "完全個室" });
  if (gym.has_nutrition_support)
    featureTags.push({ icon: <ClipboardListIcon size={12} />, label: "食事指導" });
  if (gym.supports_contest)
    featureTags.push({ icon: <TrophyIcon size={12} />, label: "コンテスト対応" });

  return (
    <article className="gym-list-item">
      {/* ─── サムネイル ─── */}
      <Link href={href} className="gym-list-item__image-wrap" tabIndex={-1} aria-hidden="true">
        {gym.image_url ? (
          <Image
            src={gym.image_url}
            alt={gym.name}
            width={180}
            height={128}
            className="gym-list-item__image"
          />
        ) : (
          <div className="gym-list-item__no-image">
            <span>写真なし</span>
          </div>
        )}
      </Link>

      {/* ─── 本文 ─── */}
      <div className="gym-list-item__body">
        {/* ジム名 + 評価 */}
        <div className="gym-list-item__header">
          <Link href={href} className="gym-list-item__name">
            {gym.name}
          </Link>

          {gym.google_rating != null && (
            <div className="gym-list-item__rating">
              <StarIcon
                size={13}
                style={{ color: "var(--color-rating)", flexShrink: 0 }}
              />
              <span className="gym-list-item__rating-score">
                {gym.google_rating.toFixed(1)}
              </span>
              {gym.google_review_count != null && (
                <span className="gym-list-item__rating-count">
                  ({gym.google_review_count.toLocaleString()}件)
                </span>
              )}
            </div>
          )}
        </div>

        {/* 住所 */}
        {locationText && (
          <div className="gym-list-item__location">
            <MapPinIcon
              size={13}
              style={{ color: "var(--color-gray-400)", flexShrink: 0 }}
            />
            <span>{locationText}</span>
          </div>
        )}

        {/* 料金 + 体験 */}
        <div className="gym-list-item__price-row">
          <div className="gym-list-item__price">
            <span className="gym-list-item__price-label">月額</span>
            {gym.monthly_fee_min != null ? (
              <>
                <span className="gym-list-item__price-amount">
                  ¥{gym.monthly_fee_min.toLocaleString()}
                </span>
                <span className="gym-list-item__price-suffix">〜</span>
              </>
            ) : (
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--color-gray-500)",
                }}
              >
                要問合せ
              </span>
            )}
          </div>

          {gym.has_trial && (
            <span className="gym-list-item__trial">
              <CheckCircleIcon size={12} />
              無料体験あり
            </span>
          )}
        </div>

        {/* 特徴タグ */}
        {featureTags.length > 0 && (
          <div className="gym-list-item__tags">
            {featureTags.map(({ icon, label }) => (
              <span key={label} className="gym-list-item__tag">
                {icon}
                <span style={{ marginLeft: "0.25rem" }}>{label}</span>
              </span>
            ))}
          </div>
        )}

        {/* 詳細リンク */}
        <div className="gym-list-item__footer">
          <Link href={href} className="gym-list-item__cta">
            詳細を見る
            <ChevronRightIcon size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
