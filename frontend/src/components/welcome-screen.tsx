"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  Users,
  Code,
  Sparkles,
} from "lucide-react";

const SUGGESTIONS = [
  {
    icon: Code,
    text: "Find assessments for a Java developer role",
    tag: "Engineering",
  },
  {
    icon: Users,
    text: "I need to evaluate leadership competencies",
    tag: "Leadership",
  },
  {
    icon: Search,
    text: "What personality assessments do you have?",
    tag: "Discovery",
  },
  {
    icon: MessageSquare,
    text: "Help me hire a sales manager",
    tag: "Sales",
  },
];

export function WelcomeScreen({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center h-full px-6 text-center"
    >
      {/* Logo Mark */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.1] 
                        flex items-center justify-center backdrop-blur-xl animate-pulse-glow">
          <Sparkles className="w-7 h-7 text-white/80" />
        </div>
        {/* Ambient ring */}
        <div className="absolute -inset-3 rounded-3xl bg-white/[0.02] blur-xl -z-10" />
      </motion.div>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-3xl md:text-4xl font-semibold text-white tracking-[-0.03em] mb-3"
      >
        SHL Assessment Advisor
      </motion.h2>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-white/35 text-sm md:text-base max-w-lg mb-12 leading-relaxed font-light tracking-wide"
      >
        I help you find the perfect SHL assessments for your hiring needs.
        Tell me about the role, and I&apos;ll recommend the right tests.
      </motion.p>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.25 + i * 0.08,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={() => onSuggestionClick(s.text)}
            className="group relative flex items-start gap-3.5 p-4 rounded-xl
                       bg-white/[0.02] border border-white/[0.06]
                       hover:bg-white/[0.05] hover:border-white/[0.12]
                       transition-all duration-500 text-left overflow-hidden"
          >
            {/* Hover shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] 
                            group-hover:translate-x-[100%]" 
                 style={{ transition: 'opacity 0.7s, transform 1s' }} />
            
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] 
                            flex items-center justify-center flex-shrink-0
                            group-hover:bg-white/[0.08] group-hover:border-white/[0.15] transition-all duration-300">
              <s.icon className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors duration-300" />
            </div>
            
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-white/20 uppercase tracking-[0.1em] font-medium block mb-1">
                {s.tag}
              </span>
              <span className="text-[13px] text-white/50 group-hover:text-white/75 transition-colors duration-300 leading-snug block">
                {s.text}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
