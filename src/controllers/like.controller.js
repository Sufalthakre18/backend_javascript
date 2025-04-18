import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Assuming contentType is always "video" for this case
    const userId = req.user._id; // 
    console.log("User ID:", userId);
    
    

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    // Check if the user has already liked the video
    const existingLike = await Like.findOne({
        likedBy: userId,
        video: videoId // Check for likes on the video
    });

    // Get the total like count for the video
    const likeCount = await Like.countDocuments({ video: videoId });

    if (existingLike) {
        // If the like exists, remove it (unlike)
        await Like.deleteOne({ _id: existingLike._id });

        return res.status(200).json(
            new ApiResponse(200, "Video unliked successfully", {
                isLiked: false,
                likeCount: likeCount - 1, // Decrement the like count
                userWhoLiked: userId // Include the user ID who toggled
            })
        );
    } else {
        // If the like does not exist, add it (like)
        const newLike = new Like({
            likedBy: userId,
            video: videoId // Set the video ID
        });
        await newLike.save();

        return res.status(200).json(
            new ApiResponse(200, "Video liked successfully", {
                isLiked: true,
                likeCount: likeCount + 1, // Increment the like count
                userWhoLiked: userId // Include the user ID who toggled
            })
        );
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params; // Get the comment ID from the request parameters

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const userId = req.user._id; // Access the user ID from req.user

    // Check if the user has already liked the comment
    const existingLike = await Like.findOne({
        likedBy: userId,
        comment: commentId // Check for likes on the comment
    });

    // Get the total like count for the comment
    const likeCount = await Like.countDocuments({ comment: commentId });

    if (existingLike) {
        // If the like exists, remove it (unlike)
        await Like.deleteOne({ _id: existingLike._id });

        return res.status(200).json(
            new ApiResponse(200, "Comment unliked successfully", {
                isLiked: false,
                likeCount: likeCount - 1, // Decrement the like count
                userWhoLiked: userId // Include the user ID who toggled
            })
        );
    } else {
        // If the like does not exist, add it (like)
        const newLike = new Like({
            likedBy: userId,
            comment: commentId // Set the comment ID
        });
        await newLike.save();

        return res.status(200).json(
            new ApiResponse(200, "Comment liked successfully", {
                isLiked: true,
                likeCount: likeCount + 1, // Increment the like count
                userWhoLiked: userId // Include the user ID who toggled
            })
        );
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }
    const userId = req.user._id; 
    // Check if the user has already liked the tweet
    const existingLike = await Like.findOne({
        likedBy: userId,
        tweet: tweetId // Check for likes on the tweet
    });
    // Get the total like count for the tweet
    const likeCount = await Like.countDocuments({ tweet: tweetId });
    if (existingLike) {
        // If the like exists, remove it (unlike)
        await Like.deleteOne({ _id: existingLike._id });

        return res.status(200).json(
            new ApiResponse(200, "Tweet unliked successfully", {
                isLiked: false,
                likeCount: likeCount - 1, // Decrement the like count
                userWhoLiked: userId // Include the tweet content
            })
        );
    } else {
        // If the like does not exist, add it (like)
        const newLike = new Like({
            likedBy: userId,
            tweet: tweetId // Set the tweet ID
        });
        await newLike.save();

        return res.status(200).json(
            new ApiResponse(200, "Tweet liked successfully", {
                isLiked: true,
                likeCount: likeCount + 1, // Increment the like count
                userWhoLiked: userId // Include the user ID who toggled
            })
        );
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id; 

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: userId,
            }
        },
        {
            $lookup: {
                from: "videos", // Assuming the videos collection is named "videos"
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails" // Unwind the video details array
        },
        {
            $project: {
                _id: 1,
                videoId: "$video",
                videoDetails: 1,
            }
        }
    ])

    // total videos count
    const totalVideosCount = likedVideos.length;

    return res.status(200).json(
        new ApiResponse(200, "Liked videos fetched successfully", {
            likedVideos,
            totalVideosCount
        })
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}