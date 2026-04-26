import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import session from "express-session";
import db from "./db.js";
const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, 
  saveUninitialized: false
}));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});