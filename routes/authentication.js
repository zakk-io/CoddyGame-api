const express = require('express');
const router = express.Router();
const {registerUser,emailVerfiy,loginUser,logoutUser} = require('../controllers/authentication');
const {googleOAuth2,googleOAuth2Callback,linkedinOAuth2,linkedinOAuth2Callback} = require('../controllers/oauth2');
const {registerUserLimiter,loginUserLimiter} = require('../middlewares/middlewares');

router.post('/api/auth/register',registerUserLimiter, registerUser);
router.get('/api/auth/email-verify/:token', emailVerfiy);
router.post('/api/auth/login',loginUserLimiter, loginUser);
router.get('/api/auth/logout', logoutUser);



//google oauth2 routes
router.get('/api/auth/oauth2/google', googleOAuth2);
router.get('/api/auth/oauth2/google/callback', googleOAuth2Callback);

router.get('/api/auth/oauth2/linkedin', linkedinOAuth2);
router.get('/api/auth/oauth2/linkedin/callback', linkedinOAuth2Callback);


module.exports = router;