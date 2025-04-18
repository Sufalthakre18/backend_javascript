import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
        })

        

        fs.unlinkSync(localFilePath)

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}


// Function to delete an image from Cloudinary
const deleteFromCloudinary = async (publicId,resource_Type="video") => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resource_Type, // Specify resource type if needed
        });
        return result; // Return the result of the deletion
    } catch (error) {
        console.error("Error deleting video from Cloudinary:", error);
        return null; // Return null or handle the error as needed
    }
};

export {uploadOnCloudinary, deleteFromCloudinary}

