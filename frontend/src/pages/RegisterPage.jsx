import React, { useState } from "react";
import { apiRequest } from "../api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function RegisterPage({ onSuccess, switchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "rider",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiRequest("/auth/register", "POST", form);
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Share rides only when going same way"
      switchText="Already registered?"
      switchAction={switchToLogin}
      switchLabel="Login"
    >
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">

        <div className="input-box">
          <input
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <span className="input-icon">👤</span>
        </div>

        <div className="input-box">
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <span className="input-icon">📧</span>
        </div>

        <div className="input-box">
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <span className="input-icon">🔐</span>
        </div>

        <div className="role-toggle">
          <button
            type="button"
            className={form.role === "driver" ? "active" : ""}
            onClick={() => setForm({ ...form, role: "driver" })}
          >
            🚘 Driver
          </button>
          <button
            type="button"
            className={form.role === "rider" ? "active" : ""}
            onClick={() => setForm({ ...form, role: "rider" })}
          >
            🧑‍💼 Rider
          </button>
        </div>

        <button className="submit-btn" type="submit">
          Register
        </button>
      </form>
    </AuthLayout>
  );
}
