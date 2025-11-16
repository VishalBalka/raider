import React from "react";
import "../landing.css"; // Correct path if file is in src folder

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div className="landing-container">
      <header className="top-nav">
        <h2 className="brand-name">Same Destination Rides</h2>
        <div>
          <button className="nav-btn" onClick={onLogin}>Login</button>
          <button className="nav-btn" onClick={onRegister}>Sign Up</button>
        </div>
      </header>

      <main className="landing-content">
        <h1 className="landing-title">
          Ride Smart. Save Smart. <span>Go Together</span> 🚗
        </h1>
        <p className="landing-subtitle">
          We match riders only when they share the same destination.
        </p>

        <div className="cta-buttons">
          <button className="primary-btn" onClick={onRegister}>
            Get Started
          </button>
          <button className="outline-btn" onClick={onLogin}>
            I already have an account
          </button>
        </div>
      </main>

      <footer className="footer">
        Built for the future of shared mobility ✨
      </footer>
    </div>
  );
}
