

import { Router } from "express";
import { changeCurrentPassword,
     getCurentUser, 
     getUserChannelProfile, 
     getWatchHistory, 
     loginUser, 
     logoutUser, 
     refreshAccessToken,
      registerUser, 
      updateAccountDetails, 
      updateUserAvatar, 
      updateUserCoverImage,
    htmlRenderer,
    htmlRendererForRegister } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.midleware.js";
import { getUserChannelProfileForHtml } from "../middlewares/profile.midleware.js";



const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),

    registerUser)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)






router.route("/index/:username").get(getUserChannelProfileForHtml,htmlRenderer)



router.route("/register-index").get(htmlRendererForRegister)






export default router;