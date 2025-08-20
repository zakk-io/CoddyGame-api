const {Users} = require("../../models/users")
const {genrateUserAvatar} = require("../../utilities")
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
        return res.status(500).json({
            "status":"fail",
            "code":500,
            "type":"server error",
            "message": error.message
        })
    }
}


const googleOAuth2Callback = async (req,res,next) => {
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
        
        let user = await Users.findOneAndUpdate({googleId : user_data.id},{
            $set : {
                email : user_data.email,
                username : user_data.email.split("@")[0],
                password : uuid.v4(),
                first_name : user_data.given_name,
                last_name : user_data.family_name,
                avatar: user_data.picture,
                googleId : user_data.id
            }
        },{new : true})

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
            id : user._id,
            email : user_data.email,
            username : user_data.email.split("@")[0],
            first_name : user_data.given_name,
            last_name : user_data.family_name,
            avatar: user_data.picture
        }

        const authToken = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn : "7d"})
        res.cookie('authToken', authToken, {
          httpOnly: false,           // you’re reading it in the SPA; keep as-is
          secure: true,              // required in production (HTTPS)
          sameSite: 'Lax',           // same-site across subdomains is OK with Lax
          domain: '.onrender.com',   // <-- key change
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect(process.env.FRONTEND_URI);


    } catch (error) {
        console.log(error)
        next(error)
    }
}


const linkedinOAuth2 = async (req,res) => {
    try {
      const linkedin_oauth_state = uuid.v4()
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_Client_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_CALLBACK_URI)}&state=${linkedin_oauth_state}&scope=openid%20profile%20email`;


      res.cookie("linkedin_oauth_state", linkedin_oauth_state, {
        httpOnly: true,
        secure: false, // Set to true (in production)
        sameSite: "lax",
      })

    return res.redirect(authUrl)
    } catch (error) {
        return res.status(500).json({
            "status":"fail",
            "code":500,
            "type":"server error",
            "message": error.message
        })
    }
}


const linkedinOAuth2Callback = async (req,res,next) => {
    try {
        const linkedin_oauth_state = req.cookies.linkedin_oauth_state
        const state = req.query.state
        if(linkedin_oauth_state !== state){
            return res.status(401).json({
                "success" : false,
                "code" : 401,
                "type" : "OAuth2 error",
                "message" : "Invalid state parameter"
            })
        }

        const code = req.query.code
        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
            params: {
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: process.env.LINKEDIN_CALLBACK_URI,
              client_id: process.env.LINKEDIN_Client_ID,
              client_secret: process.env.LINKEDIN_Client_SECRET,
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
        const access_token = tokenResponse.data.access_token;

        const useResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: {
            Authorization: `Bearer ${access_token}`
        }
        })
        const user_data = useResponse.data


        let user = await Users.findOneAndUpdate({linkedinId : user_data.sub},{
            $set : {
                email : user_data.email,
                username : user_data.email.split("@")[0],
                password : uuid.v4(),
                first_name : user_data.given_name,
                last_name : user_data.family_name,
                avatar: user_data.picture,
                linkedinId : user_data.sub
            }
        },{new : true})

        if(!user){
            user = new Users({
                email : user_data.email,
                username : user_data.email.split("@")[0],
                password : uuid.v4(),
                first_name : user_data.given_name,
                last_name : user_data.family_name,
                avatar: user_data.picture,
                email_verified : true,
                provider : "linkedin",
                linkedinId : user_data.sub
            })
            await user.save()
        }
        
        const payload = {
            id : user._id,
            email : user_data.email,
            username : user_data.email.split("@")[0],
            first_name : user_data.given_name,
            last_name : user_data.family_name,
            avatar: user_data.picture
        }

        const authToken = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn : "7d"})
        res.cookie("authToken", authToken, {
            httpOnly: false,
            secure: false, // Set to true (in production)
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 
        })

        return res.redirect(process.env.FRONTEND_URI);


    } catch (error) {
        console.log(error)
        next(error) 
    }
}




module.exports = {
    googleOAuth2,
    googleOAuth2Callback,
    linkedinOAuth2,
    linkedinOAuth2Callback
}

