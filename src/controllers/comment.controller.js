import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Validate page and limit
    if (isNaN(pageNumber) || pageNumber < 1) {
        throw new ApiError(400, "Invalid page number");
    }
    if (isNaN(limitNumber) || limitNumber < 1) {
        throw new ApiError(400, "Invalid limit number");
    }

    // Validate videoId
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    // Fetch comments for the video with pagination
    const allComments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 }) // Sort by creation date
        .skip((pageNumber - 1) * limitNumber) // Skip the previous pages
        .limit(limitNumber); // Limit the number of results

    // Get total count of comments matching the query
    const totalComments = await Comment.countDocuments({ video: videoId });

    // Send response back to client
    res.status(200).json(
        new ApiResponse(200, {
            comments: allComments,
            totalPages: Math.ceil(totalComments / limitNumber),
            currentPage: pageNumber,
            totalComments
        }, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    // Validate input
    if (!content || content.trim() === '') {
        throw new ApiError(400, "Comment content is required");
    }

    // Create a new comment
    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id
    });

    // Check if the comment was created successfully
    if (!comment) {
        throw new ApiError(500, "Failed to add comment");
    }

    return res.status(201).json(
        new ApiResponse(200, comment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;   

    // Validate input
    if (!content || content.trim() === '') {
        throw new ApiError(400, "Comment content is required");
    }

    // Update the comment and return the updated document
    const comment = await Comment.findByIdAndUpdate(
        commentId,
        { content: content },
        { new: true } // Option to return the updated document
    );

    // Check if the comment was found and updated
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    // Validate commentId
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }
    // Delete the comment
    const comment = await Comment.findByIdAndDelete(commentId);
    // Check if the comment was found and deleted
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}