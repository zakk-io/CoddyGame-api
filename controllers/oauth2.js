const {Users} = require("../models/users")
const {genrateUserAvatar} = require("../utilities")
const uuid = require("uuid")
require("dotenv").config()
const {google} = require("googleapis")
const jwt = require("jsonwebtoken")
const axios = require("axios")


// google OAuth2
const googleOAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_Client_ID,
    process.env.GOOGLE_Client_SECRET,
    process.env.GOOGLE_CALLBACK_URI
);


const googleOAuth2 = async (req,res) => {
    try {
        const google_oauth_state = uuid.v4()
        const authUrl = googleOAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "profile",
                "email"
            ],
            state : google_oauth_state
        })
        
        res.cookie("google_oauth_state", google_oauth_state, {
            httpOnly: true,
            secure: false, // Set to true (in production)
            sameSite: "lax",
        })

        return res.redirect(authUrl)
    } catch (error) {
        console.log(error)
        res.json(error)
    }
}


const googleOAuth2Callback = async (req,res) => {
    try {
        const code = req.query.code
        const google_oauth_state = req.cookies.google_oauth_state
        const state = req.query.state
        if(google_oauth_state !== state){
            return res.status(401).json({
                "success" : false,
                "code" : 401,
                "type" : "OAuth2 error",
                "message" : "Invalid state parameter"
            })
        }

        const {tokens} = await googleOAuth2Client.getToken(code)

        const response = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo",{
            headers : {Authorization :`Bearer ${tokens.access_token}`}
        })

        const user_data = response.data
        
        let user = await Users.findOne({googleId : user_data.id})
        if(!user){
            user = new Users({
                email : user_data.email,
                username : user_data.email.split("@")[0],
                password : uuid.v4(),
                first_name : user_data.given_name,
                last_name : user_data.family_name,
                avatar: user_data.picture,
                email_verified : true,
                provider : "google",
                googleId : user_data.id
            })
            await user.save()
        }

        const payload = {
            email : user_data.email,
            username : user_data.email.split("@")[0],
            first_name : user_data.given_name,
            last_name : user_data.family_name,
            avatar: user_data.picture
        }

        const jwt_token = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn : "7d"})
        res.cookie("jwt_token", jwt_token, {
            httpOnly: true,
            secure: false, // Set to true (in production)
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 
        })

        return res.status(201).json({
            "status": "success",
            "code" : "201",
            "message": "User created successfully",
            "data": {
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "avatar" : user.avatar,
                "email_verified": user.email_verified,
            }
        })

    } catch (error) {
        console.log(error)
        res.json(error)
    }
}







module.exports = {
    googleOAuth2,
    googleOAuth2Callback,
}

