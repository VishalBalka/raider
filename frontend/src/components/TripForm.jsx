import React, { useState } from "react";
import { apiRequest } from "../api.js";

export default function TripForm({ role, onCreated }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const trip = await apiRequest("/trips", "POST", {
        origin,
        destination,
        time,
        price: parseFloat(price),
      });
      onCreated(trip);
      setOrigin("");
      setDestination("");
      setTime("");
      setPrice("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginBottom: 16 }}>
      <h4>Create {role} trip</h4>
      <input
        placeholder="Origin"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        required
        style={{ display: "block", marginBottom: 6, width: "100%" }}
      />
      <input
        placeholder="Destination (must match exactly)"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        required
        style={{ display: "block", marginBottom: 6, width: "100%" }}
      />
      <input
        type="datetime-local"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        required
        style={{ display: "block", marginBottom: 6, width: "100%" }}
      />
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
        style={{ display: "block", marginBottom: 6, width: "100%" }}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Save trip</button>
    </form>
  );
}
