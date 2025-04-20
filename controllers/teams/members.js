const {Teams,Invitations} = require("../../models/teams")
const {Users} = require("../../models/users")
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
            team_id,
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
                <a href="${process.env.BASE_URI}/api/teams/${team_id}/members/accept-invitation?token=${token}">
                  invitation link 
                </a>
            `,
        });


        return res.status(201).json({
            "status": "success",
            "code" : "201",
            "message": "invitation has been sent successfully",
            "resource" : "invitations",
            "data": {
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
            team_id,
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
            { id: team_id },
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

        await Invitations.deleteMany({used : false , team_id , email : invitation.email})  

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
        const team_id = req.params.team_id
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
            team_id,
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
            "data": {
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
            team_id,
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
            team_id,
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

module.exports = {
    inviteUser,
    acceptInvitation,
    listInvitations,
    cancelInvitation
}