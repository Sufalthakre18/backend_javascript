import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";


export const incrementVideoViews = asyncHandler(async (req, _, next) => {
    const { videoId } = req.params;
    const userId = req.user?._id; // From auth middleware
  
    if (!videoId) {
      throw new ApiError(400, "Video ID is required");
    }
  
    // Fetch the video first to check ownership
    const video = await Video.findById(videoId);
  
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
  
    // Skip increment if the viewer is the video owner
    if (video.owner.toString() === userId?.toString()) {
      req.video = video; // Attach original video (unmodified)
      return next();
    }
  
    // Increment views for non-owners
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    );
  
    req.video = updatedVideo;
    next();
  });

