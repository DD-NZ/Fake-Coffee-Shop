var helmet = require("helmet");
var csrf = require("csurf");
var express = require("express");
var path = require("path");
const { Pool } = require("pg");
const fs = require("fs");
var crypto = require("crypto");
var expressSession = require("express-session");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var passport = require("passport");
var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

// setup route middlewares
var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false });

//create express app
var app = express();
var port = process.env.PORT || 8080;

const pool = new Pool({
  //connectionString: process.env.DATABASE_URL,
  connectionString:
    "postgres://xcbqudcykxzroi:ff3c28e5c01f6b16eeda3e971aec3c9a4a845773c586ee665028397bd0c24844@ec2-54-243-47-196.compute-1.amazonaws.com:5432/dbn61cq0hlbcnf",
  ssl: true
});

app.use(cookieParser());
app.use(
  expressSession({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true
  })
);

app.use(express.json());
app.use(helmet());
//no caching on the client side so users cant get old javascript and exploit an old vulnerability
//app.use(helmet.noCache());
app.use(
  //prevents injection attacks
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "maxcdn.bootstrapcdn.com"]
    }
  })
);

//avoid unexpected disclosure of user information
app.use(helmet.permittedCrossDomainPolicies());
//prevents sites from seeing where users are originating from
app.use(helmet.referrerPolicy({ policy: "same-origin" }));

app.use("/", express.static(__dirname + "/frontend/home"));
app.use("/login", express.static(__dirname + "/frontend/login"));
app.use("/register", express.static(__dirname + "/frontend/register"));

function requestHandler(req, res) {
  res.setHeader("Cache-Control", "public,max-age=259200");
  res.setHeader("Pragma", "public,max-age=259300");
}

/* google oauth
--------------------------------*/
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "526355157156-pve2uhoov3jqk12gf9goniegdhdep3sb.apps.googleusercontent.com",
      clientSecret: "IO2DqbHQH1AW1suDATgTR6bu",
      callbackURL: "http://localhost:8080"
    },
    function(token, tokenSecret, profile, done) {
      User.findOrCreate({ googleId: profile.id }, function(err, user) {
        return done(err, user);
      });
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: "https://www.google.com/m8/feeds" })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/");
  }
);

app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");
  // // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT,PATCH, DELETE"
  );
  // Request headers you wish to allow ,
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-ControlAllow-Headers"
  );
  // Pass to next layer of middleware
  next();
});

/* authorisation
--------------------------------*/

// checks if a user is logged in
function authorise(req) {
  if (req.session.user != undefined) return true;
  else return false;
}

function authoriseAdmin(req) {
  if (req.session.admin) return true;
  else return false;
}

//generates a random salt
function generateSalt(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

//hashes a password using md5 hash with salt
function hashPassword(password, salt) {
  var hash = crypto.createHash("md5", salt);
  hash.update(password);
  var value = hash.digest("hex");
  return value;
}

/* User Login and register
--------------------------------*/

//adding a user to the database
app.post("/user", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //if item is null respond with bad request.
  if (email == null || password == null) {
    res.status(400).end();
    return;
  }
  //Hash password with salt
  var salt = generateSalt(16);
  var hash = hashPassword(password, salt);
  const client = await pool.connect();

  //Check user name isnt already in use
  client.query("Select from users where email = ($1)",[email],(error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
        client.release();
        return;
      }
      //if username is found return 409
      else if (results.rowCount > 0) {
        res.status(409).end();
        client.release();
        return;
      }
    }
  );

  //insert username and password into the database
  client.query(
    "INSERT INTO users(email,password,salt) VALUES ($1,$2,$3)",
    [email, hash, salt],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
      }
      //if rowcount ==0 then query did nothing so bad request.
      else if (results.rowCount == 0) {
        res.status(404).end();
      } else {
        //if success responds with 200 OK, no data back is needed.
        res.status(200).end();
      }
      client.release();
    }
  );
});

//Add a user to the express sessions if they have given a valid email and password
app.get("/user", async (req, res) => {
  console.log("authenticting users");
  const email = req.query.email;
  const password = req.query.password;

  if (email == null || password == null) {
    res.status(400).end();
    return;
  }

  //connects to database
  const client = await pool.connect();
  //Gets emails password and salt from databaase
  client.query(
    "SELECT password,salt FROM users WHERE email = ($1)",
    [email],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
      }
      //if there is no results it means that the email has not been used for an account
      else if (results.rows.length != 1) {
        res.status(404).end();
      } else {
        //if no error responds 200 OK with all the items as JSON
        var databaseHash = results.rows[0].password;
        var salt = results.rows[0].salt;

        //hashes the password given and checks if it matches the hashed password in the database
        var passwordHash = hashPassword(password, salt);
        if (databaseHash == passwordHash) {
          //adds user email to the sessions lists
          req.session.user = email;
          //if email is admin then set admin priviliges
          if (email == "admin") {
            req.session.admin = true;
          }
          req.session.save();
          res.status(200).end();
        }
        // if passwords dont match then return bad request.
        else {
          res.status(404).end();
        }
      }
      //disconnects
      client.release();
    }
  );
});

//Change a users password
app.put("/changePassword", async (req, res) => {
  console.log("changing password");
  const email = req.body.email;
  const password = req.body.password;
  //if item is null respond with bad request.
  if (email == null || password == null) {
    res.status(400).end();
    return;
  }
  //hashes new password
  var salt = generateSalt(16);
  var hash = hashPassword(password, salt);
  const client = await pool.connect();
  //updates the database with new password
  client.query(
    "Update users SET password =($1), salt=($2) where email = ($3)",
    [hash, salt, email],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
      }
      //if rowcount ==0 then email is wrong
      else if (results.rowCount == 0) {
        res.status(404).end();
      } else {
        //if success responds with 200 OK, no data back is needed.
        res.status(200).end();
      }
      client.release();
    }
  );
});

//Checks if a user is in a current session
app.get("/authenication", async (req, res) => {
  console.log("checking logged in");
  if (req.session.user != undefined) {
    res.status(200).end();
  } else {
    res.status(401).end();
  }
});

//Checks if a user is in a current session
app.get("/adminAuthenication", async (req, res) => {
  console.log("checking logged in");
  if (req.session.admin == true) {
    res.status(200).end();
  } else {
    res.status(401).end();
  }
});

//removes a user from sessions loggin them out
app.post("/logout", async (req, res) => {
  console.log("logout");
  if (req.session.user != undefined) {
    req.session.destroy();
  }
  res.status(200).end();
});

/* Products
--------------------------------*/

//Gets all products from the database
app.get("/products", async (req, res) => {
  console.log("getting products");
  //connects to database
  const client = await pool.connect();
  //Gets all products from the data base
  client.query("SELECT * FROM product", (error, results) => {
    //if error responds with response code 500 internal server error, this query should always work.
    if (error) {
      res.status(500).end();
    } else {
      //if no error responds 200 OK with all the items as JSON
      res.status(200).json(results.rows);
    }
    //disconnects
    client.release();
  });
});

//adds a product to the database
app.post("/products", async (req, res) => {
  if (!authoriseAdmin(req)) {
    res.status(401).end();
    return;
  }

  const description = req.body.description;
  const cost = req.body.cost;

  //if item is null respond with bad request.
  if (description == null || cost == null) {
    console.log("bad input");
    res.status(400).end();
    return;
  }

  const client = await pool.connect();
  //adds a product description, cost and quantity into the database
  client.query(
    "INSERT INTO product(description,cost) VALUES ($1,$2)",
    [description, cost],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(409).end();
      }
      //if rowcount ==0 then query did nothing so bad request.
      else if (results.rowCount == 0) {
        res.status(404).end();
      } else {
        //if success responds with 200 OK, no data back is needed.
        res.status(200).end();
      }
      client.release();
    }
  );
});

//deletes an item from a users carts
app.delete("/products", async (req, res) => {
  console.log("deleting item from products");
  //admin must have logged in
  if (!authoriseAdmin(req)) {
    res.status(401).end();
    return;
  }
  const description = req.body.description;

  //if id is null respond with bad request.
  if (description == null) {
    res.status(400).end();
    return;
  }
  const client = await pool.connect();
  client.query(
    "Delete from product where description = ($1)",
    [description],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
        client.release();
        return;
      }
      // checks that one result is returned, else the cartID doesn not exist
      else if (results.rows.length == 1) {
        res.status(404).end();
        client.release();
        return;
      } else {
        //if success responds with 200 OK, no data back is needed.
        res.status(200).end();
      }
      client.release();
    }
  );
});

/* Cart
--------------------------------*/

//gets a users cart
app.get("/cart", async (req, res) => {
  //user must have logged in
  if (!authorise(req)) {
    res.status(401).end();
    return;
  }
  //gets email from the session
  const email = req.session.user;
  console.log("getting users cart");
  //connects to database
  const client = await pool.connect();
  //Gets all products description, thier cart id and their cost and the quantity from the cart
  client.query(
    "SELECT cart.id, product.description,product.cost, cart.quantity FROM cart join product on cart.productid = product.productid where email = ($1)",
    [email],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
      } else {
        //if no error responds 200 OK with all the items as JSON
        res.status(200).json(results.rows);
      }
    }
  );
  //disconnects
  client.release();
});

//adds items to a users cart
app.post("/cart", async (req, res) => {
  //user must have logged in
  if (!authorise(req)) {
    res.status(401).end();
    return;
  }
  const email = req.session.user;
  const description = req.body.description;
  const quantity = req.body.quantity;
  //if description and quantity is null respond with bad request.
  if (description == null || quantity == null) {
    res.status(400).end();
    return;
  }
  const client = await pool.connect();
  // first find the products id from its description
  client.query(
    "select productId from product where description = ($1)",
    [description],
    (error, results) => {
      if (error) {
        res.status(500).end();
      }
      //no such item with the description
      else if (results.rows.length != 1) {
        res.status(404).end();
      } else {
        //gets product id from previous query
        var productID = results.rows[0].productid;
        //insert product into cart with a quantity
        client.query(
          "INSERT INTO cart(email,productID,quantity) VALUES ($1,$2,$3)",
          [email, productID, quantity],
          (error, results) => {
            //if error responds with response code 500 internal server error, this query should always work.
            if (error) {
              throw error;
              res.status(500).end();
            }
            //if rowcount ==0 then query did not insert
            else if (results.rowCount == 0) {
              res.status(404).end();
            } else {
              //if success responds with 200 OK, no data back is needed.
              res.status(200).end();
            }
            client.release();
          }
        );
      }
    }
  );
});

//deletes an item from a users carts
app.delete("/cart", async (req, res) => {
  console.log("deleting item from cart");
  //user must have logged in
  if (!authorise(req)) {
    res.status(401).end();
    return;
  }
  const email = req.session.user;
  //This is the unique cart identifier
  const id = req.body.id;

  //if id is null respond with bad request.
  if (id == null) {
    res.status(400).end();
    return;
  }
  const client = await pool.connect();
  client.query(
    "select email from cart where id = ($1)",
    [id],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
        client.release();
        return;
      }
      // checks that one result is returned, else the cartID doesn not exist
      else if (results.rows.length != 1) {
        res.status(404).end();
        client.release();
        return;
      }
      // checks that the email of the cart item is the same as the person trying to delete it
      //else return un authorised
      else if (results.rows[0].email != email) {
        res.status(401).end();
        client.release();
        return;
      } else {
        var productID = results.rows[0].productid;
        //If cartId is found and emails are correct delete it from the dataabse.
        client.query(
          "Delete from cart where id =($1)",
          [id],
          (error, results) => {
            //if error responds with response code 500 internal server error, this query should always work.
            if (error) {
              throw error;
              res.status(500).end();
            }
            //if rowcount ==0 then query did nothing so bad request.
            else if (results.rowCount == 0) {
              res.status(404).end();
            } else {
              //if success responds with 200 OK, no data back is needed.
              res.status(200).end();
            }
            client.release();
          }
        );
      }
    }
  );
});

/* Purchases
--------------------------------*/
app.get("/purchases", async (req, res) => {
  console.log("getting users purchases");
  let email;
  //if admin is accessing cart, use the email they put in the body as they can access
  //any customers cart
  if (authoriseAdmin(req)) {
    email = req.query.email;
  }
  //if they are a user they can only access their own cart
  else if (authorise(req)) {
    email = req.session.user;
  }
  //else unathorised
  else {
    res.status(401).end();
    return;
  }
  const client = await pool.connect();
  //Gets all products from users purchases from the data base
  client.query(
    "SELECT purchases.id,purchases.quantity, purchases.date, product.description, product.cost FROM purchases join product on purchases.productid = product.productid where email = ($1)",
    [email],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
      } else {
        //if no error responds 200 OK with all the items as JSON
        res.status(200).json(results.rows);
        //disconnects
        client.release();
      }
    }
  );
});

//Adds all items from users cart to the purchased section
app.post("/purchases", async (req, res) => {
  //user must have logged in
  if (!authorise(req)) {
    res.status(401).end();
    return;
  }
  //all purchases need a date
  const date = new Date();
  const email = req.session.user;
  //list of cart ids to move from cart to purchases
  const cartIds = req.body.cartIDs;

  //if ids is null respond with bad request.
  if (cartIds == null) {
    res.status(400).end();
    return;
  }

  const client = await pool.connect();
  //keeps atrack of the number of completed ids
  let completed = 0;
  //iterates through all cart ids
  let i = 0;
  for (i; i < cartIds.length; i++) {
    let id = cartIds[i];
    let productid;
    let quantity;
    //Check that the cartId exists in the database
    client.query(
      "select product.productid, cart.quantity FROM cart join product on cart.productid = product.productid where id = ($1)",
      [id],
      (error, results) => {
        //if error responds with response code 500 internal server error, this query should always work.
        if (error) {
          res.status(500).end();
          client.release();
          return;
        }
        //If no cart id found abort
        else if (results.rows.length != 1) {
          res.status(404).end();
          client.release();
          return;
        } else {
          //add product from cart into purchases
          productid = results.rows[0].productid;
          quantity = results.rows[0].quantity;
          client.query(
            "INSERT INTO purchases(email,productid,quantity,date) VALUES ($1,$2,$3,$4)",
            [email, productid, quantity, date],
            (error, results) => {
              //if error responds with response code 500 internal server error, this query should always work.
              if (error) {
                res.status(500).end();
                client.release();
                return;
              }
              //if rowcount ==0 then query did nothing
              else if (results.rowCount == 0) {
                res.status(404).end();
                client.release();
                return;
              } else {
                //delete items from the user cart which have been placed into the purchases
                client.query(
                  "Delete From cart where id = ($1)",
                  [id],
                  (error, results) => {
                    //if error responds with response code 500 internal server error, this query should always work.
                    if (error) {
                      res.status(500).end();
                      client.release();
                      return;
                    }
                    //if rowcount ==0 then query did nothing so bad request.
                    else if (results.rowCount == 0) {
                      res.status(404).end();
                      client.release();
                      return;
                    } else {
                      completed++;
                      //if the number of completed transactions equal the number cartIds return 200 OK
                      if (completed == cartIds.length) {
                        res.status(200).end();
                        client.release();
                      }
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  }
});

app.delete("/purchases", async (req, res) => {
  console.log("deleting item from products");
  //admin must have logged in
  if (!authoriseAdmin(req)) {
    res.status(401).end();
    return;
  }
  const id = req.body.id;

  //if id is null respond with bad request.
  if (id == null) {
    res.status(400).end();
    return;
  }
  const client = await pool.connect();
  client.query(
    "Delete from purchases where id = ($1)",
    [id],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
        client.release();
        return;
      }
      // checks that one result is returned, else the cartID doesn not exist
      else if (results.rows.length == 1) {
        res.status(404).end();
        client.release();
        return;
      } else {
        //if success responds with 200 OK, no data back is needed.
        res.status(200).end();
      }
      client.release();
    }
  );
});

app.delete("/archive", async (req, res) => {
  console.log("Archiveing purchases");
  //admin must have logged in
  if (!authoriseAdmin(req)) {
    res.status(401).end();
    return;
  }
  const id = req.body.id;

  //if id is null respond with bad request.
  if (id == null) {
    res.status(400).end();
    return;
  }
  const client = await pool.connect();

  client.query(
    "select * from purchases where id = ($1)",
    [id],
    (error, results) => {
      //if error responds with response code 500 internal server error, this query should always work.
      if (error) {
        res.status(500).end();
        client.release();
        return;
      }
      // checks that one result is returned, else the cartID doesn not exist
      else if (results.rows.length != 1) {
        res.status(404).end();
        client.release();
        return;
      } else {
        let email = results.rows[0].email;
        let productId = results.rows[0].productid;
        let quantity = results.rows[0].quantity;
        let date = results.rows[0].date;
        client.query(
          "Delete from purchases where id = ($1)",
          [id],
          (error, results) => {
            //if error responds with response code 500 internal server error, this query should always work.
            if (error) {
              res.status(500).end();
              client.release();
              return;
            }
            // checks that one result is returned, else the cartID doesn not exist
            else if (results.rows.length == 1) {
              res.status(404).end();
              client.release();
              return;
            } else {
              fs.appendFile(
                __dirname + "/Resources/purchaseArchive.dat",
                email + " " + productId + " " + quantity + " " + date + "\n",
                err => {
                  if (err) throw err;
                  console.log("Achived!");
                }
              );
              res.status(200).end();
            }
            client.release();
          }
        );
      }
    }
  );
});

app.listen(port, function() {
  console.log("listening on port 8080");
});
