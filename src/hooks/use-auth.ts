// src/hooks/use-auth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/utils/trpc";

export function useAuth() {
  // Initialize as false to prevent hydration mismatch
  // Will be updated in useEffect after client-side hydration
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication status
  const checkAuth = useCallback(() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("accessToken");
    return !!token;
  }, []);

  // Initialize auth state on mount (client-side only)
  useEffect(() => {
    const hasToken = checkAuth();
    setIsAuthenticated(hasToken);
    setIsInitialized(true);
  }, [checkAuth]);

  useEffect(() => {
    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        const hasToken = checkAuth();
        setIsAuthenticated(hasToken);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [checkAuth]);

  // Get profile only when authenticated
  const profileQuery = trpc.auth.getProfile.useQuery(undefined, {
    enabled: isAuthenticated && isInitialized,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  // Handle token expiration
  useEffect(() => {
    if (profileQuery.error && isAuthenticated) {
      const errorMessage = profileQuery.error.message || "";
      const errorCode = profileQuery.error.data?.code;
      
      // Check if error is due to invalid/expired token
      if (errorCode === "UNAUTHORIZED" || errorMessage.includes("Invalid or expired")) {
        console.log("Token expired or invalid, clearing auth state...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsAuthenticated(false);
      }
    }
  }, [profileQuery.error, isAuthenticated]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Continue with local logout even if API fails
      console.warn("Logout API failed, proceeding with local logout:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      // Clear all cached queries - use utils from the hook parameter
      window.location.href = "/";
    }
  }, [logoutMutation]);

  return {
    isAuthenticated,
    isInitialized,
    isLoading: !isInitialized || profileQuery.isLoading,
    profile: profileQuery.data,
    profileLoading: profileQuery.isLoading,
    profileError: profileQuery.error,
    logout,
    refetchProfile: profileQuery.refetch,
  };
}