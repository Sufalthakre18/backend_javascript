import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.static("public"));
app.use(cookieParser());
// view engine
app.set("view engine", "ejs");





// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";


// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);





// http://localhost:3000/api/v1/users/register




export {app}