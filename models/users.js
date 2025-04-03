const mongoose = require('mongoose');
const validator = require('validator');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate : {
            validator : validator.isEmail,
            message : 'Please provide a valid email'
        }
    },
    
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength : 30,
        minlength : 3
    },

    first_name : {
        type: String,
        required: true,
        trim: true,
        maxlength : 50,
    },

    last_name : { 
        type: String,
        required: true,
        trim: true,
        maxlength : 50,
    },

    password: {
        type: String,
        required: true
    },

    avatar: {
        type: String,
        required: false
    },

    email_verified: {
        type: Boolean,
        default: false
    },
});



const emailVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate : {
            validator : validator.isEmail,
            message : 'Please provide a valid email'
        }
    },

    token : {
        type: String,
        required: true,
        unique: true,
    },

    expiresAt : {
        type : Date,
        required: true,
    },

    used : {
        type : Boolean,
        default : false
    }
})

const Users = mongoose.model('User', userSchema , 'users');
const emailVerificationModel = mongoose.model('emailVerificationModel', emailVerificationSchema , 'emailVerificationModel');


module.exports = {
    Users,
    emailVerificationModel,
};