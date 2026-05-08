# CTIS 256 Project

# TEAM MEMBERS

### Tahsin Barkın Şıpka 22402050

### Afruzbek Abduvakhobov 22404001

### Gökçe Ataş 22203721

A full-stack web application built with **Node.js**, **Express**, **EJS**, and **MySQL**.  
The project implements a small marketplace system where **markets** can add discounted products and **consumers** can browse, search, add products to cart, and purchase them.

## Features

### Authentication

- Separate sign-in flow for:
  - Market users
  - Consumer users
- Session-based authentication
- Email verification during sign-up
- Password hashing for market accounts using bcrypt

### Market Features

- Add new products
- Upload product images
- Edit product information
- Delete products
- View market’s own products with pagination
- Edit market profile information
- Change password

### Consumer Features

- Browse available products
- Search products with fuzzy search
- Products are filtered by city
- Products from the same district are prioritized
- Add products to cart
- Increase or decrease product quantity
- Remove products from cart
- Purchase cart items
- Edit consumer profile information

### Cart Features

- Add multiple quantities of the same product
- Prevent adding more than available stock
- Calculate item subtotal
- Calculate cart total
- Update product stock after purchase

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS, CSS, JavaScript
- **Database:** MySQL
- **Authentication:** express-session, bcrypt
- **Validation:** express-validator
- **File Uploads:** multer
- **Email:** Nodemailer
- **Development Tool:** Nodemon
- **Database Tools:** Docker Compose, phpMyAdmin

## Project Structure

```txt
ctis256-project/
├── emails/              # Email templates
├── public/              # Static files
│   ├── css/             # CSS files
│   ├── img/             # Static images
│   ├── products/        # Uploaded product images
│   └── script/          # Frontend JavaScript files
├── sql/                 # Database initialization files
├── views/               # EJS pages
├── db.js                # MySQL connection pool
├── docker-compose.yml   # MySQL and phpMyAdmin setup
├── package.json         # Project dependencies and scripts
├── server.js            # Main Express server
└── README.md
```
