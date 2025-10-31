import { Link } from "react-router-dom";

const marketplaceLinks = [
  { label: "Live auctions", to: "/" },
  { label: "Equipment categories", to: "/#categories" },
  { label: "Transport services", to: "/services" },
  { label: "Financing", to: "/financing" },
];

const companyLinks = [
  { label: "About FES", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Become a seller", to: "/auth" },
  { label: "Privacy & terms", to: "/about#policies" },
];

const supportLinks = [
  { label: "How it works", to: "/#how-it-works" },
  { label: "Messaging", to: "/messages" },
  { label: "Profile", to: "/profile" },
  { label: "Email updates", to: "/#stay-informed" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-column footer-brand">
          <Link to="/" className="footer-logo">
            FES Auction
          </Link>
          <p>
            Forestry Equipment Sales brings the energy of a live sale to your screen—timed auctions,
            dealer-backed listings, and white-glove logistics for every lot.
          </p>
          <p className="footer-contact">
            <span>Phone:</span> <a href="tel:18003377253">1-800-337-7253</a>
          </p>
          <p className="footer-contact">
            <span>Email:</span> <a href="mailto:support@fesauction.com">support@fesauction.com</a>
          </p>
        </div>
        <div className="footer-column">
          <h4>Marketplace</h4>
          <ul>
            {marketplaceLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-column">
          <h4>Company</h4>
          <ul>
            {companyLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-column">
          <h4>Support</h4>
          <ul>
            {supportLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className="footer-badges">
            <span className="badge">24/7 monitoring</span>
            <span className="badge">Secure payments</span>
            <span className="badge">Dealer verified</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {year} Forestry Equipment Sales Auction Platform. All rights reserved.</p>
        <div className="footer-social">
          <a href="https://www.facebook.com" target="_blank" rel="noreferrer">
            <i className="fa fa-facebook" aria-hidden="true" />
            <span className="sr-only">Facebook</span>
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
            <i className="fa fa-instagram" aria-hidden="true" />
            <span className="sr-only">Instagram</span>
          </a>
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
            <i className="fa fa-linkedin" aria-hidden="true" />
            <span className="sr-only">LinkedIn</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
