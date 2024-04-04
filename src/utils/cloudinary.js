import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//files can have problmes so use try and catch
const uploadOnCloudinary = async (localFilePath) => {
  //using arrow fun as this.context not required
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file uploaded succesfully: ", response.url);
    return response;
  } catch (error) {
    //   fs.unlinkSync(); //deleting the temp files for failed uploads
    console.error(error);
    return null;
  } finally {
    fs.unlinkSync();
  }
};

export { uploadOnCloudinary };
    
// cloudinary.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );
