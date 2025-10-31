import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type FinancingApplicationFormProps = {
  auctionId?: number | null;
  headline?: string;
  description?: string;
  successMessage?: string;
  submitLabel?: string;
  className?: string;
};

type FinancingFormState = {
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  amount: string;
  timeline: string;
  notes: string;
};

export function FinancingApplicationForm({
  auctionId = null,
  headline = "Apply for financing",
  description = "Request funding through our nationwide heavy equipment lending partners.",
  successMessage = "Application received. A lender will contact you soon.",
  submitLabel = "Submit application",
  className = "",
}: FinancingApplicationFormProps) {
  const { token, user } = useAuth();
  const [form, setForm] = useState<FinancingFormState>({
    business_name: user?.display_name ? `${user.display_name} LLC` : "",
    contact_name: user?.display_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    amount: "",
    timeline: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      business_name: prev.business_name || (user.display_name ? `${user.display_name} LLC` : ""),
      contact_name: prev.contact_name || user.display_name,
      email: prev.email || user.email,
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/services/financing/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          business_name: form.business_name.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          amount: Number(form.amount.trim() || 0),
          timeline: form.timeline.trim() || null,
          notes: form.notes.trim() || null,
          auction_id: auctionId,
        }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({ detail: "Unable to submit application" }));
        throw new Error(message.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setForm((prev) => ({
        ...prev,
        amount: "",
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
          Business name
          <input
            value={form.business_name}
            onChange={(event) =>
              setForm({ ...form, business_name: event.target.value })
            }
            required
          />
        </label>
        <label>
          Contact name
          <input
            value={form.contact_name}
            onChange={(event) =>
              setForm({ ...form, contact_name: event.target.value })
            }
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
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            required
          />
        </label>
        <label>
          Amount requested
          <input
            type="number"
            min="0"
            step="1000"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            required
          />
        </label>
        <label>
          Timeline
          <input
            value={form.timeline}
            onChange={(event) => setForm({ ...form, timeline: event.target.value })}
            placeholder="e.g. Need funding within 7 days"
          />
        </label>
        <label>
          Notes for the lender
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Share equipment details, down payment, collateral, etc."
          />
        </label>
        <button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Submitting…" : submitLabel}
        </button>
        {mutation.error && (
          <p className="error-text">{(mutation.error as Error).message}</p>
        )}
        {mutation.isSuccess && <p className="success-text">{successMessage}</p>}
      </form>
    </div>
  );
}
