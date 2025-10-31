import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { Message } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

dayjs.extend(relativeTime);

async function fetchMessages(token: string): Promise<Message[]> {
  const response = await fetch(`${API_BASE}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error("Failed to load messages");
  }
  return response.json();
}

const messagingTips = [
  "Send inspection photos or PDF reports to keep the conversation in one place.",
  "Share preferred pickup windows and transport requirements early.",
  "Mark conversations as archived once the machine has shipped to keep your inbox tidy.",
];

export function MessagesPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [recipientId, setRecipientId] = useState<number | "">("");
  const [body, setBody] = useState("");
  const [auctionId, setAuctionId] = useState<number | "">("");
  const [activeConversation, setActiveConversation] = useState<number | "all">("all");

  const { data } = useQuery({
    queryKey: ["messages"],
    queryFn: () => fetchMessages(token!),
    enabled: Boolean(token)
  });

  const conversations = useMemo(() => {
    if (!data || !user) return [];
    const map = new Map<number, { counterpart: Message["sender"]; lastMessage: Message }>();
    data.forEach((message) => {
      const counterpart = message.sender.id === user.id ? message.recipient : message.sender;
      const existing = map.get(counterpart.id);
      if (!existing || dayjs(message.created_at).isAfter(existing.lastMessage.created_at)) {
        map.set(counterpart.id, { counterpart, lastMessage: message });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      dayjs(b.lastMessage.created_at).diff(dayjs(a.lastMessage.created_at))
    );
  }, [data, user]);

  const filteredMessages = useMemo(() => {
    if (!data) return [];
    if (activeConversation === "all") return data;
    return data.filter(
      (message) => message.sender.id === activeConversation || message.recipient.id === activeConversation
    );
  }, [activeConversation, data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_id: Number(recipientId),
          body,
          auction_id: auctionId === "" ? null : Number(auctionId)
        })
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({ detail: "Unable to send message" }));
        throw new Error(message.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    }
  });

  return (
    <section className="messages-layout">
      <aside className="conversation-list">
        <h2>Inbox</h2>
        <button
          className={activeConversation === "all" ? "conversation active" : "conversation"}
          onClick={() => setActiveConversation("all")}
        >
          All conversations
        </button>
        {conversations.map(({ counterpart, lastMessage }) => (
          <button
            key={counterpart.id}
            className={activeConversation === counterpart.id ? "conversation active" : "conversation"}
            onClick={() => {
              setActiveConversation(counterpart.id);
              setRecipientId(counterpart.id);
            }}
          >
            <span className="name">{counterpart.display_name}</span>
            <span className="preview">
              {dayjs(lastMessage.created_at).fromNow()} · {lastMessage.body.slice(0, 40)}
            </span>
          </button>
        ))}
      </aside>

      <div className="messages-content">
        <header className="messages-header">
          <div>
            <h1>Messages</h1>
            <p className="muted">Share inspection reports, coordinate pickup times, and negotiate privately.</p>
          </div>
          <div className="muted">Your ID: {user?.id}</div>
        </header>

        <div className="form-card">
          <h2>Send a message</h2>
          <div className="form-grid">
            <label>
              Recipient ID
              <input
                type="number"
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>
            <label>
              Auction ID (optional)
              <input
                type="number"
                value={auctionId}
                onChange={(event) => setAuctionId(event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>
          </div>
          <label>
            Message
            <textarea rows={4} value={body} onChange={(event) => setBody(event.target.value)} />
          </label>
          <button onClick={() => mutation.mutate()} disabled={mutation.isLoading || !recipientId || body.trim() === ""}>
            {mutation.isLoading ? "Sending…" : "Send"}
          </button>
          {mutation.error && <p className="error-text">{(mutation.error as Error).message}</p>}
        </div>

        <section className="message-thread">
          {filteredMessages.map((message) => (
            <article key={message.id} className="message">
              <header>
                <div>
                  <strong>{message.sender.display_name}</strong>
                  <span className="muted">
                    {message.sender.id === user?.id ? " → " : " ↔ "}
                    {message.recipient.display_name}
                  </span>
                </div>
                <time>{dayjs(message.created_at).format("MMM D, YYYY h:mm A")}</time>
              </header>
              {message.auction_id && <small className="muted">Auction #{message.auction_id}</small>}
              <p>{message.body}</p>
            </article>
          ))}
          {filteredMessages.length === 0 && <p className="muted">No messages yet.</p>}
        </section>

        <aside className="help-card">
          <h2>Messaging best practices</h2>
          <ul className="checklist">
            {messagingTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="muted">
            Reminder: Payments should be finalised outside of chat using your dealership's invoicing tools. Keep all pickup and
            delivery confirmations in the thread for your records.
          </p>
        </aside>
      </div>
    </section>
  );
}
