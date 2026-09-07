import express from "express";
import cors from "cors";



const app = express();



const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GigConnect API is running");
});

export default app;