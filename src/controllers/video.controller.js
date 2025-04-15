import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination


    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (
        [title, description].some((field) =>
            field?.trim() === '')
    ) {
        throw new ApiError(400, "All fields are required");
    }

    let videoFilePath, thumbnailPath;
    if (req.files.videoFile && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoFilePath = req.files.videoFile[0].path
    }else{
        throw new ApiError(400, "Video file is required");
    }
    if (req.files.thumbnil && Array.isArray(req.files.thumbnil) && req.files.thumbnil.length > 0) {
        thumbnailPath = req.files.thumbnil[0].path
    }else{
        throw new ApiError(400, "thumbnil file is required");
    }

    const videoFile = await uploadOnCloudinary(videoFilePath)
    const thumbnil = await uploadOnCloudinary(thumbnailPath)

    const videoFileUrl = videoFile.url
    const thumbnilUrl = thumbnil.url

    const video = await Video.create({
        videoFile: videoFileUrl,
        thumbnil: thumbnilUrl,
        title: title,
        description: description,
        duration: 0,
        owner: req.user._id
    })

    console.log("upload video and thumbnil to cloudinary", videoFile, thumbnil);
    
    if (!video) {
        throw new ApiError(500, "Failed to upload video");
    }
    
    return res.status(201).json(
        new ApiResponse(200, video, "video upload successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}