import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // Get stats for the logged-in user's channel
    const userId = req.user._id;

    const totalSubs = await Subscription.find({ channel: userId })

    if (!totalSubs) {
        return new ApiResponse(201, "Your Channel haven't anu Subs")
    }

    const totalVideos = await Video.find({ owner: userId })

    if (!totalVideos) {
        return new ApiResponse(201, "Your Channel haven't uploaded any videos")
    }

    const videos = await Video.find({ owner: userId }, "_id")
    const videoIds = videos.map(video => video._id)
    const totalLikes = await Like.countDocuments({
        video: { $in: videoIds },
        liked: true // Assuming a "liked" boolean field exists
    });

    // 4. Total Views (sum of views from all videos)
    const totalViews = (await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]))[0]?.totalViews || 0;

    return res.status(200).json(
        new ApiResponse(200, "Your dashboard fetched successfullly", {
            totalVideos,
            totalSubs,
            totalLikes,
            totalViews,
            totalsubscriber: totalSubs.length,
            totalvideos: totalVideos.length
        })
    )

})


const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id;
    const videos = await Video.find({ owner: userId })

    if (!videos) {
        return new ApiResponse(201, "Your Channel haven't uploaded any videos")
    }

    return res.status(200).json(
        new ApiResponse(200, "all videos fetched successfully for channel", { videos, totalVideos: videos.length })
    )
})



export {
    getChannelStats,
    getChannelVideos
}