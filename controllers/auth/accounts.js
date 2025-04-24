const {Users} = require("../../models/users")
const {Invitations} = require("../../models/teams")

require("dotenv").config()


const Me = async (req, res , next) => {
    try {
        const user = req.user
        return res.json({
            "status":"success",
            "code":200,
            "resource":"accounts",
            "data": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "email": user.email,
                "avatar": user.avatar,
            }
        })
    } catch (error) {
        console.log(error)
        next(error) 
    }
}

const changeUsername = async (req, res , next) => {
    try {
        const username = req.body.username
        await Users.findOneAndUpdate({_id:req.user.id},{
            $set : {username : username}
        },{new : true , runValidators : true})

        return res.json({
            "status":"success",
            "code":200,
            "resource":"accounts",
            "message": "Username changed successfully",
            "data": {
                "username" : username
            },
            "nextUri" : `${process.env.BASE_URI}/api/auth/account/me`
        })
    } catch (error) {
        console.log(error)
        next(error) 
    }
}

const listMyTeamsInvitations = async (req,res,next) => {
    try {
        const invitations = await Invitations.find({email:req.user.email,used:false})
        .populate("team_id", "name avatar type description createdAt")


        if(!invitations || invitations.length === 0){
            return res.status(404).json({
                "status":"fail",
                "code":404,
                "resource":"invitations",
                "message": "No invitations found"
            })
        }

        return res.json({
            "status":"success",
            "code":200,
            "resource":"invitations",
            "invitations" : invitations
        })
    } catch (error) {
        console.log(error)
        next(error)  
    }
}

const rejectInvitation = async (req,res,next) => {
    try {
        const invitation_id = req.params.invitation_id
        if (!invitation_id) {
            return res.status(400).json({
                "status": "fail",
                "code": 400,
                "resource": "invitations",
                "message": "Invitation ID is required"
            })
        }
        const invitation = await Invitations.findOne({_id:invitation_id,email:req.user.email})
        if(!invitation){
            return res.status(404).json({
                "status":"fail",
                "code":404,
                "resource":"invitations",
                "message": "Invitation not found"
            })
        }

        await Invitations.deleteOne({_id:invitation_id,email:req.user.email})
        return res.json({
            "status":"success",
            "code":200,
            "message": "Invitation rejected successfully",
            "resource":"invitations",
            "nextUri" : `${process.env.BASE_URI}/api/auth/account/invitations`
        })
    } catch (error) {
        console.log(error)
        next(error)  
        
    }
}

module.exports = {
    Me,
    changeUsername,
    listMyTeamsInvitations,
    rejectInvitation
}