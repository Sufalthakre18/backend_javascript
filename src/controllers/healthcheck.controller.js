import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose"; // Import mongoose to check DB connection

const healthcheck = asyncHandler(async (req, res) => {
    // Check if the database connection is alive
    const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

    return res.status(200).json(
        new ApiResponse(200, "OK", {
            status: "OK",
            message: "Server is running",
            database: dbStatus // Include database connection status
        })
    );
});

export {
    healthcheck
};