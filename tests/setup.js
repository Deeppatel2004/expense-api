
const {
  connectTestDB,
  disconnectTestDB,
} = require("./db");

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});
