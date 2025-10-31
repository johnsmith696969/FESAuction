import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AuctionCard } from "../components/AuctionCard";
import { useAuth } from "../context/AuthContext";
import { Auction, Category, SupportProgram } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchAuctions(token: string | null): Promise<Auction[]> {
  const response = await fetch(`${API_BASE}/auctions`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  });
  if (!response.ok) {
    throw new Error("Failed to load auctions");
  }
  return response.json();
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/catalog/categories`);
  if (!response.ok) {
    throw new Error("Failed to load categories");
  }
  return response.json();
}

async function fetchSupportPrograms(): Promise<SupportProgram[]> {
  const response = await fetch(`${API_BASE}/catalog/support-programs`);
  if (!response.ok) {
    throw new Error("Failed to load support programs");
  }
  return response.json();
}

const valueProps = [
  {
    title: "Verified sellers",
    description:
      "Every dealership profile is reviewed by the FES onboarding team before they can publish their first lot.",
  },
  {
    title: "Trusted logistics",
    description:
      "Preferred transport partners and white-glove export support ensure machines arrive ready to work.",
  },
  {
    title: "Transparent records",
    description:
      "Upload inspection reports, service logs, and high-resolution galleries so bidders can evaluate remotely.",
  },
];

const buyingSteps = [
  {
    title: "Create your bidder profile",
    body: "Add a photo, phone number, and dealer credentials so sellers know who is raising the paddle.",
  },
  {
    title: "Follow the lots you love",
    body: "Save listings to receive SMS and email nudges before the anti-sniping window opens.",
  },
  {
    title: "Coordinate pickup or delivery",
    body: "Message the seller directly to arrange inspections, deposits, and transport.",
  },
];

export function AuctionsPage() {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data, error, isLoading } = useQuery({
    queryKey: ["auctions"],
    queryFn: () => fetchAuctions(token ?? null)
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: programs } = useQuery({
    queryKey: ["support-programs"],
    queryFn: fetchSupportPrograms,
  });

  const filteredAuctions = useMemo(() => {
    if (!data) return [];
    return data.filter((auction) => {
      const matchesStatus = statusFilter === "all" || auction.status === statusFilter;
      const matchesSearch = [auction.title, auction.location ?? "", auction.description]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || auction.categories.some((category) => category.slug === selectedCategory);
      return matchesStatus && matchesSearch && matchesCategory;
    });
  }, [data, searchTerm, statusFilter, selectedCategory]);

  const signupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({ detail: "Unable to subscribe" }));
        throw new Error(message.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setEmail("");
    },
  });

  if (isLoading) {
    return <p>Loading auctions…</p>;
  }

  if (error) {
    return <p>Unable to load auctions.</p>;
  }

  return (
    <section>
      <header className="page-intro">
        <div>
          <h1>Live & Upcoming Auctions</h1>
          <p className="subtitle">
            Browse dealer-managed listings with verified seller profiles, anti-sniping protections,
            and rich photo galleries.
          </p>
        </div>
        <aside className="auction-stats">
          <div>
            <span className="stat-value">{data?.filter((a) => a.status === "active").length ?? 0}</span>
            <span className="stat-label">Active</span>
          </div>
          <div>
            <span className="stat-value">{data?.filter((a) => a.status === "upcoming").length ?? 0}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div>
            <span className="stat-value">{data?.filter((a) => a.status === "completed").length ?? 0}</span>
            <span className="stat-label">Recently closed</span>
          </div>
        </aside>
      </header>

      <div className="filters-bar">
        <div className="search-box">
          <input
            type="search"
            placeholder="Search make, model, seller or location…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="status-tabs">
          {(["all", "active", "upcoming", "completed"] as const).map((status) => (
            <button
              key={status}
              className={statusFilter === status ? "tab active" : "tab"}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <section className="category-showcase" id="categories">
        <header>
          <h2>Browse by category</h2>
          <p className="muted">
            Tailored channels for construction, agriculture, trucking, and material handling gear.
          </p>
        </header>
        <div className="category-pill-row" role="tablist" aria-label="Equipment categories">
          <button
            type="button"
            className={selectedCategory === null ? "category-pill active" : "category-pill"}
            onClick={() => setSelectedCategory(null)}
          >
            All inventory
          </button>
          {categories?.map((category) => (
            <button
              key={category.slug}
              type="button"
              className={selectedCategory === category.slug ? "category-pill active" : "category-pill"}
              onClick={() => setSelectedCategory(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
        {selectedCategory && (
          <div className="category-description">
            {categories?.find((category) => category.slug === selectedCategory)?.description}
          </div>
        )}
      </section>

      <div className="card-grid">
        {filteredAuctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
        {filteredAuctions.length === 0 && (
          <p className="muted">No auctions match your filters yet. Try another search term.</p>
        )}
      </div>

      <section className="newsletter-card" id="stay-informed">
        <h2>Get the next drop in your inbox</h2>
        <p>
          Join the weekly digest for curated heavy equipment, farm machinery, and dealer-only lots
          before they go live.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            signupMutation.mutate();
          }}
          className="newsletter-form"
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
          <button type="submit" disabled={signupMutation.isLoading}>
            {signupMutation.isLoading ? "Joining…" : "Notify me"}
          </button>
        </form>
        {signupMutation.error && (
          <p className="error-text">{(signupMutation.error as Error).message}</p>
        )}
        {signupMutation.isSuccess && <p className="success-text">You're on the list!</p>}
      </section>

      <section className="info-grid">
        {valueProps.map((item) => (
          <article key={item.title} className="info-card">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="timeline-card" id="how-it-works">
        <h2>How buying works on FES</h2>
        <ol>
          {buyingSteps.map((step, index) => (
            <li key={step.title}>
              <div className="step-number">{index + 1}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {programs && (
        <section className="support-programs" id="support-services">
          <h2>Finance, transport & inspections handled</h2>
          <p className="muted">
            Trusted partners ready to quote shipping, secure lending, and verify equipment in the field.
          </p>
          <div className="support-grid">
            {programs.map((program) => (
              <article key={program.slug} className={`support-card support-${program.category}`}>
                <span className="support-category">{program.category}</span>
                <h3>{program.name}</h3>
                <p>{program.summary}</p>
                <dl>
                  <div>
                    <dt>Turnaround</dt>
                    <dd>{program.turnaround}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{program.contact_email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{program.contact_phone}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
