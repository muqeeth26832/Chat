import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    // see app errors
    app.on("error", (error) => {
      console.log("App has encountred error coundnt listen ", error);
      throw error;
    });
    // start listening on PORT
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running . Listening on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection Failed", err);
  });
