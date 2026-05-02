import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import session from "express-session";
import db from "./db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import {body, validationResult} from "express-validator"
import { email } from "./emails/template.js";
import nodemailer from "nodemailer";

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
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

app.get("/market-signin", async(req, res) => {
    req.session.loginType = "market"
    res.redirect("/");
});

app.get("/user-signin", async(req, res) => {
    req.session.loginType = "consumer"
    res.redirect("/");
});

app.get("/", async(req, res) => {
    req.session.loginType ??= "consumer";
    const type = req.session.loginType
    const msg = req.session.msg
    req.session.msg = null
    if(!req.session.user){
      res.render("signin", {type,msg});
    }else{
      res.redirect("/marketpage")
    }
});

app.post("/signin", async (req,res)=>{
  try{
    const form = req.body;
    if(req.session.loginType == "consumer"){
      const [rows] = await db.query("SELECT * FROM consumer WHERE email = ?", [form.email]);
      const user = rows[0];
      if (rows.length) {
        req.session.user = user
        req.session.isAuthenticated = true;
        res.redirect("/consumerpage");
      } else {
        req.session.msg = {
          type:"error",
          text:"Invalid username or password"
        }   
        res.redirect("/");
      }
    }else{
      const [rows] = await db.query("SELECT * FROM market WHERE email = ?", [form.email]);
      if (rows.length) {
        const user = rows[0];
        const match = await bcrypt.compare(form.password, user.password);
        if (match) {
            req.session.user = user
            req.session.isAuthenticated = true;
            req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; 
            res.redirect("/marketpage");
        } else {
            req.session.msg ={
               type:"error",
               text:"Invalid username or password"
            }
            res.redirect("/");
        }
      } else {
        req.session.msg ={
               type:"error",
               text:"Invalid username or password"
        }
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

app.post("/signup",async(req, res) => {
    try {
      const form= req.body
      if(req.session.loginType== "consumer") {
        const [check]= await db.query("select * from consumer where email=?", [form.email])
        if(!check.length) {
          await db.query( "Insert into consumer (email, name, city, district) VALUES (?,?,?,?)", [form.email, form.fullname, form.city,form.district])
        } else{
          req.session.msg ={
               type:"error",
               text:"You already have an account!"
          }  
          return res.redirect("/signup")
        }
      } else{
        const [check]= await db.query("select * from market where email=?", [form.email])
        if(!check.length) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const verifyCode = {code, expire:Date.now() + 5 * 60 * 1000, form};
          req.session.verifyCode = verifyCode

          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: form.email,
            subject: "Verification Code",
            text: `Your verification code is: ${code}`,
            html: email(code),
          });
          return res.redirect("/verify-email")
          
        } else{
          req.session.msg ={
               type:"error",
               text:"This market already exists!"
          }
          return res.redirect("/signup")
        }
      }
    } catch (error) {
      console.log(error)
    }
    res.redirect("/")
});   

app.get("/verify-email", (req,res)=>{
  if (!req.session.verifyCode) {
    req.session.msg = {
      type: "error",
      text: "Please sign up first."
    };
    return res.redirect("/signup");
  }
  const msg = req.session.msg
  req.session.msg = null
  res.render("verify", {msg})
})

app.post("/verify-email", async (req,res)=>{
  try{
    const enteredCode = `${req.body.d1}${req.body.d2}${req.body.d3}${req.body.d4}${req.body.d5}${req.body.d6}`;
    
    if (!req.session.verifyCode) {
      req.session.msg ={
               type:"error",
               text:"Verification session expired. Please sign up again."
      }
      return res.redirect("/signup");
    }

    if (Date.now() > req.session.verifyCode.expire) {
      req.session.verifyCode = null;
      req.session.msg ={
               type:"error",
               text:"Verification code expired. Please sign up again."
      }
      return res.redirect("/signup");
    }

    if (enteredCode != req.session.verifyCode.code) {
      req.session.msg ={
               type:"error",
               text:"Wrong verification code"
      }
      return res.redirect("/verify-email");
    }

    const form = req.session.verifyCode.form
    
    const hashedPassword = await bcrypt.hash(form.password, 10);
    await db.query( "Insert into market (email, password, market, city, district) VALUES (?,?,?,?,?)", [form.email, hashedPassword, form.market, form.city,form.district])
    
    req.session.verifyCode = null;
    req.session.loginType = "market";
    req.session.msg ={
               type:"success",
               text:"Market account created successfully. You can sign in now."
    }
    return res.redirect("/");
  }catch(error){
    console.log("error");
  }
})

app.get("/marketpage", async (req,res)=>{
  if (!req.session.isAuthenticated) {
      req.session.msg ={
                type:"error",
                text:"Please sign in to access the mainpage"
      }
      return res.redirect("/");
  }

  let page=req.query.page ?? 1
  page= parseInt(page)
  let [pros] = await db.query("SELECT * from products where email = ?",[req.session.user.email])
  let [shown] = await db.query ("select * from products where email = ? limit ?,3", [req.session.user.email, (page-1)*3])

  const pagenum= Math.ceil(pros.length/3)

  if(req.session.loginType== "market") {
    res.render("marketpage", { user: req.session.user , pagenum, shown,page});
  } else {
    res.redirect("/")
  }
  
})

app.get("/addOne", async(req,res) => {
  try{
    if (!req.session.isAuthenticated || !req.session.user) {
      req.session.msg ={
                type:"error",
                text:"Please sign in to add a product"
      }
      return res.redirect("/");
    }
    res.render("addpro", {user:req.session.user, form:null, errorList:null})
  }catch(error){
     console.log("error")
  }
})

app.post("/addOne", upload.single("photo"),
  body("title").trim().notEmpty().withMessage("Product title cannot be empty"),
  body("stock").trim().notEmpty().withMessage("Stock value cannot be empty"),
  body("normal").trim().notEmpty().withMessage("Normal price cannot be empty"),
  body("discount").trim().notEmpty().withMessage("Discounted price cannot be empty"),
  body("date").trim().notEmpty().withMessage("Expiration date cannot be empty"),
   async (req, res) => {
  try{

    const errors= validationResult(req);
    let errorList = errors.isEmpty() ? [] : errors.array();
    const form= req.body
    
   
      if (!req.session.isAuthenticated || !req.session.user) {
            if (req.file && fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path); // kullacının yetkisi yoksa kaydedilen resimi sil
            }
            req.session.msg ={
                      type:"error",
                      text:"Please sign in to add a product"
            }
            return res.redirect("/");
      }

      if (!req.file) {
        errorList.push({ msg: "Please upload a product image." });
      } else {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (![".jpg", ".jpeg", ".png"].includes(ext)) {
          // Delete file immediately if wrong format
          fs.unlinkSync(req.file.path); 
          errorList.push({ msg: "Only .jpg, .jpeg, and .png formats are allowed." });
        }
      }

      // 4. If ANY errors exist (text or file), Re-render
      if (errorList.length > 0) {
        // Cleanup: If a file was valid but a text field was empty, delete the file to avoid orphans
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.render("addpro", {form:req.body, errorList});
      }
      

      await db.query("INSERT INTO products (img, title, stock, normal_price, discount_price, expire_date, email,district) VALUES (?,?,?,?,?,?,?,?)", 
        [ req.file.filename, form.title,form.stock,form.normal,form.discount,form.date, req.session.user.email,req.session.user.district ])
            
      res.redirect("/addOne")
    
  } catch(error){
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path); // database'e girmezse resimi producstan sil
      }
     console.log("error")
     return res.status(400).send(error.message);
  }
}) 

app.get("/logout", async (req,res)=>{
  delete req.session.user
  delete req.session.isAuthenticated
  res.redirect("/")
})

app.get("/edit", async(req,res)=> {
  if (!req.session.isAuthenticated || !req.session.user) {
      req.session.msg ={
                type:"error",
                text:"Please sign in first"
      }
      return res.redirect("/");
  }
  const success = req.session.success
  const errors = req.session.error || []
  req.session.activeTab ??= "info"

  req.session.success = null;
  req.session.error = [];

  res.render("edit", {user:req.session.user, success, errors, activeTab:req.session.activeTab})
})

app.post("/edit", async(req,res)=>{
  if (!req.session.isAuthenticated || !req.session.user) {
      req.session.msg ={
                type:"error",
                text:"Please sign in first"
      }
      return res.redirect("/");
  }
  const form = req.body
  const user = req.session.user
  req.session.activeTab = "info";
  if(form.email != user.email || form.market != user.market || form.city != user.city || form.district != user.district){
    req.session.success = "Information has been changed successfully!"
    await db.query("UPDATE market SET email = ?, market = ?, city = ?, district = ? WHERE email = ?",[form.email,form.market,form.city,form.district,user.email]);
    req.session.user.email = form.email;
    req.session.user.market = form.market;
    req.session.user.city = form.city;
    req.session.user.district = form.district;
  }
  res.redirect("/edit")
})

app.post("/edit-password",
  body("current").trim().notEmpty().withMessage("Current password is required."),
  body("new1").trim().notEmpty().withMessage("New password should not be empty."),
  body("new2").trim().notEmpty().withMessage("Write the new password again."),
  async (req,res)=>{
    if (!req.session.isAuthenticated || !req.session.user) {
      req.session.msg ={
                type:"error",
                text:"Please sign in first"
      }
      return res.redirect("/");
    }
    const errors = validationResult(req);
    req.session.error = errors.array().map(e => e.msg)
    req.session.activeTab = "password";

    if(errors.isEmpty()){
      const {current, new1, new2} = req.body
      const user = req.session.user
      if(new1 != new2){
        req.session.error.push("New passwords do not match!")
        console.log(req.session.error)

        return res.redirect("/edit")
      }
      
      const match = await bcrypt.compare(current, user.password)

      if(!match){
        req.session.error.push("Wrong password!")
        return res.redirect("/edit")
      }

      const hashedPassword = await bcrypt.hash(new1,10)

      const same = await bcrypt.compare(new1,user.password)

      if(same){
        req.session.error.push("New password cannot be the same as the current password!")
        return res.redirect("/edit")
      }

      await db.query("UPDATE market set password = ? where email = ?", [hashedPassword,user.email])
      req.session.success = "Password has been changed successfully"
    }
    res.redirect("/edit")
})

app.get("/delete/:id", async(req,res)=> {
  await db.query("DELETE from products where id=?", [req.params.id])

  res.redirect("/marketpage" )
})

app.get("/edit-product/:id",
   async(req,res)=> {
  if (!req.session.isAuthenticated || !req.session.user) {
     req.session.msg ={
                 type:"error",
                 text:"Please sign in first"
       }
       return res.redirect("/");
    }
  let [change]= await db.query("SELECT * from products where id=?", [req.params.id])

  change=change[0]
  
  res.render("edit-product", {change, form:null, errorList:null})
})

app.post("/edit-product/:id", upload.single("photo"),
  body("title").trim().notEmpty().withMessage("Product title cannot be empty"),
  body("stock").trim().notEmpty().withMessage("Stock value cannot be empty"),
  body("normal").trim().notEmpty().withMessage("Normal price cannot be empty"),
  body("discount").trim().notEmpty().withMessage("Discounted price cannot be empty"),
  body("date").trim().notEmpty().withMessage("Expiration date cannot be empty"),
  async (req, res) => {
    try {
      
      const errors= validationResult(req);
      let errorList = errors.isEmpty() ? [] : errors.array();

      if (!req.session.isAuthenticated || !req.session.user) {
            if (req.file && fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path); // kullacının yetkisi yoksa kaydedilen resimi sil
            }
            req.session.msg ={
                      type:"error",
                      text:"Please sign in to add a product"
            }
            return res.redirect("/");
      }

      const form = req.body;

      let [change]= await db.query("SELECT * from products where id=?", [req.params.id])
      change=change[0]

      const finalImage = req.file ? req.file.filename : change.img;

      if(req.file){
          const ext = path.extname(req.file.originalname).toLowerCase();
          if (![".jpg", ".jpeg", ".png"].includes(ext)) {
            // Delete file immediately if wrong format
            fs.unlinkSync(req.file.path); 
            errorList.push({ msg: "Only .jpg, .jpeg, and .png formats are allowed." });
          }
      }
      
      

      // 4. If ANY errors exist (text or file), Re-render
      if (errorList.length > 0) {
        return res.render("edit-product", {form:req.body, errorList, change});
      }

      await db.query(
          "UPDATE products SET title = ?, stock = ?, normal_price = ?, discount_price = ?, expire_date = ?, img = ? WHERE id = ?",
          [form.title, form.stock, form.normal, form.discount, form.date, finalImage, req.params.id]);
      req.session.success = "Information has been changed successfully!";
      
      res.redirect(`/marketpage`);

    }catch (error) {
      console.error(error);
      res.status(500).send("error editing product");
    }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});