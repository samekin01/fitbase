// Supabase(PostgREST)はdb-max-rows設定により1件のレスポンスが上限件数（既定1000件）に
// クランプされる。.range()を大きく指定しても上限を超えては返らないため、
// 上限件数ずつ複数回に分けて全件取得する。
const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null }>
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}
