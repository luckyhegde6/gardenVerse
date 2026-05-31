import { useState, useEffect, useCallback } from "react";
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

export function useMarketplace(options: UseMarketplaceOptions = {}) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const fetchListings = useCallback(
    async (page = 1, refresh = false) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const params: Record<string, unknown> = {
          page,
          limit: 20,
          ...(options.category && { category: options.category }),
          ...(options.search && { search: options.search }),
          ...(options.status && { status: options.status }),
          ...(options.local && { local: true }),
        };

        const response = await api.get("/marketplace/listings", { params });
        const data = response.data;

        setListings((prev) =>
          page === 1 ? data.listings : [...prev, ...data.listings],
        );
        setPagination({
          page: data.page,
          totalPages: data.totalPages,
          total: data.total,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch listings");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [options.category, options.search, options.status, options.local],
  );

  useEffect(() => {
    fetchListings(1);
  }, [fetchListings]);

  const refresh = useCallback(() => fetchListings(1, true), [fetchListings]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages && !isLoading) {
      fetchListings(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, isLoading, fetchListings]);

  const createListing = useCallback(
    async (data: {
      title: string;
      description?: string;
      category: string;
      price: number;
      currency: string;
      quantity: number;
      images?: string[];
    }) => {
      const response = await api.post("/marketplace/listings", data);
      return response.data as MarketplaceListing;
    },
    [],
  );

  const deleteListing = useCallback(async (listingId: string) => {
    await api.delete(`/marketplace/listings/${listingId}`);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }, []);

  const getListingById = useCallback(async (listingId: string) => {
    const response = await api.get(`/marketplace/listings/${listingId}`);
    return response.data as MarketplaceListing;
  }, []);

  return {
    listings,
    isLoading,
    isRefreshing,
    error,
    pagination,
    refresh,
    loadMore,
    createListing,
    deleteListing,
    getListingById,
  };
}
