import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import { authMiddleware } from "./auth.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Helper: create JWT
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
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
    const user = { id: this.lastID, name, email, role };
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  });
});

// ---------- TRIPS ROUTES (protected) ----------

// Create trip (driver creates offer, rider creates request)
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

// Get my trips
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

// Find matches by same destination
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

// Book match – ONLY if same destination
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

        // Decide which trip is driver and which is rider
        let driverTrip, riderTrip;
        if (myTrip.role === "driver") {
          driverTrip = myTrip;
          riderTrip = matchTrip;
        } else {
          driverTrip = matchTrip;
          riderTrip = myTrip;
        }

        const price = riderTrip.price; // Rider pays this price
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
