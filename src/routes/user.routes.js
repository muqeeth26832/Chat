import { Router } from "express";
import {
  getAllUsers,
  getUserChats,
  getUserProfile,
  loginUser,
  registerUser,
} from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/profile").get(getUserProfile);
router.route("/messages/:userId").get(getUserChats);
router.route("/people").get(getAllUsers);
export default router;
