import React, { useState } from "react";
import { apiRequest } from "../api.js";

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
    <div style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h3>Create account</h3>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          style={{ display: "block", marginBottom: 8, width: "100%" }}
        />
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
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          style={{ display: "block", marginBottom: 8, width: "100%" }}
        >
          <option value="driver">Driver</option>
          <option value="rider">Rider</option>
        </select>
        {error && (
          <p style={{ color: "red", marginBottom: 8 }}>{error}</p>
        )}
        <button type="submit">Register</button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account?{" "}
        <button onClick={switchToLogin}>Login</button>
      </p>
    </div>
  );
}
