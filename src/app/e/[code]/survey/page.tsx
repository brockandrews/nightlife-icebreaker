"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";

interface QuestionData {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  order: number;
}

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || "PILOT-2026";

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if registration data exists
    const regData = sessionStorage.getItem(`reg_${code.toUpperCase()}`);
    if (!regData) {
      router.replace(`/e/${code}`);
      return;
    }

    async function loadQuestions() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${code}/questions`);
        const data = await res.json();
        if (data.success && data.questions) {
          setQuestions(data.questions);
        } else {
          setError(data.error || "Failed to load questions");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load questions");
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [code, router]);

  const handleSelectOption = async (option: string) => {
    const currentQ = questions[currentIndex];
    const updatedAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(updatedAnswers);

    // If there are more questions, advance to next
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed all questions! Submit check-in
      await submitCheckIn(updatedAnswers);
    }
  };

  const submitCheckIn = async (finalAnswers: Record<string, string>) => {
    setSubmitting(true);
    setError(null);
    try {
      const regDataRaw = sessionStorage.getItem(`reg_${code.toUpperCase()}`);
      const regData = regDataRaw ? JSON.parse(regDataRaw) : {};

      const res = await fetch(`/api/events/${code}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: regData.displayName || "Guest",
          ageConfirmed: regData.ageConfirmed ?? true,
          marketingOptIn: regData.marketingOptIn ?? false,
          contactEmail: regData.contactEmail,
          contactPhone: regData.contactPhone,
          surveyResponses: finalAnswers,
        }),
      });

      const data = await res.json();
      if (data.success && data.player) {
        // Save player session to localStorage
        localStorage.setItem(
          `player_${code.toUpperCase()}`,
          JSON.stringify(data.player)
        );
        // Clear session reg data
        sessionStorage.removeItem(`reg_${code.toUpperCase()}`);
        // Go to game!
        router.replace(`/e/${code}/game`);
      } else {
        setError(data.error || "Failed to complete check-in");
        setSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please retry.");
      setSubmitting(false);
    }
  };

  if (loading || submitting) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
        <h2 className="text-xl font-bold text-white">
          {submitting ? "Building Your Bingo Card..." : "Loading Questions..."}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {submitting
            ? "Matching your traits with the room..."
            : "Get ready to tap your answers in <45s"}
        </p>
      </main>
    );
  }

  if (error || questions.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center max-w-sm mx-auto">
        <p className="text-red-400 text-sm mb-4">{error || "No questions found"}</p>
        <button
          onClick={() => router.replace(`/e/${code}`)}
          className="py-3 px-6 bg-slate-800 text-white font-bold rounded-xl text-xs"
        >
          Back to Check-in
        </button>
      </main>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(
    ((currentIndex + 1) / questions.length) * 100
  );

  return (
    <main className="min-h-screen flex flex-col justify-between p-5 max-w-md mx-auto">
      {/* Top Header & Progress */}
      <div className="pt-2 pb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-cyan-400">{progressPercent}%</span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-teal-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="my-auto py-2">
        <div className="mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400 block mb-1">
            Category: {currentQ.category}
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">
            {currentQ.prompt}
          </h2>
        </div>

        {/* Options Stack (Thumb friendly) */}
        <div className="space-y-2.5">
          {currentQ.options.map((option, idx) => {
            const isSelected = answers[currentQ.id] === option;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                className={`w-full text-left p-4 rounded-2xl font-bold text-sm transition-all transform active:scale-98 flex items-center justify-between ${
                  isSelected
                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300"
                    : "bg-[#151C2C] hover:bg-[#1C2538] text-slate-200 border border-slate-700/80 hover:border-cyan-500/50"
                }`}
              >
                <span>{option}</span>
                {isSelected && <Check className="w-5 h-5 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-800/80">
        <button
          onClick={() => {
            if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
            else router.push(`/e/${code}`);
          }}
          className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-[10px] text-slate-500 font-medium">
          Tap any option to proceed
        </span>
      </div>
    </main>
  );
}
