import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'asc', userId } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Build the match stage for aggregation
    const matchStage = {};
    if (userId && isValidObjectId(userId)) {
        matchStage.owner = userId; // Filter by user ID if provided
    }
    if (query) {
        matchStage.title = { $regex: query, $options: 'i' }; // Example: search by title
    }

    // Create the aggregation pipeline
    const pipeline = [
        { $match: matchStage }, // Match stage to filter documents
        { $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 } }, // Sort by specified field and order
        { $skip: (pageNumber - 1) * limitNumber }, // Skip the previous pages
        { $limit: limitNumber }, // Limit the number of results
    ];

    // Execute the aggregation pipeline
    const videos = await Video.aggregate(pipeline);

    // Get total count of videos matching the query
    const totalVideos = await Video.countDocuments(matchStage);

    // Send response back to client
    res.status(200).json(
        new ApiResponse(200, {
            videos,
            totalPages: Math.ceil(totalVideos / limitNumber),
            currentPage: pageNumber,
            totalVideos
        }, "Videos fetched successfully")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
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
    } else {
        throw new ApiError(400, "Video file is required");
    }
    if (req.files.thumbnil && Array.isArray(req.files.thumbnil) && req.files.thumbnil.length > 0) {
        thumbnailPath = req.files.thumbnil[0].path
    } else {
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
        duration: videoFile.duration || 0,
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
    const video = await Video.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(videoId),
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            thumbnil: 1,
                            videoFile: 1,
                            duration: 1,
                            owner: 1,
                            createdAt: 1,
                            updatedAt: 1
                        }
                    }
                ]
            }
        }
    ])
    if (!video) {
        throw new ApiError(404, "video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "video fetched successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    let thumbnilUrl;
    if (req.files && req.files.thumbnil) {
        const thumbnailPath = req.files.thumbnil[0].path; // Get the path of the uploaded thumbnail
        const thumbnil = await uploadOnCloudinary(thumbnailPath); // Upload to Cloudinary
        thumbnilUrl = thumbnil.url; // Get the URL of the uploaded thumbnail
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $set: {
                title: title,
                description: description,
                thumbnil: thumbnilUrl,
            }
        },
        {
            $merge: {
                into: "videos",
                whenMatched: "merge",
                whenNotMatched: "discard"
            }
        }
    ])

    if (!video) {
        throw new ApiError(404, "video not found for updation");
    }

    return res.status(200).json(
        new ApiResponse(200, { video,videoId, title, description, thumbnilUrl }, "video's element updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found for deletion");
    }

    // Construct the public ID for the video
    const videoFilePath = video.videoFile.split('/').pop().split('.')[0];
    const videoPublicId = `${videoFilePath}`;
    

    // Delete the video from Cloudinary
    const videoDeleteResult = await deleteFromCloudinary(videoPublicId);
    if (!videoDeleteResult) {
        console.error("Failed to delete video from Cloudinary:", videoDeleteResult);
        throw new ApiError(500, "Failed to delete video from Cloudinary");
    }

    // Construct the public ID for the thumbnail
    const thumbnailPath = video.thumbnil.split('/').pop().split('.')[0];
    const thumbnailPublicId = `${thumbnailPath}`;
    

    // Delete the thumbnail from Cloudinary
    const thumbnailDeleteResult = await deleteFromCloudinary(thumbnailPublicId,"image");
    if (!thumbnailDeleteResult) {
       
        throw new ApiError(500, "Failed to delete thumbnail from Cloudinary");
    }


    // Finally, delete the video from the database
    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { ispublished } = req.body;

    // Validate input
    if (typeof ispublished !== 'boolean') {
        throw new ApiError(400, "Invalid input: 'ispublished' must be a boolean");
    }

    // Find the video
    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found for toggle publish status");
    }

    // Update the publish status
    video.ispublished = ispublished;

    // Save the updated video
    try {
        await video.save();
    } catch (error) {
        throw new ApiError(500, "Failed to update video publish status");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video publish status toggled successfully")
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}




//access duration of video