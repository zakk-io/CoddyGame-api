const {Teams,joinTeamRequestsModel,directJoinLinkModel} = require("../../models/teams")
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


//invitations functionality
const inviteUser = async (req,res,next) => {
    try {
        const {email,role} = req.body
        const team_id = req.params.team_id

        if(req.isEmailInTeam){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "user is already a member of the team",
            })
        }

        //fetch user by email
        const user = await Users.findOne({email})
        if(!user){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "user not found",
            })
        }

        //add user to team
        const team = await Teams.findOneAndUpdate(
            {id : team_id},
            {
                $addToSet: {
                    members: {
                        _id: user._id,
                        email: user.email,
                        role: role 
                    }
                }
            },
            {new: true} 
        )


        // Send invitation link 
        await transporter.sendMail({
            from: '"CoddyGame 🚀" <coddygame1@gmail.com>',
            to: email,
            subject: `Team Invitation`,
            html: `
                <h1> you are now ${role} of ${req.team.name} team at CoddyGame 🚀</h1>
                <a href="${process.env.FRONTEND_URI}/teams/${team_id}/workplace">
                  let us work 🚀
                </a>
            `,
        });


        return res.status(201).json({
            "status": "success",
            "code" : "201",
            "message": "invitation has been sent successfully",
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}









//members mangment
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
                    id : member._id._id,
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

        if(member_id.toString() === req.user.id.toString()){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "you cannot change your own role",
                "resource" : "members",
            })
        }


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
  

        await joinTeamRequestsModel.deleteMany({
            team_id : req.team._id,
            user_id : member_id
        })

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


//join team functionality
const joinTeam = async (req,res,next) => {
    try {
        const team_id = req.params.team_id
        const team = await Teams.findOne({
            id : team_id,
        }).populate("creator", "email")

        if(team.type === "private"){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "this team is private, you cannot join it",
                "resource" : "teams",
                "nextUri" : `${process.env.BASE_URI}/api/teams`
            })
        }

        const user = req.user

        if(req.amITeamMember){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "you are already a member of this team",
                "resource" : "teams",
                "nextUri" : `${process.env.BASE_URI}/api/teams`
            })
        }

        // Check for existing join request
        const existingRequest = await joinTeamRequestsModel.findOne({
            team_id: team._id,
            user_id: user.id,
            status: "pending"
        });

        if(existingRequest){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "you have already sent a join request to this team",
                "resource" : "teams",
                "nextUri" : `${process.env.BASE_URI}/api/teams`
            })
        }

        // Create new join request
        await new joinTeamRequestsModel({
            team_id: team._id,
            user_id: user.id,
            status: "pending"
        }).save();

        await transporter.sendMail({
            from: '"CoddyGame 🚀" <coddygame1@gmail.com>',
            to: team.creator.email,
            subject: "New Team join request!",
            html: `
                <h1>${user.username} want to be part of your team ${team.name} at CoddyGame 🚀</h1>
                <a href="${process.env.BASE_URI}/api/teams/${team._id}/join-requests">
                  check join requests
                </a>
            `,
        });

        return res.status(201).json({
            "status": "success",
            "code" : "201",
            "message": "join request has been sent successfully",
            "resource" : "teams",
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}


const listTeamJoinsRequests = async (req,res,next) => {
    try {  
        const allowedStatus = ["pending","accepted","rejected"]
        const status = req.query.status || "all"

        if(!allowedStatus.includes(status) && status !== "all"){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "invalid query parameter",
                "parameters" : {
                    "status" : status
                },
                "fix" : `status parameter can be either ${allowedStatus}`,
                "resource" : "invitations",
            })
        }

        const joinTeamRequests = await joinTeamRequestsModel.find({
        team_id : req.team._id,
        status : status === "all" ? {$in: allowedStatus} : status,
       }).populate("user_id","username first_name last_name avatar")
        

        if(joinTeamRequests.length === 0){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "no join requests found",
                "resource" : "teams",
            })
        }

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "join requests fetched successfully",
            "resource" : "teams",
            "joinRequests" : joinTeamRequests.map((request) => {
                return {
                    id : request._id,
                    user_id : request.user_id._id,
                    username : request.user_id.username,
                    first_name : request.user_id.first_name,
                    last_name : request.user_id.last_name,
                    avatar : request.user_id.avatar,
                    status : request.status
                }
            })
        })


    } catch (error) {
        console.log(error)
        next(error)  
    }
}


const acceptJoinRequest = async (req,res,next) => {
    try {
        const join_request_id = req.params.join_request_id

        const role = req.body.role || "viewer"
        const allowedRoles = ["co-leader","editor","viewer"]
        if(!allowedRoles.includes(role)){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "invalid parameter",
                "parameters" : {
                    "role" : role
                },
                "fix" : `allowed roles are ${allowedRoles}`,
                "resource" : "teams",
            })  
        }

        const joinTeamRequest = await joinTeamRequestsModel.findOne({
            _id : join_request_id,
            team_id : req.team._id,
            status : "pending"
        }).populate("user_id","email username avatar")


        if(!joinTeamRequest){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "join request not found",
                "resource" : "teams",
            })
        }

        //check if member is already in the team
        const isMember = req.team.members.some((member) => member._id.toString() === joinTeamRequest.user_id._id.toString())  
        if(isMember){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "user is already a member of the team",
                "resource" : "teams",
            })
        }
        
        await joinTeamRequestsModel.findOneAndUpdate({
            _id : join_request_id,
            team_id : req.team._id,
            status : "pending"
        } , {$set : {status : "accepted"}})


        await Teams.findOneAndUpdate(
            { _id: req.team._id },
            {
              $addToSet: {
                members: {
                  _id: joinTeamRequest.user_id,               
                  email: joinTeamRequest.user_id.email,
                  role: role
                }
              }
            }
          );

          return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "user has been accepted in the team",
            "member" : {
                "id" : joinTeamRequest.user_id._id,
                "username" : joinTeamRequest.user_id.username,
                "email" : joinTeamRequest.user_id.email,
                "avatar" : joinTeamRequest.user_id.avatar,
                "role" : role,
            },
            "resource" : "teams",
            "nextUri" : `${process.env.BASE_URI}/api/teams/${req.team._id}/members`
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}

const rejectJoinRequest = async (req,res,next) => {
    try {
        const join_request_id = req.params.join_request_id

        const joinTeamRequest = await joinTeamRequestsModel.findOneAndUpdate({
            _id : join_request_id,
            team_id : req.team._id,
            status : "pending"
        },{$set : {status : "rejected"}}, {new : true})

        if(!joinTeamRequest){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "join request not found",
                "resource" : "teams",
            })
        }

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "join request has been rejected",
            "resource" : "teams",
            "nextUri" : `${process.env.BASE_URI}/api/teams/${req.team._id}/join-requests`
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}




//direct join link


const createDirectJoinLink = async (req,res,next) => {
    try {
        const role = req.body.role

        const directJoinLink =  await new directJoinLinkModel({
            team_id : req.team._id,
            role : role,
            token : uuid.v4(),
            expiresAt : new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
        })
        await directJoinLink.save()

        return res.status(201).json({
            "status": "success",
            "code" : "201",
            "message": "direct join link has been created successfully",
            "resource" : "directJoinLink",
            "link" : `${process.env.BASE_URI}/api/teams/${req.team._id}/direct-join-link?token=${directJoinLink.token}`,
            "expiresAt" : directJoinLink.expiresAt
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}


const joinWithDirectJoinLink = async (req,res,next) => {
    try {
        if(req.amITeamMember){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "you are already a member of this team",
                "resource" : "teams",
                "nextUri" : `${process.env.BASE_URI}/api/teams`
            })
        }

        const token = req.query.token

        const directJoinLink = await directJoinLinkModel.findOneAndUpdate({
            token,
            status : "pending",
            team_id : req.team._id,
            expiresAt : {$gt : new Date(Date.now())}
        },{$set : {status : "accepted"}}, {new : true})

        if(!directJoinLink){
            return res.status(400).json({
                "status": "fail",
                "code" : "400",
                "message": "invalid or expired direct join link",
                "resource" : "directJoinLink",
            })
        }

        await Teams.findOneAndUpdate(
            { _id: req.team._id },
            {
              $addToSet: {
                members: {
                  _id: req.user.id,               
                  email: req.user.email,
                  role: directJoinLink.role
                }
              }
            }
          );

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "user has been accepted as team member successfully",
            "resource" : "teams",
            "nextUri" : `${process.env.BASE_URI}/api/teams/${req.team._id}`
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}

const memberInfo = async (req,res,next) => {
    try {
        const user = req.user
        const team = req.team

        const member = team.members.find(m => m._id.toString() === user.id.toString());

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "member info fetched successfully",
            "resource" : 'member',
            "member": {
                "id": user.id,
                "email": user.email,
                "role": member.role,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "avatar": user.avatar
            },
        })


    } catch (error) {
        console.log(error)
        next(error)
    }
}

module.exports = {
    inviteUser,
    listTeamMembers,
    changeMemberRole,
    kickMember,
    joinTeam,
    listTeamJoinsRequests,
    acceptJoinRequest,
    rejectJoinRequest,
    createDirectJoinLink,
    createDirectJoinLink,
    joinWithDirectJoinLink,
    memberInfo
}