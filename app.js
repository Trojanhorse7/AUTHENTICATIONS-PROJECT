//jshint esversion:6

import dotenv from "dotenv";
dotenv.config();

import path from 'path';
const __dirname = path.resolve();

import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import md5 from "md5";

import mongoose from 'mongoose';
import _ from "lodash";

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
let port = 3000;

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.URL, {useNewUrlParser: true});
}

const UserSchema = new mongoose.Schema({
  email: String,
  password: String
 });

const User = mongoose.model("User", UserSchema);

app.get("/", (req,res) => {
    res.render("home");
});

app.route("/login")

    .get((req,res) => {
        res.render("login");
    })

    .post((req,res) => {
        const username = req.body.username;
        const password = md5(req.body.password);

        User.findOne({email: username}, (err, foundUser) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
                else {

                }
            }
        });
    }); 

app.route("/register")

    .get((req,res) => {
        res.render("register");
    })

    .post((req,res) => {
        const newUser =  new User ({
            email: req.body.username,
            password: md5(req.body.password)
        })

        newUser.save((err) => {
            if (!err) {
                console.log("Successfully saved");
                res.render("secrets");
            } else {
                console.log(err);
            }
        });
});

app.route("/logout")

    .get((req,res) => {
        res.render("login");
    });





app.listen(process.env.PORT || port, () => { 
  console.log(`Server started on port ${process.env.PORT || port}`);
});
