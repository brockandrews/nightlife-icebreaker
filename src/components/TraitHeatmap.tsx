"use client";

import React, { useState } from "react";
import { Flame, Snowflake, Users, CheckCircle, Sparkles, Filter, Megaphone } from "lucide-react";

export interface TraitItem {
  traitId: string;
  option: string;
  promptText: string;
  holdersCount: number;
  stampedCount: number;
  isHot: boolean;
  isCold: boolean;
}

export interface CategoryHeatItem {
  questionId: string;
  category: string;
  prompt: string;
  traits: TraitItem[];
}

interface TraitHeatmapProps {
  categories: CategoryHeatItem[];
  totalPlayers?: number;
}

export function TraitHeatmap({ categories, totalPlayers = 0 }: TraitHeatmapProps) {
  const [filterMode, setFilterMode] = useState<"ALL" | "HOT" | "COLD">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  if (!categories || categories.length === 0) {
    return (
      <div className="p-6 bg-[#0B0E14] border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
        No trait data available yet. Waiting for guests to complete their entry survey.
      </div>
    );
  }

  // Flatten traits for counting metrics
  const allTraits = categories.flatMap((c) =>
    c.traits.map((t) => ({ ...t, categoryName: c.category }))
  );

  const hotTraitsCount = allTraits.filter((t) => t.isHot).length;
  const coldTraitsCount = allTraits.filter((t) => t.isCold).length;

  // Filter categories
  const displayedCategories = categories
    .filter((c) => selectedCategory === "ALL" || c.category === selectedCategory)
    .map((c) => {
      const filteredTraits = c.traits.filter((t) => {
        if (filterMode === "HOT") return t.isHot;
        if (filterMode === "COLD") return t.isCold;
        return true;
      });
      return { ...c, traits: filteredTraits };
    })
    .filter((c) => c.traits.length > 0);

  const uniqueCategories = Array.from(new Set(categories.map((c) => c.category)));

  return (
    <div className="space-y-4">
      {/* Top Stat Summary Pills */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setFilterMode("ALL")}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            filterMode === "ALL"
              ? "bg-slate-800 border-cyan-400/80 shadow-md shadow-cyan-500/10"
              : "bg-[#0B0E14] border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Total Traits
          </span>
          <span className="text-lg font-black text-white">{allTraits.length}</span>
        </button>

        <button
          onClick={() => setFilterMode("HOT")}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            filterMode === "HOT"
              ? "bg-amber-950/40 border-amber-400 shadow-md shadow-amber-500/20"
              : "bg-[#0B0E14] border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[10px] uppercase font-bold text-amber-400">
              Hot Traits
            </span>
          </div>
          <span className="text-lg font-black text-amber-300">{hotTraitsCount}</span>
        </button>

        <button
          onClick={() => setFilterMode("COLD")}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            filterMode === "COLD"
              ? "bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20"
              : "bg-[#0B0E14] border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-1">
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] uppercase font-bold text-cyan-400">
              Rare / Cold
            </span>
          </div>
          <span className="text-lg font-black text-cyan-300">{coldTraitsCount}</span>
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all ${
            selectedCategory === "ALL"
              ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          All Categories
        </button>
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all ${
              selectedCategory === cat
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Category & Traits List */}
      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
        {displayedCategories.length === 0 ? (
          <div className="p-6 text-center bg-[#0B0E14] rounded-2xl text-slate-500 text-xs">
            No traits match the selected filter.
          </div>
        ) : (
          displayedCategories.map((cat) => (
            <div
              key={cat.questionId}
              className="p-4 bg-[#0B0E14] border border-slate-800/80 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {cat.category}
                  </span>
                  <h3 className="text-xs font-bold text-white mt-1">
                    {cat.prompt}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {cat.traits.length} traits
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.traits.map((trait) => {
                  const pct =
                    totalPlayers > 0
                      ? Math.round((trait.holdersCount / totalPlayers) * 100)
                      : 0;

                  return (
                    <div
                      key={trait.traitId}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                        trait.isHot
                          ? "bg-amber-950/20 border-amber-500/40"
                          : trait.isCold
                          ? "bg-cyan-950/20 border-cyan-500/30"
                          : "bg-[#151C2C] border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-white leading-tight line-clamp-2">
                          {trait.promptText}
                        </span>

                        {trait.isHot && (
                          <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                            <Flame className="w-2.5 h-2.5 fill-amber-300" /> HOT
                          </span>
                        )}

                        {trait.isCold && (
                          <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-black border border-cyan-500/40">
                            <Snowflake className="w-2.5 h-2.5" /> RARE
                          </span>
                        )}
                      </div>

                      {/* Attendee Count & Stamped Count */}
                      <div className="space-y-1.5 mt-auto pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-cyan-400" />
                            <strong className="text-white">
                              {trait.holdersCount}
                            </strong>{" "}
                            guest{trait.holdersCount === 1 ? "" : "s"} ({pct}%)
                          </span>

                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <strong className="text-white">
                              {trait.stampedCount}
                            </strong>{" "}
                            stamped
                          </span>
                        </div>

                        {/* Visual Ratio Bar */}
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              trait.isHot
                                ? "bg-gradient-to-r from-amber-500 to-orange-400"
                                : trait.isCold
                                ? "bg-gradient-to-r from-cyan-600 to-teal-400"
                                : "bg-gradient-to-r from-cyan-500 to-blue-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
