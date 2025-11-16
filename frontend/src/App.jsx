import React, { useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DriverDashboard from "./pages/DriverDashboard.jsx";
import RiderDashboard from "./pages/RiderDashboard.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import { getToken, setToken } from "./api.js";
import "./styles.css";

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [view, setView] = useState(user ? "dashboard" : "landing");

  function handleAuthSuccess({ user, token }) {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setView("dashboard");
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("user");
    setToken(null);
    setView("landing");
  }

  if (!user) {
    if (view === "login") {
      return <LoginPage onSuccess={handleAuthSuccess} switchToRegister={() => setView("register")} />;
    }
    if (view === "register") {
      return <RegisterPage onSuccess={handleAuthSuccess} switchToLogin={() => setView("login")} />;
    }
    return <LandingPage onLogin={() => setView("login")} onRegister={() => setView("register")} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h2>Same Destination Rides</h2>
        <div>
          <span style={{ marginRight: "1rem" }}>{user.name} ({user.role})</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      {user.role === "driver" ? <DriverDashboard /> : <RiderDashboard />}
    </div>
  );
}
