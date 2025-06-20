const { language } = require('googleapis/build/src/apis/language');
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



const directJoinLinkSchema = new mongoose.Schema({
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

    role : {
        type : String,
        enum : ["co-leader","editor","viewer"],
        require : true
    },

    status : {
        type : String,
        enum : ["pending","accepted"],
        default : "pending",
    },

    expiresAt : {
        type : Date,
        required : true,
    }
})



const resourcesSchema = new mongoose.Schema({

    name : {
        type : String,
        required : false,
        maxlength : 30,
        default : "Untitled",
    },

    team_id : {
        type : mongoose.Types.ObjectId,
        ref: 'Teams',
        required : true,
    },

    creator : {
        type : mongoose.Types.ObjectId,
        ref : "Users",
        required : true,
    },

    content : {
        type : mongoose.Schema.Types.Mixed,
        required : false,
    },

    type : {
        type : String,
        required : true,
        enum : ["document", "whiteboard" , "codebase"],
    },

    language : {
        type : String,
        required : false,
        enum : ["javascript", "python", "java", "c","php"],
    },

    createdAt : {
        type : Date,
        required : true
    },

    updatedAt : {
        type : Date,
        required : false
    },
})




const Teams = mongoose.model('Teams', TeamSchema , 'teams');
const Invitations = mongoose.model('Invitations', InvitationSchema , 'invitations');
const joinTeamRequestsModel = mongoose.model('joinTeamRequestsModel', joinTeamRequestsSchema , 'joinTeamRequestsModel');
const directJoinLinkModel = mongoose.model('directJoinLinkModel', directJoinLinkSchema , 'directJoinLinkModel');
const Resources = mongoose.model('Resources', resourcesSchema , 'Resources');



module.exports = {
    Teams,
    Invitations,
    joinTeamRequestsModel,
    directJoinLinkModel,
    Resources,
};