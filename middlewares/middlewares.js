const {rateLimit} = require("express-rate-limit")
const jwt = require("jsonwebtoken")
require("dotenv").config()


const registerUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit:5, // Limit each IP to 5 requests per 15 minutes,
    legacyHeaders:false,
    standardHeaders:true,
    message:{
        "status":"fail",
        "code":429,
        "type":"rate limit error",
        "message":"too many account registration attempts, please try again after 15 minutes"
    }
})



const loginUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit:5, // Limit each IP to 5 requests per 15 minutes,
    legacyHeaders:false,
    standardHeaders:true,
    message:{
        "status":"fail",
        "code":429,
        "type":"rate limit error",
        "message":"too many login attempts, please try again after 15 minutes"
    }
})



const authMiddleware = (req,res,next) => {
    try {
        let token = req.cookies.jwt_token
        if(!token){
            if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
                token = req.headers.authorization.split(" ")[1]  
            }
        }

        const payload = jwt.verify(token,process.env.JWT_SECRET)
        req.user = payload
        next()

    } catch (error) {
        if(error.name === "TokenExpiredError"){
            return res.status(401).json({
                "status":"fail",
                "code":401,
                "type":"authentication error",
                "message": "Jwt Token expired"
            })

        }

        if(error.name === "JsonWebTokenError"){
            return res.status(401).json({
                "status":"fail",
                "code":401,
                "type":"authentication error",
                "message": error.message
            })
        }

        if(error instanceof SyntaxError){
            return res.status(401).json({
                "status":"fail",
                "code":401,
                "type":"authentication error",
                "message": "Malformed Jwt token"
            })
        }
        
        return res.status(500).json({
            "status":"fail",
            "code":500,
            "type":"server error",
            "message": error.message
        })
    }
}


module.exports = {
    registerUserLimiter,
    loginUserLimiter,
    authMiddleware
}

