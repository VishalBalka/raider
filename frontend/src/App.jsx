import React, { useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DriverDashboard from "./pages/DriverDashboard.jsx";
import RiderDashboard from "./pages/RiderDashboard.jsx";
import { getToken, setToken } from "./api.js";

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [view, setView] = useState(user ? "dashboard" : "login");

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
    setView("login");
  }

  if (!user) {
    if (view === "register") {
      return (
        <RegisterPage
          onSuccess={handleAuthSuccess}
          switchToLogin={() => setView("login")}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={handleAuthSuccess}
        switchToRegister={() => setView("register")}
      />
    );
  }

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <h2>Same Destination Rides</h2>
        <div>
          <span style={{ marginRight: "1rem" }}>
            {user.name} ({user.role})
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      {user.role === "driver" ? (
        <DriverDashboard />
      ) : (
        <RiderDashboard />
      )}
    </div>
  );
}
