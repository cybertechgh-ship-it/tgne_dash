"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { ShieldAlert, ShieldCheck, Lock, ArrowRight, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AdminPinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyPin, isAuthorized } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isAuthorized) {
      router.push('/');
    }
  }, [isAuthorized, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    // Artificial delay for premium feel and identity verification simulation
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (verifyPin(pin)) {
      router.push('/');
    } else {
      setError(true);
      setPin('');
      setIsVerifying(false);
    }
  };

  const logoUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png";
  const bgUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776599742/upscaled_10x_back_ziilsg.png";

  return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={bgUrl} 
          alt="Security Background" 
          fill 
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040a]/90 via-[#02040a]/40 to-[#02040a]/95" />
      </div>

      {/* Dynamic Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px] animate-pulse z-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[140px] animate-pulse [animation-delay:3s] z-1" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-12 duration-1000">
          <div className="relative w-24 h-24 mb-6 group cursor-default">
            <div className="absolute inset-0 bg-primary/40 rounded-3xl blur-2xl group-hover:bg-primary/60 transition-all duration-700 animate-pulse" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-white/20 p-4 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
              <Image 
                src={logoUrl} 
                alt="TGNE Logo" 
                fill 
                className="object-contain p-3"
                priority
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-lg shadow-xl animate-bounce">
              <ShieldCheck size={16} />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white text-center drop-shadow-2xl">
            TGNE <span className="text-primary italic">CORE</span>
          </h1>
          <div className="flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-muted-foreground font-bold tracking-[0.3em] uppercase">
              Encrypted Session Path
            </p>
          </div>
        </div>

        <Card className={cn(
          "glass-morphism border-white/10 bg-black/60 backdrop-blur-3xl overflow-hidden transition-all duration-500",
          error ? "border-red-500/50 shadow-[0_0_60px_rgba(239,68,68,0.3)] animate-shake" : "shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        )}>
          <CardContent className="p-10 relative">
            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan z-20" />
            
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-3 text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    {error ? (
                      <ShieldAlert className="text-red-500 animate-bounce" size={40} />
                    ) : isVerifying ? (
                      <Loader2 className="text-primary animate-spin" size={40} />
                    ) : (
                      <Lock className="text-primary/80 animate-pulse" size={40} />
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Security Access</h2>
                <p className="text-xs text-muted-foreground font-medium">Verify your administrative credentials to continue</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    "relative h-20 bg-black/80 border-white/5 text-center text-5xl text-white tracking-[0.6em] focus:ring-primary focus:border-primary/50 transition-all duration-500 placeholder:tracking-normal font-mono",
                    error && "border-red-500/50 focus:ring-red-500 focus:border-red-500",
                    "rounded-xl shadow-inner"
                  )}
                  autoFocus
                  disabled={isVerifying}
                />
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 animate-in fade-in zoom-in-95 duration-300">
                  <Zap size={14} className="animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Identity Verification Failed
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={pin.length < 1 || isVerifying}
                className={cn(
                  "w-full h-16 premium-button bg-primary hover:bg-primary/90 text-white font-black text-xl group relative overflow-hidden",
                  isVerifying && "opacity-80"
                )}
              >
                {isVerifying ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="animate-spin" size={20} />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Initialize Core
                    <ArrowRight className="group-hover:translate-x-1.5 transition-transform duration-300" size={24} />
                  </span>
                )}
                {/* Button shine effect */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-full transition-all duration-1000" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-10 flex items-center justify-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-white" />
            <span className="text-[9px] text-white font-black tracking-[0.3em] uppercase">secure</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-white" />
            <span className="text-[9px] text-white font-black tracking-[0.3em] uppercase">AES-GCM</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
