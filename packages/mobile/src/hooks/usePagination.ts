import { useState, useCallback, useRef } from "react";

interface UsePaginationOptions<T> {
  fetchFn: (
    page: number,
  ) => Promise<{ data: T[]; totalPages: number; total: number }>;
  initialPage?: number;
  pageSize?: number;
}

interface UsePaginationReturn<T> {
  data: T[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function usePagination<T>({
  fetchFn,
  initialPage = 1,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const isLoadingRef = useRef(false);

  const loadPage = useCallback(
    async (pageNum: number, refresh = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFn(pageNum);
        setData((prev) =>
          pageNum === 1 ? result.data : [...prev, ...result.data],
        );
        setPage(pageNum);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isLoadingRef.current = false;
      }
    },
    [fetchFn],
  );

  const refresh = useCallback(async () => {
    await loadPage(1, true);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (page < totalPages && !isLoadingRef.current) {
      await loadPage(page + 1);
    }
  }, [page, totalPages, loadPage]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setTotalPages(1);
    setTotal(0);
    setError(null);
  }, [initialPage]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    page,
    totalPages,
    total,
    hasMore: page < totalPages,
    refresh,
    loadMore,
    reset,
  };
}
