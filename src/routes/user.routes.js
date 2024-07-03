import { Router } from "express";
import { getUserProfile, loginUser, registerUser } from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
// router.route("/profile").get(getUserProfile)
export default router;
