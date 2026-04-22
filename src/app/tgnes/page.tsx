"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { ArrowRight, Loader2, CheckCircle2, Zap, Shield, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Padlock SVG Animation ────────────────────────────────────────────────────

function PadlockIcon({ state }: { state: 'locked' | 'unlocking' | 'unlocked' | 'error' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn(
        'w-full h-full transition-all duration-500',
        state === 'unlocking' && 'animate-pulse',
      )}
      fill="none"
    >
      {/* Shackle (top arc of padlock) */}
      <path
        d={state === 'unlocked' || state === 'unlocking'
          // Shackle swings open to the right when unlocked
          ? 'M20 26 L20 16 A12 12 0 0 1 44 16 L44 20'
          // Shackle closed
          : 'M20 26 L20 16 A12 12 0 0 1 44 16 L44 26'
        }
        stroke={
          state === 'error'     ? '#ef4444' :
          state === 'unlocked'  ? '#10b981' :
          state === 'unlocking' ? '#f59e0b' :
                                  '#f97316'
        }
        strokeWidth="4.5"
        strokeLinecap="round"
        className="transition-all duration-700"
        style={{
          transformOrigin: '44px 26px',
          transform: state === 'unlocked' ? 'rotate(-45deg)' : state === 'unlocking' ? 'rotate(-20deg)' : 'rotate(0deg)',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />

      {/* Lock body */}
      <rect
        x="12" y="26" width="40" height="30" rx="6"
        fill={
          state === 'error'     ? '#ef444420' :
          state === 'unlocked'  ? '#10b98120' :
          state === 'unlocking' ? '#f59e0b20' :
                                  '#f9731620'
        }
        stroke={
          state === 'error'     ? '#ef4444' :
          state === 'unlocked'  ? '#10b981' :
          state === 'unlocking' ? '#f59e0b' :
                                  '#f97316'
        }
        strokeWidth="3"
        className="transition-all duration-500"
      />

      {/* Keyhole circle */}
      <circle
        cx="32" cy="39"
        r={state === 'unlocked' ? 4 : 3}
        fill={
          state === 'error'     ? '#ef4444' :
          state === 'unlocked'  ? '#10b981' :
          state === 'unlocking' ? '#f59e0b' :
                                  '#f97316'
        }
        className="transition-all duration-300"
      />

      {/* Keyhole notch — hidden when unlocked */}
      {state !== 'unlocked' && (
        <rect
          x="30" y="41" width="4" height="8" rx="2"
          fill={
            state === 'error'     ? '#ef4444' :
            state === 'unlocking' ? '#f59e0b' :
                                    '#f97316'
          }
        />
      )}

      {/* Checkmark when unlocked */}
      {state === 'unlocked' && (
        <path
          d="M24 39 L30 45 L42 33"
          stroke="#10b981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-in fade-in zoom-in duration-300"
        />
      )}

      {/* Glow effect behind body when unlocked */}
      {state === 'unlocked' && (
        <rect
          x="12" y="26" width="40" height="30" rx="6"
          fill="none"
          stroke="#10b981"
          strokeWidth="1"
          opacity="0.4"
          filter="url(#glow)"
        />
      )}

      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────

export default function AdminPinPage() {
  const [pin,         setPin]         = useState('');
  const [error,       setError]       = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess,   setIsSuccess]   = useState(false);

  const { verifyPin, isAuthorized } = useApp();
  const router = useRouter();

  // If already authorised, redirect immediately
  useEffect(() => {
    if (isAuthorized && !isSuccess) router.push('/');
  }, [isAuthorized, router, isSuccess]);

  const padlockState =
    isSuccess   ? 'unlocked'  :
    isVerifying ? 'unlocking' :
    error       ? 'error'     :
                  'locked';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || isSuccess) return;
    setIsVerifying(true);
    setError(false);

    // Brief delay for the unlocking animation to play
    await new Promise(r => setTimeout(r, 900));

    if (await verifyPin(pin)) {
      setIsSuccess(true);
      setIsVerifying(false);
      // Navigate after unlock animation completes
      setTimeout(() => router.push('/'), 1000);
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

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src={bgUrl} alt="bg" fill className="object-cover opacity-35" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-[#0d1220]/70 to-violet-900/35" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-violet-600/18 rounded-full blur-[90px]" />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Card */}
      <div className={cn(
        "w-full max-w-[380px] relative z-10 transition-all duration-300",
        error && "animate-shake",
        isSuccess && "drop-shadow-[0_0_40px_rgba(16,185,129,0.35)]"
      )}>
        {/* Top accent bar */}
        <div className={cn(
          "h-1 rounded-t-2xl shadow-lg transition-all duration-500",
          isSuccess   ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-emerald-500/40" :
          error       ? "bg-gradient-to-r from-red-600 via-red-400 to-red-600 shadow-red-500/40" :
          isVerifying ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-amber-500/40" :
                        "bg-gradient-to-r from-orange-600 via-amber-400 to-orange-500 shadow-orange-500/40"
        )} />

        {/* Card body */}
        <div className="bg-gray-800/85 backdrop-blur-2xl border border-white/12 border-t-0 rounded-b-3xl p-8 shadow-2xl shadow-black/50">

          {/* Logo */}
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
              <div className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 transition-all duration-500",
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

          {/* ── PADLOCK ANIMATION ───────────────────────────────────── */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              "relative w-24 h-24 transition-all duration-500",
              isSuccess && "drop-shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-110"
            )}>
              <PadlockIcon state={padlockState} />

              {/* Sparkle particles when unlocked */}
              {isSuccess && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"
                      style={{
                        top:       `${20 + Math.sin(i * 60 * Math.PI / 180) * 44}%`,
                        left:      `${50 + Math.cos(i * 60 * Math.PI / 180) * 44}%`,
                        animationDelay:    `${i * 0.1}s`,
                        animationDuration: '1s',
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Status text */}
          <p className={cn(
            "text-center text-sm font-semibold mb-6 leading-snug transition-all duration-300",
            isSuccess   ? "text-emerald-400" :
            error       ? "text-red-400" :
            isVerifying ? "text-amber-300" :
                          "text-gray-300"
          )}>
            {isSuccess    ? "✓  Access granted — Redirecting…"
             : error      ? "✗  Incorrect PIN — Please try again"
             : isVerifying ? "Unlocking dashboard…"
             :               "Enter your secure PIN to unlock"}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); if (error) setError(false); }}
              placeholder="••••••••"
              autoFocus
              disabled={isVerifying || isSuccess}
              className={cn(
                "w-full h-14 rounded-2xl bg-gray-800/80 border-2 text-white text-center text-2xl tracking-[0.5em] font-mono outline-none transition-all duration-200",
                "placeholder:text-gray-600 placeholder:tracking-[0.3em] placeholder:text-lg",
                isSuccess ? "border-emerald-500/50 focus:border-emerald-400" :
                error     ? "border-red-500/50 focus:border-red-400" :
                            "border-gray-700/80 focus:border-orange-500/70 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
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
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/30 hover:from-red-500 hover:to-red-400 hover:scale-[1.015]"
                : "bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-[1.015] hover:from-orange-500 hover:to-amber-400 active:scale-[0.98]"
              )}
            >
              {isVerifying ? <><Loader2 className="animate-spin" size={18} /> Unlocking…</>
               : isSuccess ? <><CheckCircle2 size={18} /> Welcome back</>
               : error     ? <><ShieldAlert size={18} /> Try Again</>
               :             <>Unlock Dashboard <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-5 border-t border-white/6 flex items-center justify-center gap-2">
            <Shield size={12} className="text-gray-600" />
            <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">
              Protected by TGNE Security Layer
            </span>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-500",
              isSuccess ? "bg-emerald-500" : "bg-emerald-500"
            )} />
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
