const express = require('express');
const router = express.Router();
const {registerUser,emailVerfiy,loginUser} = require('../controllers/authentication');
const {googleOAuth2,googleOAuth2Callback} = require('../controllers/oauth2');
const {registerUserLimiter,loginUserLimiter} = require('../middlewares/middlewares');

router.post('/api/auth/register',registerUserLimiter, registerUser);
router.get('/api/auth/email-verify/:token', emailVerfiy);
router.post('/api/auth/login',loginUserLimiter, loginUser);


//google oauth2 routes
router.get('/api/auth/oauth2/google', googleOAuth2);
router.get('/api/auth/oauth2/google/callback', googleOAuth2Callback);



module.exports = router;