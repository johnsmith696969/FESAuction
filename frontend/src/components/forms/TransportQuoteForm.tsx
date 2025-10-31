import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type TransportQuoteFormProps = {
  auctionId?: number | null;
  defaultOrigin?: string | null;
  defaultDestination?: string | null;
  headline?: string;
  description?: string;
  successMessage?: string;
  submitLabel?: string;
  className?: string;
};

type TransportFormState = {
  name: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  equipment_type: string;
  weight: string;
  timeline: string;
  notes: string;
};

export function TransportQuoteForm({
  auctionId = null,
  defaultOrigin = null,
  defaultDestination = null,
  headline = "Arrange transport",
  description = "Certified carriers quote door-to-door delivery within hours.",
  successMessage = "We’ll email you transport options shortly.",
  submitLabel = "Request quote",
  className = "",
}: TransportQuoteFormProps) {
  const { token, user } = useAuth();
  const [form, setForm] = useState<TransportFormState>({
    name: user?.display_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    origin: defaultOrigin ?? "",
    destination: defaultDestination ?? "",
    equipment_type: "",
    weight: "",
    timeline: "",
    notes: "",
  });

  useEffect(() => {
    if (defaultOrigin) {
      setForm((prev) => ({
        ...prev,
        origin: prev.origin || defaultOrigin,
      }));
    }
  }, [defaultOrigin]);

  useEffect(() => {
    if (defaultDestination) {
      setForm((prev) => ({
        ...prev,
        destination: prev.destination || defaultDestination,
      }));
    }
  }, [defaultDestination]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.display_name,
      email: prev.email || user.email,
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/services/transport/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          origin: form.origin.trim(),
          destination: form.destination.trim(),
          equipment_type: form.equipment_type.trim() || null,
          weight: form.weight.trim() || null,
          timeline: form.timeline.trim() || null,
          notes: form.notes.trim() || null,
          auction_id: auctionId,
        }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({ detail: "Unable to request quote" }));
        throw new Error(message.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setForm((prev) => ({
        ...prev,
        destination: defaultDestination ?? "",
        equipment_type: "",
        weight: "",
        timeline: "",
        notes: "",
      }));
    },
  });

  return (
    <div className={`form-card ${className}`.trim()}>
      <h2>{headline}</h2>
      {description && <p className="muted">{description}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label>
          Your name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Phone (optional)
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder="Best number for carrier updates"
          />
        </label>
        <label>
          Pickup location
          <input
            value={form.origin}
            onChange={(event) => setForm({ ...form, origin: event.target.value })}
            required
          />
        </label>
        <label>
          Delivery location
          <input
            value={form.destination}
            onChange={(event) => setForm({ ...form, destination: event.target.value })}
            required
          />
        </label>
        <label>
          Equipment type
          <input
            value={form.equipment_type}
            onChange={(event) => setForm({ ...form, equipment_type: event.target.value })}
            placeholder="e.g. 45,000 lb excavator"
          />
        </label>
        <label>
          Estimated weight
          <input
            value={form.weight}
            onChange={(event) => setForm({ ...form, weight: event.target.value })}
            placeholder="Optional"
          />
        </label>
        <label>
          Timeline
          <input
            value={form.timeline}
            onChange={(event) => setForm({ ...form, timeline: event.target.value })}
            placeholder="When do you need it delivered?"
          />
        </label>
        <label>
          Notes for the carrier
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Ramps required, loading assistance, onsite contacts…"
          />
        </label>
        <button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Requesting…" : submitLabel}
        </button>
        {mutation.error && (
          <p className="error-text">{(mutation.error as Error).message}</p>
        )}
        {mutation.isSuccess && <p className="success-text">{successMessage}</p>}
      </form>
    </div>
  );
}
