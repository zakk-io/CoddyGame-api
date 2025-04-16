const bcrypt = require("bcrypt")
const {Users,emailVerificationModel} = require("../../models/users")
const {passwordValidators,genrateUserAvatar} = require("../../utilities")
const uuid = require("uuid")
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken")
require("dotenv").config()


//emial service configuration
var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "coddygame1@gmail.com",
      pass: process.env.GOOGLE_APP_PASSWORD, 
    },
});


const registerUser = async (req, res,next) => {
    try {
        const {email,username,first_name,last_name,password} = req.body
        const passwordValidtion = passwordValidators.validate(password, { list: true })
        if(passwordValidtion.length > 0){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "type" : "field Validation errors",
                "message": "Please ensure your password meets the following requirements:",
                "requirements": passwordValidtion
            })
        }

        const user = new Users({
            email,
            username,
            first_name,
            last_name,
            password: await bcrypt.hash(password, 10),
            avatar: genrateUserAvatar(username),
        })
        await user.save()

        const emailVerification = new emailVerificationModel({
            email,
            token : uuid.v4(),
            expiresAt : new Date(Date.now() + 1000 * 60 * 15)
        })
        await emailVerification.save()

        //send verification link 
        await transporter.sendMail({
            from: '"CoddyGame 🚀" <coddygame1@gmail.com>', 
            to: user.email,
            subject: "Please verify your email",
            html: `<a href="${process.env.BASE_URI}/api/auth/email-verify/${emailVerification.token}">verify email</a>`,
        });

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

        next(error)
    }
}


const emailVerfiy = async (req,res,next) => {
    try {
        const token = req.params.token

        const emailVerification = await emailVerificationModel.findOneAndUpdate({
            token,
            expiresAt : {$gt:Date.now()},
            used : false
        },{$set:{used:true}},{ new: true })

        if(!emailVerification){
            return res.status(403).json({
                "status": "fail",
                "code" : "403",
                "message": "invalid or expired verification link"
            }) 
        }

        await Users.updateOne(
            { email: emailVerification.email },
            { $set: { email_verified: true } }
        );

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "account verified successfully",
            "details": "you can now login to your account"
        })


    } catch (error) {
        console.log(error)
        next(error) 
    }
}


const loginUser = async (req,res,next) => {
    try {
        const {email,password} = req.body

        if(!email || !password){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "type" : "field Validation errors",
                "message": "email and password are required"
            })
        }

        const user = await Users.findOne({email})

        if(!user){
            return res.status(401).json({
                "status": "fail",
                "code" : "401",
                "type" : "authentication error",
                "message": "invalid email or password"
            })
        }

        if(user.email_verified === false){
            return res.status(403).json({
                "status": "fail",
                "code" : "403",
                "type" : "authentication error",
                "message": "your account is not verified",
                "details": "we send you a verification link to your email, please check your email and verify your account"
            })
        }


        const isMatch = await bcrypt.compare(password, user.password);
        if(isMatch){

            const payload = {
                id : user._id,
                email : user.email,
                username : user.username,
                first_name : user.first_name,
                last_name : user.last_name,
                avatar : user.avatar,
                email_verified : user.email_verified,
            }
            const authToken = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn : "7d"})
            res.cookie("authToken", authToken, {
                httpOnly: true,
                secure: false, // Set to true (in production)
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000 
            })

            return res.status(200).json({
                "status": "success",
                "code" : "200",
                "message": "login successfully",
                "authToken": authToken,
            })
        }

        return res.status(401).json({
            "status": "fail",
            "code" : "401",
            "type" : "authentication error",
            "message": "invalid email or password"
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}


const logoutUser = async (req,res) => {
    try {
        res.clearCookie("authToken")
        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "logout successfully"
        })
    } catch (error) {
        return res.status(500).json({
            "status":"fail",
            "code":500,
            "type":"server error",
            "message": error.message
        })
    }
}






module.exports = {
    registerUser,
    emailVerfiy,
    loginUser,
    logoutUser,
}



