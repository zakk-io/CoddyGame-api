const {rateLimit} = require("express-rate-limit")




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


module.exports = {
    registerUserLimiter,
    loginUserLimiter
}

