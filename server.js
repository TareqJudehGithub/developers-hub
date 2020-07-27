const express = require("express");
const config = require("config");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send(`<h1>Hello from Express.js server!</h1>`);
});

const PORT = config.get("PORT") || 5000;

app.listen(PORT, () => {
  console.log(`Express up and running on PORT ${PORT}`);
});
