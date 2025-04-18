import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.midleware.js"
import {upload} from "../middlewares/multer.middlewares.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnil",
                maxCount: 1,
            }
            
        ]),
        publishAVideo
    );


       
router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.fields([
    
        {
            name: "thumbnil",
            maxCount: 1,
        }
    ]), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router