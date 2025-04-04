const express = require('express');
const app = express();
const mongoose = require('mongoose');
require("dotenv").config()
const path = require('path');
const {jsonValidtion,validationError,duplicateError} = require("./middlewares/errorshandlers")
const userRoutes = require("./routes/users")
const cookieparser = require("cookie-parser")

// Middlewares
app.use(express.json());
app.use(cookieparser())
app.use(express.static('public'));
app.use(userRoutes)


// mongodb connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('mongodb connected!'));

// hello world route
app.get('/hello-world', (req, res) => {
    res.json({"message" : 'Hello World 🚀'});
});
// hello world  route


// test templates
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','authentication','register.html'));
});
// test templates



app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});


//errors Middlewares
app.use(jsonValidtion)
app.use(validationError)
app.use(duplicateError)
