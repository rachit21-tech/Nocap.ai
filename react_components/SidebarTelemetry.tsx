"use client";

import React from "react";

export interface AnalysisResult {
  prediction: "Real" | "Fake" | string;
  confidence: number;
  is_fake: boolean;
  prob_fake?: number;
  prob_real?: number;
  word_count?: number;
  sentence_count?: number;
  caps_ratio?: number;
  status?: string;
}

interface SidebarTelemetryProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  error?: string | null;
  onLoadReal?: () => void;
  onLoadFake?: () => void;
  onClear?: () => void;
}

export const SidebarTelemetry: React.FC<SidebarTelemetryProps> = ({
  result,
  isLoading,
  error,
  onLoadReal,
  onLoadFake,
  onClear,
}) => {
  const isFake = result?.prediction.toLowerCase() === "fake";

  return (
    <aside className="w-full flex flex-col gap-4">
      {/* Dynamic Section: ANALYSIS // RESULTS (Replaces WORKSPACE // TOOLS) */}
      <div className="bg-[#0f0f0f]/85 border border-[#2a2a2a] rounded-2xl p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full border-[1.5px] ${
                isLoading
                  ? "border-amber-400 bg-amber-400 animate-ping"
                  : result
                  ? isFake
                    ? "border-red-500 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    : "border-emerald-500 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  : "border-[#555] bg-[#111]"
              }`}
            />
            <span className="font-mono text-[11px] font-semibold tracking-[1.8px] text-[#888] uppercase">
              ANALYSIS // RESULTS
            </span>
          </div>

          {result && (
            <span
              className={`font-mono text-[9.5px] px-2 py-0.5 rounded border uppercase tracking-wider ${
                isFake
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              LIVE INFERENCE
            </span>
          )}
        </div>

        {/* Dynamic Verdict & Confidence Display */}
        {isLoading ? (
          <div className="py-6 px-4 text-center rounded-xl bg-[#141414] border border-[#282828] animate-pulse">
            <div className="font-mono text-[10px] tracking-widest text-[#888] uppercase mb-1">
              FASTAPI ML ENGINE
            </div>
            <div className="font-mono text-sm font-semibold text-amber-400 mb-2">
              EVALUATING CORPUS...
            </div>
            <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-2/3 animate-[pulse_1s_infinite]" />
            </div>
          </div>
        ) : error ? (
          <div className="py-4 px-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 font-mono text-xs text-center">
            <div className="font-bold mb-1">INFERENCE FAILED</div>
            <div className="text-[11px] text-[#aaa]">{error}</div>
          </div>
        ) : result ? (
          <div
            className={`p-4 rounded-xl border transition-all duration-300 ${
              isFake
                ? "bg-gradient-to-b from-red-950/25 to-[#120a0a] border-red-500/40 shadow-[0_0_24px_rgba(239,68,68,0.12)]"
                : "bg-gradient-to-b from-emerald-950/25 to-[#0a120d] border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
            }`}
          >
            <div className="font-mono text-[10px] tracking-[1.5px] text-[#777] uppercase mb-1">
              MODEL VERDICT
            </div>

            {/* Prominent Real/Fake Badge */}
            <div className="flex items-baseline justify-between mb-3">
              <span
                className={`font-mono text-2xl font-bold tracking-tight ${
                  isFake ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {result.prediction.toUpperCase()}
              </span>

              <span className="font-mono text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[#ddd]">
                {result.confidence}% CONFIDENCE
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-2.5 border-t border-white/10 flex flex-col gap-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-[#888]">
                <span>PROBABILITY</span>
                <span className={isFake ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
                  {result.confidence}% {result.prediction}
                </span>
              </div>
              {result.word_count !== undefined && (
                <div className="flex justify-between text-[#888]">
                  <span>ANALYZED WORDS</span>
                  <span className="text-[#ccc]">{result.word_count} words</span>
                </div>
              )}
              {result.caps_ratio !== undefined && (
                <div className="flex justify-between text-[#888]">
                  <span>CAPS INTENSITY</span>
                  <span className="text-[#ccc]">{result.caps_ratio}%</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 px-3 rounded-xl bg-[#111] border border-[#222] text-center font-mono">
            <div className="text-xl text-[#333] mb-1">⬡</div>
            <div className="text-xs text-[#888] font-medium mb-1">STANDBY MODE</div>
            <div className="text-[11px] text-[#555] leading-relaxed">
              Click &quot;Run Analysis&quot; to invoke FastAPI inference endpoint.
            </div>
          </div>
        )}
      </div>

      {/* Preset Buffers Node */}
      <div className="bg-[#0f0f0f]/85 border border-[#2a2a2a] rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full border-[1.5px] border-[#555] bg-[#111]" />
            <span className="font-mono text-[11px] font-semibold tracking-[1.8px] text-[#888] uppercase">
              PRESET BUFFERS
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#161616] border border-[#2c2c2c] text-[#999]">
            SAMPLE
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onLoadReal}
            className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-[#161616] border border-[#333] text-[#eee] hover:bg-[#242424] hover:text-white transition-all text-left flex justify-between"
          >
            <span>Load Real News Sample</span>
            <span className="text-[10px] text-emerald-400 font-mono">REAL</span>
          </button>
          <button
            onClick={onLoadFake}
            className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-[#161616] border border-[#333] text-[#eee] hover:bg-[#242424] hover:text-white transition-all text-left flex justify-between"
          >
            <span>Load Misinfo Sample</span>
            <span className="text-[10px] text-red-400 font-mono">FAKE</span>
          </button>
          <button
            onClick={onClear}
            className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-[#161616] border border-[#333] text-[#888] hover:bg-[#242424] hover:text-white transition-all"
          >
            Clear Input Buffer
          </button>
        </div>
      </div>

      {/* Real NLP Pipeline Telemetry Panel */}
      <div className="bg-[#0f0f0f]/85 border border-[#2a2a2a] rounded-2xl p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="font-mono text-[10px] text-[#888] tracking-[1.5px] uppercase mb-3 pb-2 border-b border-[#1f1f1f]">
          NLP PIPELINE TELEMETRY
        </div>

        <div className="flex flex-col gap-3 font-mono">
          <div>
            <div className="text-[10px] text-[#666] tracking-wider mb-0.5">DATASET PIPELINE</div>
            <div className="text-xs text-[#eee] font-semibold">WELFake Corpus (72,134 records)</div>
          </div>

          <div>
            <div className="text-[10px] text-[#666] tracking-wider mb-0.5">FEATURE EXTRACTION</div>
            <div className="text-xs text-[#eee] font-semibold">TF-IDF Vectorizer (5,000 features)</div>
          </div>

          <div>
            <div className="text-[10px] text-[#666] tracking-wider mb-0.5">MODEL ARCHITECTURE</div>
            <div className="text-xs text-[#eee] font-semibold">Logistic Regression (L2)</div>
          </div>

          <div>
            <div className="text-[10px] text-[#666] tracking-wider mb-0.5">TASK</div>
            <div className="text-xs text-emerald-400 font-semibold">Binary Classification (Real vs. Fake)</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarTelemetry;
