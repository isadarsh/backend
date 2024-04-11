import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar not uploaded failure")
    }

    const user= await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        userName: userName.toLowerCase(),
        password
    })
    //is succesfully inserted? also removing paswd,ref_token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Server side failure while registering")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User is registered Succesfully")
    )

    

});

export {registerUser}
