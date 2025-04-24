const {rateLimit} = require("express-rate-limit")
const {Teams} = require("../models/teams")


//rateLimit
const createTeamRateLimit = rateLimit({
    windowMs: 1 * 60 * 60 * 1000,
    limit: 5,
    legacyHeaders: false,
    standardHeaders: true,
    message: {
        "status": "fail",
        "code": 429,
        "type": "rate limit error",
        "resource" : "teams",
        "message": "too many requests, please try again after 1 hour"
    }
})



const inviteUserRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 5,
    legacyHeaders: false,
    standardHeaders: true,
    message: {
        "status": "fail",
        "code": 429,
        "type": "rate limit error",
        "resource" : "teams",
        "message": "Too many invitations, please try again later."
    }
})
//rateLimit


const isTeamExists = async (req,res,next) => {
    console.log("isTeamExists Middleware")
    try {
        const team_id = req.params.team_id
        const team = await Teams.findOne({id: team_id}) || await Teams.findOne({ _id: team_id}) 
        if(!team){
            return res.status(404).json({
                "status": "fail",
                "code": 404,
                "resource" : "teams",
                "type": "resource not found",
                "message": "team not found"
            })
        }
        req.team = team
        next()
    } catch (error) {  
        console.error(error)
        next(error)
    }
}


function checkMembership(passCheck) {
    return async (req,res,next) => {
        try {
            const team = req.team
            if(passCheck === team.type){
                console.log("pass checkMembership Middleware")
                return next()
            }
            console.log("checkMembership Middleware")
    
            const isMember = team.members.some((member) => member._id.toString() === req.user.id.toString())
            if(!isMember){
                return res.status(403).json({
                    "status": "fail",
                    "code": 403,
                    "resource" : "teams",
                    "type": "forbidden",
                    "message": "you are not a member of this team"
                })
            }
            next()
        } catch (error) {
            console.error(error)
            next(error) 
        }
    }
}


function checkAuthorization(role) {
    return async (req,res,next) => {
        try {
            console.log("checkAuthorization Middleware")

            const team = req.team
            const member = team.members.find((member) => member._id.toString() === req.user.id.toString())
            if(role === "" || role.includes(member.role)){
                return next()
            }

            return res.status(403).json({
                "status": "fail",
                "code": 403,
                "resource" : "teams",
                "type": "forbidden",
                "message": "you are not authorized to do this action"
            })

        } catch (error) {
            console.error(error)
            next(error)  
        }
    }
}



function isEmailInTeam() {
    return async (req,res,next) => {
        try {
            console.log("isEmailInTeam Middleware")

            const team = req.team
            const email = req.body.email
            if(!email){
                return res.status(400).json({
                    "status": "fail",
                    "code": 400,
                    "resource" : "teams",
                    "type": "bad request",
                    "message": "email is required"
                })
            }

            const member = team.members.find((member) => member.email === email)
            if(member){
                req.isEmailInTeam = true
                req.emailMember = member
                return next()
            }

            req.isEmailInTeam = false
            return next()
            
        } catch (error) {
            console.error(error)
            next(error)  
        }
    }
}



function isUserIdInTeam() {
    return async (req,res,next) => {
        try {
            console.log("isUserIdInTeam Middleware")

            const team = req.team
            const member_id = req.params.member_id
            
            if(!member_id){
                return res.status(400).json({
                    "status": "fail",
                    "code": 400,
                    "resource" : "teams",
                    "type": "bad request",
                    "message": "member_id is required"
                })
            }

            const member = team.members.find((member) => member._id.toString() === member_id.toString())
            if(member){
                req.isUserIdInTeam = true
                req.idMember = member
                return next()
            }

            req.isUserIdInTeam = false
            return next()
            
        } catch (error) {
            console.error(error)
            next(error)  
        }
    }
}




module.exports = {
    //rateLimit
    createTeamRateLimit,
    inviteUserRateLimit,
    //rateLimit
    isTeamExists,
    checkMembership,
    checkAuthorization,
    isEmailInTeam,
    isUserIdInTeam
}