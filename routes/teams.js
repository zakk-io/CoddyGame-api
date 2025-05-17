const express = require('express');
const router = express.Router();
const {authMiddleware} = require("../middlewares/authentication")
//workplace
const { 
    createTeam,
    getTeam ,
    listPublicTeams,
    listUserTeams,
    updateTeam,
    deleteTeam ,
    leaveTeam
} = require('../controllers/teams/workplace');

//members
const { 
    inviteUser,
    acceptInvitation,
    listInvitations,
    cancelInvitation,
    listTeamMembers,
    changeMemberRole , 
    kickMember,
    joinTeam,
    listTeamJoinsRequests,
    acceptJoinRequest,
    rejectJoinRequest,
    createDirectJoinLink,
    joinWithDirectJoinLink,
} = require('../controllers/teams/members');

//rate limiters
const {
    createTeamRateLimit,
    inviteUserRateLimit
} = require("../middlewares/teams")

//middlewares
const {
    isTeamExists,
    checkMembership,
    checkAuthorization,
    isEmailInTeam,
    isUserIdInTeam,
    amITeamMember,
} = require("../middlewares/teams")



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
router.get('/api/teams/:team_id/members/accept-invitation',[isTeamExists,amITeamMember("")],acceptInvitation);
router.get('/api/teams/:team_id/members/invitations',isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"]),listInvitations);
router.get('/api/teams/:team_id/members/invitations/:invitation_id',isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"]),cancelInvitation);
//members mangment
router.get('/api/teams/:team_id/members',isTeamExists,checkMembership(""),checkAuthorization(""),listTeamMembers);
router.put('/api/teams/:team_id/members/:member_id',isTeamExists,checkMembership(""),checkAuthorization(["leader"]),changeMemberRole);
router.get('/api/teams/:team_id/members/:member_id/kick',isTeamExists,checkMembership(""),checkAuthorization(["leader"]),isUserIdInTeam(""),kickMember);
//join team functionality
router.get('/api/teams/:team_id/join',[isTeamExists,amITeamMember("")],joinTeam);
router.get('/api/teams/:team_id/join-requests',[isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"])],listTeamJoinsRequests);
router.post('/api/teams/:team_id/join-requests/:join_request_id',[isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"])],acceptJoinRequest);
router.get('/api/teams/:team_id/join-requests/:join_request_id',[isTeamExists,checkMembership(""),checkAuthorization(["leader"])],rejectJoinRequest);
//direct join link
router.post('/api/teams/:team_id/direct-join-link',[isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"])],createDirectJoinLink);
router.get('/api/teams/:team_id/direct-join-link',[isTeamExists,amITeamMember("")],joinWithDirectJoinLink);








module.exports = router;