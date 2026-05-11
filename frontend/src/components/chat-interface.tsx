"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, Sparkles, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, Recommendation, sendChat } from "@/lib/api";
import { RecommendationCard } from "@/components/recommendation-card";
import { TypingIndicator } from "@/components/typing-indicator";
import { WelcomeScreen } from "@/components/welcome-screen";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  recommendations?: Recommendation[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
    }

    try {
      const apiMessages: Message[] = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChat(apiMessages);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.reply,
        recommendations: response.recommendations,
      };
      setMessages([...newMessages, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error connecting to the server. Please make sure the backend is running and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 md:px-8 h-16 border-b border-white/[0.04]
                       bg-black/20 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1]
                        flex items-center justify-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-white/70" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white/90 tracking-[-0.02em]">
              SHL Assessment Advisor
            </h1>
            <p className="text-[10px] text-white/20 tracking-[0.05em] uppercase font-medium">
              Powered by SHL Product Catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-white/30 hover:text-white/60 hover:bg-white/[0.04] text-[11px] 
                           gap-1.5 rounded-lg tracking-wide uppercase font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                New Chat
              </Button>
            </motion.div>
          )}
        </div>
      </nav>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto px-2" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={(text) => handleSend(text)} />
          ) : (
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`flex items-start gap-3 px-4 mb-6 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  {msg.role === "assistant" ? (
                    <div
                      className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1]
                                  flex items-center justify-center flex-shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white/50" />
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/[0.12]
                                  flex items-center justify-center text-white/50 text-xs font-medium flex-shrink-0"
                    >
                      U
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className={`max-w-[80%] ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed tracking-[-0.01em] ${
                        msg.role === "user"
                          ? "bg-white text-[#0a0a0a] rounded-tr-md font-medium"
                          : "bg-white/[0.03] border border-white/[0.06] text-white/70 rounded-tl-md"
                      }`}
                    >
                      {msg.content.split("\n").map((line, li) => (
                        <p key={li} className={li > 0 ? "mt-2" : ""}>
                          {line.split(/(\*\*[^*]+\*\*)/).map((part, pi) =>
                            part.startsWith("**") && part.endsWith("**") ? (
                              <strong
                                key={pi}
                                className={`font-semibold ${
                                  msg.role === "user"
                                    ? "text-[#0a0a0a]"
                                    : "text-white/90"
                                }`}
                              >
                                {part.slice(2, -2)}
                              </strong>
                            ) : (
                              <span key={pi}>{part}</span>
                            )
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 px-1 mb-3">
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                          <span className="text-[10px] text-white/20 uppercase tracking-[0.15em] font-medium whitespace-nowrap">
                            {msg.recommendations.length} Assessment
                            {msg.recommendations.length > 1 ? "s" : ""}{" "}
                            Found
                          </span>
                          <div className="h-[1px] flex-1 bg-gradient-to-l from-white/[0.06] to-transparent" />
                        </div>
                        {msg.recommendations.map((rec, ri) => (
                          <RecommendationCard
                            key={ri}
                            rec={rec}
                            index={ri}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && <TypingIndicator />}
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="border-t border-white/[0.04] p-4 md:p-5 bg-black/20 backdrop-blur-2xl">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative flex items-end gap-2 bg-white/[0.03] border border-white/[0.06]
                        rounded-2xl px-4 py-3 focus-within:border-white/[0.15]
                        focus-within:bg-white/[0.04] transition-all duration-500
                        focus-within:shadow-[0_0_30px_rgba(255,255,255,0.02)]"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the role you're hiring for..."
              rows={1}
              className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/20
                         resize-none outline-none min-h-[24px] max-h-[120px] tracking-[-0.01em] font-light"
              style={{ height: "24px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "24px";
                target.style.height = target.scrollHeight + "px";
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-white text-[#0a0a0a] flex items-center justify-center
                         disabled:opacity-20 disabled:bg-white/[0.08] disabled:text-white/30
                         hover:bg-white/90 active:scale-95 transition-all duration-200 flex-shrink-0"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-[10px] text-white/15 text-center mt-2.5 tracking-wide font-light">
            Recommends from SHL&apos;s official catalog of 389 Individual Test
            Solutions
          </p>
        </div>
      </div>
    </div>
  );
}
