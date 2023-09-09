require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();

const users = require("./routes/user");
const BQPair = require("./routes/bqPair");
const CGInfo = require("./routes/cgInfo");
const Devices = require("./routes/devices");

const cors = require("cors");
const cookieParser = require("cookie-parser");

const admins = require("./routes/admin");
const ads = require("./routes/ads");

const port = 3003;
// middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.get("/node", (req, res) => res.send("Hello"));
app.use("/api/users", users);
app.use("/api/bqPair", BQPair);
app.use("/api/cgInfo", CGInfo);
app.use("/api/devices", Devices);

(() => {
  mongoose.set('strictQuery', true);
  mongoose.connect(process.env.MONGO_URL).then(db => {
    console.log(`[info] connected to ${db.connection.db.databaseName}`);
    app.listen(port, () =>
      console.log(`Express App listening on port ${port}!`)
    );
  }).catch(error => {
    console.log(`[error], ${error}`);
    process.exit(1);
  })
})();
