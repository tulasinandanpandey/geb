import { supabase } from "@/lib/supabase/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export interface Conversation {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  mode: "ai_active" | "human_active" | "closed";
  created_at: string;
  updated_at: string;
  property: {
    id: string;
    title: string;
    price: number;
    city: string;
    locality?: string;
    image: string;
    seller_id: string;
  };
  buyer: {
    id: string;
    full_name: string;
    email: string;
  };
  seller: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: "buyer" | "seller" | "ai_agent" | "system";
  message: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

async function getHeaders() {
  await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function getOrCreateConversation(
  propertyId: string
): Promise<{ conversation: Conversation; is_new: boolean }> {
  const headers = await getHeaders();

  if (!headers["Authorization"]) {
    throw new Error("You must be logged in to contact the seller.");
  }

  const response = await fetch(`${API_URL}/api/conversations/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ property_id: propertyId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Failed to initiate conversation: ${response.status}`
    );
  }

  const data = await response.json();
  return {
    conversation: data.conversation,
    is_new: data.is_new,
  };
}

export async function listConversations(): Promise<Conversation[]> {
  const headers = await getHeaders();

  if (!headers["Authorization"]) {
    throw new Error("You must be logged in to view conversations.");
  }

  const response = await fetch(`${API_URL}/api/conversations/`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Failed to fetch conversations: ${response.status}`
    );
  }

  const data = await response.json();
  return data.conversations;
}

export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const headers = await getHeaders();

  if (!headers["Authorization"]) {
    throw new Error("You must be logged in to view messages.");
  }

  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}/messages`,
    {
      headers,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Failed to fetch messages: ${response.status}`
    );
  }

  const data = await response.json();
  return data.messages;
}

export async function sendChatMessage(
  conversationId: string,
  message: string
): Promise<Message> {
  const headers = await getHeaders();

  if (!headers["Authorization"]) {
    throw new Error("You must be logged in to send a message.");
  }

  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Failed to send message: ${response.status}`
    );
  }

  const data = await response.json();
  return data.message;
}

export async function updateConversationMode(
  conversationId: string,
  mode: "ai_active" | "human_active" | "closed"
): Promise<Conversation> {
  const headers = await getHeaders();

  if (!headers["Authorization"]) {
    throw new Error("You must be logged in to update conversation co-pilot mode.");
  }

  const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ mode }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Failed to update conversation mode: ${response.status}`
    );
  }

  const data = await response.json();
  return data.conversation;
}
