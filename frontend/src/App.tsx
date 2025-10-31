import { Route, Routes } from "react-router-dom";

import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { useAuth } from "./context/AuthContext";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuctionDetailPage } from "./pages/AuctionDetailPage";
import { AuctionsPage } from "./pages/AuctionsPage";
import { AuthPage } from "./pages/AuthPage";
import { ContactPage } from "./pages/ContactPage";
import { FinancingPage } from "./pages/FinancingPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ServicesPage } from "./pages/ServicesPage";
import { AboutPage } from "./pages/AboutPage";

export default function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<AuctionsPage />} />
          <Route path="/auctions/:id" element={<AuctionDetailPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/financing" element={<FinancingPage />} />
          <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <AuthPage />} />
          <Route
            path="/admin"
            element={isAuthenticated && user?.is_admin ? <AdminDashboard /> : <AuthPage />}
          />
          <Route
            path="/messages"
            element={isAuthenticated ? <MessagesPage /> : <AuthPage />}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
