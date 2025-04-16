const mongoose = require('mongoose');


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

const Teams = mongoose.model('Teams', TeamSchema , 'teams');

module.exports = {
    Teams,
};