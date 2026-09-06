import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 5000;






connectDB()
.then(() => {
  app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})

})
.catch((err) => {
  console.error("MONGODB CONNECTION ERROR", err);
  process.exit(1)
  
})
