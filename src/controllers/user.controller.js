import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
   } catch (error) {
      throw new ApiError(500, "Something went wrong");
   }
};

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
      [fullName, email, userName, password].some((field) => field?.trim === "")
   ) {
      throw new ApiError(400, "All  fields are required");
   }
   //inject multer middleware in route just before {registerUser} to handle Files

   // check user exists?
   const userExists = await User.findOne({ email, userName });
   if (userExists) {
      throw new ApiError(409, "username/ email already exists");
   }

   //check images in request.files (multer adds this feild in req)
   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path; //giving double check is given or not

   if (!avatarLocalPath) {
      throw new ApiError(400, "avatar is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath); //if file not there return "", nice feature of cloudinary

   if (!avatar) {
      throw new ApiError(400, "Avatar not uploaded failure");
   }

   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      userName: userName.toLowerCase(),
      password,
   });
   //is succesfully inserted? also removing paswd,ref_token, also takes time "await"
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );

   if (!createdUser) {
      throw new ApiError(500, "Server side failure while registering");
   }

   return res
      .status(201)
      .json(
         new ApiResponse(200, createdUser, "User is registered Succesfully")
      );
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
   // see form-data and x-www-urlencoded issues here
   const { userName, email, password } = req.body;
   // console.log(req.body);

   if (!(userName || email)) {
      throw new ApiError(400, "userName/email is required");
   }

   const user = await User.findOne({
      //using mongoDB operator to check either
      $or: [{ userName }, { email }],
   });

   if (!user) {
      throw new ApiError(400, "user does not exist");
   }

   const validPassword = user.isPasswordCorrect(password);

   if (!validPassword) {
      throw new ApiError(401, "wrong credentials");
   }
   // await was imp here
   const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user._id
   );

   //optional new user object
   // const loggedInUser= User.findById(user._id).select("-password -refreshToken")

   const option = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
   };

   return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
         new ApiResponse(
            200,
            {
               user: accessToken,
               refreshToken, //,loggedInUser
            },
            "User logged In succesfully"
         )
      );
});

const logoutUser = asyncHandler(async (req, res, next) => {
   /*logout LOGIC
    1.manage cookie
    2.reset cookies
        but we need user credentials for that!
        add custom auth.middleware and inject in route
    use req.user to do findByIdAndUpdate(id, operation, new:true)
    return res.clearcookies
    */
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: {
            refreshToken: 1, // this removes the field from document
         },
      },
      {
         new: true,
      }
   );

   const options = {
      httpOnly: true,
      secure: true,
   };

   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
   /*process
  if the access token is expired
  hit an endpoint with user
  get his refresh token, decode it
  validate it with the db stored token
  generate new access and refresh token
  */

   const incomingRefreshToken =
      req.cookie.refreshToken || req.body.refreshToken;
   if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
   }
   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(decodedToken?._id);

      if (!user) {
         throw new ApiError(401, "Invalid refresh token");
      }

      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired/ used");
      }

      const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
         user._id
      );

      const option = {
         httpOnly: true,
         secure: true,
      };

      return res
         .status(200)
         .cookie("accessToken", accessToken, option)
         .cookie("refreshToken", newRefreshToken, option)
         .json(
            new ApiResponse(
               200,
               {
                  accessToken,
                  refreshToken: newRefreshToken,
               },
               "Access token refreshed"
            )
         );
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
   }
});

const changePassword = asyncHandler(async (req, res) => {
   /* check is user logged in? using auth middleware
  take old password, new password (can also use confirm new password)
  find and update by id
   */

   const { oldpassword, newpassword } = req.body;

   const user = await User.findById(req.user._id);

   if (!user) {
      throw new ApiError(404, "user not found");
   }

   const isValid = await user.isPasswordCorrect(oldpassword);
   if (!isValid) {
      throw new ApiError(400, "Invalid old password");
   }

   user.password = newpassword;
   await user.save({ validateBeforeSave: false });
   /*
  //it bypasses Mongoose middleware, including pre and post hooks, which can 
  include important validations and logic (like bcrypt pswd if modified)
  await user.findByIdAndUpdate(req.user._id, { password: newpassword });
  user.save()
  */

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(
         new ApiResponse(200, req.user, "Current user fetched successfully")
      );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { fullName, email } = req.body;

   if (!fullName || !email) {
      throw new ApiError(400, "All feilds are required");
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName,
            email,
         },
      },
      { new: true }
   ).select("-password");

   return res
      .status(200)
      .json(
         new ApiResponse(200, req.user, "Account details updated succesfully")
      );
});

const updateAvatar = asyncHandler(async (req, res) => {
   /*
  make sure authorized request (auth middleware)

   */

   const avatarLocalPath = req.file.path;
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
   }
   //whole avatar object is here
   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if (!avatar.url) {
      throw new ApiError(500, "Error while uploading avatar");
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url,
         },
      },
      { new: true }
   ).select("-password");

   return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar updated succesfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
   /*
  make sure authorized request (auth middleware)

   */
   //check file and files and doc
   const coverImageLocalPath = req.file.path;

   if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover Image file is missing");
   }
   //whole avatar object is here
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if (!coverImage.url) {
      throw new ApiError(500, "Error while uploading Cover Image");
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url,
         },
      },
      { new: true }
   ).select("-password");

   return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover Image updated succesfully"));
});

//First aggregation pipeline
const getUserChannelProfile = asyncHandler(async (req, res) => {
   // from the url
   const { userName } = req.params;

   if (!userName?.trim()) {
      throw new ApiError(400, "Username is missing");
   }

   const channel = await User.aggregate([
      {
         $match: {
            userName: userName?.toLowerCase(),
         },
      },
      {
         $lookup: {
            //lowercase and plural
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers",
         },
      },
      {
         $lookup: {
            //lowercase and plural
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo",
         },
      },
      {
         $addFields: {
            subscriberCount: {
               $size: "$subscribers",
            },
            subscribedToCount: {
               $size: "$subscribedTo",
            },
            isSubscribed: {
               $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
               },
            },
         },
      },
      {
         $project: {
            userName: 1,
            email: 1,
            fullName: 1,
            subscriberCount: 1,
            subscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
         },
      },
   ]);

   // console.log(channel);

   if (!channel?.length) {
      throw new ApiError(404, "Channel does not exist");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            channel[0],
            "User channel info fetched succesfully"
         )
      );
});

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changePassword,
   getCurrentUser,
   updateAccountDetails,
   updateAvatar,
   updateCoverImage,
   getUserChannelProfile,
};
