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



// connects to local mondoDB database and creates userDB 
//, {useNewUrlParser: true} blabla

mongoose.set("strictQuery", true); 
mongoose.connect("mongodb://localhost:27017/userDB");

// conifguration to add users with email and password in MongoDB 
// Also  later added "new mongoose.Schema" to later add encryption package
const userSchema = new mongoose.Schema ({
    email: String, 
    password: String,

});


// passport connects to MongoDB 
userSchema.plugin(passportLocalMongoose);

// create a constant 'secret', which is going to be th key and add encrypt package 
// as a plugin. Encryption only 'password'
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });


// connect the schema above to MongoDB database 
const User = new mongoose.model("User", userSchema);


// passport is used on the user 
passport.use(User.createStrategy());

// passport saves the information of the user and then releases it
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// We use express to get the home page from the server 
app.get("/", function (reg, res) {
        res.render("home");
    });


// We use express to get the login from the server 
app.get("/login", function (reg, res) {
        res.render("login");
    });


// We use express to get the register from the server 
app.get("/register", function (reg, res){
        res.render("register");
    });

// check if the user is authenticated
app.get("/secrets", function (req,res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else { 
        res.redirect("/login");
    }
});

app.get("/logout", function (req, res, next){
    req.logout(function(err) {
        if (err) { return next(err); }
    res.redirect("/");
    });
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