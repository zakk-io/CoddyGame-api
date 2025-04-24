const express = require('express');
const router = express.Router();
//local_authentication
const {registerUser,emailVerfiy,loginUser,logoutUser} = require('../controllers/auth/local_authentication');
//oauth2
const {googleOAuth2,googleOAuth2Callback,linkedinOAuth2,linkedinOAuth2Callback} = require('../controllers/auth/oauth2');
//account
const {Me,changeUsername,listMyTeamsInvitations,rejectInvitation} = require('../controllers/auth/accounts');
//middlewares
const {registerUserLimiter,loginUserLimiter,authMiddleware} = require('../middlewares/authentication');

//local_authentication routes
router.post('/api/auth/register',registerUserLimiter, registerUser);
router.get('/api/auth/email-verify/:token', emailVerfiy);
router.post('/api/auth/login',loginUserLimiter, loginUser);
router.get('/api/auth/logout', logoutUser);

//google oauth2 routes
router.get('/api/auth/oauth2/google', googleOAuth2);
router.get('/api/auth/oauth2/google/callback', googleOAuth2Callback);
//linkedin oauth2 routes
router.get('/api/auth/oauth2/linkedin', linkedinOAuth2);
router.get('/api/auth/oauth2/linkedin/callback', linkedinOAuth2Callback);

//account routes
router.use(authMiddleware)
router.get('/api/auth/account/me', Me);
router.put('/api/auth/account/username', changeUsername);
router.get('/api/auth/account/invitations', listMyTeamsInvitations);
router.get('/api/auth/account/invitations/:invitation_id', rejectInvitation);





module.exports = router;