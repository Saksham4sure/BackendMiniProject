const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
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
    if (user == null) return res.send("No users with such credentials.");

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
        res.redirect("/login")
    } else {
        let data = jwt.verify(req.cookies.token, "scretKey");
        req.user = data;
    }
    next();
}

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    res.render("profile", { user });
});

app.get('/post/create', isLoggedIn, (req, res) => {
    res.render("createPost")
});

app.post('/post/create', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let {postName, content} = req.body;

    let post = await postModel.create({
        user: user._id,
        postName: postName,
        content: content,
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile/post');
});

app.get('/profile/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    res.render("profilePost", {user})
})

app.listen(3000, () => {
    console.log("Listening at port 3000");
});