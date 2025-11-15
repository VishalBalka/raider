import React from "react";

export default function TripList({ trips, title }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h4>{title}</h4>
      {trips.length === 0 && <p>No trips yet.</p>}
      {trips.map((t) => (
        <div
          key={t.id}
          style={{
            border: "1px solid #ccc",
            padding: 8,
            marginBottom: 6,
            borderRadius: 4,
          }}
        >
          <div>
            {t.origin} → {t.destination}
          </div>
          <div>Time: {t.time}</div>
          <div>Price: {t.price}</div>
          <div>Status: {t.status}</div>
          {t.driver_amount != null && (
            <div>
              Driver: {t.driver_amount} | Platform: {t.platform_amount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
