import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type FormState = {
  email: string;
  password: string;
  display_name: string;
  bio: string;
  location: string;
  phone: string;
  subscribe: boolean;
};

const onboardingHighlights = [
  {
    title: "Dealer verification",
    description: "Upload credentials once and reuse them for every auction listing you create.",
  },
  {
    title: "Photo gallery hosting",
    description: "Store high-resolution walkaround shots and documents directly with each listing.",
  },
  {
    title: "Secure messaging",
    description: "Keep negotiations, inspections, and pickup logistics in an auditable chat thread.",
  },
];

export function AuthPage() {
  const navigate = useNavigate();
  const { login, refreshProfile } = useAuth();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    display_name: "",
    bio: "",
    location: "",
    phone: "",
    subscribe: true,
  });
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      if (mode === "register") {
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            display_name: form.display_name || form.email,
            bio: form.bio || undefined,
            location: form.location || undefined,
            phone: form.phone || undefined,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({ detail: "Registration failed" }));
          throw new Error(data.detail);
        }

        if (form.subscribe) {
          await fetch(`${API_BASE}/subscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email }),
          }).catch(() => undefined);
        }
      }

      const loginData = new URLSearchParams();
      loginData.append("username", form.email);
      loginData.append("password", form.password);

      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: loginData.toString(),
      });
      if (!loginResponse.ok) {
        throw new Error("Login failed");
      }
      const token = await loginResponse.json();
      login(token.access_token);
      await refreshProfile();
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section>
      <div className="form-card">
        <h1>{mode === "login" ? "Sign in" : "Create your account"}</h1>
        <form onSubmit={handleSubmit} className="stacked-form">
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          {mode === "register" && (
            <label>
              Display name
              <input
                value={form.display_name}
                onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                required
              />
            </label>
          )}
          {mode === "register" && (
            <label>
              Location (city, state)
              <input
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="e.g. Nashville, TN"
              />
            </label>
          )}
          {mode === "register" && (
            <label>
              Phone number
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="Optional contact number"
              />
            </label>
          )}
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          {mode === "register" && (
            <label>
              Short bio
              <textarea
                rows={3}
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                placeholder="Tell bidders what you specialize in."
              />
            </label>
          )}
          {error && <p style={{ color: "tomato" }}>{error}</p>}
          {mode === "register" && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.subscribe}
                onChange={(event) => setForm({ ...form, subscribe: event.target.checked })}
              />
              <span>Send me feature drops and fresh auction alerts.</span>
            </label>
          )}
          <button type="submit" className="primary-btn">
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button className="ghost-btn" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
        </button>
      </div>

      <section className="info-grid">
        {onboardingHighlights.map((highlight) => (
          <article key={highlight.title} className="info-card">
            <h2>{highlight.title}</h2>
            <p>{highlight.description}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
