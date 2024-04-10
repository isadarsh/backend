import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res, next) => {
    /*return res.status(200).json({
        message: "this is the point",
        body: "i am the body"
    })*/

    
    /*lOGIC BUILDING
    get user details from frontend
    validation for all
    user already exists ?
    check for images, avatar
    upload on cloudinary -> get url -> insert it 
    create user object(in db)
    remove psuedo, ref_token from response*/
    const { fullName, email, userName, password } = req.body;
    // console.log(password);  //TESTING ON POSTMAN   
    if (
        [fullName, email, userName, password].some((field) =>
    field?.trim === "")
    ) {
        throw new ApiError(400, "All  fields are required")
    }
    //inject multer middleware in route just before {registerUser} to handle Files

    // check user exists?
    const userExists = User.findOne({ email, userName })
    if (userExists) {
        throw new ApiError(409, "username/ email already exists")
    }

    //check images in request.files (multer adds this feild in req)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    }


});

export {registerUser}
