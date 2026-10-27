"use client";

import React, { useState } from "react";
import ShatterType from "./ShatterType";
import SidebarTelemetry, { AnalysisResult } from "./SidebarTelemetry";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SAMPLE_REAL =
  "WASHINGTON (Reuters) - The Federal Reserve held interest rates steady on Wednesday, pointing to sustained economic growth and low unemployment while inflation continues to trend toward its two percent target.";

const SAMPLE_FAKE =
  "BOMBSHELL ALERT: Secret Pentagon leaks CONFIRM global shadow government orchestrating UNPRECEDENTED atmospheric wave manipulation! Mainstream media completely SILENT as whistleblowers reveal hidden underground operations! SHARE THIS!";

export const MainCanvas: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Trigger real asynchronous inference request to FastAPI backend
  const handleRunAnalysis = async () => {
    const textToAnalyze = inputText.trim();
    if (!textToAnalyze) {
      setError("Input buffer cannot be empty. Please enter text or load a sample.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textToAnalyze }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Server returned error status ${response.status}`
        );
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("[INFERENCE ERROR]", err);
      setError(err.message || "Failed to connect to FastAPI backend at " + API_BASE_URL);
    } finally {
      setIsLoading(false);
    }
  };

  const isFake = result?.prediction.toLowerCase() === "fake";

  return (
    <div className="min-h-screen w-full bg-[#050505] bg-[radial-gradient(#222_1px,transparent_1px)] bg-[size:20px_20px] text-[#ddd] p-6 font-sans">
      {/* Top Header / Canvas Breadcrumb Bar */}
      <header className="flex items-center justify-between border-b border-[#1a1a1a] pb-3 mb-6 font-mono">
        <div className="flex items-center gap-3">
          <ShatterType
            text="NoCap.AI"
            revealContent={
              <div className="flex flex-col text-left font-sans text-xs leading-relaxed text-[#eee]">
                <span className="font-mono text-[10px] tracking-wider text-emerald-400 font-semibold uppercase mb-0.5">
                  Developed by:
                </span>
                <span className="text-white font-medium">
                  Soujanya Pathak <span className="font-mono text-[11px] text-[#aaa]">(26BDA10015)</span>
                </span>
                <span className="text-white font-medium">
                  Veer K Chauhan <span className="font-mono text-[11px] text-[#aaa]">(26BDA10021)</span>
                </span>
                <span className="font-mono text-[10.5px] text-[#888] mt-0.5">
                  Chandigarh University (CU) | AI Misinformation Defense Project
                </span>
              </div>
            }
            shatterClassName="text-sm font-bold tracking-widest text-white hover:text-emerald-400"
          />
          <span className="text-[#555]">//</span>
          <span className="text-xs tracking-wider text-white font-semibold">NOCAP</span>
          <span className="text-[#555]">//</span>
          <span className="text-xs tracking-wider text-white font-semibold">CREATORS</span>
          <span className="text-[#555]">/</span>
          <span className="text-xs tracking-wider text-[#888]">WORKSPACE_CANVAS_V2</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] tracking-wide text-[#777]">
          <div>
            API: <span className="text-[#bbb]">FASTAPI // 8000</span>
          </div>
          <div>
            STATUS: <span className="text-[#bbb]">ONLINE</span>{" "}
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <div>
            MODEL: <span className="text-[#bbb]">TF-IDF + LOGISTIC_REG</span>
          </div>
        </div>
      </header>

      {/* Main Grid Layout: Columns [1, 2, 1] */}
      <main className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Column: Dynamic ANALYSIS // RESULTS + Telemetry */}
        <div className="md:col-span-1">
          <SidebarTelemetry
            result={result}
            isLoading={isLoading}
            error={error}
            onLoadReal={() => {
              setInputText(SAMPLE_REAL);
              setError(null);
            }}
            onLoadFake={() => {
              setInputText(SAMPLE_FAKE);
              setError(null);
            }}
            onClear={() => {
              setInputText("");
              setResult(null);
              setError(null);
            }}
          />
        </div>

        {/* Center Column: Input Node */}
        <div className="md:col-span-2 bg-[#0f0f0f]/85 border border-[#2a2a2a] rounded-2xl p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border-[1.5px] border-[#555] bg-[#111]" />
              <span className="font-mono text-[11px] font-semibold tracking-[1.8px] text-[#888] uppercase">
                INPUT NODE // BUFFER
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#161616] border border-[#2c2c2c] text-[#999]">
              PORT 01 : TEXT_IN
            </span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (error) setError(null);
            }}
            rows={12}
            placeholder="Paste news article, headline, dispatch, or statement here to execute real FastAPI inference..."
            className="w-full bg-[#0b0b0b] border border-[#262626] rounded-xl text-[#e5e5e5] p-3.5 text-[13.5px] leading-relaxed focus:outline-none focus:border-[#444] resize-none"
          />

          <div className="flex justify-between items-center my-3 font-mono text-[11px] text-[#666]">
            <div>
              CHARACTERS: <span className="text-[#aaa]">{inputText.length}</span>
            </div>
            <div>
              EST. TOKENS:{" "}
              <span className="text-[#aaa]">
                {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-950/20 border border-red-500/30 text-xs font-mono text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className={`w-full py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
              isLoading
                ? "bg-[#1f1f1f] border-[#444] text-[#888] cursor-not-allowed"
                : "bg-[#161616] border-[#333] text-[#eee] hover:bg-[#242424] hover:border-[#555] hover:text-white"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Querying /api/analyze Endpoint...
              </span>
            ) : (
              "Run Analysis"
            )}
          </button>
        </div>

        {/* Right Column: Stats Node / Telemetry */}
        <div className="md:col-span-1 bg-[#0f0f0f]/85 border border-[#2a2a2a] rounded-2xl p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border-[1.5px] border-[#555] bg-[#111]" />
              <span className="font-mono text-[11px] font-semibold tracking-[1.8px] text-[#888] uppercase">
                STATS NODE // INFERENCE
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#161616] border border-[#2c2c2c] text-[#999]">
              PORT 02 : METRICS_OUT
            </span>
          </div>

          {!result ? (
            <div className="text-center py-12 text-[#555] font-mono text-xs">
              <div className="text-2xl mb-2 text-[#3a3a3a]">⬡</div>
              <div className="text-[#888] font-medium mb-1">AWAITING INGESTION</div>
              <div>Paste text into Input Node and click &apos;Run Analysis&apos; to process.</div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="font-mono text-[10px] tracking-widest text-[#777] uppercase mb-2">
                FASTAPI AI CONFIDENCE
              </div>

              <div className="font-mono text-5xl font-bold text-white mb-2 tracking-tight">
                {result.confidence}%
              </div>

              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold mb-6 border ${
                  isFake
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                }`}
              >
                {isFake ? "FLAGGED // HIGH MISINFO RISK" : "VERIFIED // AUTHENTIC REPORTING"}
              </div>

              {/* Extracted Linguistic Metadata */}
              <div className="grid grid-cols-2 gap-2 text-left font-mono">
                <div className="bg-[#111] border border-[#222] rounded-lg p-2.5">
                  <div className="text-[10px] text-[#777] uppercase">Word Count</div>
                  <div className="text-sm font-semibold text-[#eee]">{result.word_count ?? "--"}</div>
                </div>
                <div className="bg-[#111] border border-[#222] rounded-lg p-2.5">
                  <div className="text-[10px] text-[#777] uppercase">Sentences</div>
                  <div className="text-sm font-semibold text-[#eee]">{result.sentence_count ?? "--"}</div>
                </div>
                <div className="bg-[#111] border border-[#222] rounded-lg p-2.5">
                  <div className="text-[10px] text-[#777] uppercase">Caps Ratio</div>
                  <div className="text-sm font-semibold text-[#eee]">{result.caps_ratio ?? 0}%</div>
                </div>
                <div className="bg-[#111] border border-[#222] rounded-lg p-2.5">
                  <div className="text-[10px] text-[#777] uppercase">Model</div>
                  <div className="text-xs font-semibold text-[#aaa]">LogisticReg</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MainCanvas;
