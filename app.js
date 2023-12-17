//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";
import md5 from "md5";



const app = express();


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// connects to local mondoDB database and creates userDB 
//, {useNewUrlParser: true} blabla
mongoose.connect("mongodb://localhost:27017/userDB");


// conifguration to add users with email and password in MongoDB 
// Also  later added "new mongoose.Schema" to later add encryption package
const userSchema = new mongoose.Schema ({
    email: String, 
    password: String,

});

// create a constant 'secret', which is going to be th key and add encrypt package 
// as a plugin. Encryption only 'password'
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });


// connect the schema above to MongoDB database 
const User = new mongoose.model("User", userSchema);

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


// when the user in '/register' he can do a POST request, that..
// we can catch, save in the DB and then open the 'secrets render' 
app.post("/register", function (req, res){
    const newUser = new User ({
        email: req.body.username, 
        password: md5(req.body.password)
    });
    
    //saves the new user
    newUser.save(function (err){
        if (err){
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

// when the user is in '/login' he can do a POST requestr, that..
// we can catch their details and check against the existing DB in MongoDB
app.post("/login", function (req, res){
    const username = req.body.username;
    const password = req.body.password;
    
    // checks in the database for username introduced, if found render secrets page 
    User.findOne({email: username}, function (err, foundUser){
        if (err){
            console.log(err);
        } else {
           if (foundUser) {
            if (foundUser.password === password){
            res.render("secrets");
            }
            } 
        }
    });
});


app.listen(3000, function() {
    console.log("The server has started on port 3000")
})