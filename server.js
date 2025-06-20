const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require("cors")

require("dotenv").config()
const path = require('path');
const {jsonValidtion,validationError,valueDublictionsError,validateObjectId,CastError} = require("./middlewares/errorshandlers")
const {authMiddleware} = require("./middlewares/authentication")
const authRoutes = require("./routes/auth")
const teamsRoutes = require("./routes/teams")

const cookieparser = require("cookie-parser")

app.use(cors({
    origin: process.env.FRONTEND_URI,    
    credentials: true,                  
}));

// test templates
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','authentication','register.html'));
});


app.get('/teams/:team_id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','teams','workplace.html'));
});


app.get('/teams/:team_id/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','teams','dashboard.html'));
});



//document
app.get('/teams/:team_id/document/:document_id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','teams','quill.html'));
});
// test templates


// Middlewares
app.use(express.json());
app.use(cookieparser())
app.use(express.static('public'));
app.use(authRoutes)
app.use(teamsRoutes)




// mongodb connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('mongodb connected!'));

// hello world route
app.get('/welcome',[authMiddleware], (req, res) => {
    res.json({"message" : `Welcome ${req.user.username} 🚀`});
});
// hello world  route



app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});


//errors Middlewares
app.use(jsonValidtion)
app.use(validationError)
app.use(validateObjectId)
app.use(valueDublictionsError)
app.use(CastError)

