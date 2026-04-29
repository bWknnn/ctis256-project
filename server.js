import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import session from "express-session";
import db from "./db.js";
import multer from "multer";
import path from "path"

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/products"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) ?? "";
    const name = path.basename(file.originalname, ext);
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
      res.redirect("/mainpage")
    }
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
  if(req.session.loginType== "market") {
    res.render("mainpage", { user: req.session.user });
  } else {
    res.redirect("/")
  }
  
})

app.get("/addOne", async(req,res) => {
  try{
    await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      img VARCHAR(255),
      title VARCHAR(255) NOT NULL,
      stock INT NOT NULL,
      normal_price DECIMAL(10, 2) NOT NULL,
      discount_price DECIMAL(10, 2) NOT NULL,
      created_at DATETIME NOT NULL,
      district VARCHAR(255)
    )
  `);
    res.render("addpro", {user:req.session.user})
  }catch(error){
     console.log("error")
  }
})

app.post("/addOne", upload.single("photo"), async (req, res) => {
  try{

    if (!req.file) {
      return res.status(400).send("No image!");
    }
    const ext = path.extname(req.file.originalname).toLowerCase()
    const form= req.body
    if (![".jpg", ".jpeg", ".png"].includes(ext)) {
      return res.redirect("/")
    }
    await db.query("INSERT INTO products (img, title, stock, normal_price, discount_price, created_at, district) VALUES (?, ?, ?,?,?,?,?)", 
      [ req.file.filename, form.title,form.stock,form.normal,form.discount,form.date, req.session.user.district ])
    res.redirect("/addOne")
  }catch(error){
     console.log("error")
     return res.status(400).send(error);
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