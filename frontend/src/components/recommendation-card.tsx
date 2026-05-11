"use client";

import { Recommendation } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ExternalLink, Wifi, Zap, ArrowUpRight } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  A: "bg-white/[0.06] text-white/70 border-white/[0.12]",
  B: "bg-white/[0.06] text-white/60 border-white/[0.1]",
  C: "bg-white/[0.06] text-white/60 border-white/[0.1]",
  D: "bg-white/[0.06] text-white/60 border-white/[0.1]",
  E: "bg-white/[0.06] text-white/60 border-white/[0.1]",
  K: "bg-white/[0.06] text-white/60 border-white/[0.1]",
  P: "bg-white/[0.06] text-white/60 border-white/[0.1]",
  S: "bg-white/[0.06] text-white/60 border-white/[0.1]",
};

const TYPE_LABELS: Record<string, string> = {
  A: "Ability",
  B: "Biodata/SJT",
  C: "Competency",
  D: "Development",
  E: "Exercises",
  K: "Knowledge",
  P: "Personality",
  S: "Simulation",
};

export function RecommendationCard({
  rec,
  index,
}: {
  rec: Recommendation;
  index: number;
}) {
  return (
    <motion.a
      href={rec.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative block rounded-xl border border-white/[0.06] bg-white/[0.02] p-5
                 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-500
                 backdrop-blur-sm cursor-pointer overflow-hidden"
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="font-medium text-sm text-white/85 group-hover:text-white
                         transition-colors duration-300 flex items-center gap-2 tracking-[-0.01em]">
            <span className="truncate">{rec.name}</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-all duration-300 
                                     -translate-y-0.5 group-hover:translate-y-0 flex-shrink-0" />
          </h4>

          {/* Description */}
          {rec.description && (
            <p className="text-xs text-white/30 mt-2 line-clamp-2 leading-relaxed font-light">
              {rec.description}
            </p>
          )}

          {/* Tags & Metadata */}
          <div className="flex items-center gap-2 mt-3.5 flex-wrap">
            {rec.test_type.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className={`text-[10px] px-2.5 py-0.5 font-medium border rounded-full tracking-wide
                  ${TYPE_COLORS[t] || "bg-white/[0.05] text-white/50 border-white/[0.08]"}`}
              >
                {TYPE_LABELS[t] || t}
              </Badge>
            ))}

            {rec.remote_testing && (
              <span className="flex items-center gap-1 text-[10px] text-white/30 tracking-wide">
                <Wifi className="w-3 h-3" />
                <span>Remote</span>
              </span>
            )}
            {rec.adaptive_irt && (
              <span className="flex items-center gap-1 text-[10px] text-white/30 tracking-wide">
                <Zap className="w-3 h-3" />
                <span>Adaptive</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  );
}
