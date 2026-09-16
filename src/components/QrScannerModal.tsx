"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, KeyRound, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface QrScannerModalProps {
  onScanTarget: (code: string) => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
  clearError?: () => void;
  pinCode?: string;
  onPinChange?: (pin: string) => void;
  cooldownSeconds?: number;
}

export function QrScannerModal({
  onScanTarget,
  isLoading = false,
  errorMessage = null,
  clearError,
  pinCode: controlledPin,
  onPinChange: controlledOnPinChange,
  cooldownSeconds = 0,
}: QrScannerModalProps) {
  const [internalPin, setInternalPin] = useState("");
  const pinCode = controlledPin !== undefined ? controlledPin : internalPin;
  const setPinCode = controlledOnPinChange !== undefined ? controlledOnPinChange : setInternalPin;
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(cooldownSeconds);
  const scannerRef = useRef<any>(null);
  const qrRegionId = "qr-reader-viewport";

  useEffect(() => {
    if (cooldownSeconds > 0) {
      setCooldownRemaining(cooldownSeconds);
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Handle PIN input change
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (cooldownRemaining > 0) return;
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setPinCode(val);
    clearError?.();

    if (val.length === 4) {
      onScanTarget(val);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) return;
    if (pinCode.length >= 3) {
      onScanTarget(pinCode);
    }
  };

  // Start / Stop Camera Scanner
  const startScanner = async () => {
    try {
      setCameraError(null);
      if (!scannerRef.current) {
        const { Html5Qrcode } = await import("html5-qrcode");
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // Successfully scanned QR!
          stopScanner();
          onScanTarget(decodedText);
        },
        () => {
          // Frame error (ignored while seeking)
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraError(
        "Camera unavailable or permission denied. Use the 4-letter PIN below!"
      );
      setIsCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("Error stopping camera:", err);
      }
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isCameraActive) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isCameraActive]);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center p-5 bg-[#151C2C] border border-cyan-500/30 rounded-3xl shadow-2xl text-white">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Make a Connection</span>
        </div>
        <h2 className="text-xl font-black text-white">Connect with Someone</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Scan their screen QR or enter their 4-letter PIN
        </p>
      </div>

      {/* Anti-Fraud Cooldown Banner */}
      {cooldownRemaining > 0 && (
        <div className="w-full p-3 mb-4 bg-amber-950/80 border border-amber-500/70 rounded-xl text-amber-200 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-base">⏳</span>
            <div>
              <span className="font-bold">Anti-Fraud Scan Cooldown</span>
              <p className="text-[11px] text-amber-300/80">Please chat with your partner before next scan!</p>
            </div>
          </div>
          <span className="font-mono text-base font-black px-2 py-0.5 bg-amber-900/60 rounded-lg text-amber-300">
            {cooldownRemaining}s
          </span>
        </div>
      )}

      {/* Error Banner */}
      {(errorMessage || cameraError) && cooldownRemaining <= 0 && (
        <div className="w-full p-3 mb-4 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage || cameraError}</span>
        </div>
      )}

      {/* Primary: 4-Character PIN Input Pad (Fast & Nightclub-proof) */}
      <form onSubmit={handleManualSubmit} className="w-full mb-5">
        <label className="block text-xs uppercase tracking-wider font-bold text-slate-300 text-center mb-2">
          Enter Their 4-Letter PIN
        </label>

        <div className="flex items-center justify-center gap-2">
          <input
            type="text"
            value={pinCode}
            disabled={cooldownRemaining > 0}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChange={handlePinChange}
            placeholder={isInputFocused ? "" : "PIN"}
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            className="w-full max-w-[200px] text-center text-3xl font-mono font-black uppercase tracking-widest py-3 px-4 bg-[#0B0E14] border-2 border-cyan-400 rounded-2xl text-cyan-300 placeholder:text-slate-600 placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:font-bold focus:placeholder-transparent focus:outline-none focus:ring-4 focus:ring-cyan-500/30 shadow-inner disabled:opacity-40 disabled:border-slate-700"
          />
        </div>

        <button
          type="submit"
          disabled={pinCode.length < 3 || isLoading || cooldownRemaining > 0}
          className="mt-3 w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-extrabold rounded-xl text-sm transition-all disabled:opacity-40 active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Handshake...</span>
            </>
          ) : cooldownRemaining > 0 ? (
            <span>Ready in {cooldownRemaining}s</span>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Connect via PIN</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative w-full flex items-center justify-center my-2">
        <div className="border-t border-slate-800 w-full" />
        <span className="bg-[#151C2C] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Or Scan Camera
        </span>
      </div>

      {/* Camera Viewport / Toggle */}
      <div className="w-full mt-2 flex flex-col items-center">
        {!isCameraActive ? (
          <button
            onClick={startScanner}
            disabled={isLoading || cooldownRemaining > 0}
            className="w-full py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 active:scale-98 transition-all disabled:opacity-40"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Open Camera Scanner</span>
          </button>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div
              id={qrRegionId}
              className="w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border-2 border-cyan-400 bg-black mb-3"
            />
            <button
              onClick={stopScanner}
              className="py-2 px-4 bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs hover:text-white"
            >
              Close Camera
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
