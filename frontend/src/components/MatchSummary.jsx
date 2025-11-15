import React from "react";

export default function MatchSummary({ matchInfo }) {
  if (!matchInfo) return null;
  return (
    <div
      style={{
        marginTop: 16,
        padding: 8,
        border: "1px solid green",
        borderRadius: 4,
      }}
    >
      <strong>Ride booked!</strong>
      <div>Fare: {matchInfo.fare}</div>
      <div>Driver gets 60%: {matchInfo.driver_amount}</div>
      <div>Platform gets 40%: {matchInfo.platform_amount}</div>
    </div>
  );
}
