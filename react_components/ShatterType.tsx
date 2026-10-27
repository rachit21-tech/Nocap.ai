"use client";

import React, { useState, useRef } from "react";

interface ShatterTypeProps {
  text: string;
  revealContent?: React.ReactNode;
  revealText?: string;
  className?: string;
  shatterClassName?: string;
  revealClassName?: string;
  onShatter?: () => void;
}

interface Fragment {
  id: number;
  char: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
}

export const ShatterType: React.FC<ShatterTypeProps> = ({
  text,
  revealContent,
  revealText,
  className = "",
  shatterClassName = "",
  revealClassName = "",
  onShatter,
}) => {
  const [isShattered, setIsShattered] = useState(false);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleShatter = () => {
    if (!isShattered) {
      // Generate physics shard trajectories for each character
      const chars = text.split("");
      const shards = chars.map((char, index) => {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 40 + Math.random() * 80;
        return {
          id: index,
          char: char === " " ? "\u00A0" : char,
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity - 20,
          rotate: (Math.random() - 0.5) * 120,
          scale: 0.2 + Math.random() * 0.6,
          opacity: 0,
        };
      });

      setFragments(shards);
      setIsShattered(true);
      if (onShatter) onShatter();
    } else {
      // Reassemble on second click
      setIsShattered(false);
      setFragments([]);
    }
  };

  const defaultReveal = (
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
  );

  return (
    <div
      ref={containerRef}
      onClick={handleShatter}
      className={`relative inline-block cursor-pointer select-none transition-all duration-300 ${className}`}
      title={isShattered ? "Click to Reassemble" : "Click to Shatter & Reveal Easter Egg"}
    >
      {/* Front Original Text */}
      {!isShattered ? (
        <span
          className={`inline-block font-mono tracking-wider font-bold transition-transform hover:scale-105 ${shatterClassName}`}
        >
          {text}
        </span>
      ) : (
        <div className="relative inline-block">
          {/* Shattered Particles flying away */}
          <div className="absolute inset-0 pointer-events-none">
            {fragments.map((shard) => (
              <span
                key={shard.id}
                className="inline-block transition-all duration-700 ease-out font-mono font-bold"
                style={{
                  transform: `translate(${shard.x}px, ${shard.y}px) rotate(${shard.rotate}deg) scale(${shard.scale})`,
                  opacity: shard.opacity,
                  filter: "blur(2px)",
                }}
              >
                {shard.char}
              </span>
            ))}
          </div>

          {/* Gracefully Revealed Creator & College Credentials (Dark Glassmorphism) */}
          <div
            className={`animate-in fade-in zoom-in-95 duration-500 px-4 py-2.5 rounded-2xl border border-emerald-500/35 bg-[#121212]/85 text-emerald-300 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-start gap-3 ${revealClassName}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shadow-[0_0_8px_rgba(52,211,153,0.7)] flex-shrink-0 animate-pulse" />
            {revealContent ? revealContent : revealText ? <span>{revealText}</span> : defaultReveal}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShatterType;
