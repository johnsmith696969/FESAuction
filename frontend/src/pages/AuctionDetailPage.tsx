import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { FinancingApplicationForm } from "../components/forms/FinancingApplicationForm";
import { TransportQuoteForm } from "../components/forms/TransportQuoteForm";
import { useAuth } from "../context/AuthContext";
import { Auction, Bid } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

dayjs.extend(relativeTime);

const logisticsHighlights = [
  {
    title: "Inspection ready",
    copy: "Coordinate on-site walkarounds or remote video inspections directly with the seller.",
  },
  {
    title: "Flexible financing",
    copy: "Preferred lenders can pre-approve bidders in 24 hours for most heavy equipment classes.",
  },
  {
    title: "Transport assistance",
    copy: "Book a hauler through our logistics marketplace or use your own carrier—your choice.",
  },
];

const faqEntries = [
  {
    question: "What happens when the timer extends?",
    answer:
      "If a bid arrives inside the sniping window, the timer instantly extends to keep competition fair for all bidders.",
  },
  {
    question: "Can I view service history?",
    answer:
      "Sellers can upload PDFs or photos of maintenance logs. Ask in chat if you need additional documentation.",
  },
  {
    question: "How do I schedule pickup?",
    answer:
      "Use the secure messaging thread to coordinate payment, inspection, and pickup dates once the hammer falls.",
  },
];

async function fetchAuction(id: string, token: string | null): Promise<Auction> {
  const response = await fetch(`${API_BASE}/auctions/${id}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  });
  if (!response.ok) {
    throw new Error("Failed to load auction");
  }
  return response.json();
}

async function placeBidRequest(
  auctionId: number,
  amount: number,
  token: string
): Promise<Auction> {
  const response = await fetch(`${API_BASE}/auctions/${auctionId}/bids?amount=${amount}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    const message = await response.json().catch(() => ({ detail: "Bid failed" }));
    throw new Error(message.detail ?? "Bid failed");
  }
  return response.json();
}

export function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated, user } = useAuth();
  const [bidAmount, setBidAmount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryKey: ["auction", id],
    queryFn: () => fetchAuction(id!, token ?? null),
    enabled: Boolean(id)
  });

  const mutation = useMutation({
    mutationFn: (amount: number) => placeBidRequest(Number(id), amount, token!),
    onSuccess: (updatedAuction) => {
      queryClient.setQueryData(["auction", id], updatedAuction);
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      setBidAmount(updatedAuction.current_price + 1);
    }
  });

  const messageMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient_id: data?.owner.id,
          auction_id: data?.id,
          body: messageBody,
        }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({ detail: "Unable to send message" }));
        throw new Error(message.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setMessageBody("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const highestBid: Bid | null = useMemo(() => {
    if (!data) return null;
    if (data.bids.length === 0) return null;
    return [...data.bids].sort((a, b) => b.amount - a.amount)[0];
  }, [data]);

  if (isLoading) {
    return <p>Loading auction…</p>;
  }

  if (error || !data) {
    return <p>Unable to load auction.</p>;
  }

  const startingAmount = highestBid ? highestBid.amount + 1 : data.starting_price + 1;
  const heroImage = selectedImage ?? data.image_url ?? data.gallery[0]?.url ?? null;

  return (
    <section className="detail-layout">
      <div className="detail-left">
        <div className="media-gallery">
          {heroImage ? (
            <img className="hero" src={heroImage} alt={data.title} />
          ) : (
            <div className="hero placeholder">Photos coming soon</div>
          )}
          <div className="thumb-row">
            {[data.image_url, ...data.gallery.map((image) => image.url)]
              .filter((url, index, arr) => url && arr.indexOf(url) === index)
              .slice(0, 6)
              .map((url) => (
                <button
                  key={url!}
                  className={url === heroImage ? "thumb active" : "thumb"}
                  type="button"
                  onClick={() => setSelectedImage(url!)}
                >
                  <img src={url!} alt={`${data.title} thumbnail`} />
                </button>
              ))}
          </div>
        </div>

        <article className="listing-body">
          <header>
            <span className={`status-pill status-${data.status}`}>{data.status}</span>
            <h1>{data.title}</h1>
            <p className="muted">
              {data.location ? `Located in ${data.location}` : "Location shared after contact"}
            </p>
            {data.categories.length > 0 && (
              <ul className="category-chip-row detail">
                {data.categories.map((category) => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            )}
          </header>
          <section className="listing-summary">
            <div>
              <span className="summary-label">Current bid</span>
              <span className="summary-value">${data.current_price.toLocaleString()}</span>
            </div>
            <div>
              <span className="summary-label">Opens</span>
              <span>{dayjs(data.start_time).format("MMM D, YYYY h:mm A")}</span>
            </div>
            <div>
              <span className="summary-label">Closes</span>
              <span>{dayjs(data.end_time).format("MMM D, YYYY h:mm A")}</span>
            </div>
            <div>
              <span className="summary-label">Bids</span>
              <span>{data.bids.length}</span>
            </div>
          </section>
          <p className="description">{data.description}</p>
          <div className="anti-sniping-callout">
            Anti-sniping extends the close by {data.sniping_extension_minutes} minutes when a bid
            arrives within the last {data.sniping_window_minutes} minutes.
          </div>
        </article>

        <section className="bid-history">
          <h2>Bid history</h2>
          {data.bids.length === 0 ? (
            <p className="muted">No bids yet. Be the first to raise your paddle.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Amount</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {data.bids.map((bid) => (
                  <tr key={bid.id}>
                    <td>{bid.bidder.display_name}</td>
                    <td>${bid.amount.toFixed(2)}</td>
                    <td>{dayjs(bid.created_at).format("MMM D, YYYY h:mm A")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <aside className="detail-sidebar">
        <section className="seller-card">
          <h2>Seller</h2>
          <div className="seller-row">
            <div className="seller-avatar">
              {data.owner.avatar_url ? (
                <img src={data.owner.avatar_url} alt={data.owner.display_name} />
              ) : (
                <span>{data.owner.display_name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="seller-name">{data.owner.display_name}</p>
              <p className="muted">Joined {dayjs(data.owner.created_at).format("MMM YYYY")}</p>
              <p className="muted">{data.owner.location ?? "Location on request"}</p>
            </div>
          </div>
        </section>

        {isAuthenticated ? (
          <div className="form-card sticky">
            <h2>Place a bid</h2>
            <label>
              Amount
              <input
                type="number"
                min={startingAmount}
                value={bidAmount || startingAmount}
                onChange={(event) => setBidAmount(Number(event.target.value))}
              />
            </label>
            <button onClick={() => mutation.mutate(bidAmount || startingAmount)} disabled={mutation.isLoading}>
              {mutation.isLoading ? "Submitting…" : "Submit bid"}
            </button>
            {mutation.error && <p className="error-text">{(mutation.error as Error).message}</p>}
          </div>
        ) : (
          <div className="signin-card">
            <p>Sign in to place bids and message the seller.</p>
          </div>
        )}

        {isAuthenticated && user && data.owner.id !== user.id && (
          <div className="form-card">
            <h2>Message seller</h2>
            <textarea
              rows={4}
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder="Ask about inspections, transport, or service history."
            />
            <button
              onClick={() => messageMutation.mutate()}
              disabled={messageMutation.isLoading || messageBody.trim().length === 0}
            >
              {messageMutation.isLoading ? "Sending…" : "Send message"}
            </button>
            {messageMutation.error && (
              <p className="error-text">{(messageMutation.error as Error).message}</p>
            )}
            {messageMutation.isSuccess && <p className="success-text">Message delivered</p>}
          </div>
        )}

        <TransportQuoteForm
          auctionId={data.id}
          defaultOrigin={data.location ?? ""}
          headline="Arrange transport"
          description="Certified carriers quote door-to-door delivery within hours."
          successMessage="We’ll email you transport options shortly."
        />

        <FinancingApplicationForm
          auctionId={data.id}
          headline="Apply for financing"
          description="Request funding through our nationwide heavy equipment lending partners."
          successMessage="Application received. A lender will contact you soon."
        />

        <div className="meta-card">
          <h3>Quick facts</h3>
          <ul>
            <li>Anti-sniping enabled</li>
            <li>Secure messaging with audit trail</li>
            <li>All bidders verified at registration</li>
          </ul>
          <p className="muted">Last updated {dayjs(data.updated_at).fromNow()}</p>
        </div>

        <section className="detail-panels">
          <h2>Logistics & support</h2>
          <div className="detail-panel-grid">
            {logisticsHighlights.map((highlight) => (
              <article key={highlight.title} className="detail-panel">
                <h3>{highlight.title}</h3>
                <p>{highlight.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="detail-panels">
          <h2>Buyer FAQ</h2>
          <ul className="faq-list">
            {faqEntries.map((item) => (
              <li key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </section>
  );
}
