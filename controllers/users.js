const bcrypt = require("bcrypt")
const {Users,emailVerificationModel} = require("../models/users")
const {passwordValidators,genrateUserAvatar} = require("../utilities")
const uuid = require("uuid")
const nodemailer = require("nodemailer");
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
            html: `<a href="http://127.0.0.1:3000/api/auth/email-verify/${emailVerification.token}">verify email</a>`,
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



module.exports = {
    registerUser,
    emailVerfiy
}



