const express = require('express');
const router = express.Router();
const {registerUser,emailVerfiy} = require('../controllers/users');
const {registerUserLimiter} = require('../middlewares/middlewares');

router.post('/api/auth/register',registerUserLimiter, registerUser);
router.get('/api/auth/email-verify/:token', emailVerfiy);


module.exports = router;