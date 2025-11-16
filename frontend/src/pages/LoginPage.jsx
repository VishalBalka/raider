import React, { useState } from "react";
import { apiRequest } from "../api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function LoginPage({ onSuccess, switchToRegister }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiRequest("/auth/login", "POST", form);
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Match rides based on same destination"
      switchText="No account?"
      switchAction={switchToRegister}
      switchLabel="Register"
    >
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-box">
          <input
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <span className="input-icon">📧</span>
        </div>

        <div className="input-box">
          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span className="input-icon">🔐</span>
        </div>

        <button className="submit-btn" type="submit">
          Login
        </button>
      </form>
    </AuthLayout>
  );
}
