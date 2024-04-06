import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res, next) => {
    // console.log("i am the error");
    return res.status(200).json({
        message: "this is the point",
        body: "i am the body"
    })
});

export {registerUser}
