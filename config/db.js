const mongoose = require("mongoose");
const config = require("config");

// fetching the MongoDB driver from default.json:
const db = config.get("MONGO_URI");

// setting up the connection to MongoDB using mongoose:
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

//MongoDB connection test:
const Mongodb = mongoose.connection;
Mongodb.on("error", console.error.bind(console, "connection error:"));
Mongodb.once("open", function () {
  console.log("We're connected to Mongoose!");
});

module.exports = connectDB;
