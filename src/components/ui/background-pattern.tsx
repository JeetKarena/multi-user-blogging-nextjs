"use client";

import { cn } from "@/lib/utils";

interface BackgroundPatternProps {
  variant?: "dots" | "grid" | "waves" | "none";
  className?: string;
}

export default function BackgroundPattern({
  variant = "dots",
  className
}: BackgroundPatternProps) {
  if (variant === "none") return null;

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {variant === "dots" && (
        <div className="absolute inset-0 opacity-[0.03]">
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="dot-pattern"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="1"
                  fill="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-pattern)" />
          </svg>
        </div>
      )}

      {variant === "grid" && (
        <div className="absolute inset-0 opacity-[0.02]">
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="grid-pattern"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-600 dark:text-gray-400"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>
      )}

      {variant === "waves" && (
        <div className="absolute inset-0 opacity-[0.02]">
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="wave-pattern"
                x="0"
                y="0"
                width="1200"
                height="600"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0,300 Q300,200 600,300 T1200,300 L1200,600 L0,600 Z"
                  fill="currentColor"
                  className="text-blue-200 dark:text-blue-900"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wave-pattern)" />
          </svg>
        </div>
      )}
    </div>
  );
}