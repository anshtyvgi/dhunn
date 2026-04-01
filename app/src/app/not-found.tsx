import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-white border border-[#EAEAEA] flex items-center justify-center mx-auto mb-5 text-3xl">
          🎵
        </div>
        <h1 className="text-2xl font-bold text-[#111] mb-2">Page not found</h1>
        <p className="text-sm text-[#999] mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111] text-white text-sm font-semibold hover:bg-[#333] transition-colors"
        >
          Go to Create
        </Link>
      </div>
    </div>
  );
}
