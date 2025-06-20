
const mongoose = require('mongoose');

const jsonValidtion = (err,req,res,next) => {
    if(err instanceof SyntaxError && err.status === 400){
        return res.status(400).json({
            "status": "fail",
            "code" : err.status,
            "type" : err.name,
            "message": "Json Validation errors",
            "errors" : err.message
        })
    }
    next(err);
}



const validationError = (err,req,res,next) => {
    if(err.name === "ValidationError"){
        return res.status(400).json({
            "status": "fail",
            "code" : "400",
            "type" : err.name,
            "message": err._message,
            "errors" : err.message
        })
    }
    next(err);
}



const valueDublictionsError = (err,req,res,next) => {
    if(err.name === "MongoServerError" && err.code === 11000){
        return res.status(400).json({
            "status": "fail",
            "code" : "400",
            "type" : "ValidationError",
            "message": "This value already exists. Please use a different one.",
            "params" : err.keyValue
        })
    }
    next(err);
}




const validateObjectId = (req, res, next) => {
    try {
        const {id} = req.params
        console.log(id);
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            status: 'error',
            code: 400,
            message: `Invalid ${req.params}: "${id}"`
          })
        }
        next()
    } catch (error) {
        next(error);
    }
}

const CastError = (err,req,res,next) => {
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({
          "status": "fail",
          "code" : "400",
          "type" : "CastError",
          "message": `Invalid ${err.path}: ${err.value}`
        });
    }
    next(err);
}


module.exports = {
    jsonValidtion,
    validationError,
    valueDublictionsError,
    validateObjectId,
    CastError
}