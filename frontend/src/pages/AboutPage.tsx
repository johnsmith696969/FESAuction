import { Link } from "react-router-dom";

const milestones = [
  {
    year: "2012",
    title: "Classified roots",
    body: "Forestry Equipment Sales launches as a regional classifieds hub for loggers and contractors across the Upper Midwest.",
  },
  {
    year: "2016",
    title: "Nationwide network",
    body: "Verified dealerships join the marketplace, bringing truck fleets, attachments, and ag equipment into the mix.",
  },
  {
    year: "2020",
    title: "Live auction beta",
    body: "Timed bidding with anti-sniping protection debuts, mirroring the energy of on-site consignment sales.",
  },
  {
    year: "2024",
    title: "Full-service platform",
    body: "Financing, transport, inspections, and messaging integrate into a single dashboard for buyers and sellers.",
  },
];

const valueProps = [
  {
    title: "Built for heavy equipment",
    body: "Dedicated categories for forestry, construction, trucking, and agriculture mean serious buyers find the iron they need fast.",
  },
  {
    title: "People-first support",
    body: "Auction concierges keep every listing on track—from photo audits to post-sale logistics and release paperwork.",
  },
  {
    title: "Modern buyer experience",
    body: "Responsive layouts, gallery storytelling, and messaging that feels like your favorite marketplace—all tailored to work in the field.",
  },
];

export function AboutPage() {
  return (
    <div className="page-shell about-page">
      <section className="page-hero">
        <div>
          <h1>About Forestry Equipment Sales Auctions</h1>
          <p className="subtitle">
            We connect dealerships and contractors across North America with a modern auction experience that honors the
            tradition of heavy equipment trading.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/services">
              Explore logistics services
            </Link>
            <Link className="ghost-btn" to="/contact">
              Talk with our team
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>Our story</h2>
          <p className="muted">
            From timber country classifieds to a national auction venue, FES has spent more than a decade helping the industry
            buy and sell smarter.
          </p>
        </div>
        <div className="timeline-grid">
          {milestones.map((milestone) => (
            <article key={milestone.year} className="timeline-card">
              <span className="timeline-year">{milestone.year}</span>
              <h3>{milestone.title}</h3>
              <p>{milestone.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>What sets us apart</h2>
          <p className="muted">
            We blend industry expertise with the styling and usability your buyers expect from the Forestry Equipment Sales
            classifieds experience.
          </p>
        </div>
        <div className="value-grid">
          {valueProps.map((value) => (
            <article key={value.title} className="value-card">
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section" id="policies">
        <div className="section-header">
          <h2>Trust & policies</h2>
          <p className="muted">
            Every bidder is verified, every seller is vetted, and every listing follows the same transparent rule set.
          </p>
        </div>
        <div className="policy-grid">
          <article>
            <h3>Marketplace standards</h3>
            <ul>
              <li>Verified dealerships and owner-operators only</li>
              <li>Photo and description audits on each auction lot</li>
              <li>Anti-sniping extensions keep bidding fair for all</li>
            </ul>
          </article>
          <article>
            <h3>Data & privacy</h3>
            <ul>
              <li>Secure messaging with audit trails for compliance</li>
              <li>Encrypted authentication and token-based APIs</li>
              <li>Opt-in communications with quick unsubscribe controls</li>
            </ul>
          </article>
          <article>
            <h3>Support promise</h3>
            <ul>
              <li>Dedicated onboarding for every dealership team</li>
              <li>Logistics coordination from quote to release</li>
              <li>Buyer success desk available 7 days a week</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
