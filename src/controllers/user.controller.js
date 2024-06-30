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
  console.log("Request body:", req.body); // Log the request body for debugging

  const { username, password } = req.body;

  // Validate input
  if ([username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if the user already exists
  const existedUser = await User.findOne({ username });
  if (existedUser) {
    throw new ApiError(409, "User with username already exists");
  }

  // Create a new user
  const user = await User.create({ username, password });

  // Create a JWT token
  const token = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );

  // Set the token as a cookie and send the response
  res
    .cookie("token", token, options)
    .status(201)
    .json(
      new ApiResponse(
        201,
        { username: user.username },
        "User registered successfully"
      )
    );
});

export { registerUser };
