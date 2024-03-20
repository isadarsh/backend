// require("dotenv").config({path: '/.env'}); using import syntax
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
dotenv.config({
  path: "./env",
});

//calling the function and since async hence will return promise
connectDB()
  .then(() => {
    // checking errors from the app side (run time env)
    app.on("error", (error) => {
      console.log("error:", error);
      throw error;
    });
    //starting the server on some port
    app.listen(process.env.port || 8000, () => {
      console.log(`server is listening on port ${process.env.port}`);
    });
  })
  .catch((err) => {
    //error from db connection side
    console.log();
  });
