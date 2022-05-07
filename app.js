//jshint esversion:6

import dotenv from "dotenv";
dotenv.config();

import path from 'path';
const __dirname = path.resolve();

import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from 'mongoose';
import _ from "lodash";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from "mongoose-findOrCreate";

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
let port = 3000;

app.use(session({
    secret: 'Authentications',
    resave: false,
    saveUninitialized: false,
    }));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.URL, {useNewUrlParser: true});
}

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
    });

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

const User = mongoose.model("User", UserSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
    });

passport.deserializeUser(function(user, done) {
    done(null, user);
    });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_id,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // state: true
},
function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
    });
}
));

app.route("/")

    .get((req,res) => {      
        res.render("home");
    });

app.route("/auth/google")

    .get(passport.authenticate("google", {scope: [ "profile" ]}));

app.route("/auth/google/secrets")

    .get(passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
    res.redirect('/secrets');
    });

app.route("/login")

    .get((req,res) => {
        res.render("login");
    })
    
    .post((req,res) => {

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        
        req.login(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () =>{
                    res.redirect("/secrets");
                });
            }
        });
    });

app.route("/secrets")

    // .get((req,res) => {
    //    if (req.isAuthenticated()) {
    //        res.render("secrets");
    //    } else {
    //        res.render("login");
    //    }

    .get((req,res) => {

        User.find({"secret":{$ne:null}}, (err, foundUsers) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secrets", {usersWithSecrets: foundUsers});
                }
            }
        });
    });

app.route("/submit")

    .get((req,res) => {
        if (req.isAuthenticated()) {
            res.render("submit");
        } else {
            res.render("login");
        }
    })

    .post((req,res) => {
        const submittedSecret = req.body.secret;

        User.findById(req.user._id, (err, foundUser) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    foundUser.secret = submittedSecret;
                    foundUser.save(() => {
                        res.redirect("/secrets");
                    });
                }
            }
        });
    });

app.route("/register")

    .get((req,res) => {
        res.render("register");
    })
    
    .post((req,res) => {

    const username = req.body.username;
    const password = req.body.password;

        User.register({username: username}, password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, () =>{
                    res.redirect("/secrets");
                });
            }
        });
    });


app.route("/logout")

    .get((req,res) => {
        req.logout();
        res.render("home");
    });

app.listen(process.env.PORT || port, () => { 
    console.log(`Server started on port ${process.env.PORT || port}`);
});