import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import session from "express-session";
import db from "./db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/products"),
  filename: (req, file, cb) => {
    const fixedName = Buffer.from(file.originalname, "latin1").toString("utf8"); // türkçe karakter sorunun çözmek için
    const ext = path.extname(fixedName) ?? "";
    const name = path.basename(fixedName, ext);
    cb(null, `${Date.now()}-${name}${ext}`);
  }
});
const upload = multer({ storage });

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
    if(!req.session.user){
      res.render("login", {type,msg});
    }else{
      res.redirect("/marketpage")
    }
});

app.post("/login", async (req,res)=>{
  try{
    const form = req.body;
    if(req.session.loginType == "consumer"){
      const [rows] = await db.query("SELECT * FROM consumer WHERE email = ?", [form.email]);
      if (rows.length) {
        req.session.loginType = "user";
        req.session.isAuthenticated = true;
        res.redirect("/marketpage");
      } else {
        req.session.msg = "Invalid username or password";   
        res.redirect("/");
      }
    }else{
      const [rows] = await db.query("SELECT * FROM market WHERE email = ?", [form.email]);
      if (rows.length) {
        const user = rows[0];
        const match = await bcrypt.compare(form.password, user.password);
        if (match) {
            req.session.loginType = "market";
            req.session.user = user
            req.session.isAuthenticated = true;
            req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; 
            res.redirect("/marketpage");
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
        const [check]= await db.query("select * from consumer where email=?", [form.email])
        if(!check.length) {
          await db.query( "Insert into consumer (email, name, city, district) VALUES (?,?,?,?)", [form.email, form.fullname, form.city,form.district])
        } else{
          req.session.msg= "You already have an account!"
          return res.redirect("/signup")
        }
      } else{
        const [check]= await db.query("select * from market where email=?", [form.email])
        if(!check.length) {
          const hashedPassword = await bcrypt.hash(form.password, 10);
          await db.query( "Insert into market (email, password, market, city, district) VALUES (?,?,?,?,?)", [form.email, hashedPassword, form.market, form.city,form.district])
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

app.get("/marketpage", async (req,res)=>{
  if (!req.session.isAuthenticated) {
        req.session.msg = "Please login to access the mainpage";
        return res.redirect("/");
    }
  let [pros] = await db.query("SELECT * from products where email = ?",[req.session.user.email])
  if(req.session.loginType== "market") {
    res.render("marketpage", { user: req.session.user , pros});
  } else {
    res.redirect("/")
  }
  
})

app.get("/addOne", async(req,res) => {
  try{
    if (!req.session.isAuthenticated || !req.session.user) {
      req.session.msg = "Please login to add a product";
      return res.redirect("/");
    }
    res.render("addpro", {user:req.session.user})
  }catch(error){
     console.log("error")
  }
})

app.post("/addOne", upload.single("photo"), async (req, res) => {
  try{

    if (!req.session.isAuthenticated || !req.session.user) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path); // kullacının yetkisi yoksa kaydedilen resimi sil
      }
      req.session.msg = "Please login to add a product";
      return res.redirect("/");
    }

    if (!req.file) {
      return res.status(400).send("No image!");
    }

    const ext = path.extname(req.file.originalname).toLocaleLowerCase()
    const form= req.body

    if (![".jpg", ".jpeg", ".png"].includes(ext)) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path); // istenmeyen uzantılı dosyalar da silindi 
      }
      return res.redirect("/")
    }

    await db.query("INSERT INTO products (img, title, stock, normal_price, discount_price, expire_date, email,district) VALUES (?,?,?,?,?,?,?,?)", 
      [ req.file.filename, form.title,form.stock,form.normal,form.discount,form.date, req.session.user.email,req.session.user.district ])
      
    res.redirect("/addOne")
  }catch(error){
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path); // database'e girmezse resimi producstan sil
      }
     console.log("error")
     return res.status(400).send(error.message);
  }
}) 

app.get("/logout", (req,res)=>{
  delete req.session.user
  delete req.session.isAuthenticated
  res.redirect("/")
})

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});