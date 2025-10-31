import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { TransportQuoteForm } from "../components/forms/TransportQuoteForm";
import { SupportProgram } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchSupportPrograms(): Promise<SupportProgram[]> {
  const response = await fetch(`${API_BASE}/catalog/support-programs`);
  if (!response.ok) {
    throw new Error("Failed to load support programs");
  }
  return response.json();
}

const logisticsHighlights = [
  {
    title: "Nationwide carriers",
    body: "Verified heavy-haul partners quote flatbeds, RGN, and beam trailers with bonded insurance certificates.",
  },
  {
    title: "Export ready",
    body: "Customs paperwork, port drayage, and containerization support keep international deals moving.",
  },
  {
    title: "Inspection network",
    body: "Third-party inspectors capture fluid samples, ECM data, and HD photo sets before you bid.",
  },
];

export function ServicesPage() {
  const { data: programs, error: programsError } = useQuery({
    queryKey: ["support-programs"],
    queryFn: fetchSupportPrograms,
  });

  const transportPartners = programs?.filter((program) => program.category === "transport") ?? [];
  const inspectionPartners = programs?.filter((program) => program.category === "inspection") ?? [];

  return (
    <div className="page-shell services-page">
      <section className="page-hero">
        <div>
          <h1>Logistics & buyer services</h1>
          <p className="subtitle">
            Request quotes from trusted transporters, coordinate inspections, and hand off financing—all inside the FES dashboard.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/financing">
              Apply for financing
            </Link>
            <Link className="ghost-btn" to="/contact">
              Talk with logistics
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>Why dealers rely on FES logistics</h2>
        </div>
        <div className="value-grid">
          {logisticsHighlights.map((item) => (
            <article key={item.title} className="value-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>Request a transport quote</h2>
          <p className="muted">
            Share pickup and delivery details and we’ll assemble carrier options that fit your equipment, timing, and budget.
          </p>
        </div>
        <TransportQuoteForm
          headline="Door-to-door heavy haul"
          description="Certified carriers respond within hours with insured quotes for your loader, skidder, grinder, or fleet assets."
          successMessage="Thanks! We’ll email transport options shortly."
        />
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>Featured transport partners</h2>
        </div>
        {programsError && (
          <p className="error-text">Unable to load partner directory right now.</p>
        )}
        <div className="partner-grid">
          {transportPartners.map((partner) => (
            <article key={partner.slug} className="partner-card">
              <h3>{partner.name}</h3>
              <p>{partner.summary}</p>
              <dl>
                <div>
                  <dt>Turnaround</dt>
                  <dd>{partner.turnaround}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${partner.contact_email}`}>{partner.contact_email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${partner.contact_phone}`}>{partner.contact_phone}</a>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
          {transportPartners.length === 0 && (
            <p className="muted">Transport partner directory coming soon.</p>
          )}
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>Inspection coverage</h2>
          <p className="muted">
            Book independent inspections before you bid. Specialists document undercarriage wear, hydraulic performance, and cab electronics.
          </p>
        </div>
        <div className="partner-grid">
          {inspectionPartners.map((partner) => (
            <article key={partner.slug} className="partner-card">
              <h3>{partner.name}</h3>
              <p>{partner.summary}</p>
              <p className="muted">Typical turnaround: {partner.turnaround}</p>
              <a className="ghost-btn" href={`mailto:${partner.contact_email}`}>
                Request inspection
              </a>
            </article>
          ))}
          {inspectionPartners.length === 0 && (
            <p className="muted">Inspection partner network currently onboarding new providers.</p>
          )}
        </div>
      </section>
    </div>
  );
}
