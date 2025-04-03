const express = require('express');
const app = express();
const mongoose = require('mongoose');
require("dotenv").config()
const {jsonValidtion,validationError,duplicateError} = require("./middlewares/errorshandlers")
const userRoutes = require("./routes/users")

// Middlewares
app.use(express.json());
app.use(userRoutes)

// mongodb connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('mongodb connected!'));

// Basic route
app.get('/hello-world', (req, res) => {
    res.json({"message" : 'Hello World 🚀'});
});


// Start server
app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});


//errors Middlewares
app.use(jsonValidtion)
app.use(validationError)
app.use(duplicateError)
