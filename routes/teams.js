const express = require('express');
const router = express.Router();
const {authMiddleware} = require("../middlewares/authentication")
//workplace
const { createTeam, getTeam ,listPublicTeams,listUserTeams, updateTeam,deleteTeam ,leaveTeam} = require('../controllers/teams/workplace');
//members
const { inviteUser,acceptInvitation,listInvitations,cancelInvitation,listTeamMembers, changeMemberRole , kickMember } = require('../controllers/teams/members');
//rate limiters
const {createTeamRateLimit,inviteUserRateLimit} = require("../middlewares/teams")
//middlewares
const {isTeamExists,checkMembership,checkAuthorization,isEmailInTeam,isUserIdInTeam} = require("../middlewares/teams")





//workplace
router.use(authMiddleware)
router.post('/api/teams',[createTeamRateLimit],createTeam);
router.get('/api/teams',listUserTeams);
router.get('/api/teams/public',listPublicTeams);
router.get('/api/teams/:team_id',[isTeamExists,checkMembership("public")],getTeam);
router.put('/api/teams/:team_id',[isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"])],updateTeam);
router.delete('/api/teams/:team_id',[isTeamExists,checkMembership(""),checkAuthorization(["leader"])],deleteTeam);
router.get('/api/teams/:team_id/leave',isTeamExists,checkMembership(""),checkAuthorization(["co-leader","editor","viewer"]),leaveTeam);

//members
//invitations functionality
router.post('/api/teams/:team_id/members/invitations',[isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"]),isEmailInTeam(),inviteUserRateLimit],inviteUser);
router.get('/api/teams/:team_id/members/accept-invitation',isTeamExists,acceptInvitation);
router.get('/api/teams/:team_id/members/invitations',isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"]),listInvitations);
router.delete('/api/teams/:team_id/members/invitations/:invitation_id',isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"]),cancelInvitation);
//members mangment
router.get('/api/teams/:team_id/members',isTeamExists,checkMembership(""),checkAuthorization(""),listTeamMembers);
router.put('/api/teams/:team_id/members/:member_id',isTeamExists,checkMembership(""),checkAuthorization(["leader"]),changeMemberRole);
router.get('/api/teams/:team_id/members/:member_id/kick',isTeamExists,checkMembership(""),checkAuthorization(["leader"]),isUserIdInTeam(""),kickMember);







module.exports = router;