const express = require('express');
const router = express.Router();
const { createTeam, getTeam ,listPublicTeams,listUserTeams, updateTeam,deleteTeam } = require('../controllers/teams/workplace');
const {authMiddleware} = require("../middlewares/authentication")
const {createTeamRateLimit} = require("../middlewares/teams")
const {isTeamExists,checkMembership,checkAuthorization} = require("../middlewares/teams")


router.use(authMiddleware)
router.post('/api/teams',[createTeamRateLimit],createTeam);
router.get('/api/teams',listUserTeams);
router.get('/api/teams/public',listPublicTeams);
router.get('/api/teams/:team_id',[isTeamExists,checkMembership("public")],getTeam);
router.put('/api/teams/:team_id',[isTeamExists,checkMembership(""),checkAuthorization(["leader","co-leader"])],updateTeam);
router.delete('/api/teams/:team_id',[isTeamExists,checkMembership(""),checkAuthorization(["leader"])],deleteTeam);






module.exports = router;