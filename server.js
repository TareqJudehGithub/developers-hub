const express = require("express");
const config = require("config");

const connectDB = require("./config/db");

const app = express();
connectDB();

// init middlewares:
app.use(express.json());

// routes
const authRoute = require("./routes/api/auth");
const postsRoute = require("./routes/api/posts");
const profileRoute = require("./routes/api/profile");
const usersRoute = require("./routes/api/users");

app.get("/", (req, res) => {
  res.send(`<h1>Hello from Express.js server!</h1>`);
});

app.use("/api/auth", authRoute);
app.use("/api/posts", postsRoute);
app.use("/api/profile", profileRoute);
app.use("/api/users", usersRoute);

const PORT = config.get("PORT") || 5000;

app.listen(PORT, () => {
  console.log(`Express up and running on PORT ${PORT}`);
});
