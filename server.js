const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors")
const {Server} = require("socket.io")
const http = require("http")

const app = express()
const server = http.createServer(app)

const cookieparser = require("cookie-parser")

require("dotenv").config()
const path = require('path');
const {jsonValidtion,validationError,valueDublictionsError,validateObjectId,CastError} = require("./middlewares/errorshandlers")
const {authMiddleware} = require("./middlewares/authentication")
const authRoutes = require("./routes/auth")
const teamsRoutes = require("./routes/teams")




// mongodb connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('mongodb connected!'));

app.use(cors({
    origin: process.env.FRONTEND_URI,    
    credentials: true,                  
}));


const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URI,  
        methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"]
    }
});


//socket.io
io.on("connection", async (socket) =>{

    //document
    socket.on("join_document",document_id => {
        socket.join(document_id)
    })

    socket.on("emit_document_data",(data,document_id) => {
        socket.to(document_id).emit("brodcast_document_data", data);
    })

    socket.on('emit_user_cursor_document',(data, document_id) => {
        socket.to(document_id).emit("brodcast_user_cursor_document", data);
    })


    //codebase
    socket.on("join_codebase",codebase_id => {
        socket.join(codebase_id)
    })

    socket.on("emit_codebase_data",(data,codebase_id) => {
        socket.to(codebase_id).emit("brodcast_codebase_data", data);
    })


    //chat messages
    socket.on("join_chat", codebase_id => {
        socket.join(codebase_id)
    })

    socket.on("emit_chat_message", (codebase_id, data) => {
        socket.to(codebase_id).emit("brodcast_chat_message", data);
    })


    //whiteboard
    socket.on("join_whiteboard", whiteboard_id => {
        socket.join(whiteboard_id)
    })


    socket.on("emit_whiteboard_data", (data, whiteboard_id) => {
        socket.to(whiteboard_id).emit("brodcast_whiteboard_data", data);
    });



})
//socket.io









app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','authentication','register.html'));
});


// Middlewares
app.use(express.json());
app.use(cookieparser())
app.use(express.static('public'));
app.use(authRoutes)
app.use(teamsRoutes)









//errors Middlewares
app.use(jsonValidtion)
app.use(validationError)
app.use(validateObjectId)
app.use(valueDublictionsError)
app.use(CastError)



server.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});

