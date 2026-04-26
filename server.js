import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import session from "express-session";
import db from "./db.js";
const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, 
  saveUninitialized: false
}));

app.get("/marketLogin", async(req, res) => {
    req.session.loginType = "market"
    res.redirect("/");
});

app.get("/userLogin", async(req, res) => {
    req.session.loginType = "consumer"
    res.redirect("/");
});

app.get("/", async(req, res) => {
    req.session.loginType ??= "consumer";
    const type = req.session.loginType
    const msg = req.session.msg
    req.session.msg = null
    res.render("login", {type,msg});
});

app.post("/login", async (req,res)=>{
  try{
    const form = req.body;
    if(req.session.loginType == "consumer"){
      const [rows] = await db.query("SELECT * FROM userInfo WHERE email = ?", [form.email]);
      if (rows.length) {
        req.session.loginType = "user";
        req.session.isAuthenticated = true;
        res.redirect("/mainpage");
      } else {
        req.session.msg = "Invalid username or password";   
        res.redirect("/");
      }
    }else{
      const [rows] = await db.query("SELECT * FROM marketInfo WHERE email = ?", [form.email]);
      if (rows.length) {
        const user = rows[0];
        const match = await bcrypt.compare(form.password, user.password);
        if (match) {
            req.session.loginType = "market";
            req.session.user = user
            req.session.isAuthenticated = true;
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; 
            res.redirect("/mainpage");
        } else {
            req.session.msg = "Invalid username or password";
            res.redirect("/");
        }
      } else {
        req.session.msg = "Invalid username or password";   
        res.redirect("/");
      }
    }
  }catch(error){
    console.log("error")
  }
})

app.get("/signup", async(req, res) => {
  const msg= req.session.msg
  req.session.msg= null
  res.render("signup", {type: req.session.loginType, msg})
})

app.post("/signup", async(req, res) => {
    try {
      const form= req.body
      if(req.session.loginType== "consumer") {
        const [check]= await db.query("select * from userInfo where email=?", [form.email])
        if(!check.length) {
          await db.query( "Insert into userInfo (email, name, city, district) VALUES (?,?,?,?)", [form.email, form.fullname, form.city,form.district])
        } else{
          req.session.msg= "You already have an account!"
          return res.redirect("/signup")
        }
      } else{
        const [check]= await db.query("select * from marketInfo where email=?", [form.email])
        if(!check.length) {
          const hashedPassword = await bcrypt.hash(form.password, 10);
          await db.query( "Insert into marketInfo (email, password, market, city, district) VALUES (?,?,?,?,?)", [form.email, hashedPassword, form.market, form.city,form.district])
        } else{
          req.session.msg= "This market already exists!"
          return res.redirect("/signup")
        }
      }
    } catch (error) {
      console.log("error")
    }
    res.redirect("/")
});   

app.get("/mainpage", async (req,res)=>{
  if (!req.session.isAuthenticated) {
        req.session.msg = "Please login to access the mainpage";
        return res.redirect("/");
    }
  res.render("mainpage", { user: req.session.user });
})

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});