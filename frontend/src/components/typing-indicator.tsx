"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4">
      <div
        className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1]
                    flex items-center justify-center flex-shrink-0"
      >
        <Sparkles className="w-3.5 h-3.5 text-white/50" />
      </div>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-md px-5 py-3.5">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/25"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.15, 0.8],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
          <span className="text-[10px] text-white/15 ml-2 font-light tracking-wide">
            Analyzing catalog...
          </span>
        </div>
      </div>
    </div>
  );
}
