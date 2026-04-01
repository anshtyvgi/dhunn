"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-[32px] overflow-hidden border border-black/5 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
        <div className="hidden lg:flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,_#b0ffcf,_#ffe27a_40%,_#ff8fb1)] p-10 text-[#111]">
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
              Create account
            </p>
            <h1 className="text-5xl leading-[1.02] font-black">
              Start making
              <br />
              songs that stick.
            </h1>
            <p className="max-w-md text-black/75 text-lg">
              Create your Dhun account to generate private dedications, save your
              library, and unlock studio publishing.
            </p>
          </div>
        </div>
        <div className="p-6 sm:p-10 flex items-center justify-center bg-[#fffdf8]">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/login"
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
