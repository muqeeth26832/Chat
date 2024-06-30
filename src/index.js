import dotenv from "dotenv";

import { app } from "./app.js";

dotenv.config({ path: "./env" });

app.get("/test", (req, res) => {
  res.json("test ok");
});

console.log(process.env.PORT);
app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running . Listening on ${process.env.PORT}`);
});
