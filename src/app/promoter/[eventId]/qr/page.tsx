"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Printer,
  Download,
  ArrowLeft,
  Sparkles,
  Zap,
  Loader2,
  Trophy,
  Users,
} from "lucide-react";

export default function PrintQrPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.eventId as string) || "PILOT-2026";

  const [eventData, setEventData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (data.success && data.event) {
          setEventData(data.event);
          const joinUrl = `${window.location.origin}/e/${data.event.doorCodeToken}`;
          const url = await QRCode.toDataURL(joinUrl, {
            width: 600,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" },
            errorCorrectionLevel: "H",
          });
          setQrDataUrl(url);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !eventData) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center text-white">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
        <p className="text-xs">Generating Print Assets...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5 max-w-3xl mx-auto text-white">
      {/* Control Bar (Hidden when printing) */}
      <div className="print:hidden flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
        <button
          onClick={() => router.push(`/promoter/${eventData.id}`)}
          className="flex items-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Console</span>
        </button>

        <button
          onClick={handlePrint}
          className="py-3 px-6 bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Print Door Sign / Poster</span>
        </button>
      </div>

      {/* Printable Flyer (Styled for high-contrast B&W or Color Printing) */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-3xl shadow-2xl border-4 border-slate-900 text-center max-w-lg mx-auto print:border-none print:shadow-none print:p-0">
        {/* Top Venue Header */}
        <div className="border-b-4 border-black pb-4 mb-6">
          <span className="text-xs font-black uppercase tracking-widest text-slate-700 block mb-1">
            {eventData.venueName} PRESENTS
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-black uppercase">
            {eventData.name}
          </h1>
          <p className="text-sm font-bold text-slate-800 mt-2">
            ✨ Digital Human Bingo & Social Mixer ✨
          </p>
        </div>

        {/* Big Instruction */}
        <div className="mb-4">
          <span className="inline-block bg-black text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-2">
            Step 1: Scan to Play
          </span>
          <p className="text-xs font-bold text-slate-700">
            Open your phone camera & point at the code below
          </p>
        </div>

        {/* QR Code */}
        <div className="p-4 border-4 border-black rounded-3xl inline-block bg-white shadow-md my-2">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="Event QR"
              className="w-64 h-64 object-contain mx-auto"
            />
          )}
        </div>

        {/* Door Code Fallback */}
        <div className="mt-4 p-3 bg-slate-100 border-2 border-black rounded-2xl">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 block">
            Or type door code in browser:
          </span>
          <span className="text-2xl font-mono font-black text-black tracking-widest">
            {eventData.doorCodeToken}
          </span>
        </div>

        {/* Prize Callout */}
        {eventData.prizeDescription && (
          <div className="mt-6 pt-4 border-t-2 border-slate-300">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
              Tonight's Prize
            </span>
            <p className="text-sm font-black text-black">
              🏆 {eventData.prizeDescription}
            </p>
          </div>
        )}

        <div className="mt-6 text-[10px] font-bold text-slate-500">
          No app download required • Takes 45 seconds to join!
        </div>
      </div>
    </main>
  );
}
