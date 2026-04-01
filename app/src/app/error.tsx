"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-white border border-[#EAEAEA] flex items-center justify-center mx-auto mb-5 text-3xl">
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-[#111] mb-2">Something went wrong</h1>
        <p className="text-sm text-[#999] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111] text-white text-sm font-semibold hover:bg-[#333] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
