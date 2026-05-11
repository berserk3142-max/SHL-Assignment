import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <main className="h-screen relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Top-left radial */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px]" />
        {/* Bottom-right radial */}
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-white/[0.01] rounded-full blur-[100px]" />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.008] rounded-full blur-[150px]" />
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Main Chat Container */}
      <div className="relative z-10 h-full max-w-5xl mx-auto flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
