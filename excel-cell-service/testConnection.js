const mongoose = require("mongoose");
require("dotenv").config();

async function testConnection() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("🎉 SUCCESS! MongoDB connected!");
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR connecting to MongoDB:");
    console.error(err.message);
    process.exit(1);
  }
}

testConnection();
