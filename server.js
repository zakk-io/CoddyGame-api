const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors")
const {Server} = require("socket.io")
const http = require("http")
 

const app = express()
const server = http.createServer(app)

const cookieparser = require("cookie-parser")
app.set('trust proxy', 1); 

require("dotenv").config()
const path = require('path');
const {jsonValidtion,validationError,valueDublictionsError,validateObjectId,CastError} = require("./middlewares/errorshandlers")
const {authMiddleware} = require("./middlewares/authentication")
const authRoutes = require("./routes/auth")
const teamsRoutes = require("./routes/teams");
const { env } = require('process');
const e = require('express');




// mongodb connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('mongodb connected!'));

const FRONTEND_URI = process.env.FRONTEND_URI || 'https://coddygame-client.onrender.com';

app.use(cors({
    origin: FRONTEND_URI,    
    credentials: true,      
    methods: ['GET','POST','PATCH','DELETE','OPTIONS']            
}));


const io = new Server(server, {
    cors: {
        origin: FRONTEND_URI,  
        credentials: true,
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


    //audio call
    socket.on("join-call",call_id => {
        socket.join(call_id)
        socket.to(call_id).emit("new-socket",socket.id)
    })

    socket.on("offer",data => {
        socket.to(data.to).emit("recive-offer",{"from":socket.id,"offer":data.offer})
    })

    socket.on("answer",data => {
        socket.to(data.to).emit("recive-answer",{"from":socket.id,"answer":data.answer})
    })

    socket.on("icecandidate",data => {
        socket.to(data.to).emit("recive-icecandidate",{"from":socket.id,"candidate":data.candidate})
    })



})
//socket.io


app.use(cookieparser())



// Middlewares
app.use(express.json());
app.use(express.static('public'));
app.use(authRoutes)
app.use(teamsRoutes)









//errors Middlewares
app.use(jsonValidtion)
app.use(validationError)
app.use(validateObjectId)
app.use(valueDublictionsError)
app.use(CastError)


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

