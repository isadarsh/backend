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
