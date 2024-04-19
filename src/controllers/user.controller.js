import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        
        return {accessToken, refreshToken}

        
    } catch (error) {
        throw new ApiError(500, "Something went wrong")
    }
}

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
    const userExists = await User.findOne({ email, userName })
    if (userExists) {
        throw new ApiError(409, "username/ email already exists")
    }

    //check images in request.files (multer adds this feild in req)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;  //giving double check is given or not

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); //if file not there return "", nice feature of cloudinary

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
    //is succesfully inserted? also removing paswd,ref_token, also takes time "await"
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

const loginUser = asyncHandler(async (req, res, next) => {
    /*Login Logic
    get req.body data
    verify email
    find the user
    check the password 
    generate access, refresh tokens
    send them as cookies
    */
    
    const { userName, email, password } = req.body();

    if (!userName || !email) {
        throw new ApiError(400, "userName/email is required")
    }

    const user= await User.findOne({
        //using mongoDB operator to check either
        $or: [{userName}, {email}]
    })

    if (!user) {
        throw new ApiError(400, "user does not exist")
    }

    const validUser = user.isPasswordCorrect(password);

    if (!validUser) {
        throw new ApiError(401, "wrong credentials")
    }

    const { refreshToken, accessToken } = generateAccessAndRefreshToken(user._id);

    //optional new user object
    // const loggedInUser= User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, option)
        .coookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    user: accessToken, refreshToken //, loggedInUser
                },
                "user logged In succesfully"
            )
        )

})

export {registerUser}
