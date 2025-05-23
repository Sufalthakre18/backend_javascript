import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary, deleteFromCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}








const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation -not empty
    // check if user already exists: username, email
    // check for images,avatar
    // upload them to cloudinary, avatar
    // create user object -create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const { fullName, email, password, username } = req.body;
    // console.log("email", email);
    // console.log("password", password);
    

    if (
        [fullName, email, password, username].some((field) =>
            field?.trim() === '')
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

   
    

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    });

    console.log("created user", user);
    



    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})


const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})



const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {

    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
try {
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }
    
        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    accessToken, refreshToken:newRefreshToken
                },
                "Access token refreshed successfully"
            )
        )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}



})


const changeCurrentPassword=asyncHandler(async(req, res) => {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )

})

const getCurentUser=asyncHandler(async(req, res) => {

    return res
    .status(200)
    .json(
        200,
        req.user,
        "current User fetched successfully"
    )
})

const updateAccountDetails=asyncHandler(async(req, res) => {

    const {fullName, email} = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "all fields are required")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
            

        },{new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Acount details updated successfully")
    )

})

const updateUserAvatar=asyncHandler(async(req, res) => {

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
            

        },{new: true}
    ).select("-password")

    // delete old avatar from cloudinary
    if (!user) {
        throw new ApiError(404, "User  not found");
    }
    if (user.avatar) {
        const oldAvatarPublicId = user.avatar.split('/').pop().split('.')[0]; // Extract public ID from URL
        await deleteFromCloudinary(oldAvatarPublicId); // Call the delete function
    }


    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )

})



const updateUserCoverImage=asyncHandler(async(req, res) => {

    const CoverImageLocalPath = req.file?.path
    if (!CoverImageLocalPath) {
        throw new ApiError(400, "cover image file is required");
    }

    const coverImage= await uploadOnCloudinary(avatarLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "error while uploading Cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
            

        },{new: true}
    ).select("-password")


    // delete old avatar from cloudinary
    if (!user) {
        throw new ApiError(404, "User  not found");
    }
    if (user.coverImage) {
        const oldCoverImagePublicId = user.coverImage.split('/').pop().split('.')[0]; // Extract public ID from URL
        await deleteFromCloudinary(oldCoverImagePublicId); // Call the delete function
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "CoverImage updated successfully")
    )

})

const getUserChannelProfile=asyncHandler(async(req, res) => {
    const {username}=req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
        
    ])

    // console.log("channel", channel);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
        
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    )

})

const getWatchHistory=asyncHandler(async(req, res) => {

    const user= await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]

                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        


        
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
})



const htmlRenderer = (req, res) => {
    // Serve the static HTML file
    // let hobbies= ["Coding", "Anime", "Web Design"," Reading", "Gaming", "Music"]
    // const data = { search:"searchg nOw",username: "Raja",hobbies  };
    const channelData = res.locals.channel;
    const data = {
        search: "searchg nOw",
        username: channelData.username,
        channel: channelData // Pass the channel data to the template
    };

    res.render('C:/coding/src/views/index.ejs', data)

};
const htmlRendererForRegister = (req, res) => {
    // Serve the static HTML file
    // let hobbies= ["Coding", "Anime", "Web Design"," Reading", "Gaming", "Music"]
    // const data = { search:"searchg nOw",username: "Raja",hobbies  };
    
    res.render('C:/coding/src/views/register.ejs')

};




export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    htmlRenderer,
    htmlRendererForRegister

  }