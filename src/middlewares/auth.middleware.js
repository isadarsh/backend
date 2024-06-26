import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    
/*logic of middleware
"wrap around try catch"
why not send user, by adding req.user
store token from req.cookie
verify using jwt if it is same as AccesstokenSecret
load user using the "_id" of jwt response (which you defined in schema>jwt)
add req.user= user
continue using next()
//for case req is from mobile as "Authorization": "Bearer oia*93*uiahiu"
*/
    
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized access")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }
        //forward from subsequent checks
        req.user = user;
        //so that next method (here logoutUser method) in route runs
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
        
    }
})