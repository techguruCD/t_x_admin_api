require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const admins = require("./routes/admin");
const users = require("./routes/user");
const ads = require("./routes/ads");
const bqPairs = require("./routes/bqPair");
const cgInfos = require("./routes/cgInfo");
const devices = require("./routes/devices");

const app = express();
const port = 3003;
// middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: true
  })
);

app.get("/node", (_req, _res) => _res.send("Hello"));
app.use("/api/admins", admins);
app.use("/api/users", users);
app.use("/api/ads", ads);
app.use("/api/bqPairs", bqPairs);
app.use("/api/cgInfos", cgInfos);
app.use("/api/devices", devices);

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
