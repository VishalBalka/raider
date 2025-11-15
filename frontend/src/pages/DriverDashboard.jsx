import React, { useEffect, useState } from "react";
import TripForm from "../components/TripForm.jsx";
import TripList from "../components/TripList.jsx";
import MatchSummary from "../components/MatchSummary.jsx";
import { apiRequest } from "../api.js";

export default function DriverDashboard() {
  const [myTrips, setMyTrips] = useState([]);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [matches, setMatches] = useState([]);
  const [matchInfo, setMatchInfo] = useState(null);
  const [error, setError] = useState("");

  async function loadMyTrips() {
    try {
      const data = await apiRequest("/trips/my");
      setMyTrips(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadMyTrips();
  }, []);

  async function searchMatches() {
    setError("");
    setMatchInfo(null);
    try {
      const data = await apiRequest(
        `/trips/matches?destination=${encodeURIComponent(destinationSearch)}`
      );
      setMatches(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function book(matchTripId) {
    setError("");
    setMatchInfo(null);
    if (myTrips.length === 0) {
      setError("Create a driver trip first.");
      return;
    }
    const myTripId = myTrips[0].id; // simplification
    try {
      const info = await apiRequest("/trips/book", "POST", {
        myTripId,
        matchTripId,
      });
      setMatchInfo(info);
      loadMyTrips();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <TripForm
        role="driver"
        onCreated={(t) => setMyTrips((prev) => [t, ...prev])}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <TripList trips={myTrips} title="My driver trips" />
      <div style={{ marginTop: 24 }}>
        <h4>Find riders with same destination</h4>
        <input
          placeholder="Destination"
          value={destinationSearch}
          onChange={(e) => setDestinationSearch(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={searchMatches}>Search</button>
        {matches.map((m) => (
          <div
            key={m.id}
            style={{
              border: "1px solid #aaa",
              marginTop: 8,
              padding: 8,
              borderRadius: 4,
            }}
          >
            <div>
              Rider: {m.user_name} | {m.origin} → {m.destination}
            </div>
            <div>Time: {m.time}</div>
            <div>Price: {m.price}</div>
            <button onClick={() => book(m.id)}>Book this rider</button>
          </div>
        ))}
      </div>
      <MatchSummary matchInfo={matchInfo} />
    </div>
  );
}
