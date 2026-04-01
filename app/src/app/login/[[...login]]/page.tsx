"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-[32px] overflow-hidden border border-black/5 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
        <div className="hidden lg:flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,_#ffe27a,_#ff8fb1_45%,_#6b7cff)] p-10 text-[#111]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black">
                D
              </div>
              <span className="text-xl font-extrabold">Dhun</span>
            </Link>
          </div>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] font-semibold text-black/60">
              Secure sign in
            </p>
            <h1 className="text-5xl leading-[1.02] font-black">
              Make a song
              <br />
              worth sharing.
            </h1>
            <p className="max-w-md text-black/75 text-lg">
              Sign in to create private dedications, manage your wallet, and
              publish studio songs safely.
            </p>
          </div>
        </div>
        <div className="p-6 sm:p-10 flex items-center justify-center bg-[#fffdf8]">
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                card: "shadow-none border border-black/5 rounded-[28px]",
                rootBox: "w-full",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
