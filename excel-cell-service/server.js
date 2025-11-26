const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const cellRoutes = require("./routes/cellRoutes");
const workbookRoutes = require("./routes/workbookRoutes");
const app = express();

// ✅ Allow frontend requests
app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());

// Routes - order matters!
app.use("/cells", cellRoutes);
app.use("/workbook", workbookRoutes);

// 404 handler for unmatched routes (must be after all routes)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// DB connection
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected!");

    app.listen(5001, () => {
      console.log("✅ Cell service running on port 5001");
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
