import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const options = {
  httpOnly: true,
  secure: true,
};
const registerUser = asyncHandler(async (req, res) => {
  // console.log("Request body:", req.body); // Log the request body for debugging

  const { username, password } = req.body;

  // Validate input
  if ([username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if the user already exists
  const existedUser = await User.findOne({ username });
  if (existedUser) {
    return new ApiError(409, "User already exits", ["a", "b"]).send(res);
  }

  // Create a new user
  const user = await User.create({ username, password });

  // Create a JWT token
  const token = user.generateAccessToken();

  // Set the token as a cookie and send the response
  return res
    .status(201)
    .cookie("token", token)
    .json(
      new ApiResponse(201, { id: user._id }, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
  //

  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    throw new ApiError(400, "all fields required");
  }

  const user = await User.findOne({ username }); // all usernames are unique

  if (!user) {
    throw new ApiError(404, "user does not exist").send(res);
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password").send(res);
  }

  // password is correct give user an acces token
  // Create a JWT token
  const token = await user.generateAccessToken();

  // Set the token as a cookie and send the response
  return res
    .status(201)
    .cookie("token", token)
    .json(
      new ApiResponse(201, { id: user._id }, "User registered successfully")
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
  console.log("Was called ");

  const token = req.cookies?.token;

  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {}, (err, data) => {
      if (err) throw err;
      res.json(data);
    });
  } else {
    res.status(403).send("no token");
  }
});

export { registerUser, loginUser, getUserProfile };
