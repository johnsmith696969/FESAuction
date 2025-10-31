import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const topics = [
  "Auction support",
  "Consign equipment",
  "Transport & logistics",
  "Financing",
  "Account & billing",
];

export function ContactPage() {
  const { user } = useAuth();
  const fullName = (user?.display_name ?? "").trim();
  const [initialFirst, ...initialRest] = fullName ? fullName.split(" ") : [""];
  const initialLast = initialRest.join(" ");
  const [form, setForm] = useState({
    first_name: initialFirst ?? "",
    last_name: initialLast ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    company: "",
    topic: topics[0],
    message: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          message: form.message.trim(),
          phone: form.phone.trim() || null,
          company: form.company.trim() || null,
        }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({ detail: "Unable to send message" }));
        throw new Error(detail.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setForm((prev) => ({ ...prev, message: "" }));
    },
  });

  return (
    <div className="page-shell contact-page">
      <section className="page-hero">
        <div>
          <h1>Contact Forestry Equipment Sales</h1>
          <p className="subtitle">
            Whether you need help listing a lot, securing transport, or finalizing paperwork, the FES support desk is ready.
          </p>
        </div>
      </section>

      <section className="contact-layout">
        <aside className="contact-info">
          <h2>Talk with a specialist</h2>
          <p className="muted">
            Our auction coordinators answer calls 7 days a week and monitor every active listing for quick resolution.
          </p>
          <div className="info-card">
            <h3>Phone</h3>
            <a href="tel:18003377253">1-800-337-7253</a>
            <p className="muted">7:00 AM – 7:00 PM CST</p>
          </div>
          <div className="info-card">
            <h3>Email</h3>
            <a href="mailto:support@fesauction.com">support@fesauction.com</a>
            <p className="muted">We reply within one business day.</p>
          </div>
          <div className="info-card">
            <h3>Office</h3>
            <p>450 Timber Exchange Dr.<br />Duluth, MN 55802</p>
          </div>
        </aside>

        <div className="form-card">
          <h2>Send us a note</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="two-column">
              <label>
                First name
                <input
                  value={form.first_name}
                  onChange={(event) => setForm({ ...form, first_name: event.target.value })}
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={form.last_name}
                  onChange={(event) => setForm({ ...form, last_name: event.target.value })}
                  required
                />
              </label>
            </div>
            <div className="two-column">
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
                  placeholder="Include country code if outside U.S."
                />
              </label>
            </div>
            <label>
              Company (optional)
              <input
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                placeholder="Dealership or business name"
              />
            </label>
            <label>
              Topic
              <select
                value={form.topic}
                onChange={(event) => setForm({ ...form, topic: event.target.value })}
              >
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>
            <label>
              How can we help?
              <textarea
                rows={5}
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                placeholder="Tell us about the equipment or support you’re looking for."
                required
              />
            </label>
            <button type="submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? "Sending…" : "Submit"}
            </button>
            {mutation.error && (
              <p className="error-text">{(mutation.error as Error).message}</p>
            )}
            {mutation.isSuccess && <p className="success-text">Thanks! A specialist will reach out shortly.</p>}
          </form>
        </div>
      </section>
    </div>
  );
}
