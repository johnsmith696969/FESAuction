import { Link } from "react-router-dom";

import { FinancingApplicationForm } from "../components/forms/FinancingApplicationForm";

const financingHighlights = [
  {
    title: "Fast approvals",
    body: "Decisions within 24 hours for most construction and forestry equipment up to $500K.",
  },
  {
    title: "Flexible structures",
    body: "Seasonal payment plans, TRAC leases, and working capital lines that match your cash flow.",
  },
  {
    title: "Trusted partners",
    body: "Lenders specializing in heavy equipment understand resale values, attachments, and fleet lifecycle costs.",
  },
];

export function FinancingPage() {
  return (
    <div className="page-shell financing-page">
      <section className="page-hero gradient">
        <div>
          <h1>Financing that keeps deals moving</h1>
          <p className="subtitle">
            Submit one application and connect with national and regional lenders who understand heavy equipment portfolios.
          </p>
          <div className="hero-actions">
            <Link className="ghost-btn" to="/services">
              See transport services
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>Why bidders choose FES financing</h2>
        </div>
        <div className="value-grid">
          {financingHighlights.map((highlight) => (
            <article key={highlight.title} className="value-card">
              <h3>{highlight.title}</h3>
              <p>{highlight.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <FinancingApplicationForm
          headline="Apply now"
          description="Share your dealership details and purchasing plans. Our lending desk introduces you to the best-fit partner."
          successMessage="Application received! A lending partner will reach out soon."
        />
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>What you’ll need</h2>
          <p className="muted">
            Prepare these documents before the lender call to accelerate funding.
          </p>
        </div>
        <ul className="checklist">
          <li>Last two years of business financial statements</li>
          <li>Equipment list with serial numbers and hours</li>
          <li>Copy of driver’s license for all guarantors</li>
          <li>Insurance agent contact for binder delivery</li>
        </ul>
      </section>
    </div>
  );
}
