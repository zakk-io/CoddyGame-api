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
    leaveTeam,
    sendEmail,
} = require('../controllers/teams/workplace');

//members
const { 
    inviteUser,
    listTeamMembers,
    changeMemberRole , 
    kickMember,
    joinTeam,
    listTeamJoinsRequests,
    acceptJoinRequest,
    rejectJoinRequest,
    createDirectJoinLink,
    joinWithDirectJoinLink,
    memberInfo
} = require('../controllers/teams/members');


//resources
const {
    createResource,
    getResource,
    getAllResources,
    updateResource,
    deleteResource,
    getMyResources
} = require('../controllers/teams/resources')


//messages
const {
    createMessage,
    getMessages,
    senderId
} = require('../controllers/teams/messages');


//rate limiters
const {
    createTeamRateLimit,
    inviteUserRateLimit,
    createResourcesRateLimit
} = require("../middlewares/teams")

//middlewares
const {
    isTeamExists,
    checkMembership,
    checkAuthorization,
    isEmailInTeam,
    isUserIdInTeam,
    amITeamMember,
    isResourceExists,
    checkResourceOwnership,
    isTeamLeader,
} = require("../middlewares/teams")


//no auth check
router.get('/api/teams/:team_id/resources/:resource_id',[isTeamExists,checkMembership("public"),isResourceExists],getResource);
router.get('/api/teams/:team_id',[isTeamExists,checkMembership("public")],getTeam);
//workplace
router.use(authMiddleware)
router.post('/api/teams',[createTeamRateLimit],createTeam);
router.get('/api/teams',listUserTeams);
router.get('/api/teams/public',listPublicTeams);
router.put('/api/teams/:team_id',[isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"])],updateTeam);
router.delete('/api/teams/:team_id',[isTeamExists,checkMembership(""),checkAuthorization(["leader"])],deleteTeam);
router.get('/api/teams/:team_id/leave',isTeamExists,checkMembership(""),checkAuthorization(["co-leader","editor","viewer"]),leaveTeam);
router.post('/api/teams/:team_id/send-email',isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"]),sendEmail);


//members
//invitations functionality
router.post('/api/teams/:team_id/members/invitations',[isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"]),isEmailInTeam(),inviteUserRateLimit],inviteUser);
//members mangment
router.get('/api/teams/:team_id/members/me',isTeamExists,checkMembership(""),checkAuthorization(""),memberInfo);
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



//resources
router.get('/api/teams/:team_id/resources/my',[isTeamExists,checkMembership("")],getMyResources);
//basic features
router.post('/api/teams/:team_id/resources',[isTeamExists,checkMembership(""),createResourcesRateLimit],createResource);
router.get('/api/teams/:team_id/resources',[isTeamExists,checkMembership("public")],getAllResources);
router.patch('/api/teams/:team_id/resources/:resource_id',[isTeamExists,checkMembership(""),isResourceExists,checkAuthorization(["leader","co-leader","editor"])],updateResource);
router.delete('/api/teams/:team_id/resources/:resource_id',[isTeamExists,checkMembership(""),isResourceExists,checkResourceOwnership,checkAuthorization(["leader","co-leader"])],deleteResource);



//messages
router.post('/api/teams/:team_id/resources/:resource_id/messages',[isTeamExists,checkMembership(""),isResourceExists],createMessage);
router.get('/api/teams/:team_id/resources/:resource_id/messages',[isTeamExists,checkMembership(""),isResourceExists],getMessages);
router.get('/api/teams/:team_id/resources/:resource_id/messages/sender-id/me',isTeamExists,checkMembership(""),isResourceExists,senderId);









module.exports = router;