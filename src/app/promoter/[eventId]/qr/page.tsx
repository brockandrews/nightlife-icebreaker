"use client";

import React, { useEffect, useState, useRef } from "react";
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
  Layout,
  Maximize2,
  Scissors,
  Smartphone,
  Tv,
  FileText,
} from "lucide-react";

type FormatType = "poster" | "table-tent" | "badge" | "digital-slide";

export default function PrintQrPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.eventId as string) || "PILOT-2026";

  const [eventData, setEventData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeFormat, setActiveFormat] = useState<FormatType>("poster");
  const [joinUrl, setJoinUrl] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (data.success && data.event) {
          setEventData(data.event);
          const urlStr = `${window.location.origin}/e/${data.event.doorCodeToken}`;
          setJoinUrl(urlStr);
          const url = await QRCode.toDataURL(urlStr, {
            width: 800,
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

  const handleDownloadPng = () => {
    if (!qrDataUrl || !eventData) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${eventData.doorCodeToken}.png`;
    a.click();
  };

  const toggleFullscreen = () => {
    if (!slideRef.current) return;
    if (!document.fullscreenElement) {
      slideRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  if (loading || !eventData) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center text-white">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
        <p className="text-xs">Generating Multi-Format Assets...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-5xl mx-auto text-white">
      {/* Control Bar (Hidden when printing) */}
      <div className="print:hidden space-y-4 pb-6 mb-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push(`/promoter/${eventData.id}`)}
            className="flex items-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Console</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPng}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download QR (PNG)</span>
            </button>

            {activeFormat === "digital-slide" && (
              <button
                onClick={toggleFullscreen}
                className="py-2.5 px-4 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 font-bold rounded-xl text-xs flex items-center gap-2 active:scale-95 transition-all"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Fullscreen TV Mode</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="py-2.5 px-5 bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Format ({activeFormat.toUpperCase()})</span>
            </button>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#121824] border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveFormat("poster")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeFormat === "poster"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Door Sign / Poster (8.5×11)</span>
          </button>

          <button
            onClick={() => setActiveFormat("table-tent")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeFormat === "table-tent"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Table Tent (Foldable 2-Sided)</span>
          </button>

          <button
            onClick={() => setActiveFormat("badge")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeFormat === "badge"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Badge / Wristband (6-Up)</span>
          </button>

          <button
            onClick={() => setActiveFormat("digital-slide")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeFormat === "digital-slide"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Digital Slide (16:9 TV / Projector)</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          FORMAT 1: DOOR SIGN / POSTER (8.5 x 11 / A4)
      ======================================================== */}
      {activeFormat === "poster" && (
        <div className="bg-white text-black p-8 sm:p-12 rounded-3xl shadow-2xl border-4 border-slate-900 text-center max-w-lg mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none print:m-0">
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
            <span className="text-3xl font-mono font-black text-black tracking-widest">
              {eventData.doorCodeToken}
            </span>
          </div>

          {/* Prize Callout */}
          {eventData.prizeDescription && (
            <div className="mt-6 pt-4 border-t-2 border-slate-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                Tonight's Grand Prize
              </span>
              <p className="text-sm font-black text-black">
                🏆 {eventData.prizeDescription}
              </p>
            </div>
          )}

          <div className="mt-6 text-[11px] font-bold text-slate-500">
            No app download required • Takes 45 seconds to join!
          </div>
        </div>
      )}

      {/* ========================================================
          FORMAT 2: TABLE TENT (FOLDABLE 2-SIDED)
      ======================================================== */}
      {activeFormat === "table-tent" && (
        <div className="bg-white text-black p-6 rounded-3xl shadow-2xl border-4 border-slate-900 max-w-2xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none">
          {/* Top Panel (Folded Side A) */}
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {eventData.venueName} &bull; TABLE TENT (SIDE 1)
            </span>
            <h2 className="text-2xl font-black text-black uppercase mt-1 mb-2">
              {eventData.name}
            </h2>
            <div className="p-2 border-2 border-black rounded-2xl bg-white inline-block">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Event QR"
                  className="w-40 h-40 object-contain"
                />
              )}
            </div>
            <div className="mt-2 font-mono font-black text-lg text-black tracking-widest">
              DOOR CODE: {eventData.doorCodeToken}
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1">
              Scan with phone camera to join tonight's game & win drinks!
            </p>
          </div>

          {/* Fold Guideline */}
          <div className="my-4 flex items-center justify-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest border-y border-dashed border-slate-400 py-2">
            <span>✂</span>
            <span>--- FOLD HERE (CREASE TENT TOP) ---</span>
            <span>✂</span>
          </div>

          {/* Bottom Panel (Folded Side B) */}
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {eventData.venueName} &bull; TABLE TENT (SIDE 2)
            </span>
            <h2 className="text-2xl font-black text-black uppercase mt-1 mb-2">
              {eventData.name}
            </h2>
            <div className="p-2 border-2 border-black rounded-2xl bg-white inline-block">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Event QR"
                  className="w-40 h-40 object-contain"
                />
              )}
            </div>
            <div className="mt-2 font-mono font-black text-lg text-black tracking-widest">
              DOOR CODE: {eventData.doorCodeToken}
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1">
              🏆 {eventData.prizeDescription || "Exclusive Prizes for Winners!"}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          FORMAT 3: BADGE / WRISTBAND INSERT (6-UP SHEET)
      ======================================================== */}
      {activeFormat === "badge" && (
        <div className="bg-white text-black p-6 rounded-3xl shadow-2xl border-4 border-slate-900 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none">
          <div className="print:hidden text-center mb-4 text-xs font-bold text-slate-600">
            Cut along dashed borders to fit standard 3.5″ × 2.25″ lanyards & wristband sleeves (6 per page)
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="border-2 border-dashed border-slate-400 rounded-2xl p-4 flex items-center justify-between gap-3 bg-slate-50"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                    {eventData.venueName}
                  </span>
                  <h3 className="text-sm font-black text-black leading-tight uppercase">
                    {eventData.name}
                  </h3>
                  <div className="pt-1">
                    <span className="text-[9px] font-bold text-slate-600 block">
                      Door Code:
                    </span>
                    <span className="text-base font-mono font-black text-black tracking-wider">
                      {eventData.doorCodeToken}
                    </span>
                  </div>
                  <span className="inline-block text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    VIP Player Pass
                  </span>
                </div>

                <div className="p-1.5 bg-white border border-black rounded-xl shrink-0">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Badge QR"
                      className="w-24 h-24 object-contain"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          FORMAT 4: DIGITAL SCREEN SLIDE (16:9 TV / PROJECTOR)
      ======================================================== */}
      {activeFormat === "digital-slide" && (
        <div
          ref={slideRef}
          className={`aspect-video w-full max-w-4xl mx-auto bg-gradient-to-br from-[#0B0E14] via-[#151C2C] to-[#1E1238] border-4 border-cyan-500/50 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between overflow-hidden relative ${
            isFullscreen ? "border-none rounded-none w-screen h-screen max-w-none" : ""
          }`}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-teal-300 text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-cyan-400/30">
                <Zap className="w-7 h-7 fill-black text-black" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400 block">
                  {eventData.venueName} PRESENTS
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {eventData.name}
                </h1>
              </div>
            </div>

            <div className="px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold uppercase tracking-wider animate-pulse">
              Live Game Active
            </div>
          </div>

          {/* Main Slide Content: 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-auto">
            {/* Left Instructions */}
            <div className="space-y-4">
              <div className="inline-block px-4 py-1.5 rounded-xl bg-cyan-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-400/30">
                Point Phone Camera & Scan
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Meet People. <br />
                Fill Your Board. <br />
                <span className="text-cyan-400">Win Prizes.</span>
              </h2>

              {/* Door Code Box */}
              <div className="p-4 rounded-2xl bg-[#0B0E14]/80 border-2 border-cyan-400/60 inline-block">
                <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
                  Or Join Online at {window?.location?.hostname || "mixxsocial.app"}:
                </span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-cyan-300 tracking-widest">
                  {eventData.doorCodeToken}
                </span>
              </div>

              {eventData.prizeDescription && (
                <div className="flex items-center gap-3 text-amber-300 font-bold text-sm bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl">
                  <Trophy className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>Grand Prize: {eventData.prizeDescription}</span>
                </div>
              )}
            </div>

            {/* Right Large QR Code */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-5 bg-white rounded-3xl border-4 border-cyan-400 shadow-2xl shadow-cyan-500/30 inline-block">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Event QR Large"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                  />
                )}
              </div>
              <p className="text-xs font-bold text-slate-400 mt-3">
                Instant Web App &bull; No App Store Download Required
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-3">
            <span>Powered by MixxSocial Icebreaker Platform</span>
            <span>Takes 45 seconds to join</span>
          </div>
        </div>
      )}

      {/* Global CSS for high-fidelity printing */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>
    </main>
  );
}
