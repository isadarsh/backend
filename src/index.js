// require("dotenv").config({path: '/.env'}); using import syntax
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
    path: './env'
});

connectDB();
