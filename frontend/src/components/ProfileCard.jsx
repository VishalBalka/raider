import React, { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

export default function ProfileCard() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    location_name: "",
    location_lat: "",
    location_lng: "",
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await apiRequest("/me");
      setProfile(data);
      setForm({
        name: data.name || "",
        mobile: data.mobile || "",
        location_name: data.location_name || "",
        location_lat: data.location_lat || "",
        location_lng: data.location_lng || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const payload = {
        ...form,
        location_lat: form.location_lat ? Number(form.location_lat) : null,
        location_lng: form.location_lng ? Number(form.location_lng) : null,
      };
      const res = await apiRequest("/me", "PUT", payload);
      setMsg("Profile updated");
      setEditing(false);
      await loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  function detectLocation() {
    setError("");
    setMsg("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((prev) => ({
          ...prev,
          location_lat: latitude,
          location_lng: longitude,
          location_name: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        }));
        setMsg("Location detected (approx)");
      },
      (err) => {
        setError("Unable to detect location");
      }
    );
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64data = reader.result;
        const res = await apiRequest("/me/avatar", "POST", {
          imageData: base64data,
        });
        setMsg("Profile picture updated");
        await loadProfile();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="card">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const avatarSrc = profile.avatar_path
    ? `http://localhost:4000${profile.avatar_path}`
    : "https://via.placeholder.com/80?text=User";

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <img
            src={avatarSrc}
            alt="avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #007bff",
            }}
          />
          <div style={{ marginTop: 6 }}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 4px 0" }}>{profile.name}</h3>
          <div style={{ fontSize: 14, color: "#666" }}>{profile.email}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {profile.location_name || "No location set"}
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Status:{" "}
            {profile.profile_completed
              ? "✅ Profile complete"
              : "⚠️ Please complete your profile"}
          </div>
        </div>

        <div>
          <button onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={saveProfile} style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              style={{ flex: 1 }}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              style={{ flex: 1 }}
              placeholder="Mobile Number"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              required
            />
          </div>
          <input
            style={{ width: "100%", marginBottom: 6 }}
            placeholder="Location"
            value={form.location_name}
            onChange={(e) =>
              setForm({ ...form, location_name: e.target.value })
            }
            required
          />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              style={{ flex: 1 }}
              placeholder="Latitude"
              value={form.location_lat}
              onChange={(e) =>
                setForm({ ...form, location_lat: e.target.value })
              }
            />
            <input
              style={{ flex: 1 }}
              placeholder="Longitude"
              value={form.location_lng}
              onChange={(e) =>
                setForm({ ...form, location_lng: e.target.value })
              }
            />
          </div>
          <button type="button" onClick={detectLocation}>
            Detect Location
          </button>{" "}
          <button type="submit">Save Profile</button>
        </form>
      )}

      {msg && <p style={{ color: "green", marginTop: 8 }}>{msg}</p>}
      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
