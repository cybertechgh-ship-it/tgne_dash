"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { ShieldAlert, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AdminPinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { verifyPin, isAuthorized } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isAuthorized && !isSuccess) {
      router.push('/');
    }
  }, [isAuthorized, router, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    await new Promise(resolve => setTimeout(resolve, 800));

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
  const bgUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776599742/upscaled_10x_back_ziilsg.png";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-950">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgUrl}
          alt="Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gray-950/60" />
      </div>

      {/* Card */}
      <Card className={cn(
        "w-full max-w-sm relative z-10 bg-white/95 border-0 shadow-2xl transition-all duration-300",
        error && "animate-shake",
        isSuccess && "ring-2 ring-green-400"
      )}>
        <CardContent className="p-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center shadow border border-gray-100">
                <Image src={logoUrl} alt="TGNE" fill className="object-contain p-3" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              TGNE <span className="text-orange-500">CORE</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
          </div>

          {/* State icon */}
          <div className="flex justify-center mb-5">
            <div className={cn(
              "p-4 rounded-full transition-colors duration-200",
              isSuccess ? "bg-green-100" : error ? "bg-red-100" : "bg-gray-100"
            )}>
              {isSuccess ? (
                <CheckCircle2 className="text-green-500" size={32} />
              ) : error ? (
                <ShieldAlert className="text-red-500" size={32} />
              ) : isVerifying ? (
                <Loader2 className="text-gray-500 animate-spin" size={32} />
              ) : (
                <Lock className="text-gray-500" size={32} />
              )}
            </div>
          </div>

          {/* Status text */}
          <p className={cn(
            "text-center text-sm font-medium mb-6",
            isSuccess ? "text-green-600" :
            error ? "text-red-500" :
            "text-gray-500"
          )}>
            {isSuccess ? "Access granted. Redirecting..." :
             error ? "Incorrect PIN. Try again." :
             isVerifying ? "Verifying..." :
             "Enter your PIN to continue"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              className={cn(
                "h-13 bg-gray-50 border-2 border-gray-200 text-gray-900 text-center text-xl tracking-[0.4em] font-mono placeholder:text-gray-300 rounded-xl",
                "focus:ring-2 focus:ring-orange-400 focus:border-orange-400",
                error && "border-red-300 focus:ring-red-300 focus:border-red-300",
                isSuccess && "border-green-400"
              )}
              autoFocus
              disabled={isVerifying || isSuccess}
            />

            <Button
              type="submit"
              disabled={pin.length < 1 || isVerifying || isSuccess}
              className={cn(
                "w-full h-12 text-sm font-bold rounded-xl transition-colors duration-200",
                isSuccess ? "bg-green-500 hover:bg-green-600 text-white" :
                error ? "bg-red-500 hover:bg-red-600 text-white" :
                "bg-gray-900 hover:bg-gray-800 text-white"
              )}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Verifying...
                </span>
              ) : isSuccess ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} /> Welcome
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Unlock <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-300 text-xs">Protected by TGNE Security</p>
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
