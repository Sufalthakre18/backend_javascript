import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Check if channelId is valid
    if (!isValidObjectId(channelId)) {
        return res.status(400).json(new ApiError("Invalid channelId", 400));
    }

    // Check if user is already subscribed to the channel
    const subscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    // Count total subscriptions for the channel
    const totalSubscriptions = await Subscription.countDocuments({
        channel: channelId,
    });

    // If already subscribed, unsubscribe
    if (subscription) {
        // Use the remove() method on the model instead of calling delete on the document
        await Subscription.deleteOne({ _id: subscription._id });
        return res.status(200).json(new ApiResponse("Unsubscribed successfully", 200, {
            isSubscribed: false,
            subscriptionId: subscription._id,
            channelId: channelId,
            subscriberId: req.user._id,
            totalSubscriptions: totalSubscriptions - 1,
        }));
    } else {
        // If not subscribed, subscribe
        const newSubscription = new Subscription({
            subscriber: req.user._id,
            channel: channelId,
        });
        await newSubscription.save();
        return res.status(200).json(new ApiResponse("Subscribed successfully", 200, {
            isSubscribed: true,
            subscriptionId: newSubscription._id, // Use newSubscription._id instead of subscription._id
            channelId: channelId,
            subscriberId: req.user._id,
            totalSubscriptions: totalSubscriptions + 1,
        }));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscriberList= await Subscription.find({channel:channelId})
    .populate('subscriber', 'username email').exec()

    if (!subscriberList.length) {
        return res.status(404).json(new ApiError("No subscribers found for this channel", 404));
    }

    
    // Return the list of subscribers
    return res.status(200).json(new ApiResponse("Subscriber list retrieved successfully", 200, {
        subscribers: subscriberList,
        totalSubs:subscriberList.length
    }));

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        return res.status(400).json(new ApiError("Invalid subscriberId", 400));
    }

    // Retrieve channels that the subscriber is subscribed to
    const channelList = await Subscription.find({ subscriber: subscriberId })
        .populate('channel', 'username email') // Populate channel details
        .exec();

    // Check if any channels were found
    if (!channelList.length) {
        return res.status(404).json(new ApiError("No channels found for this user", 404));
    }

    // Return the list of channels
    return res.status(200).json(new ApiResponse("Channel list retrieved successfully", 200, {
        channels: channelList, // Use lowercase for consistency
        totalChannels: channelList.length
    }));
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}