const mongoose = require('mongoose');
const validator = require('validator');


const TeamSchema = new mongoose.Schema({
    id : {
        type : String,
        required : true,
        unique : true,
    },

    name : {
        type : String,
        required : true,
        unique : true,
        maxlength : 30,
    },

    avatar: {
        type: String,
        required: false
    },

    type : {
        type : String,
        required : true,
        enum : ["public", "private"],
        default : "public",
    },

    description : {
        type : String,
        required : false,
        maxlength : 300,
    },

    creator : {
        type : mongoose.Types.ObjectId,
        ref : "Users",
        required : false,
    },

    members : [{
        _id : {
            type : mongoose.Types.ObjectId,
            ref : "Users",
            required : true,
        },
        email : {
            type: String,
            required: true,
        },
        role : {
            type : String,
            enum : ["leader","co-leader","editor","viewer"],
            require : true
        },
    }],

    resources : [{
        type : mongoose.Types.ObjectId,
        ref : "Resources",
        required : false,
    }],

    createdAt : {
        type : Date,
        default : Date.now,
    },
})


const InvitationSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        validate : {
            validator : validator.isEmail,
            message : "Please provide a valid email",
        }
    },

    role : {
        type : String,
        enum : ["co-leader","editor","viewer"],
        require : true
    },

    team_id : {
        type : mongoose.Types.ObjectId,
        ref: 'Teams',
        required : true,
    },

    token : {
        type : String,
        required : true,
        unique : true,
    },

    expiresAt : {
        type : Date,
        required : true,
    },

    status : {
        type : String,
        enum : ["pending","accepted","rejected","cancelled"],
        default : "pending",
    }
})


const joinTeamRequestsSchema = new mongoose.Schema({
    team_id : {
        type : mongoose.Types.ObjectId,
        ref: 'Teams',
        required : true,
    },

    user_id : {
        type : mongoose.Types.ObjectId,
        ref: 'Users',
        required : true,
    },

    status : {
        type : String,
        enum : ["pending","accepted","rejected"],
        default : "pending",
    }
})

const Teams = mongoose.model('Teams', TeamSchema , 'teams');
const Invitations = mongoose.model('Invitations', InvitationSchema , 'invitations');
const joinTeamRequestsModel = mongoose.model('joinTeamRequestsModel', joinTeamRequestsSchema , 'joinTeamRequestsModel');

module.exports = {
    Teams,
    Invitations,
    joinTeamRequestsModel,
};