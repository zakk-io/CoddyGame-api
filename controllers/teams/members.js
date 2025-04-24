const {Teams,Invitations} = require("../../models/teams")
const uuid = require("uuid")
const nodemailer = require("nodemailer")
require("dotenv").config

//emial service configuration
var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "coddygame1@gmail.com",
      pass: process.env.GOOGLE_APP_PASSWORD, 
    },
});



const inviteUser = async (req,res,next) => {
    try {
        const {email,role} = req.body
        const team_id = req.params.team_id

        const token = uuid.v4()
        if(req.isEmailInTeam){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "user is already a member of the team",
                "resource" : "invitations",
            })
        }

        const invitation = await new Invitations({
            email,
            role,
            team_id : req.team._id,
            token : token,
            expiresAt : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }).save()
        
        // Send invitation link 
        await transporter.sendMail({
            from: '"CoddyGame 🚀" <coddygame1@gmail.com>',
            to: email,
            subject: "Team Invitation - Join Now!",
            html: `
                <h1>Join ${req.team.name} as a ${role} at CoddyGame 🚀</h1>
                <p>You have been invited to join the team ${req.team.name}. Click below to accept your invitation:</p>
                <a href="${process.env.BASE_URI}/api/teams/${req.team._id}/members/accept-invitation?token=${token}">
                  invitation link 
                </a>
            `,
        });


        return res.status(201).json({
            "status": "success",
            "code" : "201",
            "message": "invitation has been sent successfully",
            "resource" : "invitations",
            "invitation": {
                "email": invitation.email,
                "role": invitation.role
            },
            "nextUri" : `${process.env.BASE_URI}/api/teams/${team_id}/members/invitations`
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}


const acceptInvitation = async (req,res,next) => {
    try {
        const token = req.query.token
        const team_id = req.params.team_id

        const invitation = await Invitations.findOneAndUpdate({
            token,
            team_id : req.team._id,
            used : false,
            expiresAt : {$gt : new Date(Date.now())}
        },
        {$set : {used : true}},
        {new : true})

        if(!invitation){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "invalid or expired invitation",
                "resource" : "invitations",
            })
        }

        await Teams.findOneAndUpdate(
            { _id: team_id },
            {
              $addToSet: {
                members: {
                  _id: req.user.id,               
                  email: invitation.email,
                  role: invitation.role
                }
              }
            }
          );

        await Invitations.deleteMany({used : false , team_id : req.team._id , email : invitation.email})  

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "invitation has been accepted successfully",
            "resource" : "invitations",
            "nextUri" : `${process.env.BASE_URI}/api/teams/${team_id}`,
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}


const listInvitations = async (req,res,next) => {
    try {
        const used = req.query.used || "false"

        if(used !== "true" && used !== "false"){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "invalid query parameter",
                "parameters" : {
                    "used" : used
                },
                "fix" : "used parameter should be either true or false",
                "resource" : "invitations",
            })
        }

        const invitations = await Invitations.find({
            team_id : req.team._id,
            used : used
        }).select("email used role expiresAt")

        if(invitations.length === 0){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "no invitations found",
                "resource" : "invitations",
            })
        }

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "invitations fetched successfully",
            "resource" : "invitations",
            "invitations": {
                invitations
            }
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}


const cancelInvitation = async (req,res,next) => {
    try {
        const invitation_id = req.params.invitation_id
        const team_id = req.params.team_id

        const invitation = await Invitations.findOne({
            _id : invitation_id,
            team_id : req.team._id,
            used : false
        })

        if(!invitation){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "invitation not found",
                "resource" : "invitations",
            })
        }

        await Invitations.deleteOne({
            _id : invitation_id,
            team_id : req.team._id,
            used : false
        })
        
        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "invitation has been cancelled successfully",
            "resource" : "invitations",
            "nextUri" : `${process.env.BASE_URI}/api/teams/${team_id}/members/invitations`
        })  

    } catch (error) {
        console.log(error)
        next(error)
    }
}


const listTeamMembers = async (req,res,next) => {
    try {
        const team_id = req.params.team_id

        const team = await Teams.findOne({id : team_id}).select("members")
        .populate("members._id", "username first_name last_name avatar")

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "members fetched successfully",
            "resource" : "members",
            "count" : team.members.length,
            "members" : team.members.map((member) => {
                return {
                    _id : member._id._id,
                    email : member.email,
                    role : member.role,
                    username : member._id.username,
                    first_name : member._id.first_name,
                    last_name : member._id.last_name,
                    avatar : member._id.avatar
                }
            })

        })
    } catch (error) {
        console.log(error)
        next(error)
        
    }
}


const changeMemberRole = async (req,res,next) => {
    try {

        const allowedRoles = ["co-leader","editor","viewer"]
        const role = req.body.role

        if(!allowedRoles.includes(role)){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "invalid parameter",
                "parameters" : {
                    "role" : role
                },
                "fix" : `allowed roles are ${allowedRoles}`,
                "resource" : "members",
            })  
        }

        const member_id = req.params.member_id
        const team_id = req.params.team_id

        const team = await Teams.findOneAndUpdate({
            id : team_id,
            "members._id" : member_id,
            "members.role" :{ $in: allowedRoles },
        },{$set : {"members.$.role" : role}},
        { new: true})

        if(!team){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "member is not found in the team",
                "resource" : "members",
            })
        }

        const member = team.members.find(member => member._id.toString() === member_id);

        return res.json({
            "status": "success",
            "code" : "200",
            "message": "member role updated",
            "resource" : "members",
            "member": {
                "email": member.email,
                "role": member.role
            },
            "nextUri" : `${process.env.BASE_URI}/api/teams/${team_id}/members/`
        })
    } catch (error) {
        console.log(error)
        next(error) 
    }
}



const kickMember = async (req,res,next) => {
    try {
        if(!req.isUserIdInTeam){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "member not found in the team",
                "resource" : "members",
                "nextUri" : `${process.env.BASE_URI}/api/teams/${req.params.team_id}/members`
            })
        }

        const member_id = req.params.member_id
        const team = await Teams.findOne({id : req.params.team_id})

        if(team.creator.toString() === member_id.toString()){
            return res.status(403).json({
                "status": "fail",
                "code" : "403",
                "message": "you cannot kick the team leader",
                "resource" : "members",
                "nextUri" : `${process.env.BASE_URI}/api/teams/${req.params.team_id}/members`

            })
        }

        team.members.remove(member_id)
        await team.save()

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "member has been kicked successfully",
            "resource" : "members",
            "nextUri" : `${process.env.BASE_URI}/api/teams/${req.params.team_id}/members`
        })

    } catch (error) {
        console.log(error)
        next(error)  
        
    }
}

module.exports = {
    inviteUser,
    acceptInvitation,
    listInvitations,
    cancelInvitation,
    listTeamMembers,
    changeMemberRole,
    kickMember
}