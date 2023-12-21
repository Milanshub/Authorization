//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
// import encrypt from "mongoose-encryption";
// import md5 from "md5";
// import bcrypt from "bcryptjs";
import session from "express-session";
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose"
import GoogleStrategy from 'passport-google-oauth20';
import findOrCreate from "mongoose-findorcreate";

// const saltRounds = 10;
const app = express();


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// use session package and creates a key
app.use(session({
    secret: "KeyToPandora",
    resave: false, 
    saveUninitialized: false
}));

// use passport package to initialise the process and connect to session 
app.use(passport.initialize());
app.use(passport.session());

//HELLO

// connects to local mondoDB database and creates userDB 
//, {useNewUrlParser: true} blabla

mongoose.set("strictQuery", true); 
mongoose.connect("mongodb://localhost:27017/userDB");

// conifguration to add users with email and password in MongoDB 
// Also  later added "new mongoose.Schema" to later add encryption package
const userSchema = new mongoose.Schema ({
    email: String, 
    password: String,
    googleId: String,
    secret: String
});


// passport connects to MongoDB 
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// create a constant 'secret', which is going to be th key and add encrypt package 
// as a plugin. Encryption only 'password'
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });


// connect the schema above to MongoDB database 
const User = new mongoose.model("User", userSchema);


// passport is used on the user 
passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function (id, done){
    User.findById(id, function (err, user){
        done(err,user);
    })
})

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// We use express to get the home page from the server 
app.get("/", function (reg, res) {
        res.render("home");
    });


app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);


app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

// We use express to get the login from the server 
app.get("/login", function (reg, res) {
        res.render("login");
    });


// We use express to get the register from the server 
app.get("/register", function (reg, res){
        res.render("register");
    });


app.get("/secrets", function(req, res){
        User.find({"secret": {$ne: null}}, function(err, foundUsers){
          if (err){
            console.log(err);
          } else {
            if (foundUsers) {
              res.render("secrets", {usersWithSecrets: foundUsers});
            }
          }
        });
      });

      app.get("/submit", function(req, res){
        if (req.isAuthenticated()){
          res.render("submit");
        } else {
          res.redirect("/login");
        }
      });
      
app.get("/submit", function(req, res){
        if (req.isAuthenticated()){
          res.render("submit");
        } else {
          res.redirect("/login");
        }
      });
      app.post("/submit", function(req, res){
        const submittedSecret = req.body.secret;
      
      //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
        // console.log(req.user.id);
      
        User.findById(req.user.id, function(err, foundUser){
          if (err) {
            console.log(err);
          } else {
            if (foundUser) {
              foundUser.secret = submittedSecret;
              foundUser.save(function(){
                res.redirect("/secrets");
              });
            }
          }
        });
      });


app.get("/submit", function (req, res){
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res){
    const submittedSecret = req.body.secrets;

    User.findById(req.user.id, function (err, foundUser){
        if (err){
            console.log(err);
        } else {
            if (foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                } )
            }
        }
    });
});

 app.get("/logout", function(req, res){
        req.logout();
        res.redirect("/");
      });         
// when the user in '/register' he can do a POST request, that..
// we can catch, save in the DB and then open the 'secrets render' 
app.post("/register", function (req, res){
   User.register({username: req.body.username}, req.body.password, function (err, user){
    if (err){
        console.log(err);
        res.redirect("/register");
    } else {
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        });
    }
   });
});

// when the user is in '/login' he can do a POST requestr, that..
// we can catch their details and check against the existing DB in MongoDB
app.post("/login", function (req, res){
   const user = new User({
    username: req.body.username, 
    passowrd: req.body.passoword
   });


req.login(user, function(err){
    if (err){
        console.log(err);
    } else {
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        });
    }
   });
});



app.listen(3000, function() {
    console.log("The server has started on port 3000")
})

