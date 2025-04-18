import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    const playlist = await Playlist.create({
        name:name,
        description:description,
        videos: [],
        owner: req.user._id
    })
    if (!playlist) {
        throw new ApiError(400, "Playlist not created")
    }
    res.status(201).json(new ApiResponse(201, "Playlist created", {playlist}))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    const playlists = await Playlist.find({owner: userId}).populate("videos")
    if (!playlists) {
        throw new ApiError(404, "No playlists found")
    }
    res.status(200).json(new ApiResponse(200, "Playlists found", {
        playlists,
        totalPlaylists: playlists.length
    }))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    res.status(200).json(new ApiResponse(200, "Your Playlist found", {playlist}))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Check if the playlist exists and update it
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(playlistId) },
        {
            $addToSet: { // Use $addToSet to avoid duplicates
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        { new: true } // Return the updated document
    );

    if (!updatedPlaylist) {
        return res.status(404).json(new ApiResponse(false, "Playlist not found"));
    }

    res.status(200).json(new ApiResponse(true, "Video added to playlist", { playlist: updatedPlaylist,
        owner: updatedPlaylist.owner,
        totalVideos: updatedPlaylist.videos.length
     }));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const removeVideoFromPlaylist = await Playlist.findOneAndUpdate(
        {_id: new mongoose.Types.ObjectId(playlistId)},
        { $pull: {videos: new mongoose.Types.ObjectId(videoId)} },
        {new: true} // Return the updated document
    )
    if (!removeVideoFromPlaylist) {
        return res.status(404).json(new ApiResponse(false, "Playlist not found"));
    }

    res.status(200).json(new ApiResponse(true, "Video removed from playlist", {playlist: removeVideoFromPlaylist,
        owner: removeVideoFromPlaylist.owner,
        totalVideos: removeVideoFromPlaylist.videos.length
    })
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
    if (!deletedPlaylist) {
        return res.status(404).json(new ApiResponse(false, "Playlist not found to delete"));
    }
    res.status(200).json(new ApiResponse(true, "Playlist deleted successfully", {playlist: deletedPlaylist}))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {name, description},
        {new: true}
    )
    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found to update")
    }
    res.status(200).json(new ApiResponse(200, "Playlist updated", {playlist: updatedPlaylist}))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}