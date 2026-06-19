// ランキング自動並び替え用の複合スコア算出。
// 評価70% + 価格30%（評価はレビュー数による信頼度補正、価格未入力は半分の減点で評価のみで採点）。
export type GymForScoring = {
  id: string;
  google_rating: number | null;
  google_review_count: number | null;
  monthly_fee_min: number | null;
};

const RATING_WEIGHT = 0.7;
const PRICE_WEIGHT = 0.3;
const PRICE_MISSING_PENALTY_RATIO = 0.5; // 価格未入力時、PRICE_WEIGHTのうち半分だけ加点する

// ベイズ平均: レビュー数が少ない店ほど全体平均に引き寄せ、過大評価を防ぐ
function bayesianRating(gym: GymForScoring, overallAvgRating: number, confidenceConstant: number): number {
  const rating = gym.google_rating ?? overallAvgRating;
  const reviewCount = gym.google_review_count ?? 0;
  return (confidenceConstant * overallAvgRating + reviewCount * rating) / (confidenceConstant + reviewCount);
}

function priceScore(gym: GymForScoring, minPrice: number, maxPrice: number): number {
  if (gym.monthly_fee_min == null) return PRICE_MISSING_PENALTY_RATIO;
  if (maxPrice === minPrice) return 1; // 比較対象内で価格差がない場合は満点扱い
  return 1 - (gym.monthly_fee_min - minPrice) / (maxPrice - minPrice);
}

export function rankGymsByScore<T extends GymForScoring>(gyms: T[]): { gym: T; score: number }[] {
  const ratings = gyms.map((g) => g.google_rating).filter((r): r is number => r != null);
  const overallAvgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.5;

  const reviewCounts = gyms
    .map((g) => g.google_review_count)
    .filter((r): r is number => r != null)
    .sort((a, b) => a - b);
  const confidenceConstant =
    reviewCounts.length > 0 ? reviewCounts[Math.floor(reviewCounts.length / 2)] : 10;

  const prices = gyms.map((g) => g.monthly_fee_min).filter((p): p is number => p != null);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return gyms
    .map((gym) => {
      const ratingNorm = bayesianRating(gym, overallAvgRating, confidenceConstant) / 5;
      const score = 100 * (RATING_WEIGHT * ratingNorm + PRICE_WEIGHT * priceScore(gym, minPrice, maxPrice));
      return { gym, score };
    })
    .sort((a, b) => b.score - a.score);
}
