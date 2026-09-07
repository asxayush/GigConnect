import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDB from "./src/db/db.js";

const port = process.env.PORT || 5000;



connectDB()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`GigConnect listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MONGODB CONNECTION ERROR", err);
    process.exit(1)

  })
