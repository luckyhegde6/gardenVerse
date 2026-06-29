import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../services/api";
import { MarketplaceListing, ListingStatus } from "../types";

interface UseMarketplaceOptions {
  category?: string;
  search?: string;
  local?: boolean;
  status?: ListingStatus;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
}

interface MarketplaceListResponse {
  data: MarketplaceListing[];
  page: number;
  totalPages: number;
  total: number;
}

const STALE_TIME = 1000 * 60 * 2; // 2 minutes

export function useMarketplace(options: UseMarketplaceOptions = {}) {
  const queryClient = useQueryClient();

  // ── Infinite query for paginated listings ──────────────────────────────
  const {
    data,
    isLoading: isPending,
    isRefetching,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<MarketplaceListResponse>({
    queryKey: [
      "marketplace",
      options.category,
      options.search,
      options.status,
      options.local,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, unknown> = {
        page: pageParam,
        limit: 20,
        ...(options.category && { category: options.category }),
        ...(options.search && { search: options.search }),
        ...(options.status && { status: options.status }),
        ...(options.local && { local: true }),
      };
      const response = await api.get("/marketplace", { params });
      return response.data as MarketplaceListResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: STALE_TIME,
  });

  // ── Derive the flat listings list ─────────────────────────────────────
  const listings = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  // ── Derive pagination info from the last page ─────────────────────────
  const pagination = useMemo<PaginationInfo>(() => {
    const lastPage = data?.pages[data.pages.length - 1];
    return {
      page: lastPage?.page ?? 1,
      totalPages: lastPage?.totalPages ?? 1,
      total: lastPage?.total ?? 0,
    };
  }, [data]);

  // ── Error as string (matching original interface) ──────────────────────
  const error: string | null =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? String(queryError)
        : null;

  // ── Create listing mutation ────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      category: string;
      price: number;
      currency: string;
      quantity: number;
      images?: string[];
    }) => {
      const response = await api.post("/marketplace", data);
      return response.data as MarketplaceListing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });

  const createListing = useCallback(
    async (data: {
      title: string;
      description?: string;
      category: string;
      price: number;
      currency: string;
      quantity: number;
      images?: string[];
    }) => createMutation.mutateAsync(data),
    [createMutation],
  );

  // ── Delete listing mutation ────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await api.delete(`/marketplace/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });

  const deleteListing = useCallback(
    async (listingId: string) => deleteMutation.mutateAsync(listingId),
    [deleteMutation],
  );

  // ── Get listing by ID (uses queryClient.fetchQuery for caching) ────────
  const getListingById = useCallback(
    async (listingId: string) => {
      return queryClient.fetchQuery<MarketplaceListing>({
        queryKey: ["marketplace", listingId],
        queryFn: async () => {
          const response = await api.get(`/marketplace/${listingId}`);
          return response.data as MarketplaceListing;
        },
        staleTime: STALE_TIME,
      });
    },
    [queryClient],
  );

  // ── Public API ─────────────────────────────────────────────────────────
  return {
    listings,
    isLoading: isPending,
    isRefreshing: isRefetching,
    error,
    pagination,
    refresh: () => {
      void refetch();
    },
    loadMore: () => {
      if (hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    createListing,
    deleteListing,
    getListingById,
  };
}
