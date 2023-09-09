const mongoose = require("mongoose");

const connectToDB = (url) => {
    mongoose
        .set('strictQuery', false)
        .connect(url)
        .then(() => console.log("connected to mongodb....."))
        .catch((err) => console.log(err));
};
module.exports = connectToDB;