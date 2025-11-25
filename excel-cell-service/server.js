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

// Routes
app.use("/cells", cellRoutes);
app.use("/workbook", workbookRoutes);
// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log("Mongo error:", err));

app.listen(5001, () => console.log("Cell service running on port 5001"));
