import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const userId = req.user._id
    
    
    if(!content){
        return new ApiError(400,"Content is required")
    }
    

    const tweet = await Tweet.create({
        content: content,
        owner: userId
    })
    if(!tweet){
        return new ApiError(500,"Tweet not created")
    }

    res.status(201).json(
        new ApiResponse(true,"Tweet created successfully",{
            tweet: tweet
        
        })
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        return new ApiError(400,"Invalid user id")
    }

    const getTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])
    if(!getTweets){
        return new ApiError(404,"Tweets not found")
    }
    res.status(200).json(
        new ApiResponse(true,"Tweets fetched successfully",{
            tweets: getTweets
        })
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    if(!content){
        return new ApiError(400,"Content is required")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content: content
        },
        {
            new: true,
            runValidators: true
        }
        
    )
    if(!tweet){
        return new ApiError(404,"Tweet not found")
    }
    res.status(200).json(
        new ApiResponse(true,"Tweet updated successfully",{
            tweet: tweet
        })
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        return new ApiError(400,"Invalid tweet id")
    }

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!deleteTweet){
        return new ApiError(404,"Tweet not found")
    }
    res.status(200).json(
        new ApiResponse(true,"Tweet deleted successfully",{
            tweet: deleteTweet
        })
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}