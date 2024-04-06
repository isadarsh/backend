import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
//using middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
// app.use(cookieParser);
//routes import 
import userRouter from "./routes/user.route.js";
// import { registerUser } from "./controllers/user.controller.js";
app.use("/api/v1/users", userRouter)


export default app;

/*
//2nd approach of segregated codes
import mongoose from "mongoose";
import { DB_NAME } from "./constants";

import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("error:", error);
      throw error;
    });
    app.listen(process.env.port, () => {
      console.log(`process is listening on port ${process.env.port}`);
    });
  } catch (error) {
    console.log("ERROR: ", error);
    throw err;
  }
})();
-----------------------------------------------------------------------
//1st approach is using iffes("Immediately Invoked Function Expression")
import mongoose from "mongoose";
import { DB_NAME } from "./constants";

;(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
  } catch (error) {
    console.log("ERROR: ", error);
    throw err;
  }
})();
*/
