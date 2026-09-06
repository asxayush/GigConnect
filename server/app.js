import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";


const app = express();



const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

