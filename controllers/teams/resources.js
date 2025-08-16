const {Teams,Resources} = require("../../models/teams")
require("dotenv").config()



// controllers/resources.js

//create a new resource
const createResource = async (req, res, next) => {
    try {
      const { name, content, type, language } = req.body
  
      // 1) build & save the new Resource
      const resourceDoc = new Resources({
        name,
        team_id : req.team._id,
        creator : req.user.id,
        content,
        type,
        language,
        createdAt : new Date(),
        updatedAt : new Date()
      })
      await resourceDoc.save()
  
      // 2) add to the parent Team
      await Teams.findByIdAndUpdate(
        req.team._id,
        { $addToSet: { resources: resourceDoc._id } }
      )
  
      // 3) re-query & populate the creator field
      const populated = await Resources
        .findById(resourceDoc._id)
        .populate('creator', 'username first_name last_name avatar')
        .exec()
  
      // 4) send your response
      return res.status(201).json({
        status:  'success',
        code:    201,
        message: 'Resource has been created successfully',
        data: {
          id:        populated._id,
          name:      populated.name,
          content:   populated.content,
          type:      populated.type,
          language:  populated.language,
          createdAt: populated.createdAt,
          updatedAt: populated.updatedAt,
          creator:   populated.creator,  // already has only the 4 fields you populated
        },
        nextUri: `${process.env.BASE_URI}/api/teams/${req.team._id}/resources/${populated._id}`
      })
    } catch (error) {
      next(error)
    }
  }
  

  

//get single resource
const getResource = async (req,res,next) => {
    try {
        const resource = await Resources.findById(req.params.resource_id)
        .populate("creator" , "username first_name last_name avatar")


        return res.status(200).json({
            "status": "success",
            "code" : 200,
            "message": "resource has been fetched successfully",
            "resource" : "Resources",
            "data" : {
                "id" : resource._id,
                "name" : resource.name,
                "creator" : {
                    "username" : resource.creator.username,
                    "first_name" : resource.creator.first_name,
                    "last_name" : resource.creator.last_name,
                    "avatar" : resource.creator.avatar,
                },
                "content" : resource.content,
                "type" : resource.type,
                "language" : resource.language,
                "createdAt" : resource.createdAt,
                "updatedAt" : resource.updatedAt,

            }
        })

    } catch (error) {
        console.log(error)
        next(error)  
    }
}


//get all resources
const getAllResources = async (req,res,next) => {
    try {
        const resources = await Resources.find({team_id : req.team._id})
        .populate("creator" , "username first_name last_name avatar")

        if(resources.length === 0){
            return res.status(404).json({
                "status": "fail",
                "code" : 404,
                "message": "no resources found",
                "resource" : "Resources",
                "nextUri" : `POST ${process.env.BASE_URI}/api/teams/${req.team._id}/resources`,
            })
        }

        return res.status(200).json({
            "status": "success",
            "code" : 200,
            "message": "resources have been fetched successfully",
            "resource" : "Resources",
            "count" : resources.length,
            "data" : resources.map(resource => {
                return {
                    "id" : resource._id,
                    "name" : resource.name,
                    "creator" : {
                        "username" : resource.creator.username,
                        "first_name" : resource.creator.first_name,
                        "last_name" : resource.creator.last_name,
                        "avatar" : resource.creator.avatar,
                    },
                    "content" : resource.content,
                    "type" : resource.type,
                    "language" : resource.language,
                    "createdAt" : resource.createdAt,
                    "updatedAt" : resource.updatedAt
                }
            })
        })
    } catch (error) {
        console.log(error)
        next(error) 
    }
}


//update resource
const updateResource = async (req,res,next) => {
    try {
        const resource = await Resources.findByIdAndUpdate(
            req.params.resource_id,
            {$set : {
                updatedAt : Date(Date.now()),
                name : req.body.name,
                content : req.body.content
            }},
            { new: true , runValidators: true }
        )

        return res.status(200).json({
            "status": "success",
            "code": 200,
            "message": "resource has been updated successfully",
            "resource": "Resources",
            "data": {
                "name": resource.name,
                "content": resource.content,
                "createdAt": resource.createdAt,
                "updatedAt": resource.updatedAt
            }
        })

    } catch (error) {
        console.log(error)
        next(error) 
    }
}

//delete resource
const deleteResource = async (req,res,next) => {
    try {
        await Resources.deleteOne({_id : req.params.resource_id})
        await Teams.findByIdAndUpdate({_id : req.team._id},
            {
                $pull : { resources : req.params.resource_id }
            }
        )

        return res.status(200).json({
            "status": "success",
            "code" : 200,
            "message": "resource has been deleted successfully",
            "resource" : "Resources",
            "nextUri" : `${process.env.BASE_URI}/api/teams/${req.team._id}/resources`,
        })
    } catch (error) {
        console.log(error)
        next(error) 
    }
}


//my resources
const getMyResources = async (req,res,next) => {
    try {
        const resources = await Resources.find({team_id : req.team._id , creator : req.user.id})
        .populate("creator" , "username first_name last_name avatar")

        if(resources.length === 0){
            return res.status(404).json({
                "status": "fail",
                "code" : 404,
                "message": "no resources found",
                "resource" : "Resources",
                "POST nextUri" : `POST ${process.env.BASE_URI}/api/teams/${req.team._id}/resources`,
            })
        }

        return res.status(200).json({
            "status": "success",
            "code" : 200,
            "message": "resources have been fetched successfully",
            "resource" : "Resources",
            "count" : resources.length,
            "data" : resources.map(resource => {
                return {
                    "name" : resource.name,
                    "creator" : {
                        "username" : resource.creator.username,
                        "first_name" : resource.creator.first_name,
                        "last_name" : resource.creator.last_name,
                        "avatar" : resource.creator.avatar,
                    },
                    "content" : resource.content,
                    "type" : resource.type,
                    "language" : resource.language,
                    "createdAt" : resource.createdAt,
                    "updatedAt" : resource.updatedAt
                }
            })
        })
    } catch (error) {
        console.log(error)
        next(error) 
    }
}








module.exports = {
    createResource,
    getResource,
    getAllResources,
    deleteResource,
    updateResource,
    getMyResources,
}


