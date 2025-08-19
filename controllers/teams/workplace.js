const {Teams,Invitations,joinTeamRequestsModel} = require("../../models/teams")
const {genrateTeamAvatar} = require("../../utilities")
const uuid = require("uuid")
const validator = require('validator');
require("dotenv").config()
const nodemailer = require("nodemailer")




//emial service configuration
var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "coddygame1@gmail.com",
      pass: process.env.GOOGLE_APP_PASSWORD, 
    },
});



const createTeam = async (req,res,next) => {
  try {
    const {name,type,description} = req.body
    const team = await new Teams({
        id: uuid.v4(),
        name,
        type,
        description,
        avatar: genrateTeamAvatar(name),
        creator : req.user.id,
        members : [{
            _id : req.user.id,
            email : req.user.email,
            role : "leader"
        }],
    })
    await team.save()

    return res.status(201).json({
        "status": "success",
        "code" : "201",
        "message": "team created successfully",
        "self" : `${process.env.BASE_URI}/api/teams/${team.id}`,
        "resource" : "teams",
        "team": {
            "id": team.id,
            "name": team.name,
            "type": team.type,
            "description": team.description,
            "avatar" : team.avatar,
            "createdAt": team.createdAt,
        }
    })

} catch (error) {
    console.error(error)
    next(error)
}}

const getTeam = async (req,res,next) => {
    try {
        const team = req.team

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "resource" : "teams",
            "team": {
                "id": team.id,
                "name": team.name,
                "type": team.type,
                "description": team.description,
                "avatar" : team.avatar,
                "createdAt": team.createdAt,
                "resource_count": team.resources.length,
                "members_count": team.members.length,
            }
        })

    } catch (error) {
        console.error(error)
        next(error) 
    }
}

const listPublicTeams = async (req, res, next) => {
  try {
    const teams = await Teams.find({
      type: "public",
      "members._id": { $ne: req.user.id }   // exclude teams the user is already in
    });

    if (!teams || teams.length === 0) {
      return res.status(404).json({
        status: "fail",
        code: "404",
        message: "No public teams found",
        resource: "teams"
      });
    }

    return res.status(200).json({
      status: "success",
      code: "200",
      resource: "teams",
      count: teams.length,
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        type: team.type,
        description: team.description,
        avatar: team.avatar,
        createdAt: team.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const listUserTeams = async (req,res,next) => {
    try {
        const teams = await Teams.find({"members._id" : req.user.id})

        if(teams.length === 0){
            return res.status(404).json({
                "status": "fail",
                "code" : "404",
                "message": "you are not a member of any team",
                "resource" : "teams"
            })
        }

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "resource" : "teams",
            "count" : teams.length,
            "teams": teams.map((team) => {
                return {
                    "id": team.id,
                    "name": team.name,
                    "type": team.type,
                    "description": team.description,
                    "avatar" : team.avatar,
                    "createdAt": team.createdAt
                }
            })
        })
    } catch (error) {
        console.error(error)
        next(error)
        
    }
}

const updateTeam = async (req,res,next) => {
    try {
        const team_id = req.params.team_id
        const {name,type,description} = req.body

        const team = await Teams.findOneAndUpdate({id: team_id}, {
            $set:{
                name,
                type,
                description
            }
        },{runValidators : true , new : true})


        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "team updated successfully",
            "self" : `${process.env.BASE_URI}/api/teams/${team.id}`,
            "resource" : "teams",
            "team": {
                "id": team.id,
                "name": team.name,
                "type": team.type,
                "description": team.description,
            }
        })

    } catch (error) {
        console.error(error)
        next(error)
        
    }
}


const deleteTeam = async (req,res,next) => {
    try {
        const team_id = req.params.team_id
        await Teams.deleteOne({id:team_id})  

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "team deleted successfully",
            "nextURI" : `${process.env.BASE_URI}/api/teams`
        })
        
    } catch (error) {
        console.error(error)
        next(error)
    }
}



const leaveTeam = async (req,res,next) => {
    try {
        const team_id = req.params.team_id
        const team = await Teams.findOne({id : team_id})

        await Invitations.deleteMany({
            team_id : req.team._id,
            email : req.member.email,
        })

        await joinTeamRequestsModel.deleteMany({
            team_id : req.team._id,
            user_id : req.user.id
        })

        team.members.remove(req.user.id)
        await team.save()

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "message": "you have left the team successfully",
            "resource" : "members",
            "nextUri" : `${process.env.BASE_URI}/api/teams`
        })  

    } catch (error) {
        console.log(error)
        next(error)  
    }
}



const sendEmail = async (req,res,next) => {
    try {
        const {reciver_email,email_subject,email_content} = req.body
        if(!reciver_email || !email_subject){
            return res.status(200).json({
                "status": "fail",
                "code" : "400",
                "message": "reciver_email or email_subject is not provided",
            })   
        }

        if(!validator.isEmail(reciver_email)){
            return res.status(200).json({
                "status": "fail",
                "code" : "400",
                "message": "reciver_email is not valid email",
            })   
        }

        // Send invitation link 
        await transporter.sendMail({
            from: '"CoddyGame 🚀" <coddygame1@gmail.com>',
            to: reciver_email,
            subject: email_subject,
            html: email_content,
        });


        return res.status(201).json({
            "status": "success",
            "code" : "200",
            "message": "email has been sent successfully",
        })

    } catch (error) {
        console.log(error)
        next(error)  
    }
}






module.exports = {
    createTeam,
    getTeam,
    listPublicTeams,
    listUserTeams,
    updateTeam,
    deleteTeam,
    leaveTeam,
    sendEmail
}




