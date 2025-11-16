import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import { authMiddleware } from "./auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "5mb" })); // allow base64 images

// Serve uploaded images
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Helper: create JWT
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" } // JWT expiry (more secure than very long lifetime)
  );
}

// ---------- AUTH ROUTES ----------

// Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!["driver", "rider"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(
    "INSERT INTO users(name, email, password_hash, role) VALUES (?, ?, ?, ?)"
  );
  stmt.run(name, email, password_hash, role, function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({ error: "Email already registered" });
      }
      return res.status(500).json({ error: "DB error" });
    }
    const user = {
      id: this.lastID,
      name,
      email,
      role,
      mobile: null,
      avatar_path: null,
      location_name: null,
      profile_completed: 0,
    };
    const token = createToken(user);
    return res.json({ user, token });
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = createToken(user);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        avatar_path: user.avatar_path,
        location_name: user.location_name,
        profile_completed: user.profile_completed,
      },
      token,
    });
  });
});

// ---------- PROFILE ROUTES ----------

// Get my profile
app.get("/api/me", authMiddleware, (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobile: user.mobile,
      avatar_path: user.avatar_path,
      location_name: user.location_name,
      location_lat: user.location_lat,
      location_lng: user.location_lng,
      profile_completed: user.profile_completed,
    });
  });
});

// Update my profile (name, mobile, location)
app.put("/api/me", authMiddleware, (req, res) => {
  const { name, mobile, location_name, location_lat, location_lng } = req.body;

  const profile_completed = name && mobile && location_name ? 1 : 0;

  db.run(
    `
    UPDATE users
    SET name = ?, mobile = ?, location_name = ?, location_lat = ?, location_lng = ?, profile_completed = ?
    WHERE id = ?
  `,
    [name, mobile, location_name, location_lat, location_lng, profile_completed, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Profile updated", profile_completed });
    }
  );
});

// Upload avatar (base64 image)
app.post("/api/me/avatar", authMiddleware, (req, res) => {
  const { imageData } = req.body;
  if (!imageData) {
    return res.status(400).json({ error: "No image data" });
  }

  // Expecting imageData like "data:image/png;base64,AAAA..."
  const matches = imageData.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: "Invalid image data" });
  }
  const ext = matches[1].includes("jpeg") ? "jpg" : "png";
  const buffer = Buffer.from(matches[2], "base64");
  const fileName = `user-${req.user.id}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  fs.writeFile(filePath, buffer, (err) => {
    if (err) return res.status(500).json({ error: "Error saving image" });

    const relativePath = `/uploads/${fileName}`;
    db.run(
      "UPDATE users SET avatar_path = ? WHERE id = ?",
      [relativePath, req.user.id],
      function (dbErr) {
        if (dbErr) return res.status(500).json({ error: "DB error" });
        res.json({ avatar_path: relativePath });
      }
    );
  });
});

// ---------- TRIPS ROUTES (protected) ----------

app.post("/api/trips", authMiddleware, (req, res) => {
  const { origin, destination, time, price } = req.body;
  if (!origin || !destination || !time || !price) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const role = req.user.role;

  const stmt = db.prepare(`
    INSERT INTO trips (user_id, role, origin, destination, time, price, status)
    VALUES (?, ?, ?, ?, ?, ?, 'open')
  `);

  stmt.run(
    req.user.id,
    role,
    origin,
    destination,
    time,
    price,
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      return res.json({
        id: this.lastID,
        user_id: req.user.id,
        role,
        origin,
        destination,
        time,
        price,
        status: "open",
      });
    }
  );
});

app.get("/api/trips/my", authMiddleware, (req, res) => {
  db.all(
    "SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    }
  );
});

app.get("/api/trips/matches", authMiddleware, (req, res) => {
  const { destination } = req.query;
  if (!destination) {
    return res.status(400).json({ error: "Destination required" });
  }

  const roleOpposite = req.user.role === "driver" ? "rider" : "driver";

  db.all(
    `
    SELECT t.*, u.name as user_name, u.role as user_role
    FROM trips t
    JOIN users u ON u.id = t.user_id
    WHERE t.destination LIKE ?
      AND t.role = ?
      AND t.status = 'open'
      AND t.user_id != ?
    ORDER BY t.time ASC
  `,
    [destination.trim(), roleOpposite, req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    }
  );
});

app.post("/api/trips/book", authMiddleware, (req, res) => {
  const { myTripId, matchTripId } = req.body;
  if (!myTripId || !matchTripId) {
    return res.status(400).json({ error: "Missing trip ids" });
  }

  db.serialize(() => {
    db.get("SELECT * FROM trips WHERE id = ?", [myTripId], (err, myTrip) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!myTrip) return res.status(404).json({ error: "My trip not found" });
      if (myTrip.user_id !== req.user.id)
        return res.status(403).json({ error: "Not your trip" });

      db.get("SELECT * FROM trips WHERE id = ?", [matchTripId], (err2, matchTrip) => {
        if (err2) return res.status(500).json({ error: "DB error" });
        if (!matchTrip) return res.status(404).json({ error: "Match trip not found" });

        const dest1 = myTrip.destination.trim().toLowerCase();
        const dest2 = matchTrip.destination.trim().toLowerCase();

        if (dest1 !== dest2) {
          return res
            .status(400)
            .json({ error: "Destinations must be exactly same to book" });
        }

        let driverTrip, riderTrip;
        if (myTrip.role === "driver") {
          driverTrip = myTrip;
          riderTrip = matchTrip;
        } else {
          driverTrip = matchTrip;
          riderTrip = myTrip;
        }

        const price = riderTrip.price;
        const driver_amount = price * 0.6;
        const platform_amount = price * 0.4;

        const updateStmt = db.prepare(`
          UPDATE trips
          SET status = 'matched',
              matched_user_id = ?,
              driver_amount = ?,
              platform_amount = ?
          WHERE id = ?
        `);

        db.run("BEGIN TRANSACTION");
        updateStmt.run(
          riderTrip.user_id,
          driver_amount,
          platform_amount,
          driverTrip.id
        );
        updateStmt.run(
          driverTrip.user_id,
          driver_amount,
          platform_amount,
          riderTrip.id,
          function (err3) {
            if (err3) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "DB error during booking" });
            }
            db.run("COMMIT");
            return res.json({
              message: "Ride booked with same destination only",
              driverTripId: driverTrip.id,
              riderTripId: riderTrip.id,
              fare: price,
              driver_amount,
              platform_amount,
            });
          }
        );
      });
    });
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
