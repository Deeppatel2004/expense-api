
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

async function connectTestDB() {
  await mongoose.connect(process.env.TEST_MONGODB_URI);

  console.log("Test MongoDB connected:", mongoose.connection.name);

  if (mongoose.connection.name !== "expense_test") {
    throw new Error("Wrong test database! Expected expense_test");
  }
}

async function disconnectTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

module.exports = {
  connectTestDB,
  disconnectTestDB,
};
