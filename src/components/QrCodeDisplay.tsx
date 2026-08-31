"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Sun, Copy, Check, Sparkles, ShieldCheck } from "lucide-react";

interface QrCodeDisplayProps {
  player: {
    displayName: string;
    shortCode: string;
    identityToken: string;
    id: string;
  };
  venueName?: string;
}

export function QrCodeDisplay({ player, venueName }: QrCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isBright, setIsBright] = useState(false);

  useEffect(() => {
    // Generate QR code encoding player identity token
    if (player.identityToken || player.id) {
      const payload = player.shortCode; // Scan can resolve 4-char shortcode or token
      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [player]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(player.shortCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`w-full max-w-sm mx-auto flex flex-col items-center p-6 rounded-3xl transition-all duration-300 ${
        isBright
          ? "bg-white text-black ring-8 ring-cyan-400/50 shadow-2xl"
          : "bg-[#151C2C] border border-purple-500/30 text-white shadow-2xl"
      }`}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <span className="text-xs uppercase tracking-widest font-bold text-purple-400">
          Your Player Pass
        </span>
        <h2
          className={`text-2xl font-black mt-0.5 ${
            isBright ? "text-slate-900" : "text-white"
          }`}
        >
          {player.displayName}
        </h2>
        {venueName && (
          <p
            className={`text-xs mt-0.5 ${
              isBright ? "text-slate-600" : "text-slate-400"
            }`}
          >
            📍 {venueName}
          </p>
        )}
      </div>

      {/* QR Code Container */}
      <div className="relative p-3 bg-white rounded-2xl shadow-xl border-4 border-purple-500/40">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR for ${player.displayName}`}
            className="w-56 h-56 object-contain rounded-lg"
          />
        ) : (
          <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-lg">
            <span className="text-sm font-semibold text-slate-500 animate-pulse">
              Rendering QR...
            </span>
          </div>
        )}
      </div>

      {/* 4-Character Short Code (High Visibility Nightclub Fallback) */}
      <div className="w-full mt-5">
        <span
          className={`text-xs uppercase tracking-wider font-semibold block text-center mb-1 ${
            isBright ? "text-slate-700" : "text-slate-400"
          }`}
        >
          Or share your 4-letter PIN
        </span>

        <div
          onClick={handleCopyCode}
          className={`flex items-center justify-center gap-3 py-3 px-6 rounded-2xl border cursor-pointer active:scale-95 transition-all ${
            isBright
              ? "bg-slate-100 border-slate-300 text-black hover:bg-slate-200"
              : "bg-[#0C121E] border-cyan-500/40 text-cyan-400 hover:border-cyan-400"
          }`}
        >
          <span className="text-3xl font-mono font-black tracking-widest">
            {player.shortCode}
          </span>
          <button className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Nightclub Lighting Helper Button */}
      <button
        onClick={() => setIsBright(!isBright)}
        className={`mt-4 w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
          isBright
            ? "bg-slate-900 text-white"
            : "bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700"
        }`}
      >
        <Sun className="w-4 h-4 text-amber-400" />
        <span>
          {isBright ? "Normal Dark Mode" : "Bright Screen Mode (For Dark Clubs)"}
        </span>
      </button>

      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
        <span>Verified with 60s mutual handshake</span>
      </div>
    </div>
  );
}
