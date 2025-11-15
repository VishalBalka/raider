import React, { useState } from "react";
import { apiRequest } from "../api.js";

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
    <div style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h3>Login</h3>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          style={{ display: "block", marginBottom: 8, width: "100%" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          style={{ display: "block", marginBottom: 8, width: "100%" }}
        />
        {error && (
          <p style={{ color: "red", marginBottom: 8 }}>{error}</p>
        )}
        <button type="submit">Login</button>
      </form>
      <p style={{ marginTop: 12 }}>
        No account? <button onClick={switchToRegister}>Register</button>
      </p>
    </div>
  );
}
