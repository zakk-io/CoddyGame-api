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



const messagesSchema = new mongoose.Schema({
    resource_id: {
        type: mongoose.Types.ObjectId,
        ref: 'Resources',
        required: true,
    },
    sender: {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});



const Teams = mongoose.model('Teams', TeamSchema , 'teams');
const joinTeamRequestsModel = mongoose.model('joinTeamRequestsModel', joinTeamRequestsSchema , 'joinTeamRequestsModel');
const directJoinLinkModel = mongoose.model('directJoinLinkModel', directJoinLinkSchema , 'directJoinLinkModel');
const Resources = mongoose.model('Resources', resourcesSchema , 'Resources');
const Messages = mongoose.model('Messages', messagesSchema , 'Messages');




module.exports = {
    Teams,
    joinTeamRequestsModel,
    directJoinLinkModel,
    Resources,
    Messages
};