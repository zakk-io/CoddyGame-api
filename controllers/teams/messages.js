const {Messages} = require("../../models/teams")



const createMessage = async (req, res,next) => {
    try {
        const resource_id = req.params.resource_id
        const text = req.body.text
        const sender = req.user.id

        const message = await new Messages({
            resource_id,
            sender,
            text
        }).save()

        const populatedMessage = await Messages.findById(message._id).populate('sender', 'username avatar')

        return res.status(201).json({
            "status": "success",
            "code" : "201",
            "resource" : "messages",
            "message": {
                "_id": message._id,
                "sender_id": populatedMessage.sender._id,
                "sender_username": populatedMessage.sender.username,
                "sender_avatar": populatedMessage.sender.avatar,
                "text": message.text,
            }
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}



const getMessages = async (req, res, next) => {
    try {
        const {resource_id} = req.params

        const messages = await Messages.find({resource_id}).populate('sender', 'username avatar')

        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "resource" : "messages",
            "messages": messages
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
}



const senderId = async (req,res,next) => {
    try {
        return res.status(200).json({
            "status": "success",
            "code" : "200",
            "sender_id": req.user.id
        }) 
    } catch (error) {
        console.log(error)
        next(error)
    }
}







module.exports = {
    createMessage,
    getMessages,
    senderId
};