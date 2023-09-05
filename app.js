const connectToDB = require("./db/connection");
const express = require("express");
const app = express();
const users = require("./routes/user");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = 3003;

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:4200",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.get("/node", (req, res) => res.send("Hello"));
app.use("/api/users", users);

const startConnection = async () => {
  try {
    await connectToDB(process.env.MONGO_URL);
    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
  } catch (err) {
    console.log(err);
  }
};
startConnection();
