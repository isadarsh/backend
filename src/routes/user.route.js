// import { Router } from "express";
import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    //inject first the middleware of multer to Handle files
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    //then the methods
    registerUser
);

router.route("/loginUser").post(loginUser);

router.route("/logoutUser").post(verifyJWT, logoutUser)

export default router;