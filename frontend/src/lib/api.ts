const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Recommendation {
  name: string;
  url: string;
  test_type: string[];
  duration: string | null;
  remote_testing: boolean;
  adaptive_irt: boolean;
  description: string;
}

export interface ChatResponse {
  reply: string;
  recommendations: Recommendation[];
  end_of_conversation: boolean;
}

export async function sendChat(messages: Message[]): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
