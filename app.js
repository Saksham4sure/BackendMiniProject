const express = require('express');
const app = express();
const userModel = require('./models/user');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user = require('./models/user');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render("index");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.post('/register', async (req, res) => {
    let { name, username, email, password } = req.body;

    let user = await userModel.findOne({ email: email });
    if (user) return res.send("Sorry a user with email already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let createdUser = await userModel.create({
                name: name,
                username: username,
                email: email,
                password: hash
            });

            let token = jwt.sign({ email: email, userid: createdUser._id }, "scretKey");
            res.cookie("token", token);
            res.redirect("/login")
        });

    });
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email: email });
    if (user == null) return res.send("Something went wrong");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "scretKey");
            res.cookie("token", token);
            res.redirect("/");
        } else {
            res.send("Username or password incorrect!");
        }
    });
});

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login")
});

let isLoggedIn = (req, res, next) => {
    if (req.cookies.token === "") {
        res.send("You must be logged in")
    } else {
        let data = jwt.verify(req.cookies.token, "scretKey");
        req.user = data;
    }
    next();
}

app.get('/profile', isLoggedIn , (req, res) => {
    res.send(req.user.email);
})

app.listen(3000, () => {
    console.log("Listening at port 3000");
});