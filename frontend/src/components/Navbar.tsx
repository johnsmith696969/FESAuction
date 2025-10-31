import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar-default">
      <div className="navbar-container">
        <div className="brand">
          <Link to="/">FES Auction</Link>
          <span className="brand-tagline">Dealer-grade classified auctions</span>
        </div>
        <ul className="tablet-menu-ul nav navbar-nav nav-justified">
          <li>
            <Link to="/">Auctions</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/services">Services</Link>
          </li>
          <li>
            <Link to="/financing">Financing</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link to="/messages">Messages</Link>
            </li>
          )}
          {user?.is_admin && (
            <li>
              <Link to="/admin">Admin tools</Link>
            </li>
          )}
          <li className="mobile-only">
            <Link to="/profile">My profile</Link>
          </li>
        </ul>
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="profile-chip">
              <button type="button" onClick={() => navigate("/profile")}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} />
                ) : (
                  <span className="avatar-fallback">
                    {user?.display_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span>{user?.display_name}</span>
              </button>
              <button type="button" className="ghost-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link className="ghost-btn" to="/auth">
                Sign in
              </Link>
              <Link className="primary-btn" to="/auth">
                Join now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
