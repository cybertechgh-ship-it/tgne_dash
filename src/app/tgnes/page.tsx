"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { ShieldAlert, Lock, ArrowRight, Loader2, CheckCircle2, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { verifyPin, isAuthorized } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isAuthorized && !isSuccess) router.push('/');
  }, [isAuthorized, router, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);
    await new Promise(r => setTimeout(r, 800));
    if (verifyPin(pin)) {
      setIsSuccess(true);
      setIsVerifying(false);
      setTimeout(() => router.push('/'), 1200);
    } else {
      setError(true);
      setPin('');
      setIsVerifying(false);
    }
  };

  const logoUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png";
  const bgUrl   = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776599742/upscaled_10x_back_ziilsg.png";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0d1220]">

      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image src={bgUrl} alt="bg" fill className="object-cover opacity-35" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-[#0d1220]/70 to-violet-900/35" />
        {/* ambient glows — brighter */}
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-violet-600/18 rounded-full blur-[90px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-400/10 rounded-full blur-[80px]" />
        {/* grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div className={cn(
        "w-full max-w-[380px] relative z-10 transition-all duration-300",
        error && "animate-shake",
        isSuccess && "drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]"
      )}>

        {/* Orange accent top bar */}
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-orange-600 via-amber-400 to-orange-500 shadow-lg shadow-orange-500/40" />

        {/* Card body */}
        <div className="bg-gray-800/85 backdrop-blur-2xl border border-white/12 border-t-0 rounded-b-3xl p-8 shadow-2xl shadow-black/50">

          {/* Logo + Brand */}
          <div className="text-center mb-8">
            <div className="relative w-[76px] h-[76px] mx-auto mb-5">
              <div className={cn(
                "w-full h-full rounded-2xl flex items-center justify-center border-2 overflow-hidden transition-all duration-500",
                isSuccess ? "border-emerald-400/60 shadow-lg shadow-emerald-400/20 bg-gray-800"
                : error    ? "border-red-400/50 shadow-lg shadow-red-400/20 bg-gray-800"
                :            "border-orange-500/40 shadow-lg shadow-orange-500/20 bg-gray-800"
              )}>
                <Image src={logoUrl} alt="TGNE" fill className="object-contain p-2.5" />
              </div>
              {/* Badge */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 transition-colors",
                isSuccess ? "bg-emerald-500" : error ? "bg-red-500" : "bg-orange-500"
              )}>
                {isSuccess ? <CheckCircle2 size={11} className="text-white" /> : <Zap size={11} className="text-white" />}
              </div>
            </div>

            <h1 className="text-[28px] font-black text-white tracking-tight leading-none">
              TGNE <span className="text-orange-500">CORE</span>
            </h1>
            <p className="text-gray-400 text-xs mt-2 font-semibold uppercase tracking-[0.15em]">
              Admin Command Center
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex justify-center mb-5">
            <div className={cn(
              "p-4 rounded-2xl border transition-all duration-300",
              isSuccess ? "bg-emerald-500/12 border-emerald-500/25 shadow-lg shadow-emerald-500/15"
              : error    ? "bg-red-500/12 border-red-500/25 shadow-lg shadow-red-500/15"
              :            "bg-orange-500/10 border-orange-500/20"
            )}>
              {isSuccess   ? <CheckCircle2 className="text-emerald-400" size={30} />
               : error     ? <ShieldAlert  className="text-red-400"     size={30} />
               : isVerifying? <Loader2   className="text-orange-400 animate-spin" size={30} />
               :              <Lock       className="text-orange-400"   size={30} />}
            </div>
          </div>

          {/* Status text */}
          <p className={cn(
            "text-center text-sm font-semibold mb-6 leading-snug",
            isSuccess   ? "text-emerald-400"
            : error     ? "text-red-400"
            : isVerifying ? "text-orange-300"
            :               "text-gray-300"
          )}>
            {isSuccess    ? "✓  Access granted — Redirecting…"
             : error      ? "✗  Incorrect PIN — Please try again"
             : isVerifying ? "Verifying credentials…"
             :               "Enter your secure PIN to continue"}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••••••"
              autoFocus
              disabled={isVerifying || isSuccess}
              className={cn(
                "w-full h-14 rounded-2xl bg-gray-800/80 border-2 text-white text-center text-2xl tracking-[0.5em] font-mono outline-none transition-all duration-200",
                "placeholder:text-gray-600 placeholder:tracking-[0.3em] placeholder:text-lg",
                isSuccess ? "border-emerald-500/50 focus:border-emerald-400"
                : error   ? "border-red-500/50 focus:border-red-400"
                :           "border-gray-700/80 focus:border-orange-500/70 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
              )}
            />

            <button
              type="submit"
              disabled={pin.length < 1 || isVerifying || isSuccess}
              className={cn(
                "w-full h-14 text-sm font-black rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg border-0",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100",
                isSuccess
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/30"
                : error
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/30"
                : "bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-[1.015] hover:from-orange-500 hover:to-amber-400 active:scale-[0.98]"
              )}
            >
              {isVerifying  ? <><Loader2 className="animate-spin" size={18} /> Verifying…</>
               : isSuccess  ? <><CheckCircle2 size={18} /> Welcome back</>
               :               <>Unlock Dashboard <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-5 border-t border-white/6 flex items-center justify-center gap-2">
            <Shield size={12} className="text-gray-600" />
            <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">
              Protected by TGNE Security Layer
            </span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60%  { transform: translateX(-7px); }
          40%, 80%  { transform: translateX(7px); }
        }
        .animate-shake { animation: shake 0.35s ease-in-out; }
      `}</style>
    </div>
  );
}
