// src/components/auth/with-auth.tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithAuthComponent = (props: P) => {
    const { isAuthenticated, isInitialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Only redirect after initialization is complete
      // Don't redirect if there's a token (even if auth state is temporarily false)
      if (isInitialized && !isAuthenticated && !localStorage.getItem("accessToken")) {
        router.replace("/auth/login");
      }
    }, [isAuthenticated, isInitialized, router]);

    // Show loading while initializing or if not authenticated (during redirect)
    // Don't show loading if there's a token (auth state might be temporarily false)
    if (!isInitialized || (!isAuthenticated && !localStorage.getItem("accessToken"))) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
              {!isInitialized ? "Loading..." : "Redirecting..."}
            </p>
          </div>
        </div>
      );
    }

    // User is authenticated, render the protected component
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithAuthComponent;
}
