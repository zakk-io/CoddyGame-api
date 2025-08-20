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
const teamsRoutes = require("./routes/teams")




// mongodb connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('mongodb connected!'));

app.use(cors({
    origin: process.env.FRONTEND_URI,    
    credentials: true,      
    methods: ['GET','POST','PATCH','DELETE','OPTIONS']            
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

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies?.authToken;
  if (!token) return res.status(401).json({ authenticated: false, reason: 'no_cookie' });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ authenticated: false, reason: 'missing_JWT_SECRET' });
  }

  try {
    const user = jwt.verify(token, secret);  // will throw on invalid signature/expired
    return res.json({ authenticated: true, user });
  } catch (err) {
    // Helpful diagnostics (safe to return briefly)
    return res.status(401).json({
      authenticated: false,
      reason: 'verify_failed',
      error: err?.name || 'JwtError',
      message: err?.message || 'invalid token',
      // decode WITHOUT verifying so we can see payload/alg
      decoded: jwt.decode(token) || null,
      secret_len: secret.length
    });
  }
});




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



server.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});

